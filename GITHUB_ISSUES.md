# GitHub Issues — Пакет задач для EPPB Platform

Этот файл содержит структурированный список задач для импорта в GitHub Issues. Рекомендуется использовать **GitHub Projects (Board view)** для управления процессом.

## Рекомендованные метки (Labels)
- `phase:core` — Фаза 1
- `phase:demo` — Фаза 2
- `phase:advanced` — Фаза 3
- `role:be-engine` — Backend Engine
- `role:be-data` — Backend API/Data
- `role:fe-builder` — Frontend Builder
- `role:fe-portal` — Frontend Portal
- `priority:high`, `priority:medium`, `priority:low`

---

## Фаза 1: Core MVP (0-24ч)

### [BE 2] Issue #1: Setup Project & Core API Services
- **Исполнитель:** Backend Dev 2 (API/Data)
- **Метки:** `phase:core`, `role:be-data`, `priority:high`
- **Описание:** Инициализация репозитория бэкенда, настройка БД (PostgreSQL) и базовых эндпоинтов для работы со списком услуг.
- **Критерии приемки:**
  - [ ] Создан проект (Node.js/Go/Python).
  - [ ] Настроена схема БД согласно `SPECIFICATION.md`.
  - [ ] Работает GET `/api/v1/services` (возвращает пустой список).
  - [ ] Работает POST `/api/v1/services` (создание услуги).

### [BE 1] Issue #2: JSON Schema Definition & Base Parser
- **Исполнитель:** Backend Dev 1 (Engine)
- **Метки:** `phase:core`, `role:be-engine`, `priority:high`
- **Описание:** Определение финальной структуры JSON-схемы услуги и создание базового парсера, который будет проверять валидность схем.
- **Критерии приемки:**
  - [ ] JSON-схема зафиксирована и согласована с фронтендом.
  - [ ] Реализована валидация загружаемого JSON на соответствие схеме.
  - [ ] Тестовая схема услуги "Лизинг" (базовая версия) успешно парсится.

### [FE 2] Issue #3: Dynamic Form Renderer Engine
- **Исполнитель:** Frontend Dev 2 (Portal)
- **Метки:** `phase:core`, `role:fe-portal`, `priority:high`
- **Описание:** Реализация ядра рендеринга, которое превращает JSON-схему в UI-компоненты (input, select, checkbox).
- **Критерии приемки:**
  - [ ] Компонент `DynamicForm` принимает JSON и отрисовывает поля.
  - [ ] Поддержка базовых типов: string, number, enum (select).
  - [ ] Стилизация по дизайн-системе (или UI-kit).

### [FE 1] Issue #4: Admin Service Dashboard & JSON Editor
- **Исполнитель:** Frontend Dev 1 (Builder)
- **Метки:** `phase:core`, `role:fe-builder`, `priority:medium`
- **Описание:** Интерфейс администратора для просмотра списка услуг и загрузки новых схем через текстовый редактор (JSON).
- **Критерии приемки:**
  - [ ] Список существующих услуг (fetch из API).
  - [ ] Кнопка "Создать услугу" с полем для вставки JSON.
  - [ ] Интеграция с POST `/api/v1/services`.

### [CORE] Issue #5: Define JSON Schema Contract v1
- **Исполнитель:** Команда (Backend + Frontend)
- **Метки:** `phase:core`, `priority:high`
- **Описание:** Совместная фиксация структуры JSON-схемы, которую BE будет отдавать, а FE — рендерить.
- **Критерии приемки:**
  - [ ] Документированы все типы полей.
  - [ ] Описаны правила валидации и структура workflow.

### [CORE] Issue #6: End-to-End Smoke Flow
- **Исполнитель:** Команда
- **Метки:** `phase:core`, `priority:high`
- **Описание:** Проверка базовой работоспособности: создание услуги в админке -> отображение в каталоге -> успешный рендеринг и отправка формы.
- **Критерии приемки:**
  - [ ] Smoke test пройден успешно.

---

## Фаза 2: Demo Ready (24-48ч)

### [BE 1] Issue #7: Workflow Engine (Logic & Transitions)
- **Исполнитель:** Backend Dev 1 (Engine)
- **Метки:** `phase:demo`, `role:be-engine`, `priority:high`
- **Описание:** Реализация логики переходов между шагами формы на основе условий (rules).
- **Критерии приемки:**
  - [ ] Движок корректно вычисляет `next_step` на основе `current_data`.
  - [ ] Поддержка операторов: `==`, `!=`, `>`, `<`, `contains`.
  - [ ] API эндпоинт для оценки правил (или логика на стороне сервера при сохранении шага).

### [BE 2] Issue #8: External Integration Layer (Mocks)
- **Исполнитель:** Backend Dev 2 (API/Data)
- **Метки:** `phase:demo`, `role:be-data`, `priority:high`
- **Описание:** Создание слоя моков для симуляции интеграции с eGov/EISH (автозаполнение по БИН/ИИН).
- **Критерии приемки:**
  - [ ] Эндпоинт `/api/v1/integration/subject/{bin}` возвращает моковые данные компании.
  - [ ] Эндпоинт для загрузки и хранения документов (S3 mock).

### [FE 2] Issue #9: Multi-step Wizard Controller
- **Исполнитель:** Frontend Dev 2 (Portal)
- **Метки:** `phase:demo`, `role:fe-portal`, `priority:high`
- **Описание:** Управление состоянием многошаговой формы (wizard), навигация вперед/назад, валидация текущего шага.
- **Критерии приемки:**
  - [ ] Переключение шагов без перезагрузки.
  - [ ] Индикатор прогресса (Stepper).
  - [ ] Блокировка кнопки "Далее", если поля не валидны.

### [FE 1] Issue #10: Visual Logic Builder (No-code UI)
- **Исполнитель:** Frontend Dev 1 (Builder)
- **Метки:** `phase:demo`, `role:fe-builder`, `priority:high`
- **Описание:** Визуальный интерфейс для настройки правил ветвления (if field A == value, then go to step X).
- **Критерии приемки:**
  - [ ] UI для добавления условий к шагам.
  - [ ] Сохранение настроенных правил в итоговый JSON.

---

## Фаза 3: Advanced (48-72ч)

### [BE 1] Issue #11: Calculation Engine
- **Исполнитель:** Backend Dev 1 (Engine)
- **Метки:** `phase:advanced`, `role:be-engine`, `priority:medium`
- **Описание:** Добавление поддержки вычисляемых полей (например, расчет суммы лизинга).
- **Критерии приемки:**
  - [ ] Поля с типом `calculated` обновляются при изменении зависимых данных.

### [FE 2] Issue #12: User Dashboard & Tracking
- **Исполнитель:** Frontend Dev 2 (Portal)
- **Метки:** `phase:advanced`, `role:fe-portal`, `priority:medium`
- **Описание:** Личный кабинет пользователя для отслеживания статуса поданных заявок.
- **Критерии приемки:**
  - [ ] Список поданных заявок с текущим статусом.
  - [ ] Детальный вид заявки (readonly).

### [FE 1] Issue #13: Live Preview Mode
- **Исполнитель:** Frontend Dev 1 (Builder)
- **Метки:** `phase:advanced`, `role:fe-builder`, `priority:low`
- **Описание:** Возможность увидеть, как будет выглядеть форма портала, не выходя из конструктора.
- **Критерии приемки:**
  - [ ] Split-screen или модальное окно с рендерером из FE 2.

---

## Как автоматизировать создание (через GitHub CLI)
Если установлен `gh`, можно запустить скрипт:
```bash
# Пример создания одной задачи
gh issue create --title "[BE 2] Setup Project & Core API Services" --body "Описание из файла..." --label "phase:core,role:be-data,priority:high"
```
