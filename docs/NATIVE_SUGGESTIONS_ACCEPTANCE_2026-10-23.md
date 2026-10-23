# Native suggestions acceptance — 23 October 2026

PR #70 remains a draft until native interaction and accessibility results are recorded. Passing component tests or JavaScript exports do not close installed-device acceptance.

## Source regression found during acceptance preparation

A successful dismissal could complete while Today was unfocused, then an older focus-refresh response could restore the card. The component now remembers confirmed dismissals in memory for its account/language instance and filters later responses through that set. It updates the list after a confirmed write even if focus changed; account/language changes still unmount that state. No new browser/device storage, API contract or migration is added.

The new delayed-response regression fails against the previous component and passes with the fix. All **65 mobile/cross-client tests** and mobile TypeScript passed. This synthetic evidence does not replace native acceptance.

## Screen-reader announcement correction

React Native documents `accessibilityLiveRegion` as Android-only. iOS now explicitly queues the dismissal confirmation through `AccessibilityInfo.announceForAccessibilityWithOptions`; Android retains its polite live region without a duplicate explicit announcement. Clearing the prior status when a new dismissal starts also allows successive identical confirmations to become observable changes. The regression fails without the iOS announcement and passes with it, including failed-write silence and the Android path. Actual VoiceOver/TalkBack listening acceptance remains pending.

## Test environments

- Existing iPhone 16 / iOS 18.5 simulator booted without resetting data; installed Expo Go 57.0.9 located. Current Metro source uses the hosted HTTPS API on development port 8087. Node needed IPv4-first DNS ordering because Expo Go requested a 127.0.0.1 bundle while localhost initially bound only ::1. After connecting, Expo Go hit a React DevTools initialization error; it is not accepted as a successful app launch.
- Existing `Medium_Phone_API_35` Android emulator booted without wiping user data or saving over its snapshot. No physical Android/iOS device is attached.
- EAS reported a partial service outage during submission. Baseline standalone builds from commit `52a56b5`: iOS `765cb53c-bbce-41cb-9bf5-64dc28c28e77`; Android `b016f829-c2a1-4ac1-a8bf-619894a1011c`. The iOS baseline compiled and installed successfully. These precede both source corrections and cannot be used to accept either fix. Superseded intermediate builds are replaced with final-source artifacts; their status is recorded separately.
- Native computer control could select the iPhone simulator. It could not attach to the Android emulator process; Android UI and TalkBack results must remain unverified until supported control or a tester is available.

## Acceptance matrix

Record build commit, observed result and evidence; do not turn pending entries into passes from source inspection.

| Check | iOS | Android |
| --- | --- | --- |
| Current standalone artifact installs and opens | Pending | Pending |
| Signed-out and personalization-off show no suggestions | Pending | Pending |
| Consented member sees at most two explained suggestions | Pending | Pending |
| Correct plan opens; merely opening does not enroll or complete | Pending | Pending |
| Two-minute prayer setup preserves the shared Daily Word | Pending | Pending |
| Dismissal persists after restart and on another device | Pending | Pending |
| Interrupted dismissal and focus refresh cannot restore a hidden card | Component regression passed; native pending | Component regression passed; native pending |
| Account switching removes previous member state | Component regression passed; native pending | Component regression passed; native pending |
| EN/FR, light/dark and enlarged text remain usable | Pending | Pending |
| VoiceOver/TalkBack labels, focus and announcements | Pending | Pending |

No new database operation, store submission or production identity configuration is included in this acceptance pass.

## Native identity configuration mismatch

Installed baseline sign-in restored the existing Google test identity, but private profile reads failed. A fresh Google SSO round trip also completed; the English UI exposed `Invalid or expired access token`. Read-only comparison confirmed the API signing keys match the production web Clerk instance, while the native artifact used a different frontend instance. This was configuration drift, not a reason to bypass verification.

Aligned the ignored local native public configuration and EAS project-scoped development/preview public keys with the existing web/API identity instance (`in-dove-5948.clerk.accounts.dev`). Both Clerk instances and their user records were preserved; no production backend key or database data was rewritten. Native users of the earlier internal artifacts must sign in to the canonical existing LifeBook instance.

Internal EAS profiles now declare `LIFEBOOK_AUTH_FRONTEND_DOMAIN`; app configuration rejects a publishable key for another instance. The regression verifies matching/mismatched instances. Store builds retain their existing production-key and HTTPS gates and still require the separate coordinated production Clerk rollout.

Baseline simulator observations: public Daily Word recovered after retry; Google sign-out/sign-in completed; signed-out EN/FR labels and selected language state changed correctly; light/dark options are present. None closes final-artifact private-flow or real screen-reader acceptance. Final artifacts must include the identity correction as well as both suggestion fixes.
