"""Workflow: calculated fields, validation, transitions, application session."""

from __future__ import annotations

import re
from collections import defaultdict, deque
from typing import Any

from engine.ast_evaluator import _num, evaluate
from engine.schema_models import AdvanceResult, ServiceSchema, Step


class CyclicDependencyError(Exception):
    """Raised when calculated fields depend on each other in a cycle."""

    def __init__(self, message: str = "Cyclic dependency among calculated fields") -> None:
        super().__init__(message)


def _step_by_id(schema: ServiceSchema) -> dict[str, Step]:
    return {s.id: s for s in schema.steps}


def _topo_sort_calculated(fields: list[Any]) -> list[dict[str, Any]]:
    """
    Topologically sort calculated ``fields`` (dicts with ``id``, ``deps``, ``type``).

    Raises:
        CyclicDependencyError: If a cycle exists among calculated fields.
    """
    calc = [f for f in fields if f.get("type") == "calculated"]
    if not calc:
        return []

    calc_ids = {f["id"] for f in calc}
    in_degree: dict[str, int] = {fid: 0 for fid in calc_ids}
    graph: dict[str, list[str]] = defaultdict(list)

    for f in calc:
        fid = f["id"]
        for dep in f.get("deps") or []:
            if dep in calc_ids:
                graph[dep].append(fid)
                in_degree[fid] += 1

    queue: deque[str] = deque(n for n, d in in_degree.items() if d == 0)
    ordered: list[dict[str, Any]] = []
    while queue:
        n = queue.popleft()
        fobj = next(x for x in calc if x["id"] == n)
        ordered.append(fobj)
        for m in graph[n]:
            in_degree[m] -= 1
            if in_degree[m] == 0:
                queue.append(m)

    if len(ordered) != len(calc):
        raise CyclicDependencyError()
    return ordered


def compute_calculated_fields(step: dict[str, Any], field_values: dict[str, Any]) -> dict[str, Any]:
    """
    Evaluate calculated fields on a step in dependency order.

    Non-calculated values are taken from ``field_values``; results are merged in order.
    """
    fields = step.get("fields") or []
    ordered = _topo_sort_calculated(fields)
    ctx: dict[str, Any] = dict(field_values)
    out: dict[str, Any] = {}
    for cf in ordered:
        fid = cf["id"]
        formula = cf.get("formula")
        if not formula:
            continue
        val = evaluate(formula, ctx)
        ctx[fid] = val
        out[fid] = val
    return out


def validate_step(step: dict[str, Any], field_values: dict[str, Any]) -> dict[str, str]:
    """
    Validate user-editable fields on a step; skip ``calculated`` fields.

    Returns a map ``field_id -> error message``.
    """
    errors: dict[str, str] = {}
    fields: list[dict[str, Any]] = step.get("fields") or []

    for fd in fields:
        if fd.get("type") == "calculated":
            continue

        fid = fd["id"]
        raw = field_values.get(fid)
        v = fd.get("validation") or {}
        required = bool(v.get("required"))
        if required and (raw is None or raw == ""):
            errors[fid] = "This field is required"
            continue

        if raw is None or raw == "":
            continue

        ftype = fd.get("type", "string")
        pattern = v.get("pattern")
        if pattern and isinstance(raw, str):
            if re.fullmatch(pattern, raw) is None:
                errors[fid] = "Value does not match required pattern"
                continue

        if ftype == "number":
            try:
                num = _num(raw)
            except (TypeError, ValueError):
                errors[fid] = "Must be a valid number"
                continue
            if v.get("min") is not None and num < _num(v["min"]):
                errors[fid] = f"Must be >= {v['min']}"
                continue
            if v.get("max") is not None and num > _num(v["max"]):
                errors[fid] = f"Must be <= {v['max']}"
                continue

        opts = fd.get("options")
        if ftype == "select" and opts is not None and raw not in opts:
            errors[fid] = "Invalid option"

    return errors


def resolve_next_step(step: dict[str, Any], field_values: dict[str, Any]) -> str | None:
    """
    Return ``to`` of the first transition whose condition evaluates truthy.

    Order is preserved; ``always`` should be used as a catch-all last transition.
    """
    for t in step.get("transitions") or []:
        cond = t.get("condition")
        if cond is None:
            continue
        if bool(evaluate(cond, field_values)):
            return t.get("to")
    return None


class ApplicationSession:
    """
    Stateful wizard session: validation, calculated fields, transition resolution,
    history with rollback.
    """

    def __init__(self, schema: ServiceSchema) -> None:
        self._schema = schema
        self._steps = _step_by_id(schema)
        self._step_ids = set(self._steps.keys())
        self._accumulated: dict[str, Any] = {}
        self._history: list[str] = []
        self._snapshots: list[dict[str, Any]] = []

    def is_final_step(self, step_id: str) -> bool:
        """
        True if the step has no outgoing transitions, or every ``to`` target is unknown.

        Unknown targets are treated as terminal per product decision (risk #5).
        """
        step = self._steps.get(step_id)
        if not step:
            return True
        transitions = step.transitions
        if not transitions:
            return True
        return all(t.to not in self._step_ids for t in transitions)

    def get_accumulated_values(self) -> dict[str, Any]:
        """Return a shallow copy of all field values collected so far."""
        return dict(self._accumulated)

    def back(self) -> str | None:
        """
        Undo the last successful ``advance`` and restore accumulated values.

        Returns the step id to return to, or ``None`` if history is empty.
        """
        if not self._history:
            return None
        self._history.pop()
        if self._snapshots:
            self._snapshots.pop()
        if self._snapshots:
            self._accumulated = dict(self._snapshots[-1])
        else:
            self._accumulated = {}
        return self._history[-1] if self._history else None

    def advance(self, step_id: str, field_values: dict[str, Any]) -> AdvanceResult:
        """
        Validate user input for ``step_id``, merge calculated fields, resolve next step,
        and record history on success.
        """
        step_model = self._steps.get(step_id)
        if not step_model:
            return AdvanceResult(
                errors={"__step__": f"Unknown step: {step_id}"},
            )

        step = step_model.model_dump(mode="json", by_alias=True)
        merged_for_validate = {**self._accumulated, **field_values}
        errors = validate_step(step, merged_for_validate)
        if errors:
            return AdvanceResult(errors=errors)

        merged_for_calc = {**self._accumulated, **field_values}
        calculated = compute_calculated_fields(step, merged_for_calc)
        full_context = {**merged_for_calc, **calculated}

        next_step_id = resolve_next_step(step, full_context)
        is_final = next_step_id is None and self.is_final_step(step_id)

        self._accumulated = dict(full_context)
        self._history.append(step_id)
        self._snapshots.append(dict(self._accumulated))

        return AdvanceResult(
            next_step_id=next_step_id,
            calculated=calculated,
            is_final=is_final,
        )
