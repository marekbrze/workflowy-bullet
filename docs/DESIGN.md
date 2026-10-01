# Design Direction

## Register
product

## Scene
Morning, at a desk or kitchen table with coffee, in plain daylight: someone calm and slightly scattered who wants to close yesterday without being rushed, one entry at a time, mostly from the keyboard.

The scene forces a **light theme** — a warm, matte surface that does not glare in daylight. Dark mode is supported as a secondary theme (the template ships it and some mornings are dark), but light is the designed default.

## Personality
**Paper, warm, quiet.** A page from a bullet journal: matte, ink instead of interface color, no shine. Calm, never urgent; nothing congratulates the user and nothing nags.

## References
- **Paper bullet journal (Leuchtturm1917)**: the matte, slightly tinted page; thin lines instead of boxes; ink as the only color. The paper feeling comes from lightness steps and hairline borders, not from textures.
- **Day One**: the entry's text is the hero and the interface chrome recedes; an intimate, journal-like tone.
- **Linear**: precise, keyboard-first behavior with the shortcut visible next to the action; fast and exact without feeling cold.

## Anti-references
- **Duolingo and gamified apps**: streaks, points, confetti, praise. The tone is no gamification and no manufactured urgency.
- **Notion templates and productivity dashboards**: emoji in headings, colored tags, identical tile grids, the look of a template made on a weekend.
- **Neon dark "hacker" themes**: black canvas, fluorescent accent, monospace as shorthand for "technical".
- **Corporate blue SaaS**: the blue primary button, gray sidebar and anonymous cards. The reflex this direction avoids.

## Color
**Strategy**: Restrained — tinted neutrals plus one accent used on at most ~10% of any screen. Color serves decisions (the primary action, focus, the current selection), never decoration.
**Seed hue**: `oklch(0.44 0.13 335)` — a deep plum, the colour of aubergine or of ink gone slightly violet. Chosen from the paper-and-ink scene, not from the blue (~250) or orange (~60) defaults.

### Light (default)
| Role | Token | Value | Notes |
|------|-------|-------|-------|
| Canvas | `--canvas` | `oklch(0.975 0.007 335)` | page background; paper |
| Surface | `--surface` | `oklch(0.99 0.004 335)` | cards, popovers; one step lighter than the canvas |
| Surface 2 | `--surface-2` | `oklch(0.955 0.010 335)` | muted and secondary fills, pressed rows |
| Border | `--border` | `oklch(0.88 0.014 335)` | hairline dividers (decorative) |
| Input border | `--input` | `oklch(0.58 0.025 335)` | form-field boundary; ≥3:1 on canvas and surface |
| Ink | `--ink` | `oklch(0.25 0.022 335)` | body text, tinted toward plum |
| Ink muted | `--ink-muted` | `oklch(0.45 0.025 335)` | secondary text; still ≥4.5:1 |
| Primary/500 | `--brand-500` | `oklch(0.44 0.13 335)` | seed; primary button, links, selected state |
| Primary/600 | `--brand-600` | `oklch(0.39 0.13 335)` | hover and pressed |
| Primary/100 | `--brand-100` | `oklch(0.93 0.035 335)` | accent fills (hover tint, selected row) |
| Primary/050 | `--brand-050` | `oklch(0.965 0.02 335)` | faintest accent tint |
| On primary | `--on-brand` | `oklch(0.985 0.005 335)` | text on primary |
| Focus ring | `--ring` | `oklch(0.56 0.14 335)` | brand colored; ≥3:1 on canvas and surface |
| Success | `--success` | `oklch(0.44 0.10 155)` | tint `oklch(0.955 0.025 155)` |
| Error | `--error` | `oklch(0.47 0.17 27)` | tint `oklch(0.955 0.02 27)` |
| Warning | `--warning` | `oklch(0.50 0.09 75)` | tint `oklch(0.955 0.025 85)` |

**Neutrals**: tinted with chroma 0.004–0.025 toward hue 335 (the plum seed) — not the default warm cream (`oklch(97% 0.01 60)`). A 7-step scale: canvas → surface → surface-2 → border → input → ink-muted → ink.
**Depth**: from lightness steps and hairline borders, not shadows. Paper is matte.
**Radius**: a single `--radius: 0.5rem`; variants are computed from it (`sm` 0.6×, `md` 0.8×, `lg` 1×, `xl` 1.4×).
**Focus ring**: 2px in `--ring`, offset 2px, always visible on keyboard focus.

### Dark (secondary)
Not an inversion: depth comes from surface lightness, with the same hue and chroma family as the light theme.
| Role | Token | Value |
|------|-------|-------|
| Canvas | `--canvas` | `oklch(0.19 0.012 335)` |
| Surface | `--surface` | `oklch(0.23 0.014 335)` |
| Surface 2 | `--surface-2` | `oklch(0.27 0.016 335)` |
| Border | `--border` | `oklch(0.34 0.02 335)` |
| Input border | `--input` | `oklch(0.62 0.025 335)` |
| Ink | `--ink` | `oklch(0.93 0.012 335)` |
| Ink muted | `--ink-muted` | `oklch(0.74 0.02 335)` |
| Primary | `--brand-500` | `oklch(0.78 0.11 335)` (desaturated and lighter) |
| On primary | `--on-brand` | `oklch(0.20 0.02 335)` |
| Primary tint | `--brand-100` | `oklch(0.30 0.05 335)` |
| Focus ring | `--ring` | `oklch(0.70 0.13 335)` |
| Success / Error / Warning | | `oklch(0.76 0.11 155)` / `oklch(0.72 0.14 27)` / `oklch(0.78 0.10 80)` |

Body weight drops one notch in dark (light text on a dark ground reads heavier). Primitives (`--brand-*`) stay constant; only the semantic tokens below are overridden.

### Mapping to the shadcn token layer
`--background` = canvas · `--card`/`--popover` = surface · `--secondary`/`--muted` = surface-2 · `--foreground`/`--card-foreground` = ink · `--muted-foreground` = ink-muted · `--primary` = brand-500 · `--primary-foreground` = on-brand · `--accent` = brand-100 · `--accent-foreground` = brand-600 · `--destructive` = error · `--border` = border · `--input` = input border · `--ring` = ring. The `chart-*` and `sidebar-*` tokens are unused by this app and follow the neutrals.

### Contrast (verified numerically, WCAG 2.2)
Light: ink on canvas 14.96 · ink on surface 15.65 · ink-muted on canvas 7.00, on surface-2 6.59 · on-brand on brand-500 7.98 · brand-500 text on canvas 7.75 · error on canvas 6.92, on its tint 6.50 · ring on canvas 4.66 · input border on canvas 4.03. Dark: ink on canvas ≥ 7.9 · ink-muted on surface-2 6.52 · brand text on canvas 8.82 · input border on surface 4.60. Everything is above the floor (4.5:1 text, 3:1 UI), with AAA-level body text.

## Typography
**Direction**: one well-tuned sans for the whole interface. The entry card gets a larger size and looser leading, not a different face.
**Family**: **Atkinson Hyperlegible Next** (variable, `@fontsource-variable/atkinson-hyperlegible-next`). Voice words: paper, warm, quiet. It was drawn for legibility — open apertures, clear letter shapes, slightly humanist — so it reads like a calm printed page rather than a tech product, and suits a user who is easily overwhelmed. It rejects the reflex defaults (Inter, DM Sans, Plus Jakarta, Geist) and is not a display face, so it is safe in labels and buttons.
**Scale**: fixed `rem`, ratio ≈ 1.2 (product):
| Step | Size | Use |
|------|------|-----|
| xs | 0.75rem | keyboard hints (`kbd`) only — decorative, hidden on touch screens |
| sm | 0.875rem | secondary text, buttons, labels, and any meta that carries information (day, counters, statuses, chips) — never below 14px |
| base | 1rem | body |
| lg | 1.2rem | section headings |
| xl | 1.44rem | page headings |
| card | 1.5rem / line-height 1.35 | the entry text on the review card — the one place type gets big |
**Weights**: 400 body, 500 labels and buttons, 600 headings (three weights).
**Loading**: `font-display: swap`; fallback stack `system-ui, sans-serif` with metric adjustment so the swap does not shift layout; preload only the regular weight's latin subset.
**Details**: `font-variant-numeric: tabular-nums` for counters ("3 of 12", "12 min ago"); prose measure 65–75ch (the app's column is already `max-w-2xl`); line-height 1.5 body, 1.35 on the card.

## Motion
Functional only, 150–250 ms, on state changes: the card swapping to the next entry, dialogs opening, focus, disclosure. `ease-out`, no bounce, no choreography, no animation on load. Every transition has a `prefers-reduced-motion: reduce` fallback (instant state change). Closing a queue has no effect or celebration — the summary is plain.

## Guardrails
**Absolute bans** (match-and-refuse):
- Side-stripe borders (`border-left/right` > 1px as a colored accent) — use a full hairline border, a background tint or a leading glyph.
- Gradient text; glassmorphism as a default.
- The hero-metric template, identical card grids, tiny uppercase tracked eyebrows over every section, `01/02/03` markers as scaffolding.
- Text that overflows its container at any breakpoint.
- Skeuomorphic paper: no textures, dot-grid backgrounds, torn edges or fake shadows. Paper is expressed through tint and restraint.

**Product bans**:
- Decorative motion that isn't state.
- Inconsistent component vocabulary across screens (one button style per role, one dialog pattern, one way to show a shortcut).
- A display font in labels, buttons or data.
- Reinvented standard controls (custom scrollbars, odd form controls).
- Heavy accent on inactive states; the accent marks what can be acted on or what is selected.
- A modal as the first thought — exhaust inline first. (The destination picker and confirmations are modal on purpose; do not add more.)
- Gamification: streaks, points, badges, celebratory copy or effects.
- Alarm styling for neutral counts: open days and waiting entries are shown in calm text, never red badges.

**Contrast floor**: body ≥ 4.5:1, large text and UI components ≥ 3:1, placeholder text ≥ 4.5:1 (no default muted gray on a tinted near-white).
**Targets**: 44px tall wherever the pointer is coarse (a base rule), keyboard focus always visible.
**Words**: the activity is a *review* everywhere in the interface ("Yesterday's review", "End review"); "session" stays a code term (`ReviewSession`).

## Hand-off to proto-design
**Token layer**: Tailwind v4 with the shadcn `:root` / `.dark` custom properties in `src/index.css` and the `@theme inline` block. First step: replace the neutral oklch values with the palette above (mapping table), set `--radius: 0.5rem`, swap `@fontsource-variable/geist` for `@fontsource-variable/atkinson-hyperlegible-next` and set `--font-sans`, add `--brand-*` primitives and the success/warning tokens, and a `prefers-reduced-motion` rule.

**Implementation order** (from `docs/MODULES.md`): the shared shell and components first (`AppShell`, `Button`, `ConfirmDialog`, `ModalDialog`, `Kbd`, notices), then `review-session` (core — the entry card and decision bar carry the most design), `note-filing` (picker), `days` (home), `connection` (settings).

**Components to design with care**: the entry card (type scale, children disclosure, chips), the decision bar and shortcut hints, the destination picker rows, the day status text (calm, no badges), and every notice (error, stale tree, invalid key) so they read as part of the same page.
