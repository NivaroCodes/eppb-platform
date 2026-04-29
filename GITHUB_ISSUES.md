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

## MVP Issues (Critical Path)

### [BE 2] Issue: Setup Project & Core API Services
- **Роль:** Backend Dev 2
- **Метки:** `status:mvp`, `priority:high`
- **Dependencies:** Blocked by: None | Blocks: #BE1

### [BE 1] Issue: JSON Schema Definition & Base Parser
- **Роль:** Backend Dev 1
- **Метки:** `status:mvp`, `priority:high`
- **Dependencies:** Blocked by: #BE2 | Blocks: #FE2-Renderer

### [FE 2] Issue: Dynamic Form Renderer Engine
- **Роль:** Frontend Dev 2
- **Метки:** `status:mvp`, `priority:high`
- **Dependencies:** Blocked by: #BE1 | Blocks: #FE2-Wizard

### [FE 2] Issue: Multi-step Wizard Controller
- **Роль:** Frontend Dev 2
- **Метки:** `status:mvp`, `priority:high`
- **Dependencies:** Blocked by: #FE2-Renderer | Blocks: #FE1-Builder

### [FE 1] Issue: Admin Service Dashboard & JSON Editor
- **Роль:** Frontend Dev 1
- **Метки:** `status:mvp`, `priority:high`
- **Dependencies:** Blocked by: #FE2-Wizard

### [BE 1] Issue: Workflow Engine (Logic & Transitions)
- **Роль:** Backend Dev 1
- **Метки:** `status:mvp`, `priority:high`

### [CORE] Issue: Define JSON Schema Contract v1
- **Роль:** Team
- **Метки:** `status:mvp`, `priority:high`

### [CORE] Issue: End-to-End Smoke Flow
- **Роль:** Team
- **Метки:** `status:mvp`, `priority:high`

---

## Как автоматизировать создание (через GitHub CLI)
Если установлен `gh`, можно запустить скрипт:
```bash
# Пример создания одной задачи
gh issue create --title "[BE 2] Setup Project & Core API Services" --body "Описание из файла..." --label "phase:core,role:be-data,priority:high"
```
