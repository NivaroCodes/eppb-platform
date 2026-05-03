"""
Schema handler for published form definitions (BE2).

Contract v2.0: root-level ``serviceCode`` and ``steps`` (AST-only; no ``content`` wrapper).
The execution engine in ``engine/`` is separate and does not import this module.
"""

from typing import Any


class BaseSchemaHandler:
    """Protocol-style base for versioned schema handlers."""

    def validate(self, schema: dict) -> bool:
        """Return True if the document satisfies the minimal structural contract."""
        raise NotImplementedError

    def get_steps(self, schema: dict) -> list:
        """Return the wizard steps array."""
        raise NotImplementedError

    def get_rules(self, schema: dict) -> list:
        """Return optional rules list if present (legacy / builder analytics)."""
        raise NotImplementedError


class SchemaV2Handler(BaseSchemaHandler):
    """
    Handler for schema version ``2.0.x`` — EPPB AST workflow shape.

    Minimal contract:
        - ``serviceCode`` (non-empty string)
        - ``steps`` (list; may be empty only for drafts — still a list)
    """

    def validate(self, schema: dict) -> bool:
        if not isinstance(schema, dict):
            return False
        code = schema.get("serviceCode")
        if not isinstance(code, str) or not code.strip():
            return False
        steps = schema.get("steps")
        if not isinstance(steps, list):
            return False
        return True

    def get_steps(self, schema: dict) -> list:
        return schema.get("steps", [])

    def get_rules(self, schema: dict) -> list:
        return schema.get("rules", [])

    def get_fields(self, schema: dict) -> list:
        """Flat list of all field definitions across steps."""
        fields: list = []
        for step in self.get_steps(schema):
            if isinstance(step, dict):
                fields.extend(step.get("fields", []))
        return fields


SCHEMA_HANDLERS: dict[str, BaseSchemaHandler] = {
    "2.0": SchemaV2Handler(),
    "2.0.0": SchemaV2Handler(),
}


def get_handler(version: str) -> BaseSchemaHandler:
    """Resolve handler for ``version``; defaults to v2.0."""
    handler = SCHEMA_HANDLERS.get(version)
    if not handler:
        handler = SCHEMA_HANDLERS["2.0.0"]
    return handler


def validate_schema(schema: dict[str, Any]) -> tuple[bool, str]:
    """
    Validate top-level JSON shape for API persistence.

    Returns:
        (True, \"\") on success, or (False, error_message).
    """
    if not isinstance(schema, dict):
        return False, "Schema must be a JSON object"
    version = schema.get("version", "2.0.0")
    if not isinstance(version, str):
        return False, "version must be a string"
    handler = get_handler(version)
    if not handler.validate(schema):
        return False, f"Invalid schema structure for version {version}"
    return True, ""
