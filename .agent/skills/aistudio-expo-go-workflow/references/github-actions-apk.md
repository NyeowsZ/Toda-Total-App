# Manual Cached Android APK Builds on GitHub Actions

Reference guide for building standalone installable Android APKs from an Expo CNG (Continuous Native Generation) repository on GitHub Actions.

## Key CI Design Principles

1. **Manual Trigger (`workflow_dispatch`)**:
   - Prevents burning CI minutes on every small commit.
   - Exposes inputs for `build_type` (`release` | `debug`) and `architectures` (`arm64-v8a` | `arm64-v8a,armeabi-v7a` | `all`).
   - Targeting `arm64-v8a` cuts native C++ compile time roughly in half and shrinks APK size significantly for modern Android phones.

2. **Avoid the `NODE_ENV=production` Install Trap**:
   - Never set `NODE_ENV: production` at the job level prior to `bun install` / `npm ci`.
   - Doing so causes package managers to omit `devDependencies` (`typescript`, `eslint`, `tailwindcss`, `lightningcss`), breaking typechecking, linting, and NativeWind CSS bundling.
   - Gradle's `assembleRelease` already compiles the JavaScript bundle in production mode automatically.

3. **Four-Layer Caching Strategy**:
   - **Gradle (`gradle/actions/setup-gradle@v4`)**: Caches Gradle wrapper, downloaded artifacts, and `--build-cache` task outputs (`cache-read-only: false`).
   - **Package Manager (`actions/cache@v4`)**: Caches `~/.bun/install/cache` and `node_modules` keyed on `bun.lock` + `package.json`.
   - **Expo & Metro (`actions/cache@v4`)**: Caches `~/.expo`, `.expo`, and `/tmp/metro-cache`.
   - **Native C++/NDK (`ccache` + `actions/cache@v4`)**: Installs `ccache`, caches `~/.cache/ccache` (2 GB cap), and exports `CMAKE_C_COMPILER_LAUNCHER=ccache`, `CMAKE_CXX_COMPILER_LAUNCHER=ccache`, and `NDK_CCACHE=ccache`. This dramatically accelerates repeat builds of `react-native-reanimated`, `react-native-screens`, `react-native-gesture-handler`, and `react-native-svg`.

4. **Zero-Config Default Signing + Optional Release Keystore**:
   - Out of the box (with no repository secrets), `expo prebuild` signs `assembleRelease` with the debug keystore so the uploaded APK installs directly on Android devices for testing.
   - When production signing secrets are added (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`), the workflow runs `zipalign -f -p 4` followed by `apksigner sign` from the runner's latest Android SDK `build-tools`, producing a deterministically signed release APK regardless of Expo's generated `build.gradle` template.

5. **Pre-Flight Quality Gate**:
   - Runs `bunx tsc --noEmit` and `bun run lint` before `expo prebuild` so TypeScript or lint issues fail in seconds instead of after a multi-minute Gradle build.
   - Requires committed `src/types/css.d.ts` because `expo-env.d.ts` is gitignored on fresh CI clones.
