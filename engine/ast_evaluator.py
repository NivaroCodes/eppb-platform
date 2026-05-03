"""AST interpreter for conditions and calculated fields (no string eval)."""

from __future__ import annotations

from typing import Any


def _num(val: Any) -> float:
    """
    Coerce a value to float for numeric operations.

    Raises:
        TypeError: If the value cannot be converted to a number.
        ValueError: If the value is not a valid number.
    """
    if isinstance(val, bool):
        raise TypeError("boolean is not a number")
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        return float(val.strip())
    raise TypeError(f"not numeric: {type(val).__name__}")


def evaluate(node: dict[str, Any], context: dict[str, Any]) -> Any:
    """
    Evaluate an AST node against a field context (flat id -> value).

    Supported node shapes:
        - ``{"type": "ref", "field": "<id>"}``
        - ``{"type": "value", "value": <any>}``
        - ``{"type": "op", "op": "<name>", "args": [ ... ]}``

    Supported operators:
        Arithmetic: add, subtract, multiply, divide, round
        Logic: and, or, not
        Comparison: eq, neq, gt, gte, lt, lte, in, not_in
        Constant truth: always (returns True)
    """
    if not isinstance(node, dict):
        raise TypeError(f"AST node must be dict, got {type(node).__name__}")

    ntype = node.get("type")
    if ntype == "ref":
        field = node.get("field")
        if not isinstance(field, str):
            raise TypeError("ref node requires string 'field'")
        return context.get(field)

    if ntype == "value":
        return node.get("value")

    if ntype == "op":
        op = node.get("op")
        if not isinstance(op, str):
            raise TypeError("op node requires string 'op'")
        raw_args = node.get("args", [])
        if not isinstance(raw_args, list):
            raise TypeError("op node 'args' must be a list")
        args = [evaluate(child, context) for child in raw_args]

        if op == "always":
            return True

        if op == "add":
            if len(args) < 2:
                raise ValueError("add requires 2 arguments")
            return _num(args[0]) + _num(args[1])
        if op == "subtract":
            if len(args) < 2:
                raise ValueError("subtract requires 2 arguments")
            return _num(args[0]) - _num(args[1])
        if op == "multiply":
            if len(args) < 2:
                raise ValueError("multiply requires 2 arguments")
            return _num(args[0]) * _num(args[1])
        if op == "divide":
            b = _num(args[1])
            if b == 0.0:
                raise ZeroDivisionError("division by zero")
            return _num(args[0]) / b
        if op == "round":
            if len(args) == 1:
                return round(_num(args[0]))
            if len(args) < 1:
                raise ValueError("round requires at least 1 argument")
            return round(_num(args[0]), int(args[1]))

        if op == "not":
            if len(args) < 1:
                raise ValueError("not requires 1 argument")
            return not bool(args[0])
        if op == "and":
            return all(bool(a) for a in args)
        if op == "or":
            return any(bool(a) for a in args)

        if op == "eq":
            if len(args) < 2:
                raise ValueError("eq requires 2 arguments")
            return args[0] == args[1]
        if op == "neq":
            if len(args) < 2:
                raise ValueError("neq requires 2 arguments")
            return args[0] != args[1]
        if op == "gt":
            if len(args) < 2:
                raise ValueError("gt requires 2 arguments")
            return _num(args[0]) > _num(args[1])
        if op == "gte":
            if len(args) < 2:
                raise ValueError("gte requires 2 arguments")
            return _num(args[0]) >= _num(args[1])
        if op == "lt":
            if len(args) < 2:
                raise ValueError("lt requires 2 arguments")
            return _num(args[0]) < _num(args[1])
        if op == "lte":
            if len(args) < 2:
                raise ValueError("lte requires 2 arguments")
            return _num(args[0]) <= _num(args[1])

        if op == "in":
            if len(args) < 2:
                raise ValueError("in requires 2 arguments")
            left, right = args[0], args[1]
            if isinstance(right, (list, tuple, set)):
                return left in right
            if isinstance(right, str):
                return left in right
            raise TypeError("'in' right side must be collection or string")

        if op == "not_in":
            if len(args) < 2:
                raise ValueError("not_in requires 2 arguments")
            left, right = args[0], args[1]
            if isinstance(right, (list, tuple, set)):
                return left not in right
            if isinstance(right, str):
                return left not in right
            raise TypeError("'not_in' right side must be collection or string")

        raise ValueError(f"unsupported op: {op!r}")

    raise ValueError(f"unknown AST node type: {ntype!r}")
