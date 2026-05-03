from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.form import Form, Submission
from app.schemas.form import SubmissionCreate, SubmissionResponse
from app.schemas.workflow_api import AdvanceRequest, SubmitRequest, SubmitResponse
from app.services.form_queries import get_published_form_by_service_code
from app.services.workflow_sessions import (
    discard_session,
    get_or_create_session,
    require_session,
)
from engine.schema_parser import load_schema
from engine.schema_models import AdvanceResult

router = APIRouter(prefix="/forms", tags=["submissions"])

api_forms_router = APIRouter(prefix="/api/forms", tags=["api-forms"])


@router.post("/{form_id}/submit", response_model=SubmissionResponse, status_code=201)
async def submit_form(
    form_id: UUID,
    payload: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
):
    form = await db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if not form.is_published:
        raise HTTPException(status_code=403, detail="Form is not published")

    submission = Submission(
        form_id=form_id,
        data=payload.data,
        status="submitted",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return submission


@router.get("/{form_id}/submissions", response_model=list[SubmissionResponse])
async def list_submissions(form_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Submission)
        .where(Submission.form_id == form_id)
        .order_by(Submission.created_at.desc())
    )
    return result.scalars().all()


def _mock_eish_submit(payload: dict) -> dict:
    """Same contract as ``POST /mock/eish/submit`` (in-process, no HTTP)."""
    return {
        "success": True,
        "tracking_number": "EISH-2026-001",
        "message": "Заявка принята в обработку (mock)",
        "received_data": payload,
    }


@api_forms_router.post(
    "/{service_code}/steps/{step_id}/advance",
    response_model=AdvanceResult,
)
async def advance_workflow_step(
    service_code: str,
    step_id: str,
    body: AdvanceRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Validate and advance the in-memory workflow session for a published service schema.
    """
    form = await get_published_form_by_service_code(db, service_code)
    if not form or form.schema.get("serviceCode") != service_code:
        raise HTTPException(status_code=404, detail="Service not found or not published")

    try:
        session = get_or_create_session(body.session_id, service_code, form.schema)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    result = session.advance(step_id, body.field_values)
    return result


@api_forms_router.get("/{service_code}/steps/{step_id}")
async def get_workflow_step(
    service_code: str,
    step_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return a single step definition from the published schema."""
    form = await get_published_form_by_service_code(db, service_code)
    if not form or form.schema.get("serviceCode") != service_code:
        raise HTTPException(status_code=404, detail="Service not found or not published")

    schema = load_schema(form.schema)
    for step in schema.steps:
        if step.id == step_id:
            return step.model_dump(mode="json", by_alias=True)
    raise HTTPException(status_code=404, detail="Step not found")


@api_forms_router.post(
    "/{service_code}/submit",
    response_model=SubmitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_workflow(
    service_code: str,
    body: SubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Persist accumulated session values as a ``Submission`` and invoke mock EISH submit.
    """
    form = await get_published_form_by_service_code(db, service_code)
    if not form or form.schema.get("serviceCode") != service_code:
        raise HTTPException(status_code=404, detail="Service not found or not published")

    try:
        session = require_session(body.session_id, service_code)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found") from None
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    accumulated = session.get_accumulated_values()
    eish_payload = {"service_code": service_code, "submission": accumulated}
    eish_result = _mock_eish_submit(eish_payload)
    ref_id = str(eish_result.get("tracking_number", ""))

    submission = Submission(
        form_id=form.id,
        data={
            "service_code": service_code,
            "payload": accumulated,
            "eish": eish_result,
        },
        status="submitted",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    discard_session(body.session_id)

    return SubmitResponse(
        submission_id=str(submission.id),
        ref_id=ref_id,
        status=submission.status,
    )
