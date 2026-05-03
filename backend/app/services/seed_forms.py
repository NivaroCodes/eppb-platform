"""Load seed JSON schemas into ``forms`` on application startup (upsert by ``serviceCode``)."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.form import Form
from engine.schema_parser import load_schema

logger = logging.getLogger(__name__)

# backend/app/services/seed_forms.py -> parents[3] == monorepo root (contains seed_data/)
REPO_ROOT = Path(__file__).resolve().parents[3]
SEED_DIR = REPO_ROOT / "seed_data"

SEED_FILES = ("leasing_stage1.json", "leasing_stage2.json")


async def _upsert_form(db: AsyncSession, raw: dict) -> None:
    schema = load_schema(raw)
    code = schema.service_code
    title = (schema.title or code)[:255]

    result = await db.execute(select(Form))
    existing: Form | None = None
    for form in result.scalars().all():
        if form.schema.get("serviceCode") == code:
            existing = form
            break

    if existing:
        existing.name = title
        existing.description = schema.description
        existing.schema = raw
        existing.schema_version = schema.version
        existing.is_published = True
    else:
        db.add(
            Form(
                name=title,
                description=schema.description,
                schema=raw,
                schema_version=schema.version,
                is_published=True,
            )
        )
    await db.commit()


async def run_startup_seed() -> None:
    """Validate seed files with the engine and upsert matching ``Form`` rows."""
    if not SEED_DIR.is_dir():
        logger.warning("seed_data directory missing at %s — skipping seed", SEED_DIR)
        return

    async with AsyncSessionLocal() as db:
        for filename in SEED_FILES:
            path = SEED_DIR / filename
            if not path.is_file():
                logger.warning("Seed file missing: %s", path)
                continue
            raw = json.loads(path.read_text(encoding="utf-8"))
            load_schema(raw)
            await _upsert_form(db, raw)
            logger.info("Upserted form for serviceCode=%s from %s", raw.get("serviceCode"), filename)
