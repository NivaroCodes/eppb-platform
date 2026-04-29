param(
    [string]$Token
)

$GITHUB_REPO = "NivaroCodes/eppb-platform"
$GITHUB_TOKEN = $Token

if (-not $GITHUB_TOKEN) {
    $GITHUB_TOKEN = $env:GITHUB_TOKEN
}

if (-not $GITHUB_TOKEN) {
    Write-Error "GitHub Token is required. Use -Token parameter or set GITHUB_TOKEN environment variable."
    exit 1
}

$headers = @{
    "Authorization" = "token $GITHUB_TOKEN"
    "Accept"        = "application/vnd.github.v3+json"
}

$baseUrl = "https://api.github.com/repos/$GITHUB_REPO"

function Create-Label($name, $color, $description) {
    Write-Host "Creating label: $name..."
    $body = @{
        name = $name
        color = $color
        description = $description
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$baseUrl/labels" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    } catch {
        Write-Warning "Label $name might already exist or error occurred: $_"
    }
}

# 1. Create Labels
Create-Label "phase:core" "ff0000" "Core MVP Phase"
Create-Label "phase:demo" "ffa500" "Demo Ready Phase"
Create-Label "phase:advanced" "008000" "Advanced Features Phase"

Create-Label "role:be-engine" "800080" "Backend Engine Role"
Create-Label "role:be-data" "0000ff" "Backend API/Data Role"
Create-Label "role:fe-builder" "ffff00" "Frontend Builder Role"
Create-Label "role:fe-portal" "00ff00" "Frontend Portal Role"

Create-Label "priority:high" "8b0000" "High Priority"
Create-Label "priority:medium" "ffff00" "Medium Priority"
Create-Label "priority:low" "90ee90" "Low Priority"

# 2. Issues Definition
$issues = @(
    @{
        title = "[BE 2] Setup Project & Core API Services"
        labels = @("phase:core", "role:be-data", "priority:high")
        context = "Инициализация репозитория бэкенда, настройка БД и базовых эндпоинтов."
        scope = @("Создать проект (Node.js/Go/Python)", "Настроить схему БД", "Реализовать GET/POST /services")
        notes = "Следовать SPECIFICATION.md"
        acceptance = @("Проект создан", "БД настроена", "API работает")
        id = 1
    },
    @{
        title = "[BE 1] JSON Schema Definition & Base Parser"
        labels = @("phase:core", "role:be-engine", "priority:high")
        context = "Определение структуры JSON-схемы и создание валидатора."
        scope = @("Зафиксировать JSON-схему", "Реализовать валидацию", "Протестировать парсинг схемы 'Лизинг'")
        notes = "Согласовать с фронтендом"
        acceptance = @("Схема зафиксирована", "Валидация работает")
        id = 2
    },
    @{
        title = "[FE 2] Dynamic Form Renderer Engine"
        labels = @("phase:core", "role:fe-portal", "priority:high")
        context = "Ядро рендеринга JSON -> UI компоненты."
        scope = @("Компонент DynamicForm", "Поддержка базовых типов полей", "Стилизация")
        notes = "Зависит от #2"
        acceptance = @("Форма рендерится из JSON", "Поля ввода работают")
        id = 3
    },
    @{
        title = "[FE 1] Admin Service Dashboard & JSON Editor"
        labels = @("phase:core", "role:fe-builder", "priority:high")
        context = "Интерфейс админа для управления услугами."
        scope = @("Список услуг", "Кнопка создания", "JSON редактор")
        notes = "Интеграция с API BE 2"
        acceptance = @("Список услуг отображается", "JSON отправляется на сервер")
        id = 4
    },
    @{
        title = "[CORE] Define JSON Schema Contract v1"
        labels = @("phase:core", "priority:high")
        context = "Единый контракт схемы для BE и FE."
        scope = @("Документировать все типы полей", "Описать правила валидации")
        acceptance = @("Контракт подписан обеими сторонами")
        id = 5
    },
    @{
        title = "[CORE] End-to-End Smoke Flow"
        labels = @("phase:core", "priority:high")
        context = "Проверка прохождения заявки от создания до отображения."
        scope = @("Создать услугу в админке", "Пройти форму на портале", "Проверить сохранение")
        notes = "Зависит от всех CORE задач"
        acceptance = @("Smoke test пройден")
        id = 6
    },
    @{
        title = "[BE 1] Workflow Engine (Logic & Transitions)"
        labels = @("phase:demo", "role:be-engine", "priority:high")
        context = "Логика переходов между шагами."
        scope = @("Вычисление next_step", "Поддержка операторов (==, !=, etc)", "API оценки правил")
        notes = "Зависит от #1"
        acceptance = @("Переходы работают корректно")
        id = 7
    },
    @{
        title = "[BE 2] External Integration Layer (Mocks)"
        labels = @("phase:demo", "role:be-data", "priority:high")
        context = "Моки eGov/EISH для автозаполнения."
        scope = @("Эндпоинт /subject/{bin}", "S3 mock для документов")
        acceptance = @("Данные по БИН возвращаются", "Документы загружаются")
        id = 8
    },
    @{
        title = "[FE 2] Multi-step Wizard Controller"
        labels = @("phase:demo", "role:fe-portal", "priority:high")
        context = "Управление состоянием многошаговой формы."
        scope = @("Навигация wizard", "Индикатор прогресса", "Валидация шагов")
        notes = "Зависит от #3 и #7"
        acceptance = @("Многошаговость работает")
        id = 9
    },
    @{
        title = "[FE 1] Visual Logic Builder (No-code UI)"
        labels = @("phase:demo", "role:fe-builder", "priority:high")
        context = "Визуальная настройка правил ветвления."
        scope = @("UI для условий", "Сохранение правил в JSON")
        notes = "Зависит от #7"
        acceptance = @("Правила настраиваются визуально")
        id = 10
    },
    @{
        title = "[BE 1] Calculation Engine"
        labels = @("phase:advanced", "role:be-engine", "priority:medium")
        context = "Поддержка вычисляемых полей."
        scope = @("Тип calculated", "Автообновление значений")
        acceptance = @("Расчеты в форме работают")
        id = 11
    },
    @{
        title = "[FE 2] User Dashboard & Tracking"
        labels = @("phase:advanced", "role:fe-portal", "priority:medium")
        context = "Личный кабинет пользователя."
        scope = @("Список заявок", "Детальный вид заявки")
        acceptance = @("Статусы отслеживаются")
        id = 12
    },
    @{
        title = "[FE 1] Live Preview Mode"
        labels = @("phase:advanced", "role:fe-builder", "priority:low")
        context = "Предпросмотр формы в админке."
        scope = @("Split-screen/Modal preview")
        notes = "Использует рендерер из FE 2"
        acceptance = @("Preview работает")
        id = 13
    }
)

$idMap = @{}

foreach ($issue in $issues) {
    Write-Host "Creating issue: $($issue.title)..."
    
    $bodyText = @"
## Context
$($issue.context)

## Scope
$($issue.scope | ForEach-Object { "* [ ] $_" } | Out-String)

## Technical Notes
$($issue.notes)

## Acceptance Criteria
$($issue.acceptance | ForEach-Object { "* [ ] $_" } | Out-String)

## Definition of Done
* [ ] Смержено в main
* [ ] Протестировано
* [ ] Работает end-to-end
"@

    $payload = @{
        title = $issue.title
        body = $bodyText
        labels = $issue.labels
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/issues" -Method Post -Headers $headers -Body $payload -ContentType "application/json"
    $idMap[$issue.id] = $response.number
    Write-Host "Created Issue #$($response.number)"
}

Write-Host "Setting up dependencies in descriptions..."
# Note: Since we created them in order, we can now update descriptions if needed to link correct IDs.
# For simplicity, we'll just print the map.

Write-Host "GitHub Project V2 (Board) creation via API requires GraphQL and is complex for a simple script."
Write-Host "Please create the project manually and link these issues."
Write-Host "Done!"
