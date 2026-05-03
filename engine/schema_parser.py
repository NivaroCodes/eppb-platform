"""Load and semantically validate v2.0 service schemas (AST-only)."""

from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

from pydantic import TypeAdapter, ValidationError

from engine.schema_models import (
    ASTNode,
    FormField,
    SchemaValidationError,
    ServiceSchema,
    Step,
)

_ast_adapter: TypeAdapter[ASTNode] = TypeAdapter(ASTNode)


def _validate_ast_node(node: Any, path: str) -> list[str]:
    if not isinstance(node, dict):
        return [f"{path}: AST node must be an object, got {type(node).__name__}"]
    try:
        _ast_adapter.validate_python(node)
    except ValidationError as e:
        return [f"{path}: invalid AST — {e!s}"]
    return []


def _step_field_ids(step: Step) -> dict[str, FormField]:
    return {f.id: f for f in step.fields}


def _detect_calc_cycles(fields: list[FormField]) -> list[str]:
    """Return error messages if calculated fields have cyclic deps (Kahn)."""
    calc_by_id = {f.id: f for f in fields if f.type == "calculated"}
    if not calc_by_id:
        return []

    in_degree: dict[str, int] = {fid: 0 for fid in calc_by_id}
    graph: dict[str, list[str]] = defaultdict(list)

    for fid, f in calc_by_id.items():
        for dep in f.deps:
            if dep in calc_by_id:
                graph[dep].append(fid)
                in_degree[fid] += 1

    queue: deque[str] = deque(n for n, d in in_degree.items() if d == 0)
    seen = 0
    while queue:
        n = queue.popleft()
        seen += 1
        for m in graph[n]:
            in_degree[m] -= 1
            if in_degree[m] == 0:
                queue.append(m)

    if seen != len(calc_by_id):
        return ["Calculated fields contain a cyclic dependency chain"]
    return []


def validate_schema(schema: ServiceSchema) -> list[str]:
    """
    Run semantic checks on a parsed schema.

    Returns an empty list if valid; otherwise all accumulated error messages.
    """
    errors: list[str] = []
    step_ids = {s.id for s in schema.steps}

    for step in schema.steps:
        sid = step.id
        fields = step.fields
        by_id = _step_field_ids(step)
        ids_seen: set[str] = set()
        for f in fields:
            if f.id in ids_seen:
                errors.append(f"Step '{sid}': duplicate field id '{f.id}'")
            ids_seen.add(f.id)

        for f in fields:
            if f.type == "calculated":
                if f.formula is None:
                    errors.append(f"Step '{sid}': calculated '{f.id}' missing formula")
                    continue
                errors.extend(_validate_ast_node(f.formula, f"Step '{sid}' field '{f.id}' formula"))
                for dep in f.deps:
                    if dep not in by_id:
                        errors.append(
                            f"Step '{sid}': calculated '{f.id}' dep '{dep}' "
                            f"is not a field on this step"
                        )
                    elif dep == f.id:
                        errors.append(
                            f"Step '{sid}': calculated '{f.id}' must not depend on itself"
                        )
                # deps must only reference non-calculated OR calculated that appear as separate fields
                # (already ensured by by_id)
            else:
                if f.formula is not None:
                    errors.append(f"Step '{sid}': field '{f.id}' must not have formula")
                if f.deps:
                    errors.append(f"Step '{sid}': field '{f.id}' must not have deps")

        errors.extend(
            f"Step '{sid}': {msg}"
            for msg in _detect_calc_cycles(fields)
        )

        for i, t in enumerate(step.transitions):
            if t.to not in step_ids:
                errors.append(
                    f"Step '{sid}' transition[{i}]: target '{t.to}' is not a defined step id"
                )
            errors.extend(
                _validate_ast_node(
                    t.condition,
                    f"Step '{sid}' transition[{i}] condition",
                )
            )

    return errors


def load_schema(raw: dict[str, Any]) -> ServiceSchema:
    """
    Parse a raw JSON object into ``ServiceSchema`` and validate semantics.

    Raises:
        SchemaValidationError: If parsing fails or semantic validation fails.
        ValidationError: If the document does not match the Pydantic model (Pydantic).
    """
    schema = ServiceSchema.model_validate(raw)
    errors = validate_schema(schema)
    if errors:
        raise SchemaValidationError(errors)
    return schema
