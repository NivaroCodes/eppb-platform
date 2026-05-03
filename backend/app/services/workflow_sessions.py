"""In-process storage for :class:`engine.workflow.ApplicationSession` by client ``session_id``."""

from __future__ import annotations

from engine.schema_parser import load_schema
from engine.workflow import ApplicationSession

# session_id -> (ApplicationSession, service_code)
_SESSIONS: dict[str, tuple[ApplicationSession, str]] = {}


def get_or_create_session(session_id: str, service_code: str, raw_schema: dict) -> ApplicationSession:
    """
    Return an existing session or create one from ``raw_schema`` (validated via ``load_schema``).

    Raises:
        ValueError: If ``session_id`` is already bound to another ``service_code``.
    """
    if session_id in _SESSIONS:
        session, code = _SESSIONS[session_id]
        if code != service_code:
            raise ValueError(
                f"session_id is already bound to service {code!r}, not {service_code!r}"
            )
        return session

    parsed = load_schema(raw_schema)
    session = ApplicationSession(parsed)
    _SESSIONS[session_id] = (session, service_code)
    return session


def require_session(session_id: str, service_code: str) -> ApplicationSession:
    """
    Return a session or raise ``KeyError`` / ``ValueError`` for unknown / mismatched service.
    """
    if session_id not in _SESSIONS:
        raise KeyError(session_id)
    session, code = _SESSIONS[session_id]
    if code != service_code:
        raise ValueError(f"session_id belongs to {code!r}, not {service_code!r}")
    return session


def discard_session(session_id: str) -> None:
    """Remove session state after successful submit."""
    _SESSIONS.pop(session_id, None)
