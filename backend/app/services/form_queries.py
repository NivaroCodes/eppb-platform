"""Database helpers for resolving published forms by ``serviceCode`` (JSON root)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.form import Form


async def get_published_form_by_service_code(
    db: AsyncSession, service_code: str
) -> Form | None:
    """
    Return the published form whose schema root ``serviceCode`` matches.

    Uses in-Python filtering so it works without JSONB operator quirks across drivers.
    """
    result = await db.execute(
        select(Form).where(Form.is_published.is_(True)).order_by(Form.updated_at.desc())
    )
    for form in result.scalars().all():
        if form.schema.get("serviceCode") == service_code:
            return form
    return None
