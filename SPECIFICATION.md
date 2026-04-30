# API & Database Specification

## 1. REST API Contract

### Services (Builder & Portal)
- `GET /api/v1/services` - Получить список активных услуг.
- `GET /api/v1/services/:code/schema` - Получить актуальную JSON-схему услуги.
- `POST /api/v1/admin/services` - Регистрация новой услуги (Builder).
- `POST /api/v1/admin/services/:id/publish` - Публикация новой версии схемы.

### Submissions (Workflow Engine)
- `POST /api/v1/submissions/init` - Создание новой сессии заявки.
- `PUT /api/v1/submissions/:id/step` - Отправка данных текущего шага и получение следующего.
- `GET /api/v1/submissions/:id/status` - Получение истории изменений статуса.

### Integration (Mock EISH)
- `GET /api/v1/external/egov/bin/:bin` - Информация об юрлице.
- `GET /api/v1/external/credit-registry/:bin` - Кредитный рейтинг (для WOW-эффекта).

---

## 2. Database Schema (PostgreSQL)

### `services` (Услуги)
- `id` (UUID, PK)
- `code` (String, Unique) - "leasing-transport"
- `name_ru / name_kz` (String)
- `category` (String)

### `service_schemas` (Версионирование логики)
- `id` (UUID, PK)
- `service_id` (FK)
- `version` (SemVer)
- `definition` (JSONB) - Вся структура и логика
- `is_active` (Boolean)
- `created_at` (Timestamp)

### `submissions` (Заявки)
- `id` (UUID, PK)
- `user_id` (UUID)
- `service_id` (FK)
- `current_step_id` (String)
- `payload` (JSONB) - Агрегированные данные всех шагов
- `status` (Enum: DRAFT, SUBMITTED, PROCESSING, APPROVED, REJECTED)

### `audit_logs` (Безопасность)
- `id` (UUID)
- `entity_type` (String)
- `entity_id` (UUID)
- `action` (String)
- `user_id` (UUID)
- `changes` (JSONB)

---

## 3. Workflow Rule Engine (Logic)

Система использует `Rules Engine` для вычисления переходов. 
Пример логического правила в БД:
```json
{
  "rule_id": "check_threshold",
  "expression": "payload.assets_cost > 50000000",
  "on_true": "step_high_value_review",
  "on_false": "step_standard_review"
}
```
