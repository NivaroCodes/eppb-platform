"""Unit tests for the AST workflow engine (v2.0)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from engine.ast_evaluator import _num, evaluate
from engine.schema_models import FormField, SchemaValidationError, ServiceSchema, Step
from engine.schema_parser import load_schema, validate_schema
from engine.workflow import (
    ApplicationSession,
    CyclicDependencyError,
    compute_calculated_fields,
    resolve_next_step,
    validate_step,
    _topo_sort_calculated,
)

ROOT = Path(__file__).resolve().parents[1]
STAGE1 = ROOT / "seed_data" / "leasing_stage1.json"


# --- ast_evaluator ---


def test_evaluate_ref_and_value():
    ctx = {"a": 3}
    assert evaluate({"type": "ref", "field": "a"}, ctx) == 3
    assert evaluate({"type": "value", "value": "x"}, ctx) == "x"


def test_evaluate_arithmetic_and_round():
    ctx = {}
    n2 = {"type": "value", "value": 2}
    n5 = {"type": "value", "value": 5}
    assert (
        evaluate({"type": "op", "op": "add", "args": [n2, n5]}, ctx) == 7.0
    )
    assert (
        evaluate({"type": "op", "op": "subtract", "args": [n5, n2]}, ctx) == 3.0
    )
    assert (
        evaluate({"type": "op", "op": "multiply", "args": [n2, n5]}, ctx) == 10.0
    )
    assert (
        evaluate({"type": "op", "op": "divide", "args": [n5, n2]}, ctx) == 2.5
    )
    assert evaluate({"type": "op", "op": "round", "args": [n2]}, ctx) == 2


def test_evaluate_divide_by_zero():
    ctx = {}
    with pytest.raises(ZeroDivisionError):
        evaluate(
            {
                "type": "op",
                "op": "divide",
                "args": [
                    {"type": "value", "value": 1},
                    {"type": "value", "value": 0},
                ],
            },
            ctx,
        )


def test_evaluate_logic_and_comparison():
    t = {"type": "value", "value": True}
    f = {"type": "value", "value": False}
    assert evaluate({"type": "op", "op": "not", "args": [f]}, {}) is True
    assert evaluate({"type": "op", "op": "and", "args": [t, t]}, {}) is True
    assert evaluate({"type": "op", "op": "or", "args": [f, t]}, {}) is True
    a = {"type": "value", "value": 1}
    b = {"type": "value", "value": 2}
    assert evaluate({"type": "op", "op": "eq", "args": [a, a]}, {}) is True
    assert evaluate({"type": "op", "op": "neq", "args": [a, b]}, {}) is True
    assert evaluate({"type": "op", "op": "lt", "args": [a, b]}, {}) is True
    assert evaluate({"type": "op", "op": "lte", "args": [b, b]}, {}) is True
    assert evaluate({"type": "op", "op": "gt", "args": [b, a]}, {}) is True
    assert evaluate({"type": "op", "op": "gte", "args": [b, a]}, {}) is True


def test_evaluate_in_ops():
    ctx = {"role": "admin"}
    assert (
        evaluate(
            {
                "type": "op",
                "op": "in",
                "args": [
                    {"type": "ref", "field": "role"},
                    {"type": "value", "value": ["user", "admin"]},
                ],
            },
            ctx,
        )
        is True
    )
    assert (
        evaluate(
            {
                "type": "op",
                "op": "not_in",
                "args": [
                    {"type": "value", "value": "x"},
                    {"type": "value", "value": ["a", "b"]},
                ],
            },
            {},
        )
        is True
    )


def test_evaluate_always():
    assert (
        evaluate({"type": "op", "op": "always", "args": []}, {}) is True
    )


def test_evaluate_nested_ast():
    ctx = {"x": 10}
    tree = {
        "type": "op",
        "op": "multiply",
        "args": [
            {"type": "op", "op": "add", "args": [{"type": "ref", "field": "x"}, {"type": "value", "value": 5}]},
            {"type": "value", "value": 2},
        ],
    }
    assert evaluate(tree, ctx) == 30.0


def test_num_coercion():
    assert _num(3) == 3.0
    assert _num("4.5") == 4.5
    with pytest.raises(TypeError):
        _num(True)


# --- schema validation ---


def _minimal_valid_schema() -> ServiceSchema:
    return ServiceSchema.model_validate(
        {
            "serviceCode": "test",
            "version": "2.0.0",
            "steps": [
                {
                    "id": "a",
                    "fields": [
                        {"id": "f1", "type": "string", "label": "F1"},
                        {
                            "id": "c1",
                            "type": "calculated",
                            "label": "C1",
                            "deps": ["f1"],
                            "formula": {"type": "ref", "field": "f1"},
                        },
                    ],
                    "transitions": [{"to": "b", "condition": {"type": "op", "op": "always", "args": []}}],
                },
                {"id": "b", "fields": [], "transitions": []},
            ],
        }
    )


def test_validate_schema_passes():
    s = _minimal_valid_schema()
    assert validate_schema(s) == []


def test_validate_schema_duplicate_field():
    step = Step(
        id="a",
        fields=[
            FormField(id="x", type="string", label=""),
            FormField(id="x", type="string", label=""),
        ],
        transitions=[],
    )
    s = ServiceSchema(serviceCode="t", steps=[step])
    errs = validate_schema(s)
    assert any("duplicate field" in e for e in errs)


def test_validate_schema_bad_transition_target():
    s = ServiceSchema.model_validate(
        {
            "serviceCode": "t",
            "steps": [
                {
                    "id": "a",
                    "fields": [],
                    "transitions": [
                        {"to": "missing", "condition": {"type": "op", "op": "always", "args": []}}
                    ],
                }
            ],
        }
    )
    errs = validate_schema(s)
    assert any("not a defined step" in e for e in errs)


def test_validate_schema_calc_cycle():
    s = ServiceSchema.model_validate(
        {
            "serviceCode": "t",
            "steps": [
                {
                    "id": "a",
                    "fields": [
                        {
                            "id": "c1",
                            "type": "calculated",
                            "deps": ["c2"],
                            "formula": {"type": "value", "value": 1},
                        },
                        {
                            "id": "c2",
                            "type": "calculated",
                            "deps": ["c1"],
                            "formula": {"type": "value", "value": 2},
                        },
                    ],
                    "transitions": [],
                }
            ],
        }
    )
    errs = validate_schema(s)
    assert any("cyclic" in e.lower() for e in errs)


def test_validate_schema_invalid_ast_in_formula():
    s = ServiceSchema.model_validate(
        {
            "serviceCode": "t",
            "steps": [
                {
                    "id": "a",
                    "fields": [
                        {
                            "id": "c1",
                            "type": "calculated",
                            "deps": [],
                            "formula": {"type": "ref"},
                        },
                    ],
                    "transitions": [],
                }
            ],
        }
    )
    errs = validate_schema(s)
    assert errs


# --- validate_step ---


def test_validate_step_required_and_pattern():
    step = {
        "fields": [
            {
                "id": "code",
                "type": "string",
                "validation": {"required": True, "pattern": "^[A-Z]{2}$"},
            }
        ]
    }
    assert "code" in validate_step(step, {})
    assert "code" in validate_step(step, {"code": "bad"})
    assert validate_step(step, {"code": "AB"}) == {}


def test_validate_step_min_max_number():
    step = {
        "fields": [
            {
                "id": "n",
                "type": "number",
                "validation": {"required": True, "min": 2, "max": 5},
            }
        ]
    }
    assert "n" in validate_step(step, {"n": 1})
    assert "n" in validate_step(step, {"n": 10})
    assert validate_step(step, {"n": 3}) == {}


def test_validate_step_skips_calculated():
    step = {
        "fields": [
            {
                "id": "c",
                "type": "calculated",
                "deps": [],
                "formula": {"type": "value", "value": 1},
            }
        ]
    }
    assert validate_step(step, {}) == {}


# --- resolve_next_step ---


def test_resolve_first_match_and_always_fallback():
    step = {
        "transitions": [
            {
                "to": "high",
                "condition": {
                    "type": "op",
                    "op": "gt",
                    "args": [{"type": "ref", "field": "cost"}, {"type": "value", "value": 10}],
                },
            },
            {
                "to": "low",
                "condition": {"type": "op", "op": "always", "args": []},
            },
        ]
    }
    assert resolve_next_step(step, {"cost": 20}) == "high"
    assert resolve_next_step(step, {"cost": 5}) == "low"


def test_resolve_no_match():
    step = {
        "transitions": [
            {
                "to": "x",
                "condition": {
                    "type": "op",
                    "op": "gt",
                    "args": [{"type": "ref", "field": "cost"}, {"type": "value", "value": 100}],
                },
            }
        ]
    }
    assert resolve_next_step(step, {"cost": 1}) is None


# --- topo / computed ---


def test_topo_chained_calculated():
    step = {
        "fields": [
            {
                "id": "base",
                "type": "number",
                "validation": {"required": True},
            },
            {
                "id": "c1",
                "type": "calculated",
                "deps": ["base"],
                "formula": {
                    "type": "op",
                    "op": "multiply",
                    "args": [{"type": "ref", "field": "base"}, {"type": "value", "value": 2}],
                },
            },
            {
                "id": "c2",
                "type": "calculated",
                "deps": ["c1"],
                "formula": {
                    "type": "op",
                    "op": "add",
                    "args": [{"type": "ref", "field": "c1"}, {"type": "value", "value": 1}],
                },
            },
        ]
    }
    out = compute_calculated_fields(step, {"base": 3})
    assert out["c1"] == 6.0
    assert out["c2"] == 7.0


def test_topo_sort_cycle_raises():
    fields = [
        {"id": "a", "type": "calculated", "deps": ["b"], "formula": {"type": "value", "value": 1}},
        {"id": "b", "type": "calculated", "deps": ["a"], "formula": {"type": "value", "value": 2}},
    ]
    with pytest.raises(CyclicDependencyError):
        _topo_sort_calculated(fields)


# --- ApplicationSession ---


def test_application_session_advance_and_back():
    schema = _minimal_valid_schema()
    session = ApplicationSession(schema)
    r1 = session.advance("a", {"f1": "ok"})
    assert r1.errors == {}
    assert r1.calculated == {"c1": "ok"}
    assert r1.next_step_id == "b"
    assert not r1.is_final

    r2 = session.advance("b", {})
    assert r2.next_step_id is None
    assert r2.is_final

    prev = session.back()
    assert prev == "a"
    assert session.get_accumulated_values() == {"f1": "ok", "c1": "ok"}


def test_application_session_validation_errors():
    schema = ServiceSchema.model_validate(
        {
            "serviceCode": "t",
            "steps": [
                {
                    "id": "a",
                    "fields": [
                        {"id": "req", "type": "string", "validation": {"required": True}},
                    ],
                    "transitions": [],
                }
            ],
        }
    )
    session = ApplicationSession(schema)
    r = session.advance("a", {})
    assert r.errors
    assert session.get_accumulated_values() == {}


def test_is_final_all_transitions_invalid_targets():
    schema = ServiceSchema.model_validate(
        {
            "serviceCode": "t",
            "steps": [
                {
                    "id": "a",
                    "fields": [],
                    "transitions": [
                        {"to": "ghost", "condition": {"type": "op", "op": "always", "args": []}}
                    ],
                }
            ],
        }
    )
    session = ApplicationSession(schema)
    assert session.is_final_step("a") is True


def test_load_schema_leasing_stage1():
    raw = json.loads(STAGE1.read_text(encoding="utf-8"))
    schema = load_schema(raw)
    assert schema.service_code == "leasing-aviation-wagons-stage1"
    assert len(schema.steps) >= 5


def test_load_schema_raises_on_semantic_errors():
    bad = {
        "serviceCode": "x",
        "steps": [
            {
                "id": "a",
                "fields": [],
                "transitions": [
                    {"to": "nonexistent", "condition": {"type": "op", "op": "always", "args": []}}
                ],
            }
        ],
    }
    with pytest.raises(SchemaValidationError):
        load_schema(bad)
