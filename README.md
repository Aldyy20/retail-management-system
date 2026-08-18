# Retail POS & Inventory Management System

Sistem kasir dan manajemen gudang terintegrasi untuk toko retail. Dibangun mengikuti
`Product Requirements Document (PRD) — Retail POS & Inventory Management System.md`.

## Susunan Project

| Project | Isi |
|---|---|
| `POS.DataLayer` | Model family, enum domain, interface, dan helper yang dipakai bersama backend. |
| `POS.Server` | ASP.NET Core Web API, EF Core, Identity, JWT, migrasi database. |
| `pos.client` | React + TypeScript + Vite. |

## Prasyarat

- .NET SDK 10
- Node.js 20 atau lebih baru
- PostgreSQL 15 atau lebih baru

## Menyiapkan Konfigurasi Lokal

`POS.Server/appsettings.Development.json` berisi kredensial dan sengaja tidak ikut ter-commit.
Salin berkas contohnya lalu isi nilainya:

```bash
cp POS.Server/appsettings.Development.example.json POS.Server/appsettings.Development.json
```

Yang perlu diisi:

- `ConnectionStrings:DefaultConnection` — kredensial PostgreSQL lokal Anda.
- `Jwt:Secret` — kunci acak minimal 32 karakter. Server menolak start jika lebih pendek.
- `SeedAdmin:Password` — kata sandi akun admin pertama, minimal 8 karakter.

Untuk produksi, gunakan environment variable atau user-secrets, bukan berkas ini.

## Menyiapkan Database

Buat database kosong lebih dulu:

```bash
createdb -U postgres pos_db
```

Migrasi dijalankan otomatis saat server pertama kali start. Untuk menjalankannya manual:

```bash
dotnet ef database update --project POS.Server --startup-project POS.Server
```

## Menjalankan

```bash
dotnet run --project POS.Server
```

Vite dev server ikut dijalankan lewat SPA proxy. Login pertama memakai `SeedAdmin:UserName`
dan `SeedAdmin:Password` dari konfigurasi Anda.

## Prinsip yang Dipegang

- Backend adalah sumber kebenaran. Harga, diskon, point, voucher, stok, dan total
  transaksi selalu dihitung ulang di server, tidak pernah dipercaya dari frontend.
- Kebijakan toko yang dapat berubah disimpan di tabel `system_settings`, bukan sebagai
  konstanta di kode. Admin mengubahnya lewat halaman pengaturan tanpa deployment ulang.
- Kontrak JSON memakai PascalCase agar nama properti sama persis antara model C# dan TypeScript.
- Seluruh endpoint aplikasi memakai POST, termasuk yang bersifat membaca data.
