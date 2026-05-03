# EPPB · Байтерек — Design System

> **EPPB (Единый портал поддержки бизнеса)** is a low-code platform that consolidates 70+ government business-support services under one roof. Analysts assemble services from a JSON schema; entrepreneurs apply through a single dynamic wizard; everything is published instantly without a frontend deploy.
>
> The platform belongs to **NMH «Байтерек»** — the Kazakhstani holding that operates these institutions. The product audience is **two cohorts on one rail**: business analysts (admin / no-code builder) and SME owners (the public portal).

---

## Files in this system

| File | Purpose |
|---|---|
| **`README.md`** | This file. The full specification — start here. |
| **`colors_and_type.css`** | Single source of truth for color & type tokens. Import in any HTML file via `<link rel="stylesheet" href="../colors_and_type.css">`. |
| **`SKILL.md`** | Mechanical recipe: how to spin up a new screen using these tokens. |
| **`preview/`** | Per-token preview cards (one HTML per concept) — registered as Design System cards. |
| **`assets/`** | Logos, icon sources. |

---

## CONTENT FUNDAMENTALS

### Core stance
The product feels **like Linear or Vercel for government services**. It is a *technical instrument*, not a brochure. The platform speaks to operators, not citizens-as-supplicants. Voice is calm, exact, present-tense; numbers are tabular; metadata is visible.

### Audiences

**Analyst (Builder).** Knows the domain, doesn't know SQL. Reads JSON when needed. Wants: speed, traceability, "what changes when I publish?" Trusts the system when it shows IDs, versions, and a graph of consequences.

**Entrepreneur (Portal).** Has a BIN, wants a leasing decision. Doesn't care that there are 70 services — only cares about *their* service, *right now*. Trusts the system when autofill works, when the next step is obvious, when a price is calculated, not retyped.

### Voice
- **Russian first** (interface). Kazakh as a planned second locale — never write copy that depends on English idiom.
- **Active, present.** "Введите БИН", "Подать заявку", "Шаг пройден". Never "Пожалуйста, введите ваш БИН компании в это поле".
- **Numbers are facts.** Always render with `font-variant-numeric: tabular-nums` and Russian thousands separators (`15 000 000 ₸`).
- **No marketing adjectives.** The product does not say "удобный", "современный", "инновационный". It shows.
- **Mono for system speech.** IDs (`# leasing-stage1`), versions (`v2.0.0`), paths (`/services/leasing/edit`), counts (`02 / 04`) — JetBrains Mono. This is how the platform identifies *itself* speaking, vs. the user speaking.

### Microcopy laws
1. **Errors name the rule, not the user.** "Введите 12 цифр БИН" — not "Неверный формат".
2. **Success is silent + green.** A green check + "Заполнено через eGov" replaces a popup.
3. **CTAs are verbs + object.** "Подать заявку", "Опубликовать схему", "Создать услугу". Never "Готово", "ОК", "Продолжить".
4. **Empty states are honest.** "Услуги не найдены" — not "Здесь будут ваши услуги".

---

## VISUAL FOUNDATIONS

### Metaphor
**Operations panel.** The screen is a console: workflow nodes, statuses, IDs, versions. Not a brochure, not a form-and-button site. Every screen should look like it could show a build log if you scrolled.

### Color philosophy

**Dark is canonical.** Light theme exists as a user setting only — never as a marketing choice. The design assumes #0C0C0F until proven otherwise.

**Three color roles, never blended:**

| Role | Color | Used for |
|---|---|---|
| **Accent** (#E84B0F orange) | Singular | Primary CTA · active nav · current wizard step · focus ring |
| **Success** (#22C55E green) | Singular | Autofill landed · step passed · application accepted |
| **Danger** (#EF4444 red) | Singular | Validation errors · destructive confirm |

Warning yellow and info blue exist but are *quiet* — used for system-state callouts (drafts, mock-mode notices), never decoration.

**Neutrals do the heavy lifting.** Backgrounds step from `--bg-1` (canvas) → `--bg-2` (panel) → `--bg-3` (control) → `--bg-4` (hover). Text steps `--fg-1` → `--fg-2` → `--fg-3` → `--fg-4`. Most surfaces of any screen should be neutral; color earns its place.

### Type system

**Pairing B — engineering / monospaced numerics:**

- **Space Grotesk** (Display, 600 / 700) — H1, H2, H3, page hero. Geometric, strong cyrillic, slightly mechanical. Never below 18px.
- **Inter** (Body, 400 / 500 / 600) — paragraphs, labels, buttons. 13–15px is the working range. 16px maximum for long-form.
- **JetBrains Mono** (Mono, 400 / 500) — IDs, versions, paths, numerics, identity symbols (· → ↗ / #). 11–13px in UI; tabular-nums on numbers.

**Hierarchy ladder:**

| Token | Family | Size | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Display | Space Grotesk | 56–80px | 700 | -0.04em | Hero word, splash |
| H1 | Space Grotesk | 40px | 600 | -0.02em | Page title |
| H2 | Space Grotesk | 32px | 600 | -0.02em | Section title |
| H3 | Space Grotesk | 24px | 600 | -0.015em | Card title, step title |
| Body | Inter | 15px | 400 | 0 | Paragraph |
| Emphasis | Inter | 15px | 500 | 0 | Inline strong |
| Small | Inter | 13px | 400 | 0 | Help text |
| Mono | JetBrains Mono | 11–13px | 400 | 0.10em uppercase for labels | IDs, breadcrumbs, metadata |

### Geometry

- **4px base.** Every spacing token is a 4px multiple. The 8 / 16 / 24 / 32 / 48 rhythm.
- **Radii are restrained.** 4px (chips), 6px (small inputs), 8px (buttons / inputs), 12px (panels), 16px (modals), pill (status dots). No 24px+ blobs.
- **Lines over shadows.** Panels separate by 1px line at `--line-2`, not by drop shadow. Shadow only earns its place at modal/popover level.
- **Density is respected.** Forms are tight (40–44px input height). Tables use 12px row padding. The product does not breathe — it works.

### Iconography

- **Lucide icons** (1.5px stroke) for UI actions: Eye, Send, Save, Plus, Search, ArrowLeft, etc. Same pack the codebase already uses.
- **Monospace symbols** (`·` `→` `↗` `/` `#`) as part of the brand. Use them in breadcrumbs, between metadata fields, before IDs, after external links. They are not decoration — they are the platform speaking syntax.
- **No illustrations.** No 3D, no gradients-as-art. If a screen feels empty, the answer is data density or honesty, not a graphic.

### Motion

**Functional only.** No fades-in for delight.
- `--dur-1` (120ms) for hover/press.
- `--dur-2` (200ms) for focus rings, input border transitions.
- `--dur-3` (320ms) for progress bars filling.
- A pulsing dot on the active wizard step (`box-shadow` keyframe) — the only ambient animation. It signals "the system is waiting on you here, right now."

### Data viz as part of identity

The Builder dashboard, the wizard progress, the Mock-eGov status block — these are not "charts inside the design", they *are* the design. KPI tiles, status counters, and step bars use the same tokens (mono numerics + accent fills + line dividers) as the rest of the system, so a metric reads like it belongs to the platform, not pasted from Recharts.

---

## Cards in this design system

Open the **Design System** tab to see all 12 cards live:

- **Type** — display, body, mono
- **Spacing** — 4px scale, radii, elevation
- **Components** — buttons, inputs, badges, service card, wizard
- **Brand** — wordmark, identity symbols

Plus the **UI Kit** in `kit/EPPB UI Kit.html` — every screen wired into one tour.
