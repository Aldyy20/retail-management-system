# Arah Desain — Retail POS & Inventory

Berkas ini adalah sumber arah visual aplikasi. `antislop` dipakai sebagai filter di atasnya,
bukan sebagai sumber arah. Skill `material-design-3-ui` menentukan sistemnya.

## Design Read

> Dibaca sebagai: aplikasi operasional toko (kasir, gudang, pengawasan, laporan) untuk
> karyawan yang memakainya seharian, dengan bahasa visual Material Design 3 bernuansa
> teal tenang, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

Alasan tiap dial:

- **ENERGY 1 (tenang).** Layar ini dipandangi 8 jam sehari oleh kasir dan petugas gudang.
  Yang harus menonjol adalah angka dan status, bukan desainnya. Permukaan tetap netral,
  warna kuat disimpan untuk satu aksi utama per area.
- **RHYTHM 2 (konsisten dengan beberapa jeda).** Halaman CRUD master data sengaja seragam
  supaya bisa dipelajari sekali dan dipakai di semua modul. Jedanya nyata dan hanya di dua
  tempat: layar kasir (dua panel, padat, tanpa navigasi permanen) dan dashboard owner
  (komposisi ringkasan). Keduanya beda karena tugasnya memang beda.
- **MOTION 1 (hanya transisi state).** Kasir mengejar kecepatan. Animasi terbatas pada
  perubahan state yang perlu dijelaskan: ripple sentuhan, munculnya snackbar, buka/tutup
  dialog. Tidak ada animasi masuk halaman, tidak ada loop.

## Palet

Seed **`#00696B`** (teal gelap). Palet lengkap dibangkitkan dengan algoritma resmi
Material 3 lewat `scripts/generate-m3-theme.mjs`, bukan dipilih manual, supaya rasio
kontras setiap pasangan `on*` benar-benar memenuhi WCAG AA.

- **Primary (teal)** — satu aksi utama per area, indikator navigasi aktif, fokus.
- **Secondary** — kontainer pendukung, chip filter terpilih.
- **Tertiary** — dipakai sangat jarang, hanya untuk sorotan point/loyalty agar tidak
  tertukar dengan aksi utama maupun status.
- **Error** — hanya untuk kesalahan dan aksi merusak.
- **Surface family** — seluruh hierarki kontainer rutin. Ini yang menanggung sebagian
  besar layar, bukan warna merek.

Kenapa teal: tidak masuk keluarga biru-ungu yang menjadi default generik, cukup gelap
untuk kontras teks putih di atasnya, dan tidak bentrok dengan hijau "disetujui" maupun
merah "ditolak" yang dipakai sistem approval.

Mode terang dan gelap dua-duanya dibangun penuh. Toko bisa terang benderang di siang hari
dan remang saat tutup, jadi pilihan tema diserahkan ke pengguna, bukan dipaksa.

## Tipografi

`Inter` untuk seluruh teks. Dipilih karena angka lining-nya jelas pada ukuran kecil dan
punya varian tabular yang dibutuhkan kolom uang. Bukan karena netral.

Peran M3 yang dipakai, sengaja dibatasi: `headline-small` (judul halaman),
`title-medium` (judul seksi dan kartu), `body-medium` (isi), `label-large` (tombol),
`label-medium` (metadata tabel). Peran `display` tidak dipakai sama sekali karena tidak
ada layar yang butuh teks sebesar itu.

## Motif Identitas

Dua hal ini diulang di seluruh aplikasi dan menjadi ciri yang membedakannya:

1. **Garis status di tepi awal.** Setiap baris atau kartu yang punya siklus hidup
   (pending, disetujui, ditolak, void) diberi garis vertikal 3px di tepi kiri.
   Garis itu selalu ditemani label teks, sehingga status tetap terbaca tanpa warna.
2. **Angka sebagai tokoh utama.** Semua nominal dan kuantitas memakai angka tabular,
   rata kanan, satu tingkat lebih tebal dari teks sekitarnya. Kolom uang berbaris rapi
   ke bawah sehingga selisih terlihat tanpa harus dibaca satu per satu.

## Bentuk dan Elevasi

Skala sudut dibatasi empat nilai: `4px` (chip, badge), `8px` (input, tombol),
`12px` (kartu, dialog), `16px` (panel besar). Tidak ada elemen berbentuk kapsul penuh
kecuali FAB, karena bentuk kapsul di mana-mana menghapus perbedaan antara input dan kartu.

Hierarki rutin ditanggung peran `surfaceContainer*`, bukan bayangan. Bayangan hanya pada
elemen yang benar-benar melayang di atas konten lain: dialog, menu, dan snackbar.

## Navigasi

Presentasi berubah mengikuti lebar jendela, arsitekturnya tidak:

| Lebar | Bentuk navigasi |
|---|---|
| `< 600px` | Navigation bar di bawah |
| `600–1199px` | Navigation rail di kiri |
| `>= 1200px` | Navigation drawer permanen |

Daftar tujuan tumbuh mengikuti modul yang benar-benar sudah jadi. Tidak ada menu yang
mengarah ke halaman kosong.

## Aset yang Masih Placeholder

Toko belum menyediakan logo, jadi dua hal berikut sengaja ditandai sebagai sementara
dan tidak boleh dianggap final:

- **Favicon** (`public/favicon.svg`): glif etalase berwarna primary, bukan lambang merek.
- **Penanda di header dan halaman masuk**: ikon etalase yang sama.

Nama dan alamat toko sudah nyata karena dibaca dari `system_settings`, sehingga admin
dapat mengubahnya sendiri. Begitu logo asli tersedia, ganti berkas favicon dan tambahkan
berkas logo pada pengaturan `store.logo`.

## Yang Sengaja Tidak Dipakai

- Gradien sebagai warna utama, glow, dan latar bermotif grid. Tidak ada yang dijelaskan
  oleh teknik itu di aplikasi operasional.
- Kartu untuk setiap baris daftar. Baris daftar tetap baris daftar; kartu hanya untuk
  unit yang memang berdiri sendiri.
- Angka contoh di dashboard. Ringkasan hanya tampil kalau datanya nyata dari database.
