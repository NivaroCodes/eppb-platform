from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.form import Form, Submission
from app.schemas.form import SubmissionCreate, SubmissionResponse

router = APIRouter(prefix="/forms", tags=["submissions"])


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