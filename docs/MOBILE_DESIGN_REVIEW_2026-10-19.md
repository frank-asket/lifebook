# Mobile design and readiness review

19 October 2026 · `codex/mobile-design-quality`

## Verdict and scope

All 12 Expo routes, both navigation layouts, shared controls and the four editor implementations were reviewed in source. This is a targeted design/accessibility improvement pass, not App Store or Play approval. Apple Design guidance is applied within Expo/React Native and LifeBook's existing design system. SwiftUI Expert is unavailable; no SwiftUI rewrite is included.

The source is more consistent and adaptable after this pass. Full visual acceptance of the changed build remains open: computer control reported no accessible Device Hub/Finder window. Earlier successful simulator smoke checks belong to the native-readiness batch and do not verify these newer changes.

## Screen coverage

| Screen | Review and changes | Acceptance still needed |
| --- | --- | --- |
| Today | Scripture remains primary; metadata wraps; weekly progress has spoken completion states; shared rows expose useful labels | Signed-in progress, long French passages, enlarged text and screen-reader reading order |
| Bible | Compact navigation separates chapter actions; 48-unit controls; safe-area-aware reading column; native Android serif fallback; loading/error recovery retained | Narrow phone/landscape, keyboard, selected highlights and real-device chapter transitions |
| Prayer | Readable shared layout; sign-in waits for pending flow; auth failure is recoverable; compose header wraps | Authenticated journal, keyboard and failed save with draft preserved |
| You / Settings | Large-text choices stack; language stays here; sign-in/out controls disable while pending; sign-out failures show a retryable error | Session restart, account switch, production identity and account/privacy parity |
| Books / chapters | Adaptive chapter grid; selected state; safe areas; chapter retry now repeats the failed request | Large-font grid, landscape, modal back and long book names |
| Reading settings | Scrollable sheet; bottom safe area; larger text controls; wrapping header | Largest text size in short sheets and keyboard-free reachability |
| Reading plans | Shared responsive layout and labels; localized loading; explicit completion and failed enrollment states preserved | Real enrollment/completion, long descriptions, capped history and back navigation |
| Saved verses | Localized loading; shared safe-area layout; existing empty/error/auth states and edit flow retained | Notes, highlights, failed writes, deletion confirmation and large text |
| Daily Word history | Localized loading; meaningful row labels; existing empty/error/signed-out states retained | Exact saved session, reflection edits/deletion, capped list and screen-reader traversal |
| Meditations | Shared column/rows and loading labels; public/private empty/error states retained | Published/saved/completed collections, long content and account isolation |
| Prayer time | Live reduced-motion preference; static press feedback; larger close/step targets; transition cleanup; reflection flow preserved | Timing, reduced motion, assistive reading order, keyboard and unsaved-exit protection |
| Learning profile | Visible checkmarks supplement selection colour; meaningful choice labels; shared disabled accessibility state | French long labels, enlarged text, consent, saved profile and dirty-close flow |

Annotation, prayer and reflection editors inherit bottom-safe-area spacing and avoid duplicate keyboard adjustment. They switch to fades under Reduce Motion. The older meditation editor was reviewed too; the active collection uses `ReflectionDetail`.

## Shared improvements

- Use 48-unit touch targets across shared controls and reader actions. This follows Android's 48dp guidance and exceeds Apple's 44pt baseline.
- Keep immediate press feedback without scaling the interface.
- Stack segmented choices at enlarged text sizes; avoid fixed-width labels.
- Constrain long content on tablets while respecting phone safe areas.
- Give screen readers text labels instead of decorative font-icon glyphs; expose checked/selected/disabled states.
- Subscribe to OS reduced-motion changes and remove the subscription on unmount. Navigation and editors use gentler transitions when requested.
- Label loading indicators in English/French and preserve retry, empty and signed-out states.
- Keep prayers/reflections in existing private flows; no schema or database changes.

## Release gates still open

1. **Account/privacy parity:** native Settings has no account-deletion entry point, full export/consent controls or accessible privacy-policy link. The web has more complete account controls. Implement the approved flows and test failure/re-authentication before store submission. Do not add a cosmetic delete button without a working, secure deletion process.
2. **iOS login options:** the native UI currently offers Google only. Review and implement an equivalent option satisfying Apple guideline 4.8, unless a documented exception applies. Test it against the matching backend identity configuration.
3. **Distribution identity/assets:** production Clerk configuration, app icon/splash/store imagery, support/privacy URLs, Apple signing/export declarations and Play Data safety/App Privacy information still need a release pass. A successful internal build does not satisfy these items.
4. **Device acceptance:** install the changed build and test all rows above in EN/FR, light/dark, largest supported text, portrait/landscape, VoiceOver and TalkBack. Native sign-in requires a test-account session. Include offline, slow network, retry and app restart.
5. **Collections:** histories remain capped and some lists use ScrollView; pagination/virtualization needs a separate data-volume acceptance pass. Do not claim an unlimited archive.

## Verification

47 mobile tests pass, including adaptive controls, meaningful labels, chapter retry, OS motion updates/cleanup, reader-sheet scrolling, text contrast, sign-out recovery, profile selection marks and existing private-draft regressions. Mobile TypeScript, both iOS/Android JavaScript exports, Prisma validation, NestJS build, Next.js web build and marketing build pass. These are source/bundle checks, not physical-device or screen-reader certification.

## References

- [Apple accessibility design](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Apple interface design tips](https://developer.apple.com/design/tips/)
- [Android accessibility and touch targets](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views)
- [Apple App Review guidelines, including login services and account deletion](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)
