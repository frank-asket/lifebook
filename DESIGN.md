# LifeBook design system

The source of truth for how LifeBook looks. Read this before changing UI in `apps/web` or `apps/marketing`, and give it to any design agent, skill or plugin (frontend-design, theme-factory, UI/UX Pro Max and so on) as a constraint. Those tools must extend this system, not replace it with their own palette, fonts or layout style.

Tokens and components live in [`apps/web/app/globals.css`](apps/web/app/globals.css). There is no Tailwind, shadcn or CSS-in-JS. Use the existing classes and tokens; add a new class only when no existing one fits.

## Character

Calm, warm and devotional, not a productivity dashboard. Scripture is the content, so the interface stays quiet: generous spacing, soft surfaces, one accent colour, readable long-form text. Avoid gradients-everywhere, glassmorphism, neon accents, emoji decoration and dense data UI.

## Colour tokens

Always use the variable, never the hex value. Dark mode redefines the same variables under `:root[data-theme='dark']`, so a token-based rule works in both themes automatically.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#faf8f5` | `#121019` | Page background |
| `--paper` | `#fff` | `#1d1927` | Cards, panels, sidebar |
| `--ink` | `#201b32` | `#f1edf8` | Body text, headings |
| `--muted` | `#686176` | `#b9adc9` | Secondary text, labels (5.90:1 on `--paper`, 5.52:1 on `--bg`; keep ≥ 4.5:1) |
| `--line` | `#ebe9f2` | `#3b334c` | Borders, dividers |
| `--purple` | `#77517e` | `#b79aee` | The single plum accent: primary actions, links, active state |
| `--deep` | `#56375f` | `#d1bdf8` | Emphasis text on soft surfaces, stat numbers |
| `--soft` | `#f0e9f2` | `#30263f` | Tinted surfaces, hover, selected |
| `--pink`, `--teal` | pastel | muted | Feature-icon tints only |

Rules:
- One accent. Do not introduce new brand colours; `--pink`/`--teal` are decorative tints, not alternate primaries.
- A hard-coded colour in a new rule needs a matching `:root[data-theme='dark']` override in the same change. Prefer a token instead.
- Text on `--soft` uses `--deep` or `--ink`, never `--muted` (contrast).
- No inline `color` / `background` in TSX: put it in a class in `globals.css` so it can carry a dark override.
- Meaningful icons need 3:1 against the chip or surface behind them (feature-icon tints: rose `#c85a9a`, mint `#269382`, gold `#ae7a2b`, lilac `#7b54cb`; `.empty svg` `#8d74c2`).
- Text on a gradient is checked against its lightest stop. The purple panels (`.auth-visual`, `.lw-hero`) end at `#76589f` so white and the `#f4e6ff` / `#f4ecff` tints stay at 4.5:1 or above.

## Product-led marketing (November 2026)

The approved Fizens reference informs product presentation, not its finance branding. Use warm ivory surfaces, a single plum accent and existing Manrope/DM Sans/Georgia typography. Gold/dawn stays a decorative tint, never an additional action colour. Preserve existing dark-mode tokens.

Runtime CSS remains canonical (Model B): `apps/web/app/globals.css` owns web tokens. Marketing maps the same light palette through `--bg`, `--accent` (web `--purple`), `--deep` and `--soft` in `apps/marketing/app/globals.css`; its `--tint` is `#f3eef2`. The marketing theme-colour metadata follows `--bg`.

The marketing hero shows source-based phone illustrations, explicitly labelled as examples. Preview content is synthetic and Scripture retains its named translation. Feature cards must retain actual availability labels, including content awaiting review. No fabricated audience numbers, testimonials, licence approvals or App Store/Play Store availability claims.

The primary marketing invitation requests pilot access by email to the operator. It does not register a participant or promise admission. Existing members sign in separately. Primary navigation has three sections: purpose, features and how it works; all other pages and sections remain reachable through the footer.

The authenticated dashboard carries the same palette and comfortable card/type rhythm. Scripture remains dominant, and existing reading, prayer, progress, language and theme behavior is preserved.

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
| Bento | `.bento` + `.bento-2/3/4/6`, `.bento-tall`; tiles are `.card.bento-tile` with `.bento-head`, `.bento-foot`, `.bento-note`, `.bento-stats` / `.bento-stat`, `.bento-list`; `.bento-cell` wraps a component that renders its own card |

Icons come from `lucide-react` only, at the stroke width used around them.

## Bento grid (November 2026)

Overview screens (the member home, the marketing "A closer look" section) use a bento grid: tiles of different sizes on one 6-column grid, so the most important item is visibly the largest.

- **One hero tile.** On the home, Today's Word takes `.bento-4.bento-tall`; everything else is `.bento-2`. Scripture stays the largest thing on the screen. Do not give two tiles hero size.
- **Rows add up to 6.** Use 4 + 2 or 2 + 2 + 2. `grid-auto-flow: dense` fills small gaps, but plan rows so it never has to reorder in a way that confuses keyboard order.
- **Tiles are cards.** Use `.card.bento-tile` so tokens, borders, shadow and dark mode come for free. No per-tile background colours or gradients; tint inner chips with `--soft` / `--pink` only.
- **Each tile states its own state.** A tile shows a skeleton while loading, a quiet message plus a retry button on error, and an invitation when empty. Never leave a hole in the grid.
- **Container queries, not viewport queries, inside tiles.** `.bento-tile` (and marketing `.story-card`, container `story`) set `container-type: inline-size`, so contents react to the tile's width: stat pairs stack below 250px, and wide marketing cards put the illustration beside the copy from 600px.
- **Collapse:** 6 columns → 2 at 1000px (marketing: 1040px) → 1 at 700px (marketing: 640px). `.bento-tall` drops its row span once the grid has two columns.
- Stat numbers use Manrope 800 in `--deep` with `tabular-nums`, sized with `cqi` so they scale with the tile. Counts are facts (awaiting, answered), never streaks or rankings.

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
