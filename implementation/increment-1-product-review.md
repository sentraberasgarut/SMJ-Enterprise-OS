# Increment 1 — Product Review

**1 Agustus 2026. Reviewer perspective: Product Engineer, bukan hanya Software Engineer.**
**Tidak ada kode yang diubah dalam sprint ini. Review saja.**

Scope: tiga file yang dibuat di Increment 1 — [`archive/apps-script/dashboard/Code.gs`](../archive/apps-script/dashboard/Code.gs), [`archive/apps-script/dashboard/Index.html`](../archive/apps-script/dashboard/Index.html), [`archive/apps-script/dashboard/appsscripts.json`](../archive/apps-script/dashboard/appsscripts.json) — dievaluasi terhadap dataset real yang sudah ada di `prototype/loka-canonical-poc/output/dashboard-dataset.json`, terhadap `src/dataset/roles.js`, dan terhadap aturan repo di `CLAUDE.md`.

---

## 1. Roster implementation

**Pertanyaan:** Enterprise OS sementara pegang roster sendiri, atau user management sengaja dibiarkan tidak terselesaikan sampai sheet ORANG Buku Toko bisa jadi provider sungguhan?

**Rekomendasi: Enterprise OS sementara pegang roster sendiri.** Satu arah, bukan dua.

**Kenapa bukan opsi kedua ("dibiarkan tidak terselesaikan"):** Increment 1 sukses hanya kalau "seorang user nyata bisa buka dashboard dari HP dan lihat data operasional nyata" — itu kriteria sukses dari sprint sebelumnya sendiri. Tanpa autentikasi yang bisa jalan hari ini, kriteria itu gagal total, bukan sebagian. Menunggu Spreadsheet ID Buku Toko (blocker nyata — tidak ada di file mana pun yang bisa dibaca dari environment ini) berarti Increment 1 tidak pernah bisa di-deploy. Itu bukan "tetap disiplin", itu menukar satu masalah kecil (roster duplikat) dengan masalah besar (tidak ada dashboard sama sekali).

**Kenapa risikonya kecil untuk sementara:** proyek ini murni baca-saja, tidak ada jalur tulis ke Sheet mana pun, dan roster hanya berisi 3 orang yang sudah dikonfirmasi eksplisit di instruksi sprint (Aditya, Ibu, Ayu). Duplikasi ini terkurung di satu file, bukan menyebar ke banyak tempat.

**Syaratnya:** ini harus ditandai sebagai utang teknis yang dilacak, bukan keputusan permanen yang diam-diam menjadi kebiasaan. Pemicu migrasi yang jelas: begitu Spreadsheet ID Buku Toko tersedia (dari CEO) ATAU Buku Toko sendiri mengekspos cara baca ORANG yang aman tanpa menyentuh kode produksinya, roster Enterprise OS harus dipensiunkan dan menyerap dari sana.

---

## 2. PIN management

**Pertanyaan:** Haruskah kredensial placeholder pernah ada di dalam repository? Kalau tidak, rekomendasikan pendekatan sementara paling aman.

**Jawaban: Tidak — dan temuannya lebih luas dari sekadar PIN Ibu.**

Placeholder PIN Ibu (`'2601'`) memang tidak boleh masuk repo — begitu di-commit, nilainya tetap ada selamanya di git history walau nanti diganti di kode. Nilai 4 digit yang terlihat plausible (pola tanggal) berisiko disalahartikan sebagai PIN asli oleh siapa pun yang membaca kode nanti.

**Tapi ada temuan yang lebih serius:** roster saat ini juga menaruh PIN **asli dan aktif** milik Aditya (`6060`) dan Ayu (`9191`) — nilai yang sama persis dipakai di Buku Toko hari ini — dalam bentuk teks polos di `Code.gs`. Dicek: `apps-script/buku-toko/` (atau setara) **tidak ada** di repo ini — source Buku Toko yang asli tidak pernah di-commit ke git sama sekali, hanya hidup di Drive yang tidak versioned. Artinya `apps-script/dashboard/Code.gs` akan jadi **kali pertama** PIN-PIN nyata ini masuk ke version control. Itu perubahan profil eksposur yang nyata: git history, kemungkinan kolaborator di masa depan, backup — semuanya sekarang menyimpan kredensial kasir yang aktif dipakai memegang uang tunai. Ruang PIN 4 digit sudah lemah (10.000 kombinasi); membuatnya dapat diakses lewat riwayat git memperbesar risiko itu, bukan sekadar soal kerapian.

**Pendekatan sementara paling aman: pindahkan SEMUA nilai PIN (asli maupun placeholder) keluar dari kode yang di-commit, ke Script Properties** — pola yang sudah dipakai di file ini sendiri untuk `FOLDER_DATASET_ID` (`PropertiesService`), jadi bukan pola baru. `ROSTER` di kode hanya berisi nama/peran/label; PIN diisi CEO satu kali lewat Project Settings > Script Properties saat deploy, persis seperti langkah manual deploy lain yang sudah diterima repo ini (deployment Buku Toko sendiri manual). Kalau properti PIN belum diisi untuk seseorang, orang itu jujur tidak bisa login — bukan jatuh ke nilai tebakan yang terlihat sah.

Ini harus diperbaiki **sebelum commit pertama**, bukan sesudahnya — lihat §6 dan §7.

---

## 3. Role visibility — matriks lengkap

Kolom = peran; baris = seluruh 11 kartu yang ada di `dashboard-dataset.json` hari ini. Nilai mencerminkan **perilaku implementasi saat ini**, bukan usulan.

| Dashboard Card | Status data | CEO | Ibu | Ayu | Teh Nurul |
|---|---|---|---|---|---|
| Today's Revenue | ok | Visible | Visible | Visible | Blocked |
| Gross Profit (laba kotor) | ok | Visible | Visible | Hidden | Blocked |
| Transaction Count | ok | Visible | Visible | Visible | Blocked |
| Cash in Hand (Kas Kasir) | unavailable | Visible | Visible | Hidden | Blocked |
| Safe Cash (Saldo Brankas) | unavailable | Visible | Visible | Hidden | Blocked |
| Inventory Value | ok | Visible | Visible | Hidden | Blocked |
| Goods Out | unavailable | Visible | Visible | Hidden | Blocked |
| Outstanding Receivables | unavailable | Visible | Visible | Hidden | Blocked |
| Expenses (beban bulan ini) | ok | Visible | Visible | Hidden | Blocked |
| Net Profit (laba bersih) | blocked | Visible | Visible | Hidden | Blocked |
| Stock Alerts | unavailable | Visible | Visible | Hidden | Blocked |

**Definisi yang dipakai:**
- **Visible** = peran ini bisa melihat entri kartu (nilai di dalamnya — ok/unavailable/blocked — tetap tampil apa adanya; ini soal akses ke kartu, bukan soal apakah datanya sudah tersedia).
- **Hidden** = `_saringKartuUntukPeran()` sengaja mengeluarkan kartu ini sebelum sampai ke client; user tidak pernah tahu kartu itu ada.
- **Blocked** = user tidak bisa masuk ke aplikasi ini sama sekali (tidak ada entri PIN/peran di `ROSTER`) — ini keputusan level-aplikasi, bukan per-kartu.
- **Unknown** — tidak dipakai di tabel ini karena setiap sel di atas punya perilaku konkret di kode saat ini (bahkan yang berupa usulan belum dikonfirmasi tetap konkret dijalankan). "Unknown" baru relevan untuk peran yang belum punya representasi sama sekali di sprint ini — lihat catatan Teh Nurul di bawah.

**Penjelasan per kolom:**

- **CEO — Visible di semua 11.** Sesuai `roles.js`: `visibilityScope: 'all-business-units,all-cards'`, digrounding ke Data Governance Framework §2 (CEO adalah Business Owner untuk hampir semua entitas kanonikal). Konsisten antara kode dan dokumen yang ada.

- **Ibu — Visible di semua 11, TAPI ini lebih luas dari grounding tertulis yang ada.** `roles.js` mendefinisikan scope Ibu sebagai `'central-kitchen,finance-cash-cosign'` saja, digrounding ke ADR-0002 (co-signatory kas) dan Canonical Data Contract §4/§6 (Ibu & Teh Nurul sebagai Business Owner bersama untuk Central Kitchen). Grounding tertulis itu **secara eksplisit hanya mencakup** kartu terkait kas (Cash in Hand, Safe Cash) dan Central Kitchen — bukan seluruh sisi Toko Sembako (Today's Revenue, Gross Profit, Inventory Value, dst). Implementasi saat ini memperluas ke semua 11 kartu berdasarkan instruksi sprint implementasi ini ("Cross-business Owner... monitor Toko Sembako dan Central Kitchen") — sebuah keputusan bisnis baru yang sah, tapi **hanya tercatat sebagai komentar kode**, belum masuk ke `roles.js` atau dokumen mana pun yang tahan lama. Lihat §6.

- **Ayu — Visible hanya di 2 kartu (Today's Revenue, Transaction Count); Hidden di 9 sisanya.** Ini bukan keputusan yang digrounding di dokumen mana pun — `roles.js` sendiri menandai scope cashier sebagai `UNKNOWN`. Daftar `KARTU_UNTUK_CASHIER` adalah usulan minimal dari backlog implementasi (B4), dipilih karena dua kartu ini paling relevan dengan shift kasir dan tidak menyingkap margin/beban yang bukan urusannya — **belum dikonfirmasi CEO**, meski kode menjalankannya seolah sudah final.

- **Teh Nurul — Blocked di semua 11 (level aplikasi, bukan keputusan per kartu).** Dia tidak ada di `ROSTER` sama sekali — bukan karena keputusan "dia tidak boleh lihat kartu-kartu ini", tapi karena tidak ada satu kartu pun di dataset saat ini yang berasal dari Central Kitchen (`businessUnits.central-kitchen.dataConnected = false`). Kalaupun dia dimasukkan ke roster hari ini, `roles.js` juga tidak punya jawaban: peran `central-kitchen-manager` scope-nya `UNKNOWN`. Akses operasionalnya yang sudah nyata dan jalan — `dashboardCK()` di Buku Toko — tidak disentuh, tidak digantikan, tidak diduplikasi oleh proyek ini.

---

## 4. Central Kitchen — masih keputusan MVP yang benar?

**Ya, masih benar. Tidak berubah.**

Tiga alasan, semuanya sudah ada di data/dokumen, bukan asumsi baru:

1. `dashboard-dataset.json` sendiri menyatakan `businessUnits.central-kitchen.dataConnected: false` — tidak ada satu field kanonikal pun dari CK yang mengalir lewat pipeline. Membangun visibility CK di sini berarti mengarang data, bukan menampilkannya.
2. Mengintegrasikan CK berarti menyentuh Connector/Canonical Dataset/Reporting Service — eksplisit di luar scope Increment 1 menurut instruksi sprint ini sendiri.
3. `CLAUDE.md` sendiri menegaskan: *"Central Kitchen berjalan tanpa satu pun angka biaya... Harga dan operasional CK adalah wewenang Ibu & Teh Nurul, bukan CEO. Scope CEO hanya pencatatan."* Membangun dashboard CK sekarang berarti proyek ini melangkah ke wewenang yang secara eksplisit bukan milik CEO untuk didesain sepihak.

Teh Nurul tidak kehilangan apa pun — `dashboardCK()` di Buku Toko tetap jalan seperti biasa. Tidak ada gap operasional yang harus ditutup sekarang.

**Pemicu untuk meninjau ulang:** begitu pipeline kanonikal punya cakupan entitas CK (inisiatif terpisah, belum dijadwalkan).

---

## 5. Dashboard UX — apa yang harus dilihat user dalam 3 detik pertama

**Tidak menulis kode UI. Ini deskripsi, bukan implementasi.**

Prioritas operasional yang sebenarnya sudah terdokumentasi jelas di repo ini, bukan asumsi generik "taruh KPI di atas":

`CLAUDE.md` sendiri memberi peringatan keras yang justru langsung relevan ke kartu-kartu Increment 1: *"Juli 2026 laba kotor ~Rp14,9 jt tapi laba bersih −Rp1,4 jt. Menyebut 'laba' tanpa kualifikasi akan menyesatkan keputusan harga."* Kartu `gross-profit` di dataset bahkan sudah membawa caveat sendiri yang searah: *"Never to be labeled as an achievement against a Net Profit target (Business Rules Catalog FIN-009)."* Sementara itu, kartu `net-profit` — angka yang sebenarnya menentukan apakah bisnis untung atau rugi bulan ini — berstatus `blocked`.

Implementasi Index.html saat ini merender ke-11 kartu dalam urutan mentah array dataset, dengan bobot visual yang sama rata. Itu artinya "Gross Profit (laba kotor) Rp14.838.115" akan tampil sama besar, sama menonjol, dengan warna hijau yang sama seperti kartu lain — dan caveat penjelasnya ada di teks kecil abu-abu yang mudah dilewati mata dalam 3 detik pertama. Ini persis pola kegagalan yang sudah pernah terjadi di repo ini (angka "laba" dibaca tanpa kualifikasi, keputusan salah arah mengikuti).

**Rekomendasi konkret untuk layar pertama** (deskripsi, bukan kode):

1. **Detik pertama harus menunjukkan fakta paling tidak ambigu dulu**: Today's Revenue dan Transaction Count — dua-duanya angka mentah, tidak bisa disalahartikan sebagai "untung/rugi".
2. **Gross Profit dan Net Profit harus berdampingan secara visual, bukan terpisah oleh kartu lain** — supaya mustahil melihat angka "laba kotor" tanpa juga langsung melihat bahwa "laba bersih: belum tersedia" ada tepat di sebelahnya. Jangan biarkan Net Profit terkubur di posisi ke-10 dari 11 seperti urutan dataset saat ini.
3. **Kualifikasi "kotor, bukan bersih" harus jadi bagian dari angka itu sendiri** (misalnya lencana/label yang tidak bisa di-scroll-lewat), bukan caveat kecil yang baru terbaca kalau user sengaja membaca detail.
4. Kartu yang datanya `unavailable` (Cash in Hand, Safe Cash, Goods Out, dst.) boleh berbobot visual lebih rendah — mereka bukan yang paling menentukan keputusan hari ini — tapi tetap harus tampil jujur, sesuai disiplin REP-005 yang sudah dipegang di layer server.

Ini bukan saran dashboard generik — ini secara spesifik menutup kegagalan yang repo ini sendiri sudah alami dan dokumentasikan.

---

## 6. Technical Debt — setiap jalan pintas di Increment 1

| # | Jalan pintas | Klasifikasi | Alasan |
|---|---|---|---|
| 1 | PIN asli (Aditya, Ayu) tertulis polos di `Code.gs` yang akan di-commit | **Must Fix Before Commit** | Kali pertama kredensial aktif masuk git history di repo ini; lihat §2. |
| 2 | PIN placeholder Ibu (`'2601'`) tertulis polos, terlihat seperti PIN sah | **Must Fix Before Commit** | Sama seperti di atas — begitu masuk git history, tidak bisa benar-benar "dihapus". |
| 3 | Urutan & bobot visual kartu tidak membedakan Gross vs Net Profit | **Must Fix Before Commit** | Ini bukan soal estetika — ini pola kegagalan spesifik yang sudah terbukti mahal di repo ini (lihat §5). Baseline pertama tidak boleh mewariskan risiko ini sebagai "standar". |
| 4 | `KARTU_UNTUK_CASHIER` adalah usulan, dijalankan seolah keputusan final | **Can Wait** | Risiko rendah (under-showing, bukan over-exposing) — tapi harus dapat konfirmasi CEO sebelum Ayu benar-benar memakainya sehari-hari. |
| 5 | Widening scope Ibu hanya tercatat di komentar kode, tidak di `roles.js`/ADR | **Can Wait** | Sah sebagai keputusan sprint ini, tapi engineer lain yang buka `roles.js` nanti akan salah kira scope-nya masih sempit. Sebaiknya disinkronkan segera setelah baseline pertama. |
| 6 | Roster berdiri sendiri, duplikat dari Buku Toko | **Can Wait** | Sudah dibahas di §1 — perlu, sudah dilacak, ada pemicu migrasi jelas. |
| 7 | Tidak bisa deploy/uji dari environment ini | **Acceptable** | Bukan jalan pintas kode — ini batas lingkungan yang sama persis dengan Buku Toko sendiri, sudah diterima repo ini sejak awal. |
| 8 | `dashboard-dataset.json` disalin manual ke Drive, bukan otomatis | **Acceptable** | Konsisten dengan seluruh pipeline saat ini yang memang dijalankan manual — bukan penyimpangan baru. |

---

## 7. Commit Readiness

**Tidak siap jadi baseline permanen pertama. Ini jawaban jujur, bukan formalitas.**

Yang menghalangi commit, persis dari §6 kategori "Must Fix Before Commit":

1. PIN aktif (Aditya `6060`, Ayu `9191`) harus dikeluarkan dari `Code.gs` sebelum file ini pernah masuk git — pindahkan ke Script Properties (lihat §2).
2. PIN placeholder Ibu harus dikeluarkan juga, dengan cara yang sama — bukan diganti ke kombinasi lain yang tetap tertulis di kode.
3. Urutan/bobot tampilan Gross Profit vs Net Profit di `Index.html` harus diperbaiki supaya tidak mewariskan pola kegagalan "laba tanpa kualifikasi" ke baseline pertama (lihat §5).

Tidak satu pun dari ketiganya butuh redesain arsitektur, pipeline, atau Apps Script — semuanya perubahan sempit dan terkurung di dua file yang sudah ada.

Dua hal dari kategori "Can Wait" (§6 #4, #5) tidak menghalangi commit, tapi harus ditindaklanjuti segera sesudahnya supaya tidak diam-diam jadi permanen.

---

## Final Question

**"If this repository were cloned by another engineer tomorrow, would Increment 1 represent the standard we want future work to follow?"**

**NO.**

Bukan karena arsitekturnya salah — pemisahan proyek, disiplin "tidak ada kalkulasi bisnis di Apps Script", penanganan jujur untuk kartu UNKNOWN/blocked, dan keputusan reuse-jangan-rewrite semuanya justru standar yang bagus untuk diikuti ke depan. Yang membuat jawabannya NO adalah satu pola spesifik: **kredensial aktif yang tertulis polos di file yang akan di-commit.** Kalau baseline pertama repo ini membiarkan pola itu lolos tanpa koreksi, engineer berikutnya yang meng-clone repo ini akan membacanya sebagai preseden yang diterima — dan kemungkinan besar mengulanginya (menyalin PIN Buku Toko berikutnya, menaruh token API berikutnya, dst). Satu baseline pertama yang longgar soal ini mencemari kebiasaan setiap increment sesudahnya.

Perbaiki tiga item di §7, dan jawabannya berubah jadi YA — sisanya sudah merupakan standar yang layak diteruskan.

