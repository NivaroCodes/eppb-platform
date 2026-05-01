# EPPB PLATFORM
# Handover Document — FE1 Admin Builder

**Дата:** 30.04.2026  
**Репозиторий:** github.com/NivaroCodes/eppb-platform  
**Роль:** FE1 — Builder / Admin Panel  
**Ветка:** feature/EPPB-3-admin-builder

---

## СТАТУС ФРОНТЕНДА FE1

Фундамент админ-панели реализован. Есть рабочий React + TypeScript + Vite admin-builder с тёмным Command Center UI, каталогом услуг, JSON Schema viewer, редактором формы, настройками и интеграцией с BE2 API через Zustand store.

Фронтенд умеет работать в двух режимах:

- **Backend available:** данные грузятся через FastAPI API на `http://localhost:8000`
- **Backend unavailable:** автоматический fallback на локальные mock-данные

---

## 1. Quick Start — для FE1 / команды

Первое что делает разработчик после получения проекта:

```bash
git clone https://github.com/NivaroCodes/eppb-platform.git
cd eppb-platform
cp .env.example .env
docker compose up --build
docker compose run --rm backend alembic upgrade head
```

Запуск админ-панели:

```bash
cd apps/admin
npm install
npm run dev
```

Проверка:

- Frontend: http://localhost:5173
- Backend Swagger: http://localhost:8000/docs
- Backend health: http://localhost:8000/health

Если backend не поднят, админка продолжит работать на mock-данных.

---

## 2. Что уже сделано (FE1)

### Инфраструктура фронтенда

- React + TypeScript + Vite
- TailwindCSS
- Zustand store для состояния форм
- React Router для навигации
- Monaco Editor для просмотра и редактирования JSON схем
- Lucide React icons
- API fallback: backend first, mock fallback

### Основные страницы

| Страница | Route | Статус |
|---|---|---|
| Каталог услуг | `/` | Реализовано |
| Редактор услуги | `/form/:id` | Реализовано |
| JSON Schema Viewer | `/schema` | Реализовано |
| Settings | `/settings` | Реализовано |
| Preview route | `/form/:id/preview` | Route используется, полноценный renderer относится к FE2 |

---

## 3. Реализованный UI / дизайн

Админ-панель переписана в едином стиле **dark glassmorphism Command Center**.

### Дизайн-система

- Основной фон: чёрный / `#131313`
- Акцент: оранжево-красный градиент `from-orange-500 to-red-600`
- Карточки: `bg-white/[0.03]`, `backdrop-blur-xl`, `border-white/10`
- Активные состояния: orange accent
- Статусы:
  - Published / Active: emerald
  - Draft: yellow
  - Error / validation: red
- Sidebar width: `260px`
- Header: fixed top bar, glass style

### Обновлённые экраны

#### AdminLayout

- Fixed sidebar
- Top navigation bar
- Search field
- User profile section
- Active nav state
- Logout item
- Command Center branding

#### ServicesPage / Каталог услуг

Реализовано:

- Header: `Каталог услуг`
- Filter tabs: `Все / Активные / Черновики`
- Gradient button: `Создать услугу`
- Statistic cards:
  - Всего услуг
  - В обработке
  - Организации
  - Ошибки валидации
- Table columns:
  - Название услуги
  - Организация
  - Категория
  - Статус
  - Шаги
  - Действия
- Row click opens editor
- Pagination
- Bottom promo cards:
  - Конструктор JSON-схем
  - Импорт из JSON

#### ServiceEditorPage / FormEditorPage

Реализовано:

- Breadcrumb: `Услуги / Редактирование`
- Tabs:
  - Основные
  - JSON-схема
- Save button with feedback: `Сохранено!`
- General tab:
  - Общая информация
  - Название услуги
  - Описание
  - Код услуги
  - Версия
  - Этапы процесса
  - Sidebar status/meta card
  - Business rules card based on transitions
  - Analytics mini card
- JSON tab:
  - Monaco Editor
  - `vs-dark` theme
  - JSON validation through `JSON.parse`
  - Copy to clipboard
  - Format JSON
  - Error display

#### SchemaViewerPage

Реализовано:

- Select service
- Monaco read-only JSON viewer
- `vs-dark` theme
- Copy JSON
- Export JSON file
- Metadata cards:
  - Steps count
  - Rules count
  - Fields count
  - Version / status info
- UUID-compatible selected id

#### SettingsPage

Реализовано:

- Dark Command Center styling
- Glass cards
- Orange accent palette
- Consistent with other admin pages

---

## 4. Интеграция с BE2 API

Фронтенд интегрирован с текущим backend API через `useFormsStore`.

### API base

```ts
const API_BASE = 'http://localhost:8000';
```

### Поддерживаемые endpoint-ы

| Метод | Endpoint | Использование во фронте |
|---|---|---|
| GET | `/forms` | Загрузка списка форм |
| POST | `/forms` | Создание новой формы |
| PUT | `/forms/{id}` | Сохранение изменений формы |
| POST | `/forms/{id}/publish` | Публикация формы |

### Runtime / Portal endpoint-ы BE2

Эти endpoint-ы есть на backend, но относятся преимущественно к FE2:

| Метод | Endpoint | Назначение |
|---|---|---|
| GET | `/forms/{id}/config` | Runtime config для dynamic renderer |
| POST | `/forms/{id}/submit` | Отправка заявки |
| GET | `/forms/{id}/submissions` | Список заявок формы |
| GET | `/mock/egov/profile?iin=` | Mock автозаполнение |
| GET | `/mock/eish/services` | Mock список услуг ЕИШ |
| POST | `/mock/eish/submit` | Mock отправка в ЕИШ |

### Важное изменение под BE2

Backend использует UUID, поэтому FE1 переведён с `number` id на `string` id.

Изменено:

- `FormRecord.id: string`
- `selectedId: string | null`
- `deleteConfirm: string | null`
- URL param `/form/:id` сравнивается как строка
- Mock ids: `'1'`, `'2'`

---

## 5. Контракт JSON схемы FE1

Текущий FE1 использует согласованный admin-builder контракт:

```json
{
  "serviceCode": "leasing-transport",
  "version": "1.0.0",
  "title": "Лизинг транспортных активов",
  "description": "Программа лизинга транспортных средств для субъектов МСБ",
  "config": {
    "allowDrafts": true,
    "autoSave": true,
    "integrationRequired": ["egov-company-info"]
  },
  "steps": [
    {
      "id": "step_1",
      "title": "Идентификация",
      "description": "Данные заявителя",
      "fields": [],
      "transitions": []
    }
  ]
}
```

### Типы полей

```ts
type FieldType = 'string' | 'number' | 'select' | 'file' | 'calculated';
```

### Step

```ts
interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  transitions: Transition[];
}
```

### Transition

```ts
interface Transition {
  to: string;
  condition: string;
}
```

### Calculated field

```json
{
  "id": "vat_amount",
  "type": "calculated",
  "label": "НДС (12%)",
  "formula": "data.cost * 0.12",
  "readonly": true
}
```

---

## 6. Store / Data Flow

Главная точка интеграции: `apps/admin/src/store/services.ts`.

### State

```ts
forms: FormRecord[]
loading: boolean
apiAvailable: boolean
```

### Actions

```ts
loadForms(): Promise<void>
createForm(name, schema): Promise<FormRecord | null>
updateForm(id, schema): void
deleteForm(id): void
publishForm(id): Promise<boolean>
```

### Поведение

- `loadForms` сначала пробует `GET /forms`
- Если API недоступен — грузит `mockForms`
- `createForm` при доступном API делает `POST /forms`
- `updateForm` при доступном API делает `PUT /forms/{id}`
- `publishForm` при доступном API делает `POST /forms/{id}/publish`
- При локальном fallback изменения применяются в Zustand state

---

## 7. Файлы, которые уже изменены FE1

| Файл | Назначение |
|---|---|
| `apps/admin/src/types/schema.ts` | Контракт типов ServiceSchema / FormRecord |
| `apps/admin/src/store/services.ts` | Zustand store + API integration |
| `apps/admin/src/data/mock-services.ts` | Demo mock services |
| `apps/admin/src/components/layout/AdminLayout.tsx` | Layout / sidebar / topbar |
| `apps/admin/src/pages/ServicesPage.tsx` | Каталог услуг |
| `apps/admin/src/pages/ServiceEditorPage.tsx` | Редактор услуги / JSON editor |
| `apps/admin/src/pages/SchemaViewerPage.tsx` | JSON schema viewer |
| `apps/admin/src/pages/SettingsPage.tsx` | Settings UI |
| `apps/admin/src/index.css` | Global styles / Tailwind setup |

---

## 8. Команды для FE1

### Dev server

```bash
cd apps/admin
npm run dev
```

### Typecheck

```bash
cd apps/admin
npx tsc --noEmit
```

Текущий статус:

```text
npx tsc --noEmit -> 0 errors
```

### Backend + DB

```bash
cp .env.example .env
docker compose up --build
docker compose run --rm backend alembic upgrade head
```

---

## 9. Известные ограничения / риски

| Риск | Статус / решение |
|---|---|
| Backend требует `.env` | Это expected. Без `.env` docker compose не стартует |
| Backend id = UUID | FE1 уже переведён на `string` id |
| Нет backend DELETE `/forms/{id}` | Удаление сейчас только локальное в Zustand. Backend не меняем без задачи BE |
| BE2 minimal schema использует `content.steps`, FE1 использует root `steps` | Backend schema-agnostic и хранит JSONB как есть. Нужно синхронизировать контракт командой перед demo |
| Preview route есть, но полноценный runtime renderer не реализован | Это зона FE2 |
| Drag & drop этапов визуально обозначен, но фактический reorder не реализован | Можно вынести в follow-up |
| Import JSON card пока UI-only | Можно реализовать отдельной задачей |
| Search в topbar layout UI-only | Поиск в ServicesPage был убран ради соответствия новому reference UI |

---

## 10. Что осталось FE1

### Обязательно для demo

- Реальный конструктор steps / fields без ручного JSON
- Добавление / редактирование / удаление полей
- Добавление / редактирование / удаление шагов
- Настройка transitions между steps
- Save через `PUT /forms/{id}` после визуальных изменений
- Publish через `POST /forms/{id}/publish`
- Финальное согласование JSON контракта с BE1/BE2/FE2

### Хорошо иметь

- Import JSON file
- Export JSON file на editor page
- Better validation messages
- Autosave indicator
- Dirty state before leaving page
- Field type templates
- JSON schema diff / history

### WOW эффект

- Live Preview формы прямо в Builder
- Drag & drop reorder steps / fields
- Visual rule builder
- Analytics widgets from real submissions

---

## 11. Git правила для FE1

Обязательно:

- Каждая задача = отдельная feature ветка от `develop`
- Коммиты атомарные
- Формат коммитов:

```bash
feat(EPPB-3): краткое описание
fix(EPPB-3): краткое описание
```

Примеры:

```bash
feat(EPPB-3): add admin services catalog
feat(EPPB-3): integrate forms api store
feat(EPPB-3): add monaco schema editor
fix(EPPB-3): support backend uuid form ids
```

Запрещено:

- push напрямую в `main`
- push напрямую в `develop`
- большие PR без декомпозиции
- смешивать UI rewrite и API changes в один огромный коммит без необходимости

---

## 12. Definition of Done — FE1

### Уже готово

- Админка запускается
- Каталог услуг отображается
- Формы грузятся из API или mocks
- Форма создаётся через store
- Форма сохраняется через `PUT /forms/{id}`
- Форма публикуется через `POST /forms/{id}/publish`
- JSON можно просматривать в Monaco
- JSON можно редактировать в editor page
- JSON validation через parse работает
- UI приведён к Command Center стилю
- TypeScript check проходит без ошибок

### Нужно закрыть до полноценного demo

- Визуальный CRUD шагов
- Визуальный CRUD полей
- Настройка validations через UI
- Настройка transitions/rules через UI
- Live preview или передача в FE2 renderer
- Финальная синхронизация контракта схемы с backend/portal

---

## 13. Финальная мысль

FE1 Admin Builder готов как основа: есть стильная Command Center админка, Zustand API integration, Monaco JSON editor, каталог услуг и редактор формы. Backend BE2 уже может принимать и хранить схемы как JSONB, поэтому следующий главный шаг FE1 — превратить JSON editor в полноценный visual builder шагов и полей без ручного кода.
