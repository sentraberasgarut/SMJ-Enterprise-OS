# Firebase Firestore Analysis v1

| | |
| --- | --- |
| **Type** | Read-only research, focused follow-on to [`loka-apk-analysis-v1.md`](loka-apk-analysis-v1.md) and [`loka-realm-runtime-v1.md`](loka-realm-runtime-v1.md). Not implementation, not a connector, not a patch. |
| **Date** | 1 August 2026 |
| **Subject** | Whether Firebase Firestore, confirmed bundled and actively registered in `loka-stock-v1-7-37.apk` (`com.loka.stock`, versionCode 12), is (A) an authentication/analytics/licensing-adjacent integration or (B) a real business-data backend. |
| **Method** | Static string and configuration-file extraction only, from the same locally-extracted APK contents used in the prior two documents (`classes*.dex`, `assets/index.android.bundle` — Hermes JS bytecode, `assets/app.config` — the app's own bundled Expo build-configuration JSON, and `AndroidManifest.xml`). No login, no network connection of any kind, no APK modification, no decompilation to source code. Every claim below is either a directly observed string/fact (with its location cited) or explicitly marked as an **inference** distinguished from that fact, or marked **UNKNOWN** where evidence does not support a conclusion. |

---

# Task 1 — Every Firebase Dependency

The authoritative signal for "is Firebase product X actually wired into this app" is `com.google.firebase.components.ComponentDiscoveryService`'s own `<meta-data>` list inside `AndroidManifest.xml` — Firebase's Gradle plugins register a product's `ComponentRegistrar` there automatically and only when that product's SDK is actually compiled in. This list was fully read in the prior sprint and is decisive here.

| Firebase product | Present? | Evidence |
| --- | --- | --- |
| **Firebase Common** (core) | **Yes** | `FirebaseCommonKtxRegistrar` registered; `META-INF/com.google.firebase-firebase-common.kotlin_module` |
| **Firebase Crashlytics** | **Yes** | `CrashlyticsRegistrar`, `CrashlyticsNdkRegistrar`, `FirebaseCrashlyticsKtxRegistrar` all registered; four `libcrashlytics*.so` native libraries present; **explicitly listed as an Expo config plugin** in `assets/app.config` (`"plugins":[...,"@react-native-firebase/crashlytics",...]`) |
| **Firestore** | **Yes** | `FirestoreRegistrar` and `FirebaseFirestoreKtxRegistrar` both registered; full `google/firestore/v1/*.proto` + `google/firebase/firestore/proto/*.proto` schema set bundled (9 files); `librealm.so`-adjacent native footprint not applicable here — Firestore ships as managed code + the shared `libappmodules.so`, not its own dedicated `.so`. See Tasks 2–5 below for full detail. |
| **Firebase Installations** | **Yes** | `FirebaseInstallationsRegistrar`, `FirebaseInstallationsKtxRegistrar` registered — standard, near-universal Firebase dependency (assigns each app install a stable installation ID); not informative about business data on its own. |
| **Firebase Analytics** (Google Analytics for Firebase) | **Yes** | `AnalyticsConnectorRegistrar` registered; `com.google.android.gms.measurement.*` (`AppMeasurementReceiver`, `AppMeasurementService`, `AppMeasurementJobService`) all present in the manifest; nine `firebase_analytics_*`/`google_analytics_*` `<meta-data>` flags present, all defaulted to `true`. |
| **Firebase Sessions** | **Yes** | `FirebaseSessionsRegistrar` registered; `com.google.firebase.sessions.SessionLifecycleService` present (`enabled="false"` in the manifest — registered but not enabled by default). |
| **Firebase Authentication** | **No — confirmed absent as a distinct product** | Zero occurrences of the string `com.google.firebase.auth` anywhere across all four `.dex` files' extracted strings. No `FirebaseAuthRegistrar` (or any Auth-named registrar) in `ComponentDiscoveryService`'s meta-data list. The only "auth"-adjacent artifact found is `firebase-auth-interop.properties` — a small internal interoperability shim other Firebase products (Firestore included) pull in transitively so they *could* read an auth token if Firebase Auth were present. Its presence is a standard side-effect of depending on Firestore, **not evidence Firebase Authentication is configured or used.** |
| **Firebase Cloud Messaging (FCM)** | **No** | No `FirebaseMessagingRegistrar`; no `<service>` extending a messaging service; no `android.intent.action.MESSAGING_EVENT` intent-filter anywhere in the manifest. |
| **Firebase Performance Monitoring** | **No** | No Performance-named registrar or component found anywhere. |
| **Cloud Storage for Firebase** | **No** | No Storage-named registrar or component found anywhere. |
| **Cloud Functions for Firebase** | **No** | No Functions-named registrar or component found anywhere. |
| **Firebase Remote Config** | **Likely not actively configured** | The literal class name `com.google.firebase.remoteconfig.FirebaseRemoteConfig` and a separate `com.google.firebase.remoteconfiginterop` package were both found in the dex string pool — but, as with Auth, **no `RemoteConfigRegistrar` appears in `ComponentDiscoveryService`'s list, and no `META-INF` artifact for a `firebase-config`/`firebase-remoteconfig` module was found.** This is the same "interop shim present, real product not wired" pattern as Auth and App Check — the class name is referenced by an interop interface, not necessarily backed by an active, configured Remote Config instance. Reported as **UNKNOWN, leaning not-actively-used**, not a confirmed absence. |
| **Firebase App Check** | **No** | Only `com.google.firebase.appcheck.interop` found — the same transitive-interop pattern as above, with no registrar and no dedicated module artifact. |
| **Google Sign-In** (Play Services, a *separate* product from Firebase Auth) | **Present as a linked library; active usage unconfirmed** | `com.google.android.gms.auth.api.signin.internal.SignInHubActivity`, `com.google.android.gms.common.api.GoogleApiActivity`, and `play-services-auth*`/`play-services-auth-api-phone.properties` are all present. This is Google's own sign-in library, distinct from Firebase Authentication — its presence does not by itself confirm it is used for a real sign-in flow in this app (it is common boilerplate pulled in by several unrelated Google libraries). |

**Summary for Task 1:** Six real Firebase products are confirmed wired in (Common, Crashlytics, Firestore, Installations, Analytics, Sessions). Firebase Authentication, Messaging, Performance, Storage, and Functions are confirmed **absent**. Remote Config and App Check show only transitive interop shims, not confirmed active use. **Firestore is the only Firebase product in this list, besides the near-universal Common/Installations/Analytics telemetry stack, that carries any real capability to store or query structured data.**

---

# Task 2 — Every Firestore Reference

## 2.1 Native Bridge (Android/Kotlin side)

The React Native binding is `@react-native-firebase/firestore` (package convention `io.invertase.firebase.firestore`, matching the same vendor pattern already confirmed for Crashlytics/App core in the prior sprint). **55 distinct classes** under `Lio/invertase/firebase/firestore/*` were found in the compiled `.dex` string pool. The large majority are single- or double-letter obfuscated names (R8 renaming — consistent with the general obfuscation already noted in `loka-apk-analysis-v1.md` §2.9), but **four entry-point classes were kept fully named** — a standard pattern for React Native native modules, which must keep a stable, reflectable name for the JS bridge's module registry to find them at runtime:

- `Lio/invertase/firebase/firestore/ReactNativeFirebaseFirestoreModule`
- `Lio/invertase/firebase/firestore/ReactNativeFirebaseFirestoreCollectionModule`
- `Lio/invertase/firebase/firestore/ReactNativeFirebaseFirestoreDocumentModule`
- `Lio/invertase/firebase/firestore/ReactNativeFirebaseFirestoreTransactionModule`

**The existence of a dedicated, separately-named Transaction module is itself notable** — a purely read-only or trivial integration would not typically need its own native transaction bridge.

## 2.2 JavaScript-side API Surface (`assets/index.android.bundle`)

The Firestore JS SDK's own internal argument-validation error strings — which only exist in a compiled bundle because the corresponding code path was actually reachable from something the app imports — confirm the following API methods are present and exercised somewhere in the bundle:

- **Reads:** `.collection()`, `.doc()`, `.collectionGroup()`, `.get()`, `.where()`, `.orderBy()`, `.limit()`, `.limitToLast()`, `.startAt()`/`.startAfter()`/`.endAt()`/`.endBefore()`.
- **Writes:** `.collection().add()`, `.doc().set()`, `.doc().update()`, `FieldValue.arrayUnion()`, `FieldValue.increment()`.
- **Batch:** `firestore.batch().set()/.update()/.delete()`, with the specific commit-lifecycle error *"A write batch can no longer be used after commit() has been called"* confirming batch commits are exercised.
- **Transactions:** `.runTransaction()` with `Transaction.get()/.set()/.update()/.delete()` all represented in distinct validator strings.
- **Listeners:** `.doc().onSnapshot()`, `.collection().onSnapshot()`, and `QuerySnapshot.docChanges()` (including the metadata-changes variant, `{includeMetadataChanges: true}`) — real-time snapshot listener usage.
- **Configuration:** `firestore().settings({cacheSizeBytes, host, ...})`, `CACHE_SIZE_UNLIMITED`, `enableNetwork()`, `disableNetwork()`, `waitForPendingWrites()`.

**Collection/document *path* names:** no isolated string literal could be confidently and specifically attributed, via this analysis's methods, to being the actual runtime argument passed to a `.collection("...")` call. Hermes bytecode packs string constants from unrelated parts of the source into one shared pool with no positional guarantee that a nearby string is causally connected to a nearby SDK call — proximity in the raw byte layout is suggestive, not proof, and this document does not claim more certainty here than the method supports. This is the central, honestly-reported limitation of Task 2.

## 2.3 Configuration Evidence

`assets/app.config` (the app's own bundled Expo build configuration — the single most authoritative, developer-authored source found in this analysis, not SDK-generated text) contains:

```json
"android":{"googleServicesFile":"./android/google-services.json", ...}
"plugins":["@react-native-firebase/app","@react-native-firebase/crashlytics","expo-router", ...]
```

**Notable:** `@react-native-firebase/firestore` is **not** listed as its own explicit Expo config plugin entry, while `@react-native-firebase/crashlytics` is. This does not contradict Firestore's confirmed presence (§2.1–2.2 already establish it is genuinely compiled in and actively exercised) — many `@react-native-firebase` submodules autolink cleanly through the single `@react-native-firebase/app` plugin and only need their own explicit entry when they require extra native build steps (Crashlytics does, for its symbol-upload Gradle plugin; Firestore typically does not). Reported as an observed configuration fact, not an inconsistency.

No raw `google-services.json` file (which would carry the literal Firebase project ID) is bundled inside the compiled APK — expected, standard Android/Firebase build behavior (the Firebase Gradle plugin consumes that file at build time and does not ship it verbatim inside the final artifact). **The Firebase project identifier is UNKNOWN from this analysis.**

---

# Task 3 — Business Entities

**Do not speculate, per instruction — every entity below is a literal, app-authored string found in `index.android.bundle`, not inferred from context.**

A systematic search for the app's own internal data-hook naming convention (`use<Action><Entity>API` — e.g. `useAddInvoiceAPI`, `useEditProductAPI`) surfaced a genuinely large, coherent business-domain vocabulary, spanning the CRUD lifecycle (`useAdd*`, `useEdit*`, `useDelete*`, `useGet*`/`use*List`) for each of the following named entities:

| Entity family | Literal identifiers found (representative, not exhaustive) |
| --- | --- |
| **Invoice** | `useAddInvoiceAPI`, `useAddInvoiceHistoryAPI`, `useDeleteAllInvoiceAPI`, `useDeleteInvoiceAPI`, `useEditInvoiceAPI`, `useInvoiceListAPI`, `useRefundInvoiceAPI`, `useUpdateInvoiceAPI`, `useUpdateInvoiceReceiptTemplateAPI` |
| **Product** | `useAddProductAPI`, `useDeleteProductAPI`, `useEditProductAPI`, `useProductListAPI`, `useEditFavoriteProductAPI`, `useEditVariantProductAPI`, `useEditStockProductAPI`, `useEditAlertProductAPI` |
| **Stock / Restock** | `useAddRestockAPI`, `useAddRestockByScan`, `useBulkRestockAPI`, `useBulkProductRestockAPI`, `useBulkIngredientRestockAPI`, `useDeleteAllRestockAPI`, `useDeleteRestockAPI`, `useMarkRestockPaymentAPI`, `useReceiveProductRestockAPI`, `useRevertStockAPI`, `useUpdateIngredientRestockBatchAPI`, `useAddRestockPaymentAPI` |
| **Supplier** | `useAddSupplierAPI`, `useDeleteSupplierAPI`, `useEditSupplierAPI`, `useSupplierListAPI` |
| **Expense / Cost** | `useAddExpenseAPI`, `useDeleteExpenseAPI`, `useEditExpenseAPI`, `useDeleteAllExpenseAPI`, `useAddFixedCostAPI`, `useEditFixedCostAPI`, `useAddExtraCostAPI`, `useEditExtraCostAPI` |
| **Customer** | `useAddCustomerAPI`, `useDeleteCustomerAPI`, `useEditCustomerAPI`, `useCustomerListAPI` |
| **Employee** | `useAddEmployeeAPI`, `useDeleteEmployeeAPI`, `useEditEmployeeAPI`, `useAddEmployeePositionAPI`, `useEditEmployeePositionAPI` |
| **Cashier** | `useAddCashierAPI`, `useDeleteCashierAPI`, `useEditCashierAPI`, `useCashierListAPI` |
| **Category** | `useAddCategoryAPI`, `useDeleteCategoryAPI`, `useEditCategoryAPI`, `useCategoryListAPI`, `useEditCategorySchemaAPI` |
| **Ingredient** (Central Kitchen-relevant) | `useAddIngredientAPI`, `useDeleteIngredientAPI`, `useEditIngredientAPI`, `useEditAlertIngredientAPI`, `useDeleteIngredientRestockAPI`, `useUpdateIngredientAlert...`, `useUpsertProductIngredientBindingsAPI`, `useDeleteProductIngredientBindingsByIngr...`/`...ByProd...` — the last two confirm a **Product↔Ingredient many-to-many binding** (a recipe/bill-of-materials structure). |
| **Order / Table** | `useAddOrderAPI`, `useAddTableAPI`, `useDeleteTableAPI`, `useEditTableAPI`, `useAddOrderTypeAPI`, `useGetOrderAPI`, `useUpdateOrderAPI`, `useResetDailyOrderQueueAPI` |
| **Payment Method** | `useAddPaymentMethodAPI`, `useDeletePaymentMethodAPI`, `useEditPaymentMethodAPI`, `usePaymentMethodListAPI`, `useEditPaymentMethodBucketAPI` |
| **Commission Rule** | `useAddCommissionRuleAPI`, `useDeleteCommissionRuleAPI`, `useEditCommissionRuleAPI` — a business concept (sales commission rules) not previously documented anywhere in this project. |
| **Discount** | `useAddDiscountDefaultsAPI`, `useEditDiscountAPI` |
| **Balance Bucket / Store Balance** | `useAddBalanceBucketAPI`, `useDeleteBalanceBucketAPI`, `useEditBalanceBucketAPI`, `useAddStoreBalanceEntryAPI`, `useEditStoreBalanceStartAPI`, `useTransferStoreBalanceAPI`, `useSetBucketMethodsAPI` — an app-native, named-wallet cash-tracking concept, directly analogous in spirit to Buku Toko's own `DOMPET` sheet. |
| **Loyalty Points** | `useAddLoyaltyPointsDefaultsAPI`, `useEditLoyaltyPointsAPI`, and the literal string `"adjustCustomerPoints Redeemed for purchase"` |
| **Unit** (unit of measure) | `useAddUnitAPI`, `useDeleteUnitAPI`, `useEditUnitAPI` |
| **Security / Roles** | `useAddSecurityDefaultsAPI`, `useEditSecurityAPI`, `useSecurityListAPI`, `useUpdateSecurityAPI` |
| **Auth / Session (local)** | `useAuthAPI`, `useAuthStatusAPI`, `useLocalGetAuthAPI`, `useLocalLoginAuthAPI`, `useLocalRemoveAuthAPI`, `useLocalSaveAuthAPI`, `useLoginAuthAPI`, `useLogoutAuthAPI` — the repeated **"Local"** prefix is a specific, notable detail carried into Task 5. |

Two literal, full app-authored (Indonesian/English) success and error messages directly confirm real business functionality, not just hook names:
- *"Ingredient stock and capital price have been updated"* — **"capital price" is the exact term this project's own canonical data model already uses (`Product.capitalPrice`)**, an independent, unprompted corroboration of an already-known field name from a completely different evidence source.
- *"Error updating ingredient stock alerts"* — confirms a stock-alert/threshold feature exists, matching this project's own already-known `Product.stockAlert` gap (Implementation Backlog BL-012).

Standalone plural business nouns (not part of a camelCase identifier — i.e., appearing as their own free-standing word, consistent with UI label text) were also found: `products` (29 occurrences), `ingredients` (12), `transactions` (7), `customers` (5), `employees` (5), `categories` (4), `invoices` (3), `expenses` (3), `orders` (3), `payments` (2), `shifts` (1), `restocks` (1).

**What Task 3 does not establish:** none of this confirms which storage engine (Realm, Firestore, or both) actually backs any given hook. That is the subject of Task 4 and 5.

---

# Task 4 — What Firestore Is Used For

| Capability | Evidence found | Assessment |
| --- | --- | --- |
| Read | `.get()`, `.where()`, `.orderBy()` and related query-builder validator strings present (§2.2) | Present in the API surface |
| Write | `.doc().set()`, `.doc().update()`, `.collection().add()` validator strings present | Present in the API surface |
| Sync | No explicit "sync" terminology found tied to Firestore specifically; Firestore's core design *is* a sync mechanism by nature, so this is implicit in its presence, not separately evidenced | Inferred from product identity, not independently observed |
| Cache / offline persistence | `firestore().settings({cacheSizeBytes: ...})`, `CACHE_SIZE_UNLIMITED`, and the generic-SDK error *"the minimum cache size is 1048576 bytes (1MB)"* are all present | The offline-persistence configuration API is present; **whether persistence is actually enabled in Loka's specific settings call was not determined** (the value passed is a runtime argument, not a static string) |
| Listeners / snapshot listeners | `.doc().onSnapshot()`, `.collection().onSnapshot()`, `QuerySnapshot.docChanges()` all present (§2.2) | Present in the API surface |
| Batch write | `firestore.batch().set()/.update()/.delete()` and the batch-commit-lifecycle error present | Present in the API surface |
| Transactions | Dedicated native `ReactNativeFirebaseFirestoreTransactionModule` **and** JS-side `.runTransaction()` with `Transaction.get/set/update/delete` all present (§2.1–2.2) | Present in the API surface, with unusually strong (native + JS) corroboration |
| Queue / retry | No Firestore-specific queuing or retry-wrapper logic was found distinct from Firestore's own built-in offline-write-queue behavior (a standard, undocumented-in-strings internal SDK behavior, not something the app needs to build itself) | UNKNOWN whether the app layers any additional retry logic on top |

**Overall Task 4 conclusion:** Firestore's full CRUD, batch, transaction, and real-time-listener API surface is genuinely present and — given the number and specificity of distinct validator strings actually found, spanning nearly every method Firestore offers — very likely genuinely exercised by real call sites, not merely imported and left unused. **This is evidence of depth of integration, not evidence of what specific data it carries** — that question is addressed next.

---

# Task 5 — Architecture and Likely Data Flow

Two evidence-consistent hypotheses exist. Neither is proven; both are stated with their supporting evidence, per this sprint's instruction to support every architectural statement rather than assert one.

## Hypothesis H1 — Firestore is primarily a licensing / trial / cross-device session validation layer

**This is the better-supported hypothesis**, on the strength of several specific, literal, app-authored strings found nowhere else in this analysis:

- *"Akun trial masih aktif"* (Trial account still active)
- *"Akun trial sedang digunakan di perangkat lain, silakan hubungi admin untuk mendapatkan akses"* (**Trial account is being used on another device** — please contact admin to get access)
- *"Akun trial telah habis masa berlakunya"* (Trial account has expired)
- *"Akun telah di blokir, silahkan hubungi admin"* (Account has been blocked, please contact admin)
- `DialogTrialExpired`, `trialExpiredTitle`, `useTrialAuthAPI`, `useGetTrialAuthStatusAPI`, `useTrialAuthStatusAPI`
- `inputLicense` (a literal settings-field identifier)
- `expo-secure-store` listed as a plugin in `app.config` — Expo's on-device encrypted key-value store, a standard place to cache a validated session/license token locally after a cloud check, matching the `useLocalSaveAuthAPI`/`useLocalGetAuthAPI` hook-naming pattern from Task 3.

**"Used on another device" is the decisive detail**: detecting that the *same* trial/license is simultaneously active on a *different* physical device is architecturally impossible with a purely local (Realm-only) database — it requires some server-reachable, shared state. Firestore is the only confirmed, actively-wired, network-reachable Firebase data product in this app (Task 1) capable of serving that role, and its full read/write/listener API surface (Task 4) is more than sufficient for a simple "check and update a device-session document" pattern.

**Likely flow under H1** (drawn only to the level of confidence the evidence supports — not a claimed proof of exact implementation):

```
App launch / periodic check
  → useTrialAuthAPI / useGetTrialAuthStatusAPI (app code)
  → firebase.firestore().doc(<some session/license path>).get() or .onSnapshot()
  → compares server-held session/device state against this device
  → if conflicting/expired: shows DialogTrialExpired / blocks app functionality
  → on success: useLocalSaveAuthAPI caches a validated session locally (expo-secure-store)
      so the app can continue operating offline until the next check
```

## Hypothesis H2 — Firestore also (or instead) carries a synced subset of business data

**Not confirmed, and not ruled out.** The evidence for this is weaker and more circumstantial: Firestore's full CRUD/batch/transaction/listener surface (Task 4) is broader than a simple license check would strictly require, and the sheer size of the business-domain hook vocabulary (Task 3) shows the app has substantial data-management logic that *could* route through Firestore for some subset of records (for example, cross-device consistency of `CommissionRule`, `PaymentMethod`, or `Security`/role settings would have the same "must agree across devices" shape as the trial-session problem). No direct evidence — no collection-path string, no business-hook-to-Firestore-call trace — was found tying any specific business entity from Task 3 to Firestore rather than Realm. This document does not draw a confident data-flow diagram for H2, because doing so would mean inventing detail the evidence does not support.

## Why the primary business-data role most plausibly still belongs to Realm

`loka-realm-runtime-v1.md` established, independently of this sprint, a far more specific and extensive evidentiary footprint for Realm as the business-of-record engine: an exact local database file path, ~60 individually-numbered schema migrations (versions ~50–109) directly tied to real, ongoing schema evolution, and native change-notifiers wired end-to-end to the JS layer. This sprint found no comparably specific evidence — no Firestore-side schema/migration equivalent, no confidently-attributed collection-name string — placing the bulk of Loka's day-to-day business data inside Firestore. Combined with H1's strong, specific support, **the most defensible reading of the combined evidence is: Realm remains the primary operational business-data store; Firestore's best-evidenced role is licensing/session validation, with a synced-subset-of-business-data role neither confirmed nor excluded.**

---

# Task 6 — Realm vs. Firestore, By Responsibility

| Responsibility | Realm | Firestore | Basis |
| --- | --- | --- | --- |
| **Local storage** | **Yes — primary.** Exact on-device file path confirmed (`loka-realm-runtime-v1.md` §2.3); largest native library in the app. | Has its own client-side offline cache (§Task 4), but this is a *cache of cloud state*, not an independent local store of record. | Direct evidence in both prior and this document |
| **Offline operation (core app usable with no network)** | **Yes — purpose-built.** No sync dependency confirmed; app clearly designed to function as an offline-capable POS/kasir app. | Firestore's offline persistence layer is present in the API surface (`cacheSizeBytes`, etc.), but whether it's relied upon for *core* app function, versus a secondary check-when-available capability, is UNKNOWN. | `loka-realm-runtime-v1.md` §2.6; this document §Task 4 |
| **Cross-device / cross-session synchronization** | **No** — `loka-realm-runtime-v1.md` §2.6 assessed Realm Sync (Atlas Device Sync) as not in active use for the local database. | **Yes — this is Firestore's core design purpose**, and the one place this sprint found concrete evidence of cross-device-aware behavior (the "used on another device" trial-conflict string). | Both documents, converging on the same conclusion from independent evidence |
| **Authentication / session / license validation** | Not evidenced as Realm's role anywhere in either document. | **Best-supported hypothesis (H1), though the specific mechanism — Firestore document read/write vs. some other check — is inferred, not directly observed.** | §Task 5, H1 |
| **Configuration (app settings, printer templates, order-queue defaults, etc.)** | Plausible, given the extensive `useEdit*API` hook vocabulary (Task 3) mirrors typical local-settings management patterns, but not independently confirmed as Realm-specific in this sprint. | Not evidenced as a primary role. | Inference from Task 3's hook naming, not direct proof |
| **Primary business-data-of-record** (Invoice, Product, Stock, Customer, etc.) | **Best-supported as primary**, per the reasoning in §Task 5's closing paragraph. | **Unconfirmed, not excluded (H2).** | §Task 5 |
| **Schema evolution / migration** | **Confirmed, extensively** — ~60 numbered migrations found directly. | No comparable evidence found. | `loka-realm-runtime-v1.md` §2.2 |

---

# Task 7 — Enterprise OS Impact

**Under the best-supported reading of this sprint's evidence (Firestore ≈ licensing/session validation; Realm remains the primary business-data store):** the existing roadmap — building toward a Realm-backup-and-connector-based ingestion pipeline, as already scoped in `implementation/loka-connector-v1-spec.md` and the connector code already built in `prototype/loka-canonical-poc/` — **remains the correct architecture, unchanged.** Nothing in this sprint's findings suggests that pipeline is targeting the wrong data source. `live-connector-feasibility-v1.md`'s own conclusion — that the safest, evidence-grounded path to better freshness is tightening the existing export-and-read cycle around Realm backups — stands as written.

**If a future, properly-authorized investigation (not this sprint) confirms Hypothesis H2** — that Firestore genuinely carries a synced subset of real business data, reachable via a legitimate, credentialed cloud API rather than a local file — **that would change the roadmap materially and for the better.** A confirmed, credentialed Firestore read path would be categorically safer and architecturally cleaner than any file-based Realm connector (no Android sandboxing constraint, no file-locking risk, a real supported API instead of static analysis of a local database format), and — per `live-connector-feasibility-v1.md`'s own feasibility scoring — would be the single most likely thing to move that document's MEDIUM rating toward HIGH. This determination should not be made on this sprint's evidence alone; it is exactly the "next experiment" this document recommends below.

**This sprint does not recommend pausing or redirecting the Realm connector track while that question is resolved.** The Realm-based path is independently justified regardless of Firestore's role, and is already the one this project has invested in and partially built.

---

# Success Criteria — Answered With Evidence

**1. Does Firestore store business data?**

**UNKNOWN**, with the evidence leaning toward **NO / primarily Authentication-Licensing (Option A)** rather than a confirmed real business-data backend (Option B) — but not conclusively either. The strongest, most specific evidence found (cross-device trial-session conflict strings, `DialogTrialExpired`, `useTrialAuthAPI`, local-session-caching hook names, `expo-secure-store`) all point toward a licensing/session-validation role. The strongest evidence *against* a confident "NO" is that Firestore's full CRUD/batch/transaction/listener API is genuinely and extensively exercised (not dead code), and this sprint's methods could not conclusively rule out that some business entities from Task 3 are also synced through it.

**2. Confidence: MEDIUM.**

Not LOW — multiple independent, specific, mutually-reinforcing pieces of evidence (the trial/license strings, the interop-only status of Auth/RemoteConfig/AppCheck, Realm's comparatively far deeper business-data footprint from the prior sprint) converge on the same conclusion. Not HIGH — this analysis's method (string extraction and proximity reading) cannot trace an actual call graph from a specific business hook to a specific backend call, which is the one piece of evidence that would move this to HIGH confidence in either direction.

**3. Recommended next experiment.**

The single highest-value, lowest-risk next step is **not further reverse engineering** — it is asking Loka's vendor/operator directly (this project already has an operational relationship with the business that runs Loka) whether Firestore is used for license/trial/device-session management, for any business-data sync, or both. This resolves the central open question in this document with certainty that no amount of additional static string analysis can match, and involves no additional technical risk. If that avenue is unavailable, the next-best purely static step (still fully within this sprint's constraints) would be locating and reading `android/google-services.json` or `GoogleService-Info-ios.plist` if either is ever obtained through legitimate means outside the compiled APK (neither was bundled inside the APK itself, per §2.3) — this would reveal the actual Firebase project identifier, which is itself informative (e.g., a project literally named for licensing/entitlements versus one named for the core product) without requiring any connection to it.

**4. Should Enterprise OS continue investing in a Realm connector?**

**YES.** Every finding in this sprint reinforces, rather than undermines, `live-connector-feasibility-v1.md`'s prior conclusion. Realm remains the best-evidenced, primary business-data engine; nothing found here suggests redirecting effort toward Firestore instead. The Firestore investigation is complementary — worth resolving, per the recommended next experiment — but it is additive, not a reason to pause the Realm-focused work already under way.

---

# Final Report

**Confirmed facts.** Six real Firebase products are wired into `com.loka.stock` (Common, Crashlytics, Firestore, Installations, Analytics, Sessions); Authentication, Messaging, Performance, Storage, and Functions are confirmed absent. Firestore's native bridge includes a dedicated Transaction module (55 total bridge classes), and its JS-side API surface confirms genuine use of reads, writes, batches, transactions, and real-time snapshot listeners. A rich, coherent business-domain vocabulary (Invoice, Product, Stock/Restock, Supplier, Customer, Employee, Cashier, Category, Ingredient, Order, Table, PaymentMethod, CommissionRule, Discount, BalanceBucket, LoyaltyPoints, Unit, Security, and more) exists throughout the app's own code, confirmed via ~150 distinct `use<Action><Entity>API` hook identifiers. Specific, literal Indonesian-language strings confirm a cross-device trial/license enforcement system exists and is a real, active feature.

**Unknowns.** Which specific storage engine (Realm, Firestore, or both) backs the extensive business-hook layer found in Task 3; whether Firestore's confirmed offline-persistence API is actually enabled; the app's real Firebase project identifier; whether any business entity is synced through Firestore at all (Hypothesis H2, neither confirmed nor excluded).

**Architectural implications.** The best-supported reading is a two-engine architecture: Realm as the primary, offline-first business-data store (independently and more extensively evidenced across both this and the prior sprint), and Firestore as a cross-device licensing/trial-session validation layer — a role that, by its nature, *requires* a cloud-reachable backend and cannot be served by Realm alone.

**Roadmap impact.** None, under the best-supported reading — the existing Realm-connector-focused roadmap is validated, not redirected. A future confirmation of Hypothesis H2 would be a positive, additive discovery (a safer, credentialed cloud path for whatever subset of data it covers), not a reason to have built the Realm connector differently.

**Recommendation.** Continue investing in the Realm connector track (**YES**, unconditionally, per Success Criterion 4). Resolve the Firestore question through a direct, low-risk business inquiry to Loka's operator rather than further technical investigation, since that is now the fastest and most certain way to close this document's one remaining open question.

No code was written. Nothing was implemented. No login occurred. No connection to Firebase was made. No APK was modified, executed, or redistributed. Nothing was committed.
