# SKILL · How to spin up a new EPPB screen

A mechanical recipe. Follow these in order — don't skip.

## 1. Wire the tokens
At the top of every new HTML file:

```html
<link rel="stylesheet" href="../colors_and_type.css">
```

(adjust the relative path). All color and type access is through CSS variables — never hardcode `#0C0C0F`, `#E84B0F`, or font names.

## 2. Set the canvas
Body always opens with:

```css
html, body { margin: 0; background: var(--bg-1); color: var(--fg-1); font-family: var(--font-body); }
```

Dark is canonical. If a light variant is needed, set `data-theme="light"` on `<html>`.

## 3. Pick the layout archetype

| Screen kind | Layout |
|---|---|
| Public hero / catalog | Top header (60px) + content with 48px horizontal pad |
| Multi-step form | **Full-bleed split** — left context (40%, 400px min, `--bg-2`), right form pane (`--bg-1`) |
| Admin / dashboard | Sidebar (240px, `--bg-2`) + topbar (52px) + content |
| Detail / overview | Single column, `panel`-grouped sections, max-width readable measure |

## 4. Build hierarchy
- One **Display** word/phrase per screen (Space Grotesk, 32–80px).
- Every panel header begins with a `.label` (mono, uppercase, `--fg-3`).
- Every metric is rendered with `.num` (`tabular-nums` + JetBrains Mono).
- Every ID uses `# slug-here` in mono, `--fg-4`.

## 5. Spend accent intentionally
`#E84B0F` only appears as:
1. Primary CTA fill,
2. Active nav item (with `--accent-soft` background),
3. Current wizard step + its pulsing dot,
4. Focus ring (`--accent-soft` 3px shadow on focused inputs),
5. The single accent dot in the wordmark.

If a screen has zero accent uses, that's fine — but never more than 5 instances on one viewport.

## 6. Never-mix the semantics
- **Green** (`--success`) = "the system did something on your behalf and it worked" → autofill landed, step passed, submission accepted.
- **Red** (`--danger`) = validation error, destructive confirm.
- **Yellow** (`--warning`) = system-state notice (mock mode, draft autosaved), never decoration.
Don't repurpose green as accent or red as warning. Roles are sticky.

## 7. Add identity syntax
Sprinkle the monospace symbols `· → ↗ / #` from the brand set:
- `→` between steps and conditions (`if X > 40M → step_audit_review`),
- `↗` for external/expandable links,
- `·` as a metadata separator (`v2.0.0 · 4 шага · eGov`),
- `/` for paths (`BUILDER / КАТАЛОГ / ЛИЗИНГ`),
- `#` before any ID (`# wagon_count`).

## 8. Motion is functional
- Hover: 120ms color/border change.
- Focus: 200ms shadow expansion to `--accent-soft`.
- Active wizard step: pulsing dot keyframe (already in `colors_and_type.css` examples).
- Avoid: page transitions, fade-ins on load, hover-lift on cards, animated counters.

## 9. Copy laws (re-read these)
1. Russian, active, present-tense.
2. Numbers tabular + Russian thousands (`15 000 000 ₸`).
3. CTAs are verb + object ("Подать заявку").
4. Errors name the rule ("Введите 12 цифр БИН").
5. No marketing adjectives.

## 10. Verify
- Every panel separated by 1px `--line-2` line, not shadow.
- Every screen has at least one mono metadata line (label, ID, version).
- Every screen has at most one Display block.
- Accent count ≤ 5.
- No emoji.
- No stock illustrations.
- Long-form text capped at 64ch.

If a screen passes all 10, register it as an asset. If it doesn't, fix it before showing.
