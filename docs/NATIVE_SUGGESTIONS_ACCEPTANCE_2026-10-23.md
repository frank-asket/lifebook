# Native suggestions acceptance — 23 October 2026

PR #70 remains a draft until native interaction and accessibility results are recorded. Passing component tests or JavaScript exports do not close installed-device acceptance.

## Source regression found during acceptance preparation

A successful dismissal could complete while Today was unfocused, then an older focus-refresh response could restore the card. The component now remembers confirmed dismissals in memory for its account/language instance and filters later responses through that set. It updates the list after a confirmed write even if focus changed; account/language changes still unmount that state. No new browser/device storage, API contract or migration is added.

The new delayed-response regression fails against the previous component and passes with the fix. All **64 mobile/cross-client tests** and mobile TypeScript passed. This synthetic evidence does not replace native acceptance.

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
