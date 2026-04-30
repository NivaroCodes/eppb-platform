from uuid import UUID
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models.form import Form
from app.schemas.form import FormCreate, FormUpdate, FormResponse
from app.services.schema_handler import validate_schema

router = APIRouter(prefix="/forms", tags=["forms"])


@router.post("/", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
async def create_form(payload: FormCreate, db: AsyncSession = Depends(get_db)):
    is_valid, error = validate_schema(payload.schema)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error)

    form = Form(
        name=payload.name,
        description=payload.description,
        schema=payload.schema,
        schema_version=payload.schema_version,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form


@router.get("/", response_model=list[FormResponse])
async def list_forms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Form).order_by(Form.created_at.desc()))
    return result.scalars().all()


@router.get("/{form_id}", response_model=FormResponse)
async def get_form(form_id: UUID, db: AsyncSession = Depends(get_db)):
    form = await db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.put("/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: UUID, payload: FormUpdate, db: AsyncSession = Depends(get_db)
):
    form = await db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    if payload.schema is not None:
        is_valid, error = validate_schema(payload.schema)
        if not is_valid:
            raise HTTPException(status_code=422, detail=error)
        form.schema = payload.schema

    if payload.name is not None:
        form.name = payload.name
    if payload.description is not None:
        form.description = payload.description
    if payload.schema_version is not None:
        form.schema_version = payload.schema_version

    await db.commit()
    await db.refresh(form)
    return form


@router.post("/{form_id}/publish", response_model=FormResponse)
async def publish_form(form_id: UUID, db: AsyncSession = Depends(get_db)):
    form = await db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    form.is_published = True
    await db.commit()
    await db.refresh(form)
    return form


@router.get("/{form_id}/config")
async def get_form_config(form_id: UUID, db: AsyncSession = Depends(get_db)):
    """Runtime endpoint — отдаёт конфиг для рендеринга формы на фронте"""
    form = await db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if not form.is_published:
        raise HTTPException(status_code=403, detail="Form is not published")
    return {
        "id": str(form.id),
        "name": form.name,
        "schema_version": form.schema_version,
        "schema": form.schema,
    }