# LifeBook design system

The source of truth for how LifeBook looks. Read this before changing UI in `apps/web` or `apps/marketing`, and give it to any design agent, skill or plugin (frontend-design, theme-factory, UI/UX Pro Max and so on) as a constraint. Those tools must extend this system, not replace it with their own palette, fonts or layout style.

Tokens and components live in [`apps/web/app/globals.css`](apps/web/app/globals.css). There is no Tailwind, shadcn or CSS-in-JS. Use the existing classes and tokens; add a new class only when no existing one fits.

## Character

Calm, warm and devotional, not a productivity dashboard. Scripture is the content, so the interface stays quiet: generous spacing, soft surfaces, one accent colour, readable long-form text. Avoid gradients-everywhere, glassmorphism, neon accents, emoji decoration and dense data UI.

## Colour tokens

Always use the variable, never the hex value. Dark mode redefines the same variables under `:root[data-theme='dark']`, so a token-based rule works in both themes automatically.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#f7f7fb` | `#121019` | Page background |
| `--paper` | `#fff` | `#1d1927` | Cards, panels, sidebar |
| `--ink` | `#201b32` | `#f1edf8` | Body text, headings |
| `--muted` | `#7a768b` | `#b9adc9` | Secondary text, labels |
| `--line` | `#ebe9f2` | `#3b334c` | Borders, dividers |
| `--purple` | `#7252ca` | `#b79aee` | The single accent: primary actions, links, active state |
| `--deep` | `#49328c` | `#d1bdf8` | Emphasis text on soft surfaces, stat numbers |
| `--soft` | `#f0ebfc` | `#30263f` | Tinted surfaces, hover, selected |
| `--pink`, `--teal` | pastel | muted | Feature-icon tints only |

Rules:
- One accent. Do not introduce new brand colours; `--pink`/`--teal` are decorative tints, not alternate primaries.
- A hard-coded colour in a new rule needs a matching `:root[data-theme='dark']` override in the same change. Prefer a token instead.
- Text on `--soft` uses `--deep` or `--ink`, never `--muted` (contrast).

## Typography

- Headings: **Manrope** 600–800, `letter-spacing: -.035em`.
- Body and UI: **DM Sans** 400–700, base `14px`.
- Scripture: `.scripture-text` is set in Georgia serif at `clamp(18px, 2vw, 21px)` with line height 2; `.reading` body is 16px / 1.9. Keep verse text unbroken by UI chrome.
- Common sizes: 12–13px labels and meta, 14px body, 16–17px lead, 20–23px section titles, 34px page titles. Reuse these instead of adding new sizes.

## Shape, depth and spacing

- Radius: `--radius` (20px) for cards and panels; 12px for buttons and inputs; 16px for inner tiles; `99px` for pills.
- Shadow: only `--shadow`, and only on raised cards. Borders (`1px solid var(--line)`) do most of the separation.
- Layout: sidebar shell (`.app-shell`, `.sidebar`, `.main-column`) collapses at 1150px and to the mobile header and menu at 760px; content grids collapse to one column by 700px.

## Components to reuse

| Need | Classes |
| --- | --- |
| Buttons | `.btn` + `.btn-primary` / `.btn-soft` / `.btn-outline` / `.btn-light`, `.btn-sm`; `.icon-button` |
| Surfaces | `.card`, `.feature-card`, `.stat-card`, `.status-card`, `.settings-card` |
| Page structure | `.page`, `.page-heading`, `.page-intro`, `.eyebrow`, `.section-title`, `.subheading` |
| Forms | `.form-field`, `.input`, `.textarea`, `.select`, `.choice-grid` / `.choice`, `.check-row` |
| Feedback | `.notice`, `.alert`, `.empty`, `.skeleton`, `.pill`, `.tag`, `.progress-track` / `.progress-fill` |
| Scripture | `.reading`, `.verse-quote`, `.verse-ref`, `.small-verse`, `.scripture-attribution` |
| Layout | `.grid` + `.cols-2/3/4`, `.stack`, `.two-up`, `.list-row` |

Icons come from `lucide-react` only, at the stroke width used around them.

## Non-negotiables

- Touch targets at least 44px high (buttons, nav links, selects, tags).
- Visible `:focus-visible` outline on every interactive element; keep the skip link working.
- Respect `prefers-reduced-motion`; motion is limited to short colour, shadow and transform transitions (about 150–180ms).
- Every data view has loading, empty and error states with a retry action (see `.skeleton`, `.empty`, `.alert`).
- All user-facing text goes through the language provider (`<L en fr />` or `useLanguage`), in both English and French.
- Scripture text is shown with its translation attribution and is never generated or paraphrased by the UI.
- Check new UI at 320, 390, 768 and 1440px in both light and dark themes.

## Performance

Context values in `components/*-provider.tsx` are memoised because every `<L>` string and theme consumer subscribes to them. Keep new provider values in `useMemo` and callbacks in `useCallback`. Use React Scan (see [docs/FRONTEND_TOOLING.md](docs/FRONTEND_TOOLING.md)) to check a new screen does not re-render on every keystroke or timer tick.
