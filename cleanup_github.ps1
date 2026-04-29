param(
    [string]$Token
)

$GITHUB_REPO = $env:GITHUB_REPOSITORY
if (-not $GITHUB_REPO) { $GITHUB_REPO = "NivaroCodes/eppb-platform" }
$GITHUB_TOKEN = if ($Token) { $Token } else { $env:GITHUB_TOKEN }

$headers = @{
    "Authorization" = "token $GITHUB_TOKEN"
    "Accept"        = "application/vnd.github.v3+json"
}
$baseUrl = "https://api.github.com/repos/$GITHUB_REPO"

function Call-API($endpoint, $method = "GET", $body = $null) {
    $uri = "$baseUrl$endpoint"
    $params = @{
        Uri = $uri
        Method = $method
        Headers = $headers
        ContentType = "application/json"
    }
    if ($body) { $params.Body = $body | ConvertTo-Json -Depth 10 }
    return Invoke-RestMethod @params
}

# 1. Create Labels and Milestone
Write-Host "Setting up labels and milestones..."
try { Call-API "/labels" "POST" @{ name = "status:mvp"; color = "00ff00"; description = "Core MVP Issue" } } catch {}
try { Call-API "/labels" "POST" @{ name = "status:deprecated"; color = "cccccc"; description = "Deprecated or duplicate issue" } } catch {}
$milestone = try { Call-API "/milestones" "POST" @{ title = "MVP"; state = "open"; description = "Minimum Viable Product" } } catch { 
    Call-API "/milestones" | Where-Object { $_.title -eq "MVP" } | Select-Object -First 1
}

$mvpId = $milestone.number

# 2. Define MVP and Deprecated lists
$mvpMapping = @{
    1 = "[BE 2] Setup Project & Core API Services"
    2 = "[BE 1] JSON Schema Definition & Base Parser"
    7 = "[BE 1] Workflow Engine (Logic & Transitions)"
    3 = "[FE 2] Dynamic Form Renderer Engine"
    9 = "[FE 2] Multi-step Wizard Controller"
    4 = "[FE 1] Admin Service Dashboard & JSON Editor"
    5 = "[CORE] Define JSON Schema Contract v1"
    6 = "[CORE] End-to-End Smoke Flow"
}

$criticalPath = "BE2 (#1) → BE1 (#2) → FE2(Renderer) (#3) → FE2(Wizard) (#9) → FE1(Builder) (#4)"

# 3. Process all issues
$allIssues = Call-API "/issues?state=all&per_page=100"
foreach ($issue in $allIssues) {
    if ($issue.pull_request) { continue }
    $num = [int]$issue.number
    
    if ($mvpMapping.ContainsKey($num)) {
        Write-Host "Normalizing MVP Issue #$num..."
        $depText = "`n`n## Dependencies`nCritical Path: $criticalPath"
        $newBody = $issue.body
        if ($newBody -notlike "*## Dependencies*") {
            $newBody += $depText
        }
        
        Call-API "/issues/$num" "PATCH" @{
            labels = @("status:mvp")
            milestone = $mvpId
            body = $newBody
            state = "open"
        }
    } elseif ($num -ne 27) { # Don't deprecate Master Issue
        Write-Host "Deprecating Issue #$num..."
        Call-API "/issues/$num" "PATCH" @{
            labels = @("status:deprecated")
            state = "closed"
        }
    }
}

# 4. Create Master Issue
Write-Host "Checking for Master Issue..."
$masterIssue = $allIssues | Where-Object { $_.title -like "*[MASTER]*" } | Select-Object -First 1

if (-not $masterIssue) {
    Write-Host "Creating Master Issue..."
    $masterBody = @"
## Context
Единый контрольный центр MVP разработки

## Critical Path
$criticalPath

## Scope
* [BE 2] Setup Project & Core API Services (#1)
* [BE 1] JSON Schema Definition & Base Parser (#2)
* [BE 1] Workflow Engine (#7)
* [FE 2] Dynamic Form Renderer Engine (#3)
* [FE 2] Multi-step Wizard Controller (#9)
* [FE 1] Admin Service Dashboard & JSON Editor (#4)
* [CORE] Define JSON Schema Contract v1 (#5)
* [CORE] End-to-End Smoke Flow (#6)

## Execution Rules
* 1 task per developer
* no parallel work outside dependency order

## Definition of Done
* end-to-end flow работает: schema → UI → submission → workflow
"@

    Call-API "/issues" "POST" @{
        title = "[MASTER] EPPB MVP Execution Plan"
        body = $masterBody
        labels = @("status:mvp")
        milestone = $mvpId
    }
} else {
    Write-Host "Master Issue already exists."
}

Write-Host "Done!"
