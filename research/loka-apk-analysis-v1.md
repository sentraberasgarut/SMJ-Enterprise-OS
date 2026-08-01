# Loka APK Analysis v1

| | |
| --- | --- |
| **Type** | Read-only architecture and feasibility research. Not an implementation, connector, or patching sprint. |
| **Date** | 1 August 2026 |
| **Subject** | The Loka Kasir Android application package(s) stored at `H:\My Drive\SMJ ENTERPRISE OS\Loka Kasir\`, per this sprint's explicit scope — no other Google Drive location was searched. |
| **Method** | Static, read-only inspection only: ZIP-level listing (`unzip -l`), extraction of individual files to a local scratch directory for offline reading (originals never touched), a from-scratch Android Binary XML (AXML) parser written against the public, documented AOSP `ResourceTypes.h` chunk format (no third-party decompiler, no `aapt`/`apktool` was available or used), and plain-text string extraction from `.dex`, the Hermes JS bytecode bundle, and native `.so` libraries — the same category of inspection the standard Unix `strings` utility performs. No APK was modified, renamed, resigned, patched, executed, or redistributed. No code was decompiled to source form. |
| **Discipline** | Every fact below is either directly observed (with the exact byte offset, file path, or manifest attribute cited) or marked **UNKNOWN**. Nothing is inferred beyond what the cited evidence actually supports; every inference is explicitly labeled as such and distinguished from a directly-observed fact. |

---

# Part 1 — APK Inventory

## 1.1 Access Attempt and Its Limits

Per this sprint's instruction, only `H:\My Drive\SMJ ENTERPRISE OS\Loka Kasir\` was searched. That folder contains, at its top level: `Agustus\`, `File Aplikasi Loka\`, `JSON\`, `Juli\`, and one file directly at the root — `loka-stock-v1-7-37.apk`.

**`File Aplikasi Loka\`, by its own name, is the folder most likely to hold additional or historical APK builds.** Three independent attempts were made to enumerate it — two via `ls` (each timed out after 100–110 seconds without returning a directory listing) and one via PowerShell `Get-ChildItem` (also failed to return within 60 seconds). All three failures are consistent with Google Drive's virtual/streamed filesystem behavior on a folder containing many cloud-only files that have not been synced to local cache, not with a permissions or path error — no error other than a timeout was ever returned. **This folder's contents are UNKNOWN.** `Agustus\`, `Juli\`, and `JSON\` were separately checked and confirmed to contain no `.apk` files (they hold Realm backup and JSON export data, consistent with this project's existing, already-documented backup workflow).

**Consequence for this document:** exactly **one** APK was available for analysis. Part 6 of this sprint's brief ("Version Evolution") asked for a comparison across versions if multiple exist — that comparison could not be performed. This is stated as a real, unresolved gap, not glossed over: **if `File Aplikasi Loka\` does hold earlier Loka builds, none of them were inspected for this document, and any architectural change over time is entirely UNKNOWN.**

## 1.2 The One APK Found

| Field | Value | Source |
| --- | --- | --- |
| Filename | `loka-stock-v1-7-37.apk` | Directory listing |
| File size | 65,679,910 bytes (~62.6 MB) | Directory listing |
| Location | `H:\My Drive\SMJ ENTERPRISE OS\Loka Kasir\` (folder root) | Directory listing |
| Package name | `com.loka.stock` | `AndroidManifest.xml`, `<manifest package="com.loka.stock">` |
| versionCode | `12` | `AndroidManifest.xml`, `<manifest>` attribute |
| versionName | `1.7.37` | `AndroidManifest.xml`, `<manifest>` attribute (matches the filename) |
| Build date | **UNKNOWN** | Every ZIP entry in the archive carries the placeholder timestamp `1981-01-01 01:01` — a known artifact of reproducible-build tooling (Android Gradle Plugin / `bundletool`), not a real build date. No other build-date marker was found. |
| Target architecture | `arm64-v8a` only | `lib/arm64-v8a/*.so` is the only `lib/` ABI directory present in the archive — this specific file is a single-ABI (arm64 only) build, not a universal/multi-ABI APK |
| Signing | **UNKNOWN / not verifiable in this file as stored** | No `META-INF/*.RSA`, `*.DSA`, or `*.SF` (classic v1 JAR signing) found in the archive; no `APK Sig Block 42` marker (APK Signature Scheme v2/v3) found in the last 200 KB before the end-of-central-directory record. This file, as currently stored, does not carry a signature this analysis could locate by either mechanism — it is not known whether this reflects an unsigned/debug artifact, a signature stripped by whatever process produced this file, or a signing placement this analysis did not check. |
| Notes | Filename encodes the version (`v1-7-37`); this matches `versionName` inside the manifest exactly, giving one independent cross-check that the filename is trustworthy. | |

## 1.3 Version Comparison Table

Not producible — only one version was available. See §1.1.

---

# Part 2 — APK Structure

All facts below come from the fully and successfully parsed `AndroidManifest.xml` (33,604 bytes, extracted and decoded with a purpose-built AXML parser validating against the binary XML chunk format), the ZIP central directory listing, and plain-text string extraction from the four `.dex` files and the native libraries.

## 2.1 SDK Levels

| Field | Value |
| --- | --- |
| `compileSdkVersion` | 36 |
| `compileSdkVersionCodename` | 16 |
| `platformBuildVersionCode` / `platformBuildVersionName` | 36 / 16 |
| `minSdkVersion` | 24 (Android 7.0) |
| `targetSdkVersion` | 36 |

## 2.2 Package / Application Structure

`com.loka.stock.MainApplication` is the declared `<application>` class. The application declares `allowBackup="true"`, `extractNativeLibs="false"`, and references `dataExtractionRules`/`fullBackupContent` resources (their content was not decoded — resolving them requires parsing `resources.arsc`'s resource table in full, which this pass did not attempt; **the actual backup-inclusion/exclusion rules for the Realm database are UNKNOWN**).

The application is architecturally a **single-Activity React Native / Expo app**: exactly one app-authored Activity exists (`MainActivity`); every other Activity, Service, Receiver, and Provider in the manifest belongs to a third-party library (Firebase, Expo modules, Google ML Kit, Google Play services, AndroidX, or React Native community modules), not to Loka's own code. This is a direct, observed structural fact, not an inference — no `com.loka.stock.*`-namespaced class appears anywhere in the manifest outside `MainApplication` and `MainActivity`.

## 2.3 Activities

| Activity | Exported | Notes |
| --- | --- | --- |
| `com.loka.stock.MainActivity` | **true** | The only launcher Activity (`android.intent.action.MAIN` / `CATEGORY_LAUNCHER`). Also handles deep links for two URI schemes: `myapp` and `exp+loka` — the latter is Expo's standard development/deep-link scheme convention, confirming this is an Expo-managed React Native app. |
| `expo.modules.imagepicker.ExpoCropImageActivity` | false | Expo library |
| `com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity` | false | Google ML Kit barcode scanner delegate |
| `com.google.android.gms.auth.api.signin.internal.SignInHubActivity` | false | Google Sign-In library |
| `com.canhub.cropper.CropImageActivity` | **true** | Third-party image-cropper library's own default (exported by that library's own manifest merge, not app-specific configuration) |
| `androidx.compose.ui.tooling.PreviewActivity` | **true** | **Notable.** This is Jetpack Compose's developer-tooling preview Activity, normally excluded from a hardened release build (it ships only when a `ui-tooling`/debug-scoped dependency is present in the build that produced this APK). Its presence here is a real, observed fact worth flagging: it suggests this specific APK may be an internal, staging, or ad hoc distribution build rather than the exact artifact end users receive via a fully locked-down release pipeline — see §2.9. |
| `com.google.android.gms.common.api.GoogleApiActivity` | false | Google Play services |

## 2.4 Services

Every declared `<service>` belongs to a third-party library. **No `com.loka.stock.*` Service exists anywhere in the manifest.**

| Service | Exported | Foreground type | Notes |
| --- | --- | --- | --- |
| `com.google.firebase.components.ComponentDiscoveryService` | false | — | Firebase's component-registration mechanism (lists 11 registered Firebase component registrars, including Crashlytics, **Firestore**, Analytics-connector, Installations, Sessions) |
| `expo.modules.audio.service.AudioControlsService` | false | `mediaPlayback` (0x2) | Expo Audio module |
| `expo.modules.audio.service.AudioRecordingService` | false | `microphone` (0x80) | Expo Audio module |
| `com.google.android.gms.metadata.ModuleDependencies` | false, `enabled="false"` | — | Google Play services, disabled |
| `com.google.mlkit.common.internal.MlKitComponentDiscoveryService` | false | — | ML Kit barcode + vision-common registrars |
| `com.google.firebase.sessions.SessionLifecycleService` | false, `enabled="false"` | — | Firebase Sessions, disabled |
| `com.google.android.datatransport.runtime.backends.TransportBackendDiscovery` | false | — | Firebase's telemetry transport layer |
| `com.google.android.gms.auth.api.signin.RevocationBoundService` | **true** | — | Google-signed library component |
| `androidx.camera.core.impl.MetadataHolderService` | false, `enabled="false"` | — | CameraX metadata holder, disabled |
| `com.google.android.gms.measurement.AppMeasurementService` | false | — | Firebase Analytics |
| `com.google.android.gms.measurement.AppMeasurementJobService` | false | — | Firebase Analytics (JobScheduler-backed) |
| `com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService` | false | — | Firebase transport layer (JobScheduler-backed) |

**No foreground service with `foregroundServiceType="dataSync"` (0x1) is declared anywhere.** The only two foreground service types present are media playback and microphone recording, both belonging to Expo's Audio module, unrelated to data synchronization.

## 2.5 Broadcast Receivers

| Receiver | Exported | Notes |
| --- | --- | --- |
| `com.google.android.gms.measurement.AppMeasurementReceiver` | false | Firebase Analytics |
| `androidx.profileinstaller.ProfileInstallReceiver` | **true** | AndroidX baseline-profile installer, standard boilerplate, one-time on-install use |
| `com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver` | false | Firebase transport layer's `AlarmManager`-based scheduling for batching telemetry uploads |

**No `com.loka.stock.*` Broadcast Receiver exists anywhere in the manifest.**

## 2.6 Content Providers

| Provider | Exported | Authority | Notes |
| --- | --- | --- | --- |
| `com.reactnativecommunity.webview.RNCWebViewFileProvider` | false | `com.loka.stock.fileprovider` | RN WebView community module |
| `io.invertase.firebase.crashlytics.ReactNativeFirebaseCrashlyticsInitProvider` | false | — | RN Firebase |
| `io.invertase.firebase.app.ReactNativeFirebaseAppInitProvider` | false | — | RN Firebase |
| `com.imagepicker.ImagePickerProvider` | false | — | RN image picker |
| `expo.modules.filesystem.FileSystemFileProvider` | false | `com.loka.stock.FileSystemFileProvider` | Expo FileSystem |
| `expo.modules.imagepicker.fileprovider.ImagePickerFileProvider` | false | — | Expo ImagePicker |
| `expo.modules.sharing.SharingFileProvider` | false | — | Expo Sharing |
| `com.google.mlkit.common.internal.MlKitInitProvider` | false | — | ML Kit |
| `com.canhub.cropper.CropFileProvider` | false | — | Image cropper library |
| `com.google.firebase.provider.FirebaseInitProvider` | false | — | Firebase core |
| `androidx.startup.InitializationProvider` | false | `com.loka.stock.androidx-startup` | Registers exactly three initializers via its own `<meta-data>` children: `EmojiCompatInitializer`, `ProcessLifecycleInitializer`, `ProfileInstallerInitializer`. **`androidx.work.impl.WorkManagerInitializer` is not among them** — see §2.7. |

**No Content Provider exposes any application data (Realm or otherwise) — every provider is `exported="false"` except library defaults unrelated to business data, and none is authored by Loka's own package for the purpose of sharing data externally.**

## 2.7 WorkManager and JobScheduler

**No evidence of WorkManager usage by the Loka application was found.** Specifically:
- No `androidx.work.impl.WorkManagerInitializer` (or any `androidx.work.*` component) appears anywhere in the manifest.
- `androidx.startup.InitializationProvider`'s own declared initializer list (§2.6) does not include it — this is the standard place WorkManager registers itself when present, and it is absent.
- No `androidx.work` string markers were found during dex/bundle string extraction (see §2.9).

**The only JobScheduler-backed components present belong entirely to Firebase's own telemetry stack** (`AppMeasurementJobService`, `JobInfoSchedulerService`) — neither is Loka-authored, and neither has any connection to business data (stock, invoices, customers). No Loka-authored JobScheduler usage was found.

## 2.8 Permissions

Eighteen `<uses-permission>` entries plus one app-defined permission were found:

`ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`, `CAMERA`, `INTERNET`, `MANAGE_EXTERNAL_STORAGE`, `MODIFY_AUDIO_SETTINGS`, `READ_EXTERNAL_STORAGE`, `READ_MEDIA_AUDIO`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `VIBRATE`, `WRITE_EXTERNAL_STORAGE`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, `com.google.android.gms.permission.AD_ID`, `ACCESS_ADSERVICES_ATTRIBUTION`, `ACCESS_ADSERVICES_AD_ID`, `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE`, and a self-defined `com.loka.stock.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (`protectionLevel="0x2"` — a standard, auto-generated Android permission for securing dynamically-registered receivers, not a custom business permission).

**`MANAGE_EXTERNAL_STORAGE`** ("All files access") is present — this is consistent with, and likely the mechanism behind, Loka's own existing manual backup/export feature (the `.realm` snapshot files this project has already been ingesting), not evidence of anything new.

## 2.9 Libraries, Multidex, Obfuscation

**Multidex: confirmed.** Four `.dex` files are present — `classes.dex` (7.11 MB), `classes2.dex` (8.46 MB), `classes3.dex` (8.36 MB), `classes4.dex` (1.02 MB) — roughly 25 MB of compiled bytecode total, consistent with the very large dependency surface below.

**Obfuscation: partially confirmed.** Resource file names throughout `res/` are systematically shortened to 1–3 character names (e.g. `res/vl.xml`, `res/w9.xml`, `res/zk.png`) — this is a direct, observed signature of R8/AAPT2 resource-name minification being enabled for this build. Whether class- and method-level code obfuscation (ProGuard/R8 renaming) is also active was **not independently verified** — doing so would require decompiling `.dex` bytecode to inspect class/method names, which is outside this sprint's read-only, no-decompilation scope. Given resource shrinking is active, code obfuscation being active as well would be the conventional pairing, but this is stated as a reasonable expectation, not a confirmed fact.

**Native libraries** (`lib/arm64-v8a/`, this build's only ABI):

| Library | Size | Identifies |
| --- | --- | --- |
| `libreactnative.so` | 5.88 MB | React Native core |
| `librealm.so` | **9.37 MB — the single largest native library in the APK** | Realm Core (C++ database engine) |
| `libhermes.so` + `libhermestooling.so` | 2.14 MB + 0.14 MB | Hermes JavaScript engine |
| `libbarhopper_v3.so` | 4.95 MB | Google ML Kit barcode detection engine |
| `libappmodules.so` | 1.95 MB | React Native autolinking/codegen aggregate module |
| `libreanimated.so` + `libworklets.so` | 1.41 MB + 0.90 MB | React Native Reanimated 3 (worklet-based animations) |
| `libVisionCamera.so` | 0.27 MB | react-native-vision-camera |
| `libcrashlytics*.so` (4 files) | ~1.32 MB combined | Firebase Crashlytics native crash reporting |
| `libc++_shared.so` | 1.29 MB | Standard C++ runtime, shared across the above |
| `libexpo-modules-core.so`, `libfbjni.so`, `libjsi.so`, `libgesturehandler.so`, `libgifimage.so`, `libimagepipeline.so`, `libimage_processing_util_jni.so`, `libnative-filters.so`, `libnative-imagetranscoder.so`, `libstatic-webp.so`, `libdatastore_shared_counter.so`, `libandroidx.graphics.path.so`, various `libreact_codegen_*.so`, `librnscreens.so` | — | Standard Expo / React Native / Fresco (image pipeline) supporting libraries |

**Managed-code libraries** (from `META-INF/*.version` and `*.kotlin_module` marker files — legitimate build metadata, not decompiled source): the full Expo module set (`expo`, `expo-application`, `expo-asset`, `expo-audio`, `expo-constants`, **`expo-dev-launcher`, `expo-dev-menu`**, `expo-document-picker`, `expo-file-system`, `expo-font`, `expo-image-picker`, `expo-json-utils`, `expo-manifests`, `expo-modules-core`, `expo-print`, `expo-system-ui`, `expo-web-browser`); the full Jetpack Compose stack; AndroidX Camera (CameraX: `camera-camera2`, `camera-core`, `camera-extensions`, `camera-lifecycle`, `camera-video`, `camera-view`); AndroidX Biometric; Firebase (`firebase-common`, `firebase-crashlytics`, **`firebase-firestore`**, `firebase-installations`); and the community RN modules `react-native-gesture-handler`, `react-native-keyboard-controller`, `react-native-screens`, `react-native-vision-camera`.

**Notable finding: `expo-dev-launcher` and `expo-dev-menu` are present.** These are normally development-only tools (the Expo Dev Client's in-app developer menu and launcher), not expected in a fully hardened production release build. Combined with the `androidx.compose.ui.tooling.PreviewActivity` finding in §2.3, **this is consistent, repeated evidence that this specific APK file may be an internal, staging, or development-distribution build rather than the exact production artifact Google Play serves to end users.** This does not invalidate any fact observed above (they are facts about this file, correctly reported as such) — it is a caveat about how far those facts can be generalized to "the real production Loka app" without independent confirmation, and is carried forward into `live-connector-feasibility-v1.md`.

**Realm dependency: confirmed.** The Android-side JS binding is `io.realm.react` (class `Lio/realm/react/RealmReactPackage;`, found directly in `classes.dex` string data) — the community React Native Realm SDK's native Android module, paired with `librealm.so` as its native engine.

**Firebase Firestore: confirmed present and wired in, not merely a stray transitive dependency.** The full Firestore protobuf schema set (`google/firebase/firestore/proto/*.proto`, `google/firestore/v1/*.proto` — 8 files, ~72 KB of `.proto` definitions) is bundled inside the APK, and `FirebaseFirestoreKtxRegistrar` / `FirestoreRegistrar` are both registered as active Firebase components in `ComponentDiscoveryService`'s own `<meta-data>` list (§2.4). **What data, if any, flows through Firestore is UNKNOWN** — its presence and active registration are confirmed facts; its actual usage (a real sync path for business data, versus a feature this analysis has no visibility into, such as remote config or licensing checks) was not determinable from static structure alone. This is carried forward as the single most consequential open question for `live-connector-feasibility-v1.md`.

---

# Part 6 — Version Evolution

**Not producible.** Only one APK version was accessible for analysis (§1.1). No architectural, dependency, Realm, permission, storage, or component changes across versions can be documented. This entire section is **UNKNOWN**, pending access to `File Aplikasi Loka\` or any other located historical build.

---

# Facts-Only Summary

- Package `com.loka.stock`, versionName `1.7.37`, versionCode `12`, minSdk 24 / targetSdk 36, single-ABI (`arm64-v8a`) build.
- Single-Activity React Native / Expo application; zero app-authored Services, Receivers, or externally-useful Content Providers.
- No WorkManager, no app-authored JobScheduler usage, no `dataSync`-type foreground service — directly observed absences, not assumptions.
- `librealm.so` (Realm Core) is the largest native library in the app; the JS binding is `io.realm.react`.
- Firebase Firestore is bundled and actively registered — a real, open architectural question, not yet answered by this document.
- `MANAGE_EXTERNAL_STORAGE` permission is present, consistent with this project's already-known manual `.realm` backup/export workflow.
- Two independent signals (`expo-dev-launcher`/`expo-dev-menu` present; `androidx.compose.ui.tooling.PreviewActivity` present and exported) suggest this specific file may not be a fully hardened production release build.
- No verifiable signature (neither v1 JAR signing nor a v2/v3 APK Signing Block) was found in this file as stored.
- A second, likely-relevant folder (`File Aplikasi Loka\`) could not be enumerated after three independent attempts within this session — its contents, and any version history it may hold, remain **UNKNOWN**.

No APK was modified, renamed, resigned, patched, executed, or redistributed in the course of this analysis. Nothing was committed.
