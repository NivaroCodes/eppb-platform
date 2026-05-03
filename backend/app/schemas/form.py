from uuid import UUID
from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator


# --- Form Schemas ---

class FormCreate(BaseModel):
    name: str
    description: str | None = None
    # content — любой dict, мы не валидируем структуру внутри
    schema: dict[str, Any] = {}
    schema_version: str = "2.0.0"

    @field_validator("schema")
    @classmethod
    def schema_must_have_content(cls, v: dict) -> dict:
        # Минимальный контракт: schema — это объект
        # Больше ничего не требуем — schema-agnostic
        if not isinstance(v, dict):
            raise ValueError("schema must be a JSON object")
        return v


class FormUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    schema: dict[str, Any] | None = None
    schema_version: str | None = None


class FormResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    schema: dict[str, Any]
    schema_version: str
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Submission Schemas ---

class SubmissionCreate(BaseModel):
    data: dict[str, Any]


class SubmissionResponse(BaseModel):
    id: UUID
    form_id: UUID
    data: dict[str, Any]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True