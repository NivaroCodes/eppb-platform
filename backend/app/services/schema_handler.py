"""
Schema Handler — schema-agnostic версионный интерпретатор.
Backend не знает о конкретной структуре формы.
Знает только минимальный контракт.
"""

from typing import Any


class BaseSchemaHandler:
    def validate(self, schema: dict) -> bool:
        raise NotImplementedError

    def get_steps(self, schema: dict) -> list:
        raise NotImplementedError

    def get_rules(self, schema: dict) -> list:
        raise NotImplementedError


class SchemaV1Handler(BaseSchemaHandler):
    """
    Обработчик для schema_version = "1.0"
    Минимальный контракт: { "content": {...} }
    Всё через .get() — никогда не падает на KeyError
    """

    def validate(self, schema: dict) -> bool:
        if not isinstance(schema, dict):
            return False
        # Единственное жёсткое требование — content должен быть объектом
        content = schema.get("content")
        if content is not None and not isinstance(content, dict):
            return False
        return True

    def get_steps(self, schema: dict) -> list:
        content = schema.get("content", {})
        # Поддерживаем и "steps" и "pages" — фронт может поменять
        return content.get("steps", content.get("pages", []))

    def get_rules(self, schema: dict) -> list:
        content = schema.get("content", {})
        return content.get("rules", [])

    def get_fields(self, schema: dict) -> list:
        """Плоский список всех полей из всех шагов"""
        fields = []
        for step in self.get_steps(schema):
            if isinstance(step, dict):
                fields.extend(step.get("fields", []))
        return fields


# Registry — добавляй новые версии сюда
SCHEMA_HANDLERS: dict[str, BaseSchemaHandler] = {
    "1.0": SchemaV1Handler(),
}


def get_handler(version: str) -> BaseSchemaHandler:
    handler = SCHEMA_HANDLERS.get(version)
    if not handler:
        # Fallback на последнюю известную версию — не падаем
        handler = SCHEMA_HANDLERS.get("1.0")
    return handler


def validate_schema(schema: dict[str, Any]) -> tuple[bool, str]:
    """Возвращает (is_valid, error_message)"""
    version = schema.get("version", "1.0")
    handler = get_handler(version)
    if not handler.validate(schema):
        return False, f"Invalid schema structure for version {version}"
    return True, ""