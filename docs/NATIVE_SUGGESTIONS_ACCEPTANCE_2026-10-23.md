# Native suggestions acceptance — 23 October 2026

PR #70 merged as `5c38dcd` on 23 October. Its later identity, EAS configuration and large-text corrections are being prepared separately on `codex/native-release-fixes` (0.3.1.0). Native interaction and accessibility acceptance remain open. Passing component tests or JavaScript exports do not close installed-device acceptance.

## Source regression found during acceptance preparation

A successful dismissal could complete while Today was unfocused, then an older focus-refresh response could restore the card. The component now remembers confirmed dismissals in memory for its account/language instance and filters later responses through that set. It updates the list after a confirmed write even if focus changed; account/language changes still unmount that state. No new browser/device storage, API contract or migration is added.

The new delayed-response regression fails against the previous component and passes with the fix. All **65 mobile/cross-client tests** and mobile TypeScript passed. This synthetic evidence does not replace native acceptance.

## Screen-reader announcement correction

React Native documents `accessibilityLiveRegion` as Android-only. iOS now explicitly queues the dismissal confirmation through `AccessibilityInfo.announceForAccessibilityWithOptions`; Android retains its polite live region without a duplicate explicit announcement. Clearing the prior status when a new dismissal starts also allows successive identical confirmations to become observable changes. The regression fails without the iOS announcement and passes with it, including failed-write silence and the Android path. Actual VoiceOver/TalkBack listening acceptance remains pending.

## Test environments

- Existing iPhone 16 / iOS 18.5 simulator booted without resetting data; installed Expo Go 57.0.9 located. Current Metro source uses the hosted HTTPS API on development port 8087. Node needed IPv4-first DNS ordering because Expo Go requested a 127.0.0.1 bundle while localhost initially bound only ::1. After connecting, Expo Go hit a React DevTools initialization error; it is not accepted as a successful app launch.
- Existing `Medium_Phone_API_35` Android emulator booted without wiping user data or saving over its snapshot. No physical Android/iOS device is attached.
- EAS reported a partial service outage during submission. Baseline standalone builds from commit `52a56b5`: iOS `765cb53c-bbce-41cb-9bf5-64dc28c28e77`; Android `b016f829-c2a1-4ac1-a8bf-619894a1011c`. The iOS baseline compiled and installed successfully. These precede both source corrections and cannot be used to accept either fix. Superseded intermediate builds are replaced with final-source artifacts; their status is recorded separately.
- Native computer control could select the iPhone simulator. It could not attach to the Android emulator process; the user explicitly authorized SDK `adb` screenshots, taps and text input on the test emulator. Its saved snapshot rendered black, so it was cold-booted without loading or saving a snapshot and without wiping its data.

## Acceptance matrix

Record build commit, observed result and evidence; do not turn pending entries into passes from source inspection.

| Check | iOS | Android |
| --- | --- | --- |
| Current standalone artifact installs and opens | Passed on iPhone 16 / iOS 18.5, `fdceca8` | Pending |
| Signed-out and personalization-off show no suggestions | Pending | Pending |
| Consented member sees at most two explained suggestions | Passed on `fdceca8`, French explanation | Pending |
| Correct plan opens; merely opening does not enroll or complete | Passed on `fdceca8`; start action remained available | Pending |
| Two-minute prayer setup preserves the shared Daily Word | Pending | Pending |
| Dismissal persists after restart and on another device | Passed on `fdceca8`: app-switcher close/reopen and web refresh | Pending |
| Interrupted dismissal and focus refresh cannot restore a hidden card | Component regression passed; native pending | Component regression passed; native pending |
| Account switching removes previous member state | Component regression passed; native pending | Component regression passed; native pending |
| EN/FR, light/dark and enlarged text remain usable | Pending | Pending |
| VoiceOver/TalkBack labels, focus and announcements | Pending | Pending |

No new database operation, store submission or production identity configuration is included in this acceptance pass.

## Native identity configuration mismatch

Installed baseline sign-in restored the existing Google test identity, but private profile reads failed. A fresh Google SSO round trip also completed; the English UI exposed `Invalid or expired access token`. Read-only comparison confirmed the API signing keys match the production web Clerk instance, while the native artifact used a different frontend instance. This was configuration drift, not a reason to bypass verification.

Aligned the ignored local native public configuration and EAS project-scoped development/preview public keys with the existing web/API identity instance (`in-dove-5948.clerk.accounts.dev`). Both Clerk instances and their user records were preserved; no production backend key or database data was rewritten. Native users of the earlier internal artifacts must sign in to the canonical existing LifeBook instance.

Internal EAS profiles now declare `LIFEBOOK_AUTH_FRONTEND_DOMAIN`; app configuration rejects a publishable key for another instance. The regression verifies matching/mismatched instances. Store builds retain their existing production-key and HTTPS gates and still require the separate coordinated production Clerk rollout.

EAS CLI first resolves the project ID before loading the remote environment. The host guard allows that initial lookup when no key is available; the existing `EAS_BUILD_PROFILE` missing-key check still rejects an actual unconfigured build, and any provided mismatched key is rejected. Tests cover this ordering. Final-source submissions at `fdceca8`: iOS `ee78571c-c0c0-4067-bf95-3806bf9210e9`, Android `c8ba50b6-81b5-495c-b49f-69fbbc1f4c02`. Both native JavaScript exports passed. An unnecessary `--platform all` export failed because the native app does not install `react-native-web`; separate iOS and Android exports are the relevant checks.

Connecting Expo Go explicitly to `exp://127.0.0.1:8087` loaded the current production-mode bundle (Metro confirmed a fresh iOS bundle), and Today rendered Daily Word. This is development-host evidence, not standalone artifact acceptance.

Current-source Expo Go checks: canonical Google SSO restored the member’s French profile and reading history; Today showed exactly two suggestions; the French explanation reflected the selected learning choice; “Fondements de la foi” opened that exact plan and still offered “Commencer ce plan” (no automatic enrollment). Disabling personalization saved successfully and removed suggestions after Today refreshed, while Daily Word and history remained. The original enabled consent was restored and confirmed saved. These results are kept separate from standalone acceptance.

The `fdceca8` iOS EAS artifact finished and installed over the existing app without resetting data. Launching LifeBook from Spotlight opened the standalone app with Daily Word, main navigation, and no signed-out suggestions. Canonical Google SSO loaded the French member profile and history. Two suggestions and the French explanation rendered; the exact suggested plan remained unenrolled. Hiding “Fondements de la foi,” leaving Today during the request, and returning kept it absent after refresh. The web client showed the same remaining plan/journal suggestions. Closing LifeBook using the app switcher’s “Close LifeBook” action and reopening preserved the dismissal.

## Enlarged text and remaining device gates

At maximum iOS Larger Accessibility Sizes (slider 100%), controls remained reachable but decorative row icons and chevrons narrowed labels enough to break words awkwardly. The shared row now removes those decorative elements above font scale 1.3, giving labels their full available width without reducing the member’s text size. Existing accessibility labels and actions are retained. The added regression failed against the prior row. Visual recheck of this correction remains pending.

The `fdceca8` Android EAS artifact compiled, but installation failed with `INSTALL_FAILED_INSUFFICIENT_STORAGE`; the existing emulator has 371 MB free. Android’s cache-only `pm trim-caches 1G` reclaimed nothing. No app was uninstalled or cleared. The user chose to keep Android testing pending instead of creating another emulator. Do not treat compilation as installed Android acceptance.

The user offered to connect a physical test iPhone for VoiceOver. No physical iPhone was connected at the last check. VoiceOver listening, second-member account switching, and the two-minute suggestion path remain open; synthetic tests cover their source behavior only.

Baseline simulator observations: public Daily Word recovered after retry; Google sign-out/sign-in completed; signed-out EN/FR labels and selected language state changed correctly; light/dark options are present. None closes final-artifact private-flow or real screen-reader acceptance. Final artifacts must include the identity correction as well as both suggestion fixes.
