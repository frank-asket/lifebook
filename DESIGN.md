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
| `--muted` | `#686176` | `#b9adc9` | Secondary text, labels (5.90:1 on `--paper`, 5.52:1 on `--bg`; keep ≥ 4.5:1) |
| `--line` | `#ebe9f2` | `#3b334c` | Borders, dividers |
| `--purple` | `#7252ca` | `#b79aee` | The single accent: primary actions, links, active state |
| `--deep` | `#49328c` | `#d1bdf8` | Emphasis text on soft surfaces, stat numbers |
| `--soft` | `#f0ebfc` | `#30263f` | Tinted surfaces, hover, selected |
| `--pink`, `--teal` | pastel | muted | Feature-icon tints only |

Rules:
- One accent. Do not introduce new brand colours; `--pink`/`--teal` are decorative tints, not alternate primaries.
- A hard-coded colour in a new rule needs a matching `:root[data-theme='dark']` override in the same change. Prefer a token instead.
- Text on `--soft` uses `--deep` or `--ink`, never `--muted` (contrast).
- No inline `color` / `background` in TSX: put it in a class in `globals.css` so it can carry a dark override.
- Meaningful icons need 3:1 against the chip or surface behind them (feature-icon tints: rose `#c85a9a`, mint `#269382`, gold `#ae7a2b`, lilac `#7b54cb`; `.empty svg` `#8d74c2`).
- Text on a gradient is checked against its lightest stop. The purple panels (`.auth-visual`, `.lw-hero`) end at `#76589f` so white and the `#f4e6ff` / `#f4ecff` tints stay at 4.5:1 or above.

## Typography

- Headings: **Manrope** 600–800. Tracking is size-specific, never one value for every size: h1 `-.03em` / line height 1.2, h2 `-.022em` / 1.3, h3–h4 `-.012em` / 1.35; body text stays at 0. Marketing display headings use `-.04em` to `-.05em`, always in `em` so they scale with `clamp()`.
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

## Motion and feedback

Adapted from the `apple-design` skill (Apple's *Designing Fluid Interfaces*) to fit the calm character above. The styles live in the "Interaction and craft" block at the end of each `globals.css`.

- **Respond on press.** Interactive elements give feedback on `:active` (pointer-down): `scale(.97)` over 100ms for buttons, icons and nav items, `scale(.985)` for larger tappable cards and card links, and `opacity: .65` for inline text links (scaling text looks wobbly). Add `touch-action: manipulation` to remove the double-tap delay.
- **Hover lifts only on hover-capable pointers.** Under `@media (hover: none)`, a `translateY` hover is reset, so it does not stick after a tap.
- **Spatial consistency.** A panel enters from the control that opened it and leaves the same way. The web app's mobile More panel rises from the bottom bar (`transform-origin: bottom right`). The marketing mobile menu drops from the header and retracts upward (`@starting-style` with `transition-behavior: allow-discrete`). Marketing FAQ answers expand and collapse in place (`::details-content` with `interpolate-size`). Reversible transitions mirror their easing: `cubic-bezier(.2, .8, .2, 1)` on the way in, its inverse `cubic-bezier(.8, 0, .8, .2)` on the way out. Browsers without these features simply show and hide the panel.
- **Scroll edges, not permanent dividers.** Sticky headers show their bottom border only once content scrolls under them (a scroll-driven animation, with a plain border as the fallback).
- **No springs or gesture physics yet.** LifeBook has no drag, swipe or sheet gestures. Add a spring library only when one is built, and then follow the skill: interruptible motion, velocity handoff, critically damped by default.
- **No glassmorphism.** Translucency stays limited to the existing near-opaque marketing header, which turns solid under `prefers-reduced-transparency` and `prefers-contrast: more`.
- **Accessibility signals.** `prefers-reduced-motion` removes movement; `prefers-contrast: more` darkens `--line` (to at least 3:1 against `--paper`, the non-text contrast minimum) and `--muted` (about 7:1) in both themes; theme changes ease the large surfaces over 180ms instead of flashing.

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

## Native mobile application

Expo/React Native uses the same calm character and single accent, with system UI fonts and platform serif Scripture (`Georgia` on iOS, `serif` on Android). Web CSS rules above do not require CSS classes inside native components.

- Shared touch targets are at least 48 units; labels may wrap and controls grow with text.
- At enlarged font sizes, segmented choices become vertical. Chapter grids adapt their column count.
- Reading content has a comfortable maximum width on tablets and respects safe areas. Sheets with settings must scroll.
- Decorative icons stay outside accessible names. Spoken labels include purpose and meaningful progress/selection state.
- Press feedback is immediate and stationary. Reduced Motion changes apply while the app runs, including navigation and editor transitions.
- Preserve draft/failed-write feedback and confirm destructive actions. Language preferences live in Settings.

See [mobile screen review](docs/MOBILE_DESIGN_REVIEW_2026-10-19.md) for coverage, evidence and open device/store acceptance.
