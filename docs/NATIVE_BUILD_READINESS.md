# Native build readiness

Historical baseline: 19 October 2026. Branch: `codex/native-readiness`. SDK migration and internal test builds are separate from production app-store distribution. No production database or authentication-instance migration is included.

Current follow-up (24 October): PR #70 merged as `5c38dcd`. Native internal builds now align with the existing web/API Clerk instance; the initial EAS project lookup is allowed before remote variables load, while actual builds still reject missing or mismatched keys. The 0.3.1.0 follow-up also removes decorative row icons at enlarged text sizes. Latest source checks pass; the corrected rows were visually verified in the compiled iOS simulator artifact on 24 October. Physical-device screen-reader acceptance and the full native matrix remain pending. The [native acceptance record](NATIVE_SUGGESTIONS_ACCEPTANCE_2026-10-23.md) supersedes the historical build and device statuses below. Android testing remains pending by the user’s choice after insufficient emulator storage.

## Stack and identity

Expo 57.0.30, React Native 0.86.3, React 19.2.3 and `@clerk/expo` 4.13.0 replace Expo52 and the deprecated Clerk package. Expo's own dependency matrix controls native-module versions. Runtime imports remain pinned to the native app's own React/Expo dependencies; web and marketing retain their existing runtime versions.

`ClerkProvider` uses the official encrypted token cache. Browser SSO returns through the `lifebook` scheme. The existing development Clerk instance responds to native environment requests and has Google authentication enabled. It is intentionally retained so account identities and private data remain associated correctly. Its key is configured as a project-scoped sensitive variable in EAS development/preview environments; it is a publishable client key, not a backend secret. No key values are stored in Git.

Production builds fail closed when the publishable key is missing/development-only or the API URL is not HTTPS (or contains credentials/query/fragment). Configure the matching production Clerk instance/backend deliberately before creating a store release; replacing one client key alone would not safely migrate existing identities.

## Build project and profiles

Project: https://expo.dev/accounts/asketfranckolivieralex/projects/lifebook

Run EAS commands from `apps/mobile`, using the signed-in Expo account. EAS CLI25.2.0 and Node22.23.2 are used for this setup. Managed Android signing credentials are held by EAS; they were not downloaded or committed.

| Profile | Output / purpose |
| --- | --- |
| `development` | Internal development client; Metro required |
| `development-simulator` | Development client for iOS Simulator; no physical-device signing required |
| `preview` | Internal standalone Android APK / iOS internal distribution; preview environment |
| `preview-simulator` | Standalone iOS Simulator build, without App Store submission |
| `production` | Store-targeted build; production environment and explicit production-key/API checks |

```sh
cd apps/mobile
pnpm dlx eas-cli@25.2.0 build --platform android --profile preview
pnpm dlx eas-cli@25.2.0 build --platform ios --profile preview-simulator
```

The app-level `.easignore` excludes dependencies, local environment files, agent configuration, recovery material and signing files from the upload. Native generated folders remain Git-ignored. Public API URL is supplied by test profiles; missing authentication configuration blocks cloud builds instead of silently creating a signed-out release.

## Verification and outstanding acceptance

- Expo Doctor: 21/21 checks passed after removing the retired architecture setting and installing the required font/native peers.
- Mobile: 41 tests passed after merging the latest main and repairing stale collection-detail test mocks, including release configuration guards and the existing private-state/draft regressions. TypeScript passes.
- Web: 37 tests passed; web and marketing production builds pass with the updated dependency lockfile.
- Prisma validation/generation and NestJS build pass. No schema or backend-source change is made by this migration.
- Both native JavaScript bundles export successfully. These checks do not prove compiled binary or device usability.
- The corrected [iOS simulator build](https://expo.dev/accounts/asketfranckolivieralex/projects/lifebook/builds/df8c3d28-993f-4bec-9fdc-da99e588081f) compiled successfully. The [Android APK build](https://expo.dev/accounts/asketfranckolivieralex/projects/lifebook/builds/b07254f1-8676-47af-8491-533826eab682) remains queued; Android binary acceptance is pending. Earlier submissions were canceled because Doctor identified config/font issues before acceptance.
- Device Hub is the simulator UI in this Xcode installation; the old Expo52 CLI's missing-`Simulator.app` diagnosis does not require reinstalling Xcode. The official cached Expo Go57 runtime was installed into the existing iPhone16/iOS18.5 simulator.
- The successful standalone build was installed and launched on iPhone16/iOS18.5. Today’s Word and John1 loaded from the hosted API. Switching Settings to dark mode and French updated the UI and accessible selected states. Google SSO opened the system confirmation and reached Google’s sign-in form; test-account credentials are required before private-flow and session-persistence acceptance can continue.
- Expo Go also bundles and opens, but its initial local API configuration targeted an unavailable server. Standalone verification uses the hosted API supplied by the preview profile. VoiceOver/TalkBack, enlarged-text and physical-device acceptance remain pending. No physical phone was attached.

After native test-account sign-in, complete the English/French, light/dark, enlarged-text, VoiceOver/TalkBack and account-switching matrices in `EXPO_READER_ACCEPTANCE.md` and `REFLECTION_HISTORY_ACCEPTANCE.md`. Verify a real sign-in survives restarting the installed app. App Store export-compliance declarations and physical iOS distribution/Apple signing are not completed by simulator builds.

## Recovery from local disk pressure

Temporary build exports, the task's downloaded Expo52 runtime and its disposable Android AVD were removed when the disk filled. Project/user files and all databases were preserved. Keep enough disk free for native builds; old runtime warnings are not evidence that the upgraded application failed.
