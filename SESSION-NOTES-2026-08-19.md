# Catatan Sesi 19 Agustus 2026

Serah terima untuk agent berikutnya. Berisi apa yang dikerjakan sesi ini, keputusan yang
diambil pengguna, dan hal yang ditemukan saat verifikasi.

> **`CLAUDE.md` tetap sumber kebenaran yang hidup.** Berkas ini potret satu sesi dan akan
> menua. Kalau keduanya berbeda, percaya `CLAUDE.md`.

---

## 1. Ringkas: apa yang terjadi

Sesi ini menutup Tahap 9 sampai 12. Sebelum sesi, delapan tahap sudah selesai.

| Tahap | Isi | Commit |
|---|---|---|
| 9 | Audit log, pengaturan sistem, penanda notifikasi, hardening, `POS.Tests` | `aad6662` lalu `9033f56` |
| 10 | Unggah foto produk dan logo toko | `b64d279` |
| 11 | Lupa kata sandi lewat antrean permintaan ke admin | `b64d279` |
| 12 | Ganti kata sandi sendiri, penerjemahan kesalahan Identity | `b64d279` |

**Tahap 10, 11, dan 12 masuk ke satu commit yang sama** (`b64d279`), memakai judul Tahap 12.
Jadi riwayat commit tidak berpasangan satu lawan satu dengan tahap. Keterangan checkpoint
untuk Tahap 10 dan 11 tidak pernah terpakai.

Keadaan akhir sesi: **working tree bersih, seluruh pekerjaan sudah ter-commit.**

---

## 2. Keputusan yang diambil pengguna sesi ini

Empat keputusan berikut datang langsung dari pengguna, bukan simpulan saya. Jangan diubah
tanpa membicarakannya lagi.

1. **Pembayaran gabungan dilarang di toko ini.** Karena itu satu pembayaran per transaksi
   adalah bentuk final, dan tabel `payments` terpisah tidak akan pernah dibuat. Sebelumnya
   status ini "sementara"; sekarang final. Lihat keputusan tetap nomor 8 di `CLAUDE.md`.
2. **Foto disimpan sebagai berkas di folder server**, bukan di database. Batas 3 MB, tanpa
   pengecilan otomatis. Pengguna memilih ini setelah diberi pilihan kolom `bytea`.
3. **Penanda notifikasi untuk admin memakai jumlah stok yang perlu dipesan ulang.**
   Disetujui dari usulan saya, karena admin memang tidak punya antrean persetujuan.
4. **Alur lupa kata sandi memakai antrean permintaan ke admin**, bukan tautan lewat email
   dan bukan kode sekali pakai. Alasannya sistem tidak punya kemampuan kirim email dan PRD
   bagian 48 menunda integrasi email. Pengguna memilih ini dari tiga pilihan.

---

## 3. Cacat dan regresi yang ditemukan saat verifikasi

Semuanya sudah diperbaiki. Dicatat di sini supaya tidak dibongkar lagi tanpa sadar.

| Temuan | Perbaikan |
|---|---|
| `UseStaticFiles` tidak pernah menyajikan berkas, gambar dibalas 401 | Urutan pipeline `Program.cs` ditulis eksplisit, `UseStaticFiles` sebelum `app.UseRouting()` |
| Instance axios memaksa `Content-Type: application/json`, unggahan multipart sampai tanpa berkas | Interceptor melepas header itu bila badan permintaan berupa `FormData` |
| Berkas unggahan ikut terbawa ke hasil `dotnet publish` | Dikecualikan lewat `POS.Server.csproj` |
| `change-password` membalas "Incorrect password." dalam Bahasa Inggris | `TranslateIdentityErrors` diangkat ke `BaseApiController` dan dipakai semua pemanggil |
| Tombol ganti kata sandi menyempitkan nama toko jadi 5 karakter di layar 375px | Disembunyikan di bawah `medium`, dipindah ke drawer |
| `className="hidden"` pada `IconButton` kalah oleh `inline-flex` bawaannya | Penyembunyian dikerjakan `div` pembungkus |
| Kelompok pengaturan berurutan abjad nama kunci Inggris | Urutan ditetapkan eksplisit di frontend |
| Layar kasir tidak punya `h1` | Ditambah `h1` sr-only |

Dua yang pertama adalah jebakan yang mudah terulang. Keduanya sudah masuk daftar jebakan
teknis di `CLAUDE.md` bagian 7.

---

## 4. Cara kerja yang dipakai sesi ini

Berguna diikuti karena sudah terbukti jalan di mesin ini.

- **Verifikasi UI dilakukan terprogram**, bukan lewat screenshot. Panel preview sering tidak
  aktif. Skrip audit yang dipakai berulang memeriksa empat hal pada elemen yang benar-benar
  dirender: rasio kontras terhadap latar efektifnya, tinggi elemen interaktif, elemen tanpa
  nama aksesibilitas, dan pergeseran mendatar lewat `window.scrollTo(400,0)` lalu memeriksa
  `window.scrollX` tetap nol.
- **Sapuan Delivery Gate menelusuri seluruh halaman lewat klik menu**, bukan navigasi URL,
  supaya skrip auditnya tetap hidup di memori. Navigasi cepat beruntun pernah memicu
  `ERR_INSUFFICIENT_RESOURCES` dari browser; itu batas browser, bukan cacat aplikasi.
- **Endpoint diuji langsung dengan `curl` lebih dulu**, baru UI-nya. Lebih cepat menemukan
  penyebab, dan membedakan masalah backend dari masalah frontend.
- **Kata sandi akun uji dikembalikan** ke nilai yang tertulis di `CLAUDE.md` setiap selesai
  menguji alur reset atau ganti kata sandi. Keempatnya sudah dipastikan 200 di akhir sesi.

---

## 5. Keadaan lingkungan di akhir sesi

- Backend dan frontend **dijalankan pengguna sendiri** di terminal terpisah, bukan oleh
  agent. Backend `POS.Server.exe` di port 7047 dan 5263, Vite di 57987.
- Seluruh migrasi sudah diterapkan ke `pos_db`, termasuk `ProductPhoto` dan
  `PasswordResetRequest`.
- **Data uji berubah dari yang tertulis sebelumnya**: `store.name` menjadi "Toko Berkah
  Jaya", `store.address` menjadi "Jl. Merdeka No. 1", logo toko terpasang, dan dua produk
  punya foto. Ada beberapa baris di `password_reset_requests` dari pengujian.
- Folder `POS.Server/wwwroot/uploads/` berisi berkas hasil pengujian. Foldernya
  di-gitignore dan dikecualikan dari publish.

### Galat yang sempat membingungkan

Vite mencetak `ECONNREFUSED` pada `/api/v1/auth/get-store-info` ketika backend mati, dan
**baris galat itu tetap tinggal di terminal setelah masalahnya beres**. Kalau pengguna
melaporkan galat ini, periksa jam pada barisnya lebih dulu sebelum mencari penyebab lain.
Penyebab paling sering: backend belum dijalankan ulang setelah `dotnet build`, karena build
mengharuskan seluruh proses dimatikan lebih dahulu.

---

## 6. Batas yang diketahui dan belum diputuskan

Bukan bug, tetapi pilihan sadar yang perlu ditanyakan kalau relevan.

1. **Token JWT tetap berlaku sampai kedaluwarsa meskipun kata sandi baru diganti.** Diuji
   langsung: token lama masih menerima 200 setelah ganti kata sandi. Sebabnya token tidak
   memeriksa security stamp. Sesi lain karena itu tidak ikut terputus, sampai 480 menit.
   Dua jalan menutupnya: perpendek masa token, atau periksa stamp per permintaan dengan
   biaya satu query di jalur panas kasir.
2. **Berkas unggahan bisa yatim.** Gambar dikirim saat dipilih, bukan saat form disimpan.
   Form yang ditinggalkan meninggalkan berkas tak terpakai. Belum ada pembersih terjadwal.
3. **Gambar unggahan dapat dibuka tanpa autentikasi** oleh siapa pun yang tahu alamatnya.
   Ini keharusan karena tag `img` tidak mengirim token. Nama berkasnya GUID acak.
4. **Sistem tidak dapat memastikan siapa yang mengirim permintaan lupa kata sandi.**
   Pemastian identitas memang pekerjaan admin; yang dijamin sistem hanya jejaknya.
5. **Belum ada uji beban.** Data uji hanya tiga produk. Index dan paging sudah terpasang di
   seluruh tabel yang cepat membesar, tetapi angkanya belum pernah diukur.

---

## 7. Verifikasi wajib sebelum menutup pekerjaan

```bash
dotnet build
dotnet test POS.Tests/POS.Tests.csproj
cd pos.client && npm run build && npm run lint
grep -rn "—" pos.client/src/ POS.Server/ POS.DataLayer/ POS.Tests/ --include=*.tsx --include=*.ts --include=*.cs
```

Target di akhir sesi ini: build 0 warning, **35 uji lulus**, lint **0 error** dengan 9
peringatan React Compiler untuk react-hook-form yang memang ditoleransi, dan hasil grep em
dash kosong.

Server harus dimatikan sebelum `dotnet build`, karena berkas DLL terkunci selama server
hidup:

```bash
taskkill //F //IM dotnet.exe
```

Kesiapan rilis sudah diuji sungguhan sesi ini, bukan diperkirakan. `dotnet publish` berhasil
membangun SPA ke `wwwroot`, dan hasilnya dijalankan dalam mode Production: SPA tersaji,
deep link tersaji, login 200, endpoint terlindungi 401, rate limit 429 pada permintaan
kesepuluh.

---

## 8. Keadaan fitur terhadap PRD

Seluruh delapan phase MVP di PRD bagian 49 tertutup, dan seluruh acceptance criteria bagian
50 terpenuhi. Yang belum ada semuanya berada di PRD bagian 48 Future Development, jadi bukan
kekurangan: pembayaran QRIS dan e-wallet, transfer stok antar gudang, purchase order, tier
member, retur dan refund, serta integrasi akuntansi, WhatsApp, dan marketplace.

**Tidak ada tahap wajib yang tersisa.** Daftar hal tertunda di `CLAUDE.md` kosong.

---

## 9. Bacaan untuk agent berikutnya

Urutan yang saya sarankan:

1. `CLAUDE.md` seluruhnya. Bagian 3 keputusan tetap dan bagian 7 jebakan teknis paling
   sering menghemat waktu.
2. Bagian 3 berkas ini, supaya perbaikan yang sudah ada tidak dibongkar tanpa sadar.
3. PRD hanya pada bagian yang sedang dikerjakan. Panjangnya 2385 baris.

Empat skill wajib project ini tetap berlaku: `siremun-coding-style` untuk struktur,
`ponytail` untuk isi, `antislop-ui` mode DURING untuk UI, dan `material-design-3-ui` untuk
sistem desain. Skill `dataviz` dibaca sebelum menulis kode grafik apa pun.
