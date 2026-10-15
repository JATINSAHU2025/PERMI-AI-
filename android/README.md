# PERMI SCAN — Native Android Security Assistant

Permi Scan is a native Android application built with **Kotlin** and **Jetpack Compose** (Material 3). It audits app permissions, evaluates foreground usage via `UsageStatsManager`, monitors permission diffs over time, flags suspicious permission combinations using an explainable rule engine, and provides offline pre-installation APK manifest inspection.

---

## Architecture & Tech Stack

- **UI**: 100% Jetpack Compose with Material 3 Dark Cybersecurity Theme
- **Language**: Kotlin 2.0+ (Coroutines, StateFlow, Flow)
- **Local Persistence**: Room Database (`PermiScanDatabase` with DAOs for scan sessions, observations, and permission snapshots)
- **Scanners**:
  - `PackageManagerScanner`: Interrogates installed packages, flags, requested/granted permissions, targetSdk, installSource.
  - `UsageStatsScanner`: Reads foreground duration via `UsageStatsManager` (when user grants Usage Access).
  - `ApkInspector`: Safely parses uninstalled `.apk` files using `PackageManager.getPackageArchiveInfo()` without executing code.
- **Rule-Based Risk Engine**: Deterministic explainable evaluator for sensitive permission combinations, overlay abuse, utility anomalies, and sideload risks.
- **Broadcast Receiver**: `PackageInstallReceiver` observing `ACTION_PACKAGE_ADDED` and `ACTION_PACKAGE_REPLACED` to log observations and post security notifications.

---

## Build & Run Instructions

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or Ladybug (2024.2+)
- Android SDK 35 (compileSdk: 35, targetSdk: 35, minSdk: 26)
- JDK 17 (set in Android Studio or `JAVA_HOME`)

### Building from Command Line
```bash
# Navigate to the android directory
cd android

# Grant execution rights to the Gradle wrapper (if needed)
chmod +x gradlew

# Run unit tests
./gradlew test

# Build debug APK
./gradlew assembleDebug

# The output APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Installing on Device via ADB
```bash
# Connect Android device with USB debugging enabled
adb devices

# Install debug APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Optional: Enable Usage Access for Permi Scan via ADB
adb shell appops set com.permiscan.app.debug GET_USAGE_STATS allow
```

---

## Permissions Declared & Rationale

1. `android.permission.QUERY_ALL_PACKAGES`
   - **Rationale**: Permi Scan is an app security and permission manager. On Android 11+ (API 30+), inspecting all installed apps and their granted permissions requires this declaration.
2. `android.permission.PACKAGE_USAGE_STATS`
   - **Rationale**: Optional capability to read foreground application screen time to help users identify apps consuming screen time with sensitive permissions. Requires explicit user activation in Android System Settings.
3. `android.permission.POST_NOTIFICATIONS`
   - **Rationale**: On Android 13+ (API 33+), required to notify users when a newly installed application requests high-risk permission combinations.

---

## Security Boundaries & Limitations

1. **Foreground vs Background Usage**: Android's `UsageStatsManager` reports cumulative foreground display duration. Permi Scan explicitly informs users that foreground time does **not** prove background microphone or camera execution.
2. **Dynamic Invocations**: Standard third-party Android applications cannot passively intercept another app's hardware sensor activations in real time without root or OS-level modifications. Permi Scan does not claim to do so.
3. **Pre-install Interception**: Permi Scan does not pretend to override the Android system package installer on non-rooted devices; instead, it provides a dedicated APK file picker for pre-install inspection.
4. **Heuristic Assessment**: Risk scores are rule-based heuristics based on declared permissions, target SDKs, and installer sources. They are not cloud reputation lookups or definitive malware verdicts.
