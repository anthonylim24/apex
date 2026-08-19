# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Cloud Agent environment

This repo is an Expo (SDK 57) app configured for Cursor Cloud Agents in `.cursor/environment.json`.

- Base image: Cursor default (Linux x86_64, Node 22). No custom Dockerfile is required.
- `install`: `npm ci` — reproducible install from `package-lock.json`.
- `terminals.expo`: `npx expo start --port 8081` — Metro dev server. Starting it also regenerates
  the gitignored `expo-env.d.ts` and `.expo/types/` used by `tsc`.

### Running and verifying

- Web preview (works on this headless Linux VM): open `http://localhost:8081` in the browser, or press
  `w` in the Expo terminal. Metro bundles for web via `react-native-web`.
- Type-check: `npx tsc --noEmit` (run after the Expo dev server has generated types at least once).
- Health check: `npx expo-doctor`.
- iOS/Android: this VM has no local simulator/emulator. Use EAS for device builds and cloud simulators
  (`eas build`, `eas simulator`). These require an `EXPO_TOKEN` secret and run via `npx eas-cli`.
