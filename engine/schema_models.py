"""Pydantic models for the EPPB service schema contract v2.0 (AST-only)."""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

# --- AST nodes (discriminated union: ref | value | op) ---


class RefNode(BaseModel):
    """Reference to a field value in the evaluation context."""

    type: Literal["ref"] = "ref"
    field: str = Field(..., min_length=1)


class ValueNode(BaseModel):
    """Literal constant."""

    type: Literal["value"] = "value"
    value: Any


class OpNode(BaseModel):
    """Operator applied to child AST nodes."""

    type: Literal["op"] = "op"
    op: str = Field(..., min_length=1)
    args: list["ASTNode"] = Field(default_factory=list)


ASTNode = Annotated[RefNode | ValueNode | OpNode, Field(discriminator="type")]

OpNode.model_rebuild()


# --- Field definitions ---


class FieldValidation(BaseModel):
    """Declarative validation for user-editable fields."""

    required: bool = False
    pattern: str | None = None
    min: float | None = None
    max: float | None = None


class AutofillConfig(BaseModel):
    """Metadata for integration-driven autofill (execution is out of engine scope)."""

    source: str = Field(
        ...,
        description="Integration key, e.g. egov_mock — resolved by BE2/FE at runtime.",
    )


class FormField(BaseModel):
    """Single form field or calculated field on a step."""

    id: str = Field(..., min_length=1)
    type: Literal["string", "number", "select", "file", "calculated"] = "string"
    label: str = ""
    description: str | None = None
    validation: FieldValidation | None = None
    autofill: AutofillConfig | None = None
    readonly: bool = False
    disabled: bool = False
    options: list[str] | None = None
    deps: list[str] = Field(default_factory=list)
    formula: dict[str, Any] | None = None

    @model_validator(mode="after")
    def calculated_consistency(self) -> FormField:
        if self.type == "calculated":
            if not self.formula:
                msg = f"Calculated field '{self.id}' must define 'formula' (AST object)"
                raise ValueError(msg)
        else:
            if self.formula is not None or self.deps:
                msg = f"Non-calculated field '{self.id}' must not set formula/deps"
                raise ValueError(msg)
        if self.type == "select":
            if not self.options:
                raise ValueError(f"Select field '{self.id}' must define non-empty options")
        return self


class Transition(BaseModel):
    """Directed edge to the next step; condition is an AST root dict (validated at load)."""

    to: str = Field(..., min_length=1)
    condition: dict[str, Any]


class Step(BaseModel):
    """Wizard step: fields and outgoing transitions."""

    id: str = Field(..., min_length=1)
    title: str = ""
    description: str | None = None
    fields: list[FormField] = Field(default_factory=list)
    transitions: list[Transition] = Field(default_factory=list)


class ServiceConfig(BaseModel):
    """Optional service-level flags."""

    allow_drafts: bool = True
    auto_save: bool = False
    integration_required: list[str] = Field(default_factory=list)


class ServiceSchema(BaseModel):
    """Root document: serviceCode and steps at top level (v2.0 storage shape)."""

    service_code: str = Field(..., alias="serviceCode")
    version: str = "2.0.0"
    title: str = ""
    description: str | None = None
    config: ServiceConfig | None = None
    steps: list[Step] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class AdvanceResult(BaseModel):
    """Outcome of advancing the application session by one step."""

    next_step_id: str | None = None
    errors: dict[str, str] = Field(default_factory=dict)
    calculated: dict[str, Any] = Field(default_factory=dict)
    is_final: bool = False


class SchemaValidationError(Exception):
    """Schema failed semantic validation."""

    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__(f"Schema validation failed ({len(errors)} error(s)): {errors!r}")
