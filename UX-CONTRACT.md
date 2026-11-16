# LifeBook UI behavior contract

This records existing owners used by the product-led marketing and dashboard design update. It does not change authorization, data retention, publication or account behavior.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Navigation | `apps/web/components/shell.tsx`, marketing `site-header.tsx` | Existing route map and DESIGN.md | Authenticated sidebar/mobile navigation; public three-link header | Responsive browser and keyboard checks |
| Theme | Web theme provider and both `globals.css` files | DESIGN.md runtime token mapping | Web saved/system theme; marketing system preference | Light/dark rendering and contrast checks |
| Scrollbar | Each app's `globals.css` | DESIGN.md | Document scroll; existing horizontal phone rails | Narrow-layout and keyboard checks |
| Home data | `daily-word-provider.tsx`, dashboard API effects | Existing API and member authorization | Loading, empty, error/retry, populated | Web regression suite |
| Surface | `.card`, `.home-link`, marketing `.story-card` | DESIGN.md | Interactive links use anchor semantics; explanatory cards remain articles | Browser layout and accessible names |

## Preserved behavior

- The public pilot action opens an email request to the operator. It does not submit an invitation, grant admission or create an account. Sign-in remains a separate action.
- Marketing availability labels come from the existing bilingual content source. Illustrations do not indicate that unreviewed content is published.
- Marketing navigation closes on selection, Escape, outside pointer and desktop resize. Keyboard focus remains visible. Existing feature tabs retain arrow/Home/End navigation.
- Dashboard activity and Scripture retain their existing providers, requests, recovery states and member isolation. Design changes do not introduce API writes or modify reading, prayer or learning completion.
- App language is changed through Settings. Marketing uses its existing English/French page links. Dark mode and reduced motion remain supported.
- No new forms, tables, dialogs, CRUD operations or publication actions are introduced by this design update. Those capabilities retain their existing owners; this scoped contract does not claim that all historical UI has been audited.
