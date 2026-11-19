---
name: aistudio-expo-go-workflow
description: Configure, build, debug, and ship Expo / React Native apps inside Google AI Studio Build so they run cleanly in AI Studio Web Preview (port 3000), Expo Go on iOS/Android, and cached manual GitHub Actions Android APK builds. Use whenever starting or fixing an Expo project in AI Studio, resolving dev server startup timeouts, fixing blank mobile icons, preventing NativeWind mobile crashes, eliminating cross-platform text truncation, or setting up Android APK CI.
license: MIT
compatibility: Requires Expo SDK 54+, React Native, Node.js >= 20, Bun or npm, and optional NativeWind v4/v5.
metadata:
  author: aistudio-build
  version: "1.0.0"
---

# AI Studio Build + Expo Go & Android APK Workflow

End-to-end engineering playbook for running Expo / React Native apps reliably across three targets simultaneously: **AI Studio Web Preview**, **Expo Go (iOS & Android)**, and **GitHub Actions Android APK builds**.

---

## 1. Fix AI Studio Dev Server Startup (Port 3000)

AI Studio's reverse proxy expects the dev server on **port 3000**, while `expo start` defaults to **port 8081**. If left on 8081, AI Studio reports `"The dev server didn't start"`.

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "expo start --port 3000",
    "start": "expo start --port 3000",
    "build": "expo export --platform web",
    "web": "expo start --web --port 3000",
    "lint": "expo lint"
  }
}
```

Verify after restarting the dev server:

```bash
ss -tulpn | grep 3000
curl -s -o /dev/null -w "%{http_code}\n" --max-time 10 http://localhost:3000/
# Expected: 200
```

---

## 2. Install Only Expo-SDK-Matched & Expo-Go-Safe Packages

1. **Always use `npx expo install` (or `bunx expo install`)** instead of raw `npm install` / `bun add` so native module versions match the installed `expo` SDK exactly.
2. **Prefer Expo Go bundled modules** so users can scan and run immediately in Expo Go without building a custom dev client:
   - `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`
   - `expo-haptics`, `expo-screen-orientation`, `expo-file-system`, `expo-sharing`, `@react-native-async-storage/async-storage`
3. **Check installed `.d.ts` files before writing SDK code** — Expo ships breaking API changes across SDKs:
   - `expo-file-system` (SDK 54+/58): uses class-based `new File(Paths.cache, name)` + `file.write(content)` rather than legacy `writeAsStringAsync`.
   - `expo-status-bar` (SDK 58): use `<StatusBar style="dark" />` (edge-to-edge is default; omit deprecated `translucent`/`backgroundColor`).
4. **Guard native-only APIs on Web** (`Platform.OS !== 'web'`):
   - `expo-haptics`, `expo-screen-orientation`, and `expo-file-system` / `expo-sharing` must have clean Web branches (e.g., Blob download on Web, native `File` + `Sharing.shareAsync` on mobile).

---

## 3. Render Icons Reliably on Mobile & Expo Go (Use `react-native-svg`)

### Why `@expo/vector-icons` Fails on Mobile / Expo Go
`@expo/vector-icons` renders an empty `<Text />` until its `.ttf` icon font finishes loading asynchronously via `expo-font`. Over tunneled dev servers, slow mobile connections, or Expo Go font mismatches, icons stay blank.

### Fix: Pure Vector SVG Icons via `react-native-svg`
- Install `react-native-svg` via `npx expo install react-native-svg` (bundled natively inside Expo Go).
- Wrap app icons in a typed component (e.g., `src/components/terminal/TerminalIcon.tsx`) using `<Svg width={size} height={size} viewBox="0 0 24 24">` and `<Path fill={color} ... />`.
- Result: synchronous frame-1 rendering, zero `.ttf` font downloads, crisp at all DPIs on iOS, Android, Expo Go, and Web.

---

## 4. NativeWind v4/v5 Mobile Crash Prevention

Dynamic NativeWind interop upgrades can trigger fatal `Render Error: Couldn't find a LinkingContext context` crashes on native mobile (while silently working on Web):

- **Never** use `active:bg-*`, `active:scale-*`, `active:text-*`, or `active:border-*` in `className`.
- **Never** conditionally toggle `shadow-*` classes in `className`.
- **Never** use `space-x-*` or `space-y-*` (use Flexbox `gap-*`).
- **Instead**: Use `Pressable` with `style={({ pressed }) => [StaticShadow, pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }]}` and static shadow objects (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`).

---

## 5. Responsive Sizing Without Ellipsis Truncation

`numberOfLines={1}` combined with `adjustsFontSizeToFit` shrinks text on iOS only — on **React Native Web** and many **Android** layouts it clips values with `...` (turning `#741` into `#7...`).

- Measure actual container dimensions via `onLayout`.
- Compute a deterministic `fontSize` from available width and string length:

```ts
export function computeFitFontSize(
  text: string,
  availableWidth: number,
  maxSize: number,
  minSize = 18,
  charWidthRatio = 0.72
): number {
  const safeWidth = Math.max(40, availableWidth);
  const charCount = Math.max(1, text.length);
  const fitted = Math.floor(safeWidth / (charCount * charWidthRatio));
  return Math.max(minSize, Math.min(maxSize, fitted));
}
```

- Omit `numberOfLines={1}` on mission-critical numeric displays so digits always scale down cleanly instead of truncating.
- For landscape-first mobile apps: set `"orientation": "landscape"` in `app.json`, call `ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)` on native, apply `useSafeAreaInsets()` to all four edges (for landscape notches/home bars), and keep a responsive `width >= height` portrait fallback for narrow preview panes.

---

## 6. React Compiler, TypeScript & Fresh-Clone CI Readiness

Expo SDK 58 enables `experiments.reactCompiler: true` and strict ESLint rules:

1. **No `setState` synchronously inside `useEffect`**: Reset modal/form state inside event handlers (`handleClose`) instead of watching `visible` in an effect.
2. **No `ref.current` reads/writes during render**: Access refs only in effects or event callbacks.
3. **Commit CSS & Expo ambient types (`src/types/css.d.ts`)**: `expo-env.d.ts` is gitignored, so `tsc --noEmit` fails with `TS2882`/`TS2307` on CSS imports during fresh CI checkouts unless `src/types/css.d.ts` is committed:

```ts
/// <reference types="expo/types" />

declare module '*.css';

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
```

4. **Set Native Identifiers in `app.json`**: Include `expo.android.package` and `expo.ios.bundleIdentifier` so non-interactive `expo prebuild --platform android --clean --non-interactive` succeeds in CI without prompting.
5. **CI Caching & Manual APK Builds**: See `references/github-actions-apk.md` for the full manual (`workflow_dispatch`) Android APK GitHub Actions workflow with Bun, Gradle, Expo/Metro, and `ccache` caching.

---

## 7. Automated Pre-Flight Verification

Run the bundled verification script before finishing or pushing to CI:

```bash
node .agent/skills/aistudio-expo-go-workflow/scripts/verify-aistudio-expo.mjs
```

And run fresh-clone TypeScript + Expo Lint checks:

```bash
bunx tsc --noEmit && bun run lint
```
