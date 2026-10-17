# Frontend tooling

How the frontend debugging and design tools fit LifeBook. Design rules themselves are in [DESIGN.md](../DESIGN.md).

## React Scan: render profiling (wired in)

Highlights components as they re-render, so wasted renders are visible while you use the app.

```bash
NEXT_PUBLIC_REACT_SCAN=1 pnpm dev:web
```

The script tag in [`apps/web/app/layout.tsx`](../apps/web/app/layout.tsx) is rendered only when `NODE_ENV` is `development` **and** the flag is `1`, so it never reaches staging or production. It loads a pinned version (`react-scan@0.5.7`) from unpkg before hydration; bump the version there deliberately.

What to look for: components flashing on idle (timers in `ThemeProvider` every 30s and `DailyWordProvider` every 60s should not repaint the page), the whole tree flashing when typing in a prayer, note or search field, and every `<L>` label flashing when Clerk refreshes the session. The provider values were memoised for that last case.

## Jam: bug reports (browser extension, no code)

Install the Jam Chrome extension and use it when reporting UI bugs: it captures a screen recording with console logs, network requests, browser and viewport. Attach the Jam link to the GitHub issue or PR. Before recording on staging or production, make sure no personal prayer, journal or note content is on screen; Jam uploads what it captures to Jam's servers.

## Replay: time-travel debugging (optional)

Replay's browser records a session you can step through later, which helps with intermittent issues such as the Daily Word race between language and date changes. Use it manually for now. If Playwright end-to-end tests are added later, `@replayio/playwright` can record failing CI runs; there are no browser tests in the repository today, so it is not integrated.

## WebSocket King: not applicable today

WebSocket King tests WebSocket and Socket.IO endpoints. LifeBook's API (`apps/api`) is plain REST and the web app has no WebSocket, Socket.IO or server-sent-events connections, so there is nothing for it to test. Revisit if real-time features (shared prayer walls, live study sessions) are built.

## Claude Code design plugins and skills

Optional, per developer; install from an interactive `claude` terminal. Each one must be pointed at `DESIGN.md` so it follows the existing system instead of generating a new style.

| Tool | Fit | Notes |
| --- | --- | --- |
| `frontend-design` (official Anthropic plugin) | Good | `/plugin install frontend-design@claude-plugins-official`. Tell it to follow `DESIGN.md`. |
| theme-factory | Low | Generates new palettes and font pairings. LifeBook already has a theme; use only for exploring, never to replace tokens. |
| Figma MCP / Code Connect | Only with a Figma library | Useful once the design system exists as Figma components mapped to these CSS classes. |
| UI/UX Pro Max, TasteSkill, Flawless | Low | Built around Tailwind/shadcn and preset aesthetics; LifeBook uses plain CSS with its own tokens. They conflict with the existing system more than they help. |
| `.cursorrules` / design toolkit | Covered | `DESIGN.md` at the repository root plays this role for any editor or agent. |

Community plugins run with your Claude Code permissions; review their source before installing.
