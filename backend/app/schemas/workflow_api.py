"""Request/response bodies for engine-integrated workflow API."""

from typing import Any

from pydantic import BaseModel, Field


class AdvanceRequest(BaseModel):
    """Body for ``POST .../steps/{step_id}/advance``."""

    session_id: str = Field(..., min_length=1)
    field_values: dict[str, Any] = Field(default_factory=dict)


class SubmitRequest(BaseModel):
    """Body for ``POST .../submit``."""

    session_id: str = Field(..., min_length=1)


class SubmitResponse(BaseModel):
    """Response after persisting submission and mock EISH handoff."""

    submission_id: str
    ref_id: str
    status: str
