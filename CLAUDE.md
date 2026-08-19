# Konteks Kerja Project POS

Berkas ini dimuat otomatis setiap sesi. Baca seluruhnya sebelum menyentuh kode.

Bahasa percakapan dengan pengguna: **Bahasa Indonesia**.

---

## 1. Apa yang sedang dibangun

Aplikasi **Point of Sale dan Inventory Management** untuk toko retail, mengikuti
`Product Requirements Document (PRD) — Retail POS & Inventory Management System.md`
(2385 baris, di root project). PRD adalah sumber kebenaran kebutuhan.

| Bagian | Teknologi |
|---|---|
| `POS.DataLayer` | Class library .NET 10. Model family, enum domain, interface, helper format Indonesia. Dipakai bersama backend. |
| `POS.Server` | ASP.NET Core Web API .NET 10, EF Core 10, Npgsql, Identity, JWT. |
| `pos.client` | React 19 + TypeScript 6 + Vite 8 + Tailwind v4. |
| `POS.Tests` | xUnit + EF Core InMemory. Menguji perhitungan keranjang, pergerakan stok, dan mutasi point. |
| Database | PostgreSQL 17, nama database `pos_db`. |

Empat role: **Admin**, **Owner**, **Supervisor**, **Karyawan**.

---

## 2. Skills yang WAJIB dipakai

Pengguna menetapkan empat skill ini wajib selama project berjalan. Tersimpan di
`C:/Users/PC/.agents/skills/`.

| Lingkup | Skill | Perannya |
|---|---|---|
| Backend | `siremun-coding-style` | Otoritas struktur: model family, entity+configuration+mapper satu berkas, controller POST-only, base controller per fitur, JSON PascalCase, berkas rute per role, nama handler frontend. |
| Backend | `ponytail` | Solusi paling malas yang benar-benar bekerja. Tidak ada abstraksi yang tidak diminta, tidak ada dependency untuk hal yang bisa ditulis beberapa baris. |
| Frontend | `antislop-ui` (+ core `antislop`) | Filter anti-slop. **Mode 1 (DURING)** dipilih pengguna: aturan diterapkan sambil menulis, dan setiap checkpoint UI disertai laporan Delivery Gate. |
| Frontend | `material-design-3-ui` | Sistem desain. Token semantik M3, pemilihan komponen berdasarkan perilaku, navigasi adaptif, aksesibilitas sebagai syarat rilis. |

Skill tambahan yang sudah dipakai dan harus dipakai lagi bila relevan:

- **`dataviz`**: wajib dibaca sebelum menulis baris kode grafik apa pun. Sudah dipakai di Tahap 8.

### Cara skill-skill ini berdamai satu sama lain

- Siremun menang untuk **struktur**. Ponytail menang untuk **isi**. Contoh: siremun
  minta kelas `Mapper[Entity]` di samping entity, jadi kelas itu dibuat, tetapi isinya
  assignment eksplisit tanpa AutoMapper.
- Siremun mengulang logika paging di tiap halaman; ponytail melarang. Jalan tengah
  yang dipakai: logika bersama diangkat ke `useListPage` dan `BaseApiController`,
  sedangkan kolom tabel dan proyeksi query tetap ditulis eksplisit per halaman.
- MD3 dan antislop sama-sama menolak "semua elemen berbentuk kapsul". Radius tombol
  8px, bukan pill. Ini penyimpangan sadar dari bentuk baku M3, alasannya tertulis di
  `DESIGN.md`.

---

## 3. Keputusan tetap yang sudah diambil

Jangan ubah tanpa membicarakannya dengan pengguna.

1. **Seluruh endpoint aplikasi memakai POST**, termasuk yang membaca data. PRD
   menulis REST, tetapi skill siremun mewajibkan POST-only dan pengguna menetapkan
   skill itu wajib. Rute: `api/v1/{role}/{fitur}/{aksi}`.
2. **JSON PascalCase** persis sama antara model C# dan interface TypeScript. Tidak
   ada lapisan penerjemah nama.
3. **Bahasa kode Inggris, bahasa tampilan Indonesia.** Entity, properti, dan segmen
   rute memakai Inggris (mengikuti PRD). Seluruh teks yang dilihat pengguna Indonesia.
4. **Tanpa AutoMapper.** Versi 15 berlisensi komersial dan pemetaannya sepele.
5. **Tabel snake_case**, kolom PascalCase (PRD bagian 39 menamai tabelnya).
6. **Waktu disimpan sebagai `timestamp without time zone`** memakai `DateTime.Now`
   lokal, dikonfigurasi lewat `ConfigureConventions` di `ApplicationDbContext`.
   Laporan harian dikelompokkan menurut tanggal buka toko, bukan UTC.
7. **Tidak ada tabel `stores`.** Konfigurasi toko masuk `system_settings` grup `store`.
8. **Tidak ada tabel `payments` terpisah.** Satu pembayaran per transaksi, kolomnya
   menempel di baris transaksi. Perlu dipisah bila nanti ada pembayaran gabungan.
9. **Foto produk belum dibuat.** PRD menyebutnya field opsional dan tidak masuk
   acceptance criteria. Sudah disampaikan ke pengguna sebagai hal yang ditunda.
10. **Bila satu produk terkena beberapa diskon aktif, dipakai potongan terbesar**,
    tidak ditumpuk.
11. **Point dihitung dari total setelah potongan penukaran point**, jadi pembeli tidak
    mendapat point dari bagian yang dibayar dengan point.
12. **Selisih stock opname dihitung ulang saat disetujui**, terhadap stok saat itu,
    bukan stok yang dibekukan saat dokumen dibuat.

---

## 4. Kebiasaan kerja yang sudah terbentuk

### Backend

- Satu berkas per entity berisi: kelas entity yang mewarisi `Table[X]Model`,
  `IEntityTypeConfiguration<T>`, dan kelas statis `Mapper[X]`.
- Model family di `POS.DataLayer/Models`: `[X]KeyModel` → `Base[X]Model` →
  `Table[X]Model` → `Query[X]Model` → `Details[X]Model` → `CreateEdit[X]Model`.
  Properti tampilan diawali `Str`, contoh `StrTotalAmount`, `StrStatus`.
- Aturan yang tidak boleh dilanggar ditegakkan **di database**, bukan hanya di kode:
  index unik, index tersaring (satu gudang utama, barcode unik bila diisi, satu
  permintaan approval pending per dokumen).
- Setiap operasi yang menyentuh lebih dari satu tabel dibungkus
  `BeginTransactionAsync` dan di-rollback saat gagal.
- Pesan kesalahan selalu Bahasa Indonesia, spesifik, dan menyebutkan angka atau nama
  yang relevan. Contoh: "Stok Teh Kotak tinggal 27, sedangkan keranjang meminta 500."
- Id apa pun yang datang dari frontend selalu divalidasi ulang ke database.
- Setiap tindakan penting menulis audit log lewat `AddAuditLog(...)` pada controller.

### Frontend

- Struktur mengikuti siremun: `@dataLayer` dan `@models` (cermin PascalCase),
  `components/router/routes/[role]-routes.tsx` dengan `lazy(() => import(...))`,
  `components/ui`, `components/common`, `components/charts`, `layouts/user-layout`,
  `pages/user-pages/common-pages/[fitur]`, `pages/user-pages/supervisor-pages`.
- Nama handler: `loadInitData`, `getListData`, `handleRefresh`, `handleSearch`,
  `handleSort`, `setPageSizeOption`, `openDeleteConfirmation`, `onSubmit`.
- **Pola pengambilan data wajib memakai rantai `.then().catch().finally()`**, bukan
  `async/await` yang dipanggil langsung di dalam `useEffect`. Aturan lint
  `react-hooks/set-state-in-effect` akan gagal kalau ada `setState` sinkron di badan
  efek. Untuk mereset state saat dialog dibuka, ganti `key` komponennya, jangan pakai
  efek pembersih.
- Setiap tampilan data punya tiga keadaan: memuat, kosong, gagal. Keadaan kosong
  menyebutkan **penyebab dan tindakan berikutnya**, bukan "tidak ada data".
- Status tidak pernah disampaikan warna saja. Selalu ada label teks, dan komponen
  `StatusPill` memakai garis di tepi kiri sebagai motif identitas aplikasi.
- Angka uang dan kuantitas memakai kelas `.text-numeric` (tabular, rata kanan).
- Tabel lebar dibungkus `div.overflow-x-auto` supaya bergulir di dalam kotaknya
  sendiri dan halaman tidak pernah bergeser mendatar.
- Area sentuh minimal 44px. Tombol ikon wajib punya prop `label` untuk pembaca layar.

### Grafik (dari skill `dataviz`)

- Judul grafik adalah **pertanyaan yang dijawabnya**, bukan label generik.
- Tidak pernah ada grafik dua sumbu.
- Kategori tanpa urutan alami mendapat **satu warna yang sama** untuk semua batang.
- Palet grafik tersimpan sebagai `--md-chart-1..3` di `src/styles/index.css`, terpisah
  dari palet merek, dan sudah lolos validator enam pemeriksaan:
  - Terang `#00918f, #c2680a, #6b4fbb` di atas `#f4fbfa`
  - Gelap `#00a3a0, #cf7a28, #8b78dd` di atas `#0e1415`
  - Validator: `node scripts/validate_palette.js "<hex,hex,hex>" --mode light --surface "#f4fbfa"`
    di direktori skill `dataviz`. Kalau palet berubah, jalankan ulang untuk dua mode.

---

## 5. Arah desain

`DESIGN.md` di root adalah sumber arah visual. Ringkasnya:

- Seed Material 3: **`#00696B`** (teal gelap). Palet lengkap dibangkitkan algoritma
  resmi Material lewat `pos.client/scripts/generate-m3-theme.mjs`, bukan dipilih
  manual, dan skrip itu menggagalkan proses bila ada pasangan warna yang tidak
  memenuhi WCAG AA. Jalankan ulang dengan `npm run generate:theme` bila seed berubah.
- Dial antislop: **ENERGY 1 / RHYTHM 2 / MOTION 1**.
- Dua motif identitas: garis status 3px di tepi kiri, dan angka tabular rata kanan.
- Skala sudut empat nilai: 4px chip, 8px kontrol, 12px kartu, 16px panel. Tidak ada
  bentuk kapsul kecuali FAB.
- Navigasi adaptif: drawer sementara `<600px`, rail `600–1199px`, drawer permanen
  `>=1200px`. Menu hanya berisi halaman yang benar-benar ada.
- Jeda irama yang disengaja hanya di dua tempat: layar kasir dan dashboard owner.

---

## 6. Cara menjalankan dan memverifikasi

### Menjalankan

Backend dan frontend dijalankan terpisah saat pengujian:

```bash
ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS="https://localhost:7047;http://localhost:5263" dotnet run --project POS.Server --no-launch-profile
```

```bash
cd pos.client && ASPNETCORE_HTTPS_PORT=7047 npm run dev
```

Frontend di `https://localhost:57987`, API langsung di `http://localhost:5263/api/v1`.
Selalu `taskkill //F //IM dotnet.exe` dan `taskkill //F //IM node.exe` sebelum
menjalankan ulang, karena port dan berkas DLL sering terkunci.

### Kredensial pengembangan

Database: `postgres` / `admin123` di `localhost:5432`, database `pos_db`.
Berkas `POS.Server/appsettings.Development.json` sengaja di-gitignore; contohnya ada
di `appsettings.Development.example.json`.

| Akun | Kata sandi | Role |
|---|---|---|
| `admin` | `Admin#2026` | Admin |
| `budi` | `Kasir#2026` | Karyawan |
| `siti` | `Spv#20261` | Supervisor |
| `owner` | `Owner#2026` | Owner |

### Data uji yang sudah ada di database

Kategori Minuman dan Sembako; satuan BOTOL dan PCS; gudang GD01 Gudang Utama (utama)
dan GD02 Gudang Belakang; supplier PT ABC; produk PRD-00001 Air Mineral 600ml
(barcode 8991234567890), PRD-00002 Teh Kotak, PRD-00003 Beras Premium 5kg; member
Andi Wijaya `081234567890` dan Rina Sari `081298765432`; aturan penukaran 100 dan
200 point; diskon Promo Teh Agustus 20%; voucher HEMAT20 (khusus member, kuota 2),
UMUM5K, EXPIRED.

Pengaturan yang sudah dinyalakan: `member.enabled`, `loyalty.enabled`, `voucher.enabled`.
Saat memverifikasi Tahap 9, `store.name` diubah menjadi "Toko Berkah Jaya" dan
`store.address` menjadi "Jl. Merdeka No. 1" lewat halaman pengaturan.

### Perintah verifikasi wajib sebelum menutup satu tahap

```bash
dotnet build
dotnet test POS.Tests/POS.Tests.csproj
cd pos.client && npm run build && npm run lint
grep -rn "—" pos.client/src/ POS.Server/ POS.DataLayer/ POS.Tests/ --include=*.tsx --include=*.ts --include=*.cs
```

Target: build bersih, seluruh uji lulus (22 uji), lint **0 error** (peringatan React
Compiler "Compilation Skipped" untuk react-hook-form boleh ada), dan hasil grep em dash
kosong (antislop R-02).

### Cara memverifikasi UI

Jalankan aplikasi, lalu pakai `mcp__Claude_Browser__javascript_tool`. Screenshot
sering gagal karena panel preview tidak selalu aktif, jadi verifikasi dilakukan
terprogram. Skrip audit yang dipakai berulang kali di sesi ini memeriksa: rasio
kontras seluruh teks yang benar-benar dirender terhadap latar efektifnya, tinggi
seluruh elemen interaktif, tombol tanpa nama aksesibilitas, dan
`document.documentElement.scrollWidth > clientWidth`.

Catatan penting: pada emulasi mobile, `innerWidth` kadang melaporkan 480 sementara
`clientWidth` 375. Itu artefak emulator. Cara memastikan tidak ada overflow nyata:
`window.scrollTo(300,0)` lalu periksa `window.scrollX` tetap 0.

---

## 7. Jebakan teknis yang sudah ditemukan

1. **Batas panjang perintah Bash sekitar 8KB.** Heredoc yang lebih panjang terpotong
   dan gagal dengan "unexpected EOF". Tulis berkas besar dalam beberapa panggilan
   memakai `cat >` lalu `cat >>`. Ini penyebab paling sering kegagalan menulis berkas.
2. **Python di Windows tidak mengerti path `/tmp/...`.** Untuk berkas sementara yang
   dibaca Python, pakai path scratchpad bergaya Windows
   (`C:/Users/PC/AppData/Local/Temp/claude/...`). Path `/tmp` hanya aman untuk
   perintah bash murni seperti `grep` dan `tail`.
3. **Npgsql menolak `DateTime` berjenis Local ke `timestamptz`.** Sudah diselesaikan
   lewat `ConfigureConventions` yang memetakan seluruh `DateTime` ke
   `timestamp without time zone`.
4. **`GlobalList` menyimpan cache pengaturan sistem.** Mengubah `system_settings`
   langsung lewat SQL tidak berlaku sampai server di-restart. Halaman pengaturan admin
   (Tahap 9) wajib memanggil `GlobalList.ClearSystemSetting()` setelah menyimpan.
5. **Berkas DLL terkunci saat server jalan.** `dotnet build` gagal dengan MSB3027.
   Matikan `dotnet.exe` lebih dulu.
6. **Arah mutasi tidak bisa disimpulkan dari kolom nilai mutlak.** Pernah menyebabkan
   riwayat point menampilkan `+6` untuk penarikan. Simpulkan arah dari perbandingan
   saldo sebelum dan sesudah.
7. **Template controller yang di-generate lewat substitusi Python** perlu diperiksa
   ulang komentarnya, karena komentar dari template sumber ikut terbawa.

---

## 8. Status pekerjaan

Sembilan tahap selesai dan sudah diverifikasi berjalan. Setiap tahap ditutup dengan
checkpoint berisi judul dan keterangan commit untuk pengguna.

| Tahap | Isi | Status |
|---|---|---|
| 1 | Fondasi backend, PostgreSQL, Identity 4 role, JWT, `system_settings`, `audit_logs`, seeder | Selesai |
| 2 | Sistem desain M3 dari seed, Tailwind v4, router per role, halaman masuk, kerangka adaptif | Selesai |
| 3 | Master data: kategori, satuan, gudang, supplier, produk dengan histori harga, pengguna | Selesai |
| 4 | Inventory, stock movement, barang masuk, stock opname, alur persetujuan lintas modul | Selesai |
| 5 | Kasir, transaksi, pembayaran tunai, nota cetak, pembatalan transaksi | Selesai |
| 6 | Member, loyalty point, aturan penukaran point | Selesai |
| 7 | Diskon produk berperiode, voucher dengan kuota | Selesai |
| 8 | Dashboard per role, lima laporan, grafik SVG dengan palet tervalidasi | Selesai |
| 9 | Audit log, pengaturan sistem, penanda approval, hardening, uji logika kritis | Selesai |

Migrasi yang sudah diterapkan: `InitialFoundation`, `MasterData`,
`PriceHistoryInitialFlag`, `InventoryAndApproval`, `SalesTransaction`,
`MemberAndLoyalty`, `DiscountAndVoucher`, `AuditLogActionIndex`.

### Aturan bisnis PRD yang sudah terbukti lewat uji

BR-001 harga snapshot, BR-002 stok hanya berubah lewat jalur resmi, BR-003 approval
tidak mengubah kondisi final, BR-004 audit trail, BR-005 member hanya bila fitur
aktif, BR-006 seluruh syarat voucher, BR-007 point per aturan yang berlaku, BR-008
penukaran point atomic, BR-009 transaksi atomic.

### Hardening yang sudah terpasang (Tahap 9)

1. **Endpoint tertutup secara bawaan.** `AddAuthorization` memasang `FallbackPolicy`
   `RequireAuthenticatedUser`, sehingga controller baru yang lupa diberi `[Authorize]`
   menolak permintaan. Yang boleh terbuka menyebutkannya sendiri: `[AllowAnonymous]`
   pada `login` dan `get-store-info`, serta `.AllowAnonymous()` pada `MapStaticAssets`,
   `MapOpenApi`, dan `MapFallbackToFile`. **Kalau menambah endpoint publik baru, ia harus
   diberi `[AllowAnonymous]` atau akan membalas 401.**
2. **Rate limiting pada `api/v1/auth/login`**: fixed window 10 permintaan per menit per
   alamat IP, memakai `Microsoft.AspNetCore.RateLimiting` bawaan tanpa paket tambahan.
   Penolakan membalas 429 dengan pesan Bahasa Indonesia. Kebijakan bernama
   `AppData.RateLimitPolicyLogin`.
3. **Index tambahan** `audit_logs.ActionName`, karena halaman audit menyaring menurut aksi
   dan tabel itu yang paling cepat membesar.
4. **Uji logika kritis** di `POS.Tests`: 22 uji untuk perhitungan keranjang (harga dari
   database, penggabungan baris kembar, peringatan stok, prioritas diskon terbesar, urutan
   diskon produk lalu voucher, voucher khusus member, voucher yang dimatikan), pergerakan
   stok (masuk, keluar, penolakan stok negatif, produk berulang dalam satu dokumen,
   penomoran dokumen), dan mutasi point (pembulatan perolehan, member nonaktif, arah
   mutasi, batas potongan penukaran).

Catatan uji: `GlobalList` memakai cache statis, jadi `AssemblyInfo.cs` mematikan
paralelisasi xUnit dan `TestDb.Create` selalu memanggil `GlobalList.ClearSystemSetting()`.

### Hal yang masih tertunda dan perlu ditanyakan ulang ke pengguna

- Foto produk (upload berkas).
- Tabel `payments` terpisah bila butuh pembayaran gabungan.
- Notifikasi khusus admin. Penanda jumlah approval sudah terpasang untuk supervisor,
  tetapi admin tidak punya antrean pekerjaan yang menunggu, jadi belum diberi penanda.
  Kandidat yang masuk akal: jumlah produk yang stoknya menipis.

## 9. Format checkpoint

Pengguna meminta setiap tahap ditutup dengan checkpoint berisi judul dan keterangan
commit yang jelas tetapi tidak terlalu panjang. Format yang sudah dipakai delapan kali:

- Judul: `feat: <ringkasan tahap dalam Bahasa Indonesia huruf kecil>`
- Keterangan: tiga sampai lima paragraf pendek. Menjelaskan **apa yang dibangun dan
  mengapa**, bukan daftar berkas. Menyebutkan aturan bisnis yang ditegakkan dan
  keputusan desain yang diambil.

Laporan ke pengguna di akhir tahap berisi: apa yang dibangun, tabel aturan bisnis
beserta bukti ujinya, keputusan yang perlu diketahui, masalah yang ditemukan saat
verifikasi beserta perbaikannya, lalu blok checkpoint.

Jujur soal hasil verifikasi. Kalau screenshot gagal, katakan dan jelaskan bahwa
verifikasi dilakukan terprogram. Kalau ada bagian yang tidak dikerjakan, sebutkan
alasannya dan tawarkan untuk mengerjakannya.
