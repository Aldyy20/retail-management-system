# Product Requirements Document (PRD)
# Retail POS & Inventory Management System

**Versi:** 1.0  
**Status:** Draft / Development Specification  
**Platform:** Web Application  
**Backend:** ASP.NET Core Web API  
**Frontend:** React + TypeScript + Vite  
**Database:** PostgreSQL  
**Architecture:** Client–Server / REST API  

---

# 1. Ringkasan Produk

Sistem ini merupakan aplikasi **Point of Sale (POS) dan Inventory Management** yang dirancang untuk membantu toko mengelola seluruh aktivitas operasional penjualan dan pergudangan secara terintegrasi.

Sistem tidak hanya berfungsi sebagai aplikasi kasir, tetapi juga mencakup:

- Manajemen barang dan kategori.
- Manajemen gudang.
- Pencatatan barang masuk dan keluar.
- Stock tracking dan stock audit.
- Manajemen harga.
- Transaksi penjualan.
- Sistem kasir.
- Sistem approval supervisor.
- Manajemen karyawan.
- Manajemen member.
- Loyalty point.
- Penukaran point menjadi diskon.
- Sistem voucher.
- Sistem diskon barang.
- Dashboard owner.
- Laporan penjualan dan keuntungan.
- Manajemen konfigurasi toko.
- Pembuatan dan pencetakan nota.
- Pengaturan sistem yang bersifat dinamis.

Prinsip utama sistem adalah:

> **Tidak melakukan hardcode terhadap aturan bisnis yang seharusnya dapat dikonfigurasi oleh administrator.**

Contohnya:

- Satuan barang dapat ditambah.
- Satuan dapat dinonaktifkan.
- Sistem member dapat diaktifkan/nonaktifkan.
- Besaran point dapat diatur.
- Nilai penukaran point dapat diatur.
- Voucher dapat diaktifkan/nonaktifkan.
- Voucher dapat dibatasi hanya untuk member.
- Diskon dapat memiliki periode berlaku.
- Informasi toko pada nota dapat diubah.
- Footer nota dapat diubah.
- Metode pembayaran dapat dikembangkan tanpa mengubah struktur utama sistem.

---

# 2. Tujuan Sistem

## 2.1 Tujuan Utama

Membangun sistem yang mampu mengintegrasikan aktivitas:

```text
Gudang
   ↓
Inventory
   ↓
Kasir
   ↓
Penjualan
   ↓
Member / Voucher / Discount
   ↓
Pembayaran
   ↓
Laporan
   ↓
Dashboard Owner
```

sehingga seluruh aktivitas toko dapat dicatat, dilacak, diverifikasi, dan dianalisis.

## 2.2 Tujuan Bisnis

Sistem diharapkan mampu:

1. Mengurangi pencatatan manual.
2. Mengurangi kesalahan pencatatan stok.
3. Mengetahui jumlah stok secara aktual.
4. Mengetahui histori pergerakan setiap barang.
5. Mengetahui siapa yang melakukan suatu tindakan.
6. Memastikan aktivitas penting mendapatkan approval.
7. Mempermudah proses transaksi kasir.
8. Meningkatkan transparansi penjualan.
9. Menyediakan informasi bisnis kepada owner.
10. Meningkatkan loyalitas pelanggan melalui member dan loyalty point.
11. Memberikan fleksibilitas kepada admin dalam mengatur sistem.
12. Menjadi fondasi untuk integrasi payment gateway di masa depan.

---

# 3. Pengguna Sistem

Sistem memiliki empat role utama:

```text
ADMIN
OWNER
SUPERVISOR
KARYAWAN
```

Setiap role memiliki hak akses berbeda.

---

# 4. Role dan Hak Akses

## 4.1 Admin

Admin merupakan role dengan hak akses operasional dan konfigurasi paling tinggi.

### Tanggung jawab

Admin bertanggung jawab terhadap:

- Data barang.
- Kategori.
- Satuan.
- Gudang.
- Harga.
- Supplier.
- Karyawan.
- Supervisor.
- Member.
- Loyalty point.
- Voucher.
- Diskon.
- Konfigurasi toko.
- Konfigurasi POS.
- Konfigurasi sistem.
- Laporan.
- Pengaturan hak akses.

### Fitur Admin

Admin dapat:

- Menambah barang.
- Mengubah barang.
- Menonaktifkan barang.
- Mengatur harga.
- Mengatur harga modal.
- Mengatur kategori.
- Mengatur satuan.
- Mengatur gudang.
- Mengelola stok.
- Mengelola supplier.
- Mengelola karyawan.
- Mengelola supervisor.
- Mengelola member.
- Mengaktifkan/nonaktifkan sistem member.
- Mengatur loyalty point.
- Mengaktifkan/nonaktifkan voucher.
- Membuat voucher.
- Mengatur voucher khusus member.
- Membuat diskon.
- Menentukan periode diskon.
- Mengatur informasi toko.
- Mengatur logo toko.
- Mengatur alamat toko.
- Mengatur footer nota.
- Mengatur metode pembayaran yang tersedia.
- Melihat laporan.
- Melihat audit log.

---

# 5. Owner

Owner merupakan role yang berfokus pada **informasi dan pengambilan keputusan**, bukan operasional harian.

Owner tidak seharusnya memiliki akses untuk mengubah data operasional secara langsung.

## 5.1 Dashboard Owner

Dashboard harus menyajikan data yang telah diolah menjadi informasi.

Contoh:

### Ringkasan hari ini

```text
Penjualan Hari Ini
Rp 8.500.000

Jumlah Transaksi
127

Produk Terjual
438

Keuntungan
Rp 2.100.000

Member Bertransaksi
72

Voucher Digunakan
14
```

### Informasi tambahan

- Penjualan hari ini.
- Penjualan minggu ini.
- Penjualan bulan ini.
- Perbandingan penjualan.
- Produk paling laku.
- Produk kurang laku.
- Produk dengan keuntungan terbesar.
- Produk dengan margin terkecil.
- Jumlah stok.
- Barang hampir habis.
- Barang habis.
- Jumlah transaksi.
- Rata-rata transaksi.
- Total keuntungan.
- Total diskon.
- Total voucher.
- Total point yang digunakan.
- Aktivitas karyawan.
- Aktivitas supervisor.
- Tren penjualan.

Dashboard harus menggunakan visualisasi seperti:

- Line chart.
- Bar chart.
- Pie/donut chart.
- Summary card.
- Ranking table.
- Trend indicator.

---

# 6. Supervisor

Supervisor merupakan pengawas operasional.

Supervisor memiliki fitur seperti karyawan, tetapi memiliki kewenangan tambahan untuk melakukan approval terhadap tindakan tertentu.

## 6.1 Fitur Supervisor

Supervisor dapat:

- Melakukan transaksi penjualan.
- Mengakses kasir.
- Melihat produk.
- Melakukan audit stok.
- Mencatat barang masuk.
- Melihat histori stok.
- Melihat transaksi.
- Melakukan approval.
- Menolak approval.
- Melihat aktivitas karyawan.

## 6.2 Approval Workflow

Tindakan tertentu tidak langsung dianggap final.

Contoh:

```text
Karyawan
   ↓
Mengajukan tindakan
   ↓
Pending Approval
   ↓
Supervisor
   ├── Approve
   └── Reject
```

### Contoh tindakan yang membutuhkan approval

- Pembatalan transaksi.
- Void transaksi.
- Koreksi stok.
- Penyesuaian stok.
- Konfirmasi barang masuk.
- Perubahan tertentu terhadap inventory.
- Retur barang jika fitur retur diaktifkan.
- Aktivitas lain yang dikategorikan admin sebagai membutuhkan approval.

Approval system harus bersifat **dinamis** sehingga ke depannya jenis tindakan yang membutuhkan approval dapat dikembangkan.

---

# 7. Karyawan

Karyawan merupakan pengguna operasional utama.

## 7.1 Fungsi utama

### Kasir

Karyawan dapat:

- Membuat transaksi.
- Mencari barang.
- Scan barcode.
- Menambahkan barang ke cart.
- Mengubah jumlah barang.
- Menghapus item dari cart.
- Memilih member.
- Menggunakan voucher.
- Menggunakan loyalty point jika memenuhi syarat.
- Melakukan pembayaran cash.
- Mencetak nota.
- Melihat transaksi yang dilakukan.

### Gudang / Inventory

Karyawan dapat:

- Mencatat barang masuk.
- Melakukan stock opname.
- Melakukan audit stok.
- Melaporkan selisih stok.
- Melihat stok.
- Melihat histori barang.

Aktivitas tertentu menghasilkan status:

```text
DRAFT
   ↓
PENDING
   ↓
APPROVED / REJECTED
```

---

# 8. Sistem Authentication

Semua pengguna wajib melakukan login.

```text
Username / Email
Password
     ↓
Authentication
     ↓
Authorization
     ↓
Dashboard berdasarkan Role
```

Sistem menggunakan:

- Authentication.
- Authorization.
- Role-based access control.
- JWT atau mekanisme authentication yang sesuai.
- Password hashing.
- Session/token expiration.

---

# 9. Modul Master Data

## 9.1 Product

Setiap barang memiliki minimal:

- ID.
- SKU / kode barang.
- Barcode.
- Nama barang.
- Deskripsi.
- Kategori.
- Satuan.
- Harga modal.
- Harga jual.
- Minimum stock.
- Status aktif/nonaktif.
- Foto produk opsional.
- Tanggal dibuat.
- Tanggal diperbarui.

Contoh:

```text
SKU       : PRD-00001
Barcode   : 899xxxxxxxx
Nama      : Air Mineral
Kategori  : Minuman
Satuan    : Botol
Modal     : Rp2.000
Harga     : Rp3.500
Min Stock : 20
Status    : Active
```

---

# 10. Sistem Satuan

Satuan **tidak boleh hardcode**.

Admin dapat:

- Menambah satuan.
- Mengubah satuan.
- Mengaktifkan satuan.
- Menonaktifkan satuan.

Contoh:

```text
PCS
BOTOL
KOTAK
DUS
KG
GRAM
LITER
PACK
```

Jika suatu satuan sudah digunakan oleh transaksi, sebaiknya satuan **tidak dihapus secara fisik**, tetapi dinonaktifkan.

---

# 11. Kategori Produk

Admin dapat:

- Membuat kategori.
- Mengubah kategori.
- Menonaktifkan kategori.
- Mengatur produk dalam kategori.

Contoh:

```text
Makanan
Minuman
Rokok
Sembako
Alat Rumah Tangga
Elektronik
```

---

# 12. Gudang

Sistem harus mendukung pencatatan barang berdasarkan gudang.

Setiap gudang memiliki:

- ID.
- Kode.
- Nama.
- Alamat.
- Deskripsi.
- Status.

Contoh:

```text
Gudang Utama
Gudang Belakang
Gudang Cabang
```

Arsitektur harus memungkinkan lebih dari satu gudang di masa depan.

---

# 13. Inventory Management

Inventory merupakan salah satu modul utama.

Sistem harus dapat mengetahui:

```text
Stok Awal
+
Barang Masuk
-
Barang Keluar
± Stock Adjustment
=
Stok Akhir
```

## 13.1 Stock Movement

Setiap perubahan stok harus dicatat.

Contoh:

```text
Product       : Air Mineral
Movement      : OUT
Quantity      : 5
Reference     : Sale #INV-00125
User          : Budi
Date          : 18-08-2026
```

Jenis movement:

```text
IN
OUT
ADJUSTMENT_IN
ADJUSTMENT_OUT
TRANSFER_IN
TRANSFER_OUT
RETURN_IN
RETURN_OUT
```

Jenis movement sebaiknya dikelola melalui enum/domain rule yang terkontrol dan bukan string bebas dari frontend.

---

# 14. Barang Masuk

Ketika barang masuk:

```text
Karyawan
   ↓
Input Barang Masuk
   ↓
Pending
   ↓
Supervisor
   ↓
Approve
   ↓
Stock bertambah
```

Contoh:

```text
Barang      : Air Mineral
Jumlah      : 100
Supplier    : PT ABC
Harga Modal : Rp2.000
```

Setelah supervisor melakukan approval:

```text
Stock sebelumnya : 50
Barang masuk     : 100
Stock sekarang   : 150
```

---

# 15. Stock Opname / Audit Gudang

Karyawan dapat melakukan audit stok.

Sistem membandingkan:

```text
System Stock
vs
Physical Stock
```

Contoh:

```text
System Stock    : 100
Physical Stock  : 97
Difference      : -3
```

Selisih harus dicatat.

Jika adjustment memerlukan approval:

```text
Karyawan
    ↓
Stock Opname
    ↓
Selisih -3
    ↓
Pending Approval
    ↓
Supervisor
    ↓
Approve
    ↓
Stock menjadi 97
```

---

# 16. Sistem Kasir

Kasir merupakan salah satu modul terpenting.

## 16.1 Cart

Kasir dapat:

- Mencari produk.
- Scan barcode.
- Menambah produk.
- Mengurangi quantity.
- Menghapus produk.
- Melihat harga.
- Melihat subtotal.
- Melihat diskon.
- Melihat total.

Contoh:

```text
Produk              Qty     Harga       Subtotal

Air Mineral          2      3.500        7.000
Roti                 1      8.000        8.000
Mie Instan           5      3.000       15.000

-----------------------------------------------
Subtotal                              30.000
Diskon                                -5.000
-----------------------------------------------
Total                                  25.000
```

---

# 17. Sistem Harga

Harga harus dapat dikelola oleh admin.

Minimal:

- Harga modal.
- Harga jual.
- Histori harga.

Perubahan harga sebaiknya tidak mengubah histori transaksi sebelumnya.

Contoh:

```text
Harga Lama : Rp10.000
Harga Baru : Rp12.000
```

Transaksi lama tetap menyimpan:

```text
Rp10.000
```

bukan mengambil harga terbaru dari tabel product.

---

# 18. Sistem Member

Member merupakan fitur yang dapat diaktifkan atau dinonaktifkan oleh admin.

```text
Settings
    ↓
Member Enabled?
    ├── YES
    └── NO
```

Jika disabled:

- Menu member tidak tersedia bagi kasir.
- Member tidak dapat digunakan pada transaksi.
- Loyalty point tidak diproses.

Jika enabled:

- Kasir dapat memilih member.
- Member dapat memperoleh point.
- Member dapat menukarkan point.

---

# 19. Data Member

Nomor HP digunakan sebagai **business identifier yang unik**.

Data member minimal:

```text
Phone Number
Name
Point Balance
Status
Created At
Updated At
```

Contoh:

```text
No HP       : 081234567890
Nama        : Andi
Point       : 250
Status      : Active
```

### Catatan desain database

Walaupun nomor HP menjadi identifier utama yang digunakan pengguna, secara teknis database sebaiknya tetap memiliki **internal ID** seperti UUID sebagai primary key.

Nomor HP diberi constraint:

```text
UNIQUE
```

Dengan demikian:

```text
Member ID   → Primary Key
Phone       → Unique Business Identifier
```

Ini lebih aman jika suatu hari nomor HP member berubah.

---

# 20. Loyalty Point

Admin dapat mengatur sistem point secara dinamis.

Contoh konfigurasi:

```text
Setiap pembelian Rp10.000
mendapatkan 1 point.
```

Admin dapat mengubah:

```text
Minimum Purchase
Point Reward
```

Contoh:

```text
Rp10.000 → 1 Point
Rp50.000 → 5 Point
Rp100.000 → 10 Point
```

Aturan sebenarnya harus berasal dari konfigurasi sistem, bukan hardcode.

---

# 21. Penukaran Point

Member dapat menggunakan point untuk memperoleh diskon.

Admin menentukan:

```text
100 Point → Diskon 5%
200 Point → Diskon 10%
500 Point → Diskon 20%
```

Konfigurasi minimal:

- Point required.
- Discount type.
- Discount value.
- Maximum discount jika diperlukan.
- Status.
- Periode berlaku jika diperlukan.

---

# 22. Sistem Voucher

Sistem voucher dapat diaktifkan/nonaktifkan oleh admin.

```text
Voucher Enabled
    ├── YES
    └── NO
```

Admin dapat membuat:

```text
Voucher Code
Discount Type
Discount Value
Minimum Purchase
Maximum Discount
Start Date
End Date
Usage Limit
Member Only
Status
```

Contoh:

```text
Code            : HEMAT20
Discount        : 20%
Minimum Belanja : Rp100.000
Maximum Discount: Rp25.000
Member Only     : YES
Valid Until     : 31-12-2026
```

---

# 23. Voucher Member / Non-Member

Admin dapat menentukan:

```text
Member Only = YES
```

atau:

```text
Member Only = NO
```

Jika:

```text
YES
```

maka voucher hanya dapat digunakan jika transaksi memiliki member.

Jika:

```text
NO
```

maka semua pelanggan dapat menggunakan voucher sesuai aturan voucher.

---

# 24. Sistem Diskon Produk

Admin dapat membuat diskon terhadap produk tertentu.

Contoh:

```text
Produk       : Kopi ABC
Diskon       : 15%
Mulai        : 20-08-2026
Berakhir     : 30-08-2026
```

Jenis diskon dapat dikembangkan menjadi:

```text
Percentage
Fixed Amount
```

Contoh:

```text
Diskon 10%
atau
Potongan Rp5.000
```

Diskon harus memiliki periode berlaku.

---

# 25. Prioritas Diskon

Sistem harus memiliki aturan yang jelas apabila terdapat:

- Discount produk.
- Voucher.
- Loyalty point.

Sistem tidak boleh menghitung diskon secara ambigu.

Contoh aturan:

```text
Harga Produk
    ↓
Product Discount
    ↓
Voucher
    ↓
Point Redemption
    ↓
Final Total
```

Urutan tersebut harus menjadi business rule yang terdokumentasi dan dapat dikembangkan kemudian.

Sistem juga harus mencegah kombinasi promo yang tidak diperbolehkan.

---

# 26. Pembayaran

Untuk versi pertama:

```text
CASH
```

Contoh:

```text
Total      : Rp75.000
Bayar      : Rp100.000
Kembalian  : Rp25.000
```

Namun desain sistem harus memungkinkan metode pembayaran baru:

```text
CASH
DEBIT
CREDIT_CARD
QRIS
E_WALLET
PAYMENT_GATEWAY
```

di masa depan.

Metode pembayaran harus menjadi data/configuration atau domain enum yang dapat dikembangkan, bukan logika yang tersebar di frontend.

---

# 27. Transaksi Penjualan

Setiap transaksi memiliki:

```text
Transaction
├── Invoice Number
├── Cashier
├── Member
├── Date
├── Subtotal
├── Discount
├── Voucher Discount
├── Point Discount
├── Total
├── Payment Method
├── Amount Paid
├── Change
└── Status
```

Transaction Detail:

```text
Product
Quantity
Unit Price
Discount
Subtotal
```

Harga harus disimpan pada transaction detail agar histori transaksi tidak berubah ketika harga produk berubah.

---

# 28. Pembatalan / Void Transaksi

Karyawan tidak dapat melakukan pembatalan transaksi secara bebas jika tindakan tersebut membutuhkan approval.

Workflow:

```text
Karyawan
   ↓
Request Void
   ↓
Alasan
   ↓
Pending
   ↓
Supervisor
   ├── Approve
   └── Reject
```

Jika approved:

```text
Transaction → VOID
```

dan inventory dikembalikan sesuai business rule.

Semua tindakan dicatat dalam audit log.

---

# 29. Nota / Receipt

Sistem harus dapat menghasilkan nota yang jelas dan informatif.

Contoh:

```text
================================
          TOKO ABC
       Jl. Contoh No. 123
        Kupang - NTT
================================

Invoice : INV-20260818-00001
Tanggal : 18/08/2026 20:30
Kasir   : Budi
Member  : 081234567890

--------------------------------
Barang          Qty    Harga
--------------------------------
Air Mineral      2     7.000
Roti             1     8.000
Mie Instan       5    15.000
--------------------------------

Subtotal              Rp30.000
Diskon                 Rp5.000
--------------------------------
TOTAL                  Rp25.000

Bayar                  Rp50.000
Kembalian              Rp25.000

--------------------------------
Terima kasih telah berbelanja
di Toko ABC.

Barang yang telah dibeli
tidak dapat dikembalikan.

[Footer dapat diubah admin]
================================
```

---

# 30. Konfigurasi Nota

Admin dapat mengubah:

- Nama toko.
- Logo.
- Alamat.
- Nomor telepon.
- Email.
- Footer.
- Catatan transaksi.
- Pesan terima kasih.
- Kebijakan retur.
- Informasi tambahan.

Tidak boleh hardcode seperti:

```text
"Terima kasih telah berbelanja..."
```

karena isi tersebut harus berasal dari konfigurasi toko.

---

# 31. Konfigurasi Toko

Admin dapat mengatur:

```text
Store Name
Store Logo
Address
Phone
Email
Website
Receipt Header
Receipt Footer
Return Policy
Currency
Timezone
```

---

# 32. Dashboard

## 32.1 Dashboard Admin

Menampilkan:

- Jumlah produk.
- Jumlah stok.
- Barang hampir habis.
- Barang habis.
- Pending approval.
- Transaksi hari ini.
- Penjualan hari ini.
- Aktivitas pengguna.
- Inventory status.

## 32.2 Dashboard Supervisor

Menampilkan:

- Pending approval.
- Transaksi hari ini.
- Aktivitas karyawan.
- Barang masuk pending.
- Stock adjustment pending.
- Permintaan void.
- Stock discrepancy.

## 32.3 Dashboard Owner

Dashboard paling informatif.

Menampilkan:

### Financial

- Revenue.
- Gross profit.
- Net profit jika data biaya tersedia.
- Total discount.
- Total voucher.
- Total payment.

### Sales

- Total transaction.
- Average transaction value.
- Sales trend.
- Sales by category.
- Sales by product.

### Inventory

- Total inventory.
- Low stock.
- Out of stock.
- Inventory movement.

### Employee

- Sales by cashier.
- Number of transactions per cashier.
- Activity summary.

---

# 33. Laporan

Sistem menyediakan laporan:

## Sales Report

Filter:

```text
Tanggal
Kasir
Produk
Kategori
Member
Payment Method
```

## Profit Report

Menampilkan:

```text
Revenue
Cost
Gross Profit
Margin
Discount
```

## Inventory Report

Menampilkan:

```text
Stock
Stock Movement
Stock Opname
Adjustment
```

## Employee Report

Menampilkan:

```text
Employee
Transaction Count
Sales
Activity
```

## Member Report

Menampilkan:

```text
Member
Total Transaction
Total Spending
Point Earned
Point Used
Point Balance
```

---

# 34. Audit Log

Karena sistem memiliki role dan approval, **audit log wajib tersedia**.

Setiap aktivitas penting dicatat:

```text
User
Action
Module
Reference
Old Value
New Value
IP Address
Timestamp
```

Contoh:

```text
User      : Budi
Action    : UPDATE_PRODUCT
Product   : PRD-00001
Old Price : 10.000
New Price : 12.000
Timestamp : 18-08-2026 20:30
```

Audit log membantu mengetahui:

> Siapa melakukan apa, kapan, dan terhadap data apa.

---

# 35. Notification

Sistem dapat memiliki notification center.

Contoh:

```text
🔔 3 Approval menunggu tindakan

- Barang masuk #GR-001
- Stock adjustment #SA-021
- Void transaction #INV-123
```

Supervisor mendapatkan notifikasi ketika terdapat approval pending.

Admin juga dapat mendapatkan notifikasi tertentu.

---

# 36. Status Data

Data operasional sebaiknya menggunakan lifecycle yang jelas.

Contoh:

```text
DRAFT
PENDING
APPROVED
REJECTED
CANCELLED
COMPLETED
VOID
```

Tidak semua entity membutuhkan seluruh status.

---

# 37. Prinsip Dynamic Configuration

Sistem harus menghindari hardcode terhadap business configuration.

Contoh yang **tidak boleh hardcode**:

```text
Member Enabled = true
```

Sebaliknya:

```text
System Settings
    ↓
MEMBER_ENABLED
```

Begitu juga:

```text
VOUCHER_ENABLED
POINT_ENABLED
```

dan konfigurasi lainnya.

Contoh:

```text
settings
--------------------------------
member.enabled
voucher.enabled
loyalty.enabled
currency
receipt.footer
receipt.return_policy
```

---

# 38. Pengaturan yang Dapat Dikelola Admin

Minimal:

### General

- Nama toko.
- Logo.
- Alamat.
- Kontak.
- Currency.
- Timezone.

### Member

- Enable/disable member.
- Enable/disable point.
- Point earning rule.
- Point redemption rule.

### Voucher

- Enable/disable voucher.
- Member-only setting.
- Default voucher behavior.

### Inventory

- Minimum stock.
- Approval stock adjustment.
- Approval goods receiving.

### Transaction

- Approval void.
- Approval cancellation.
- Payment methods.

### Receipt

- Header.
- Footer.
- Return policy.
- Thank-you message.

---

# 39. Database Entity Utama

Struktur database awal dapat mencakup:

```text
users
roles
permissions
role_permissions

stores

warehouses

categories
units
products

suppliers

inventory
stock_movements
stock_opnames
stock_opname_details

price_histories

transactions
transaction_details
payments

members
member_point_transactions

discounts
discount_products

vouchers
voucher_usages

approval_requests
approval_actions

system_settings

audit_logs
```

Entity tersebut dapat berkembang sesuai kebutuhan setelah business flow dimatangkan.

---

# 40. Relasi Konseptual

```text
ROLE
 │
 └── USER
       │
       ├── TRANSACTION
       │       │
       │       ├── TRANSACTION_DETAIL
       │       │        │
       │       │        └── PRODUCT
       │       │
       │       └── PAYMENT
       │
       ├── STOCK_MOVEMENT
       │
       └── APPROVAL_REQUEST


PRODUCT
 │
 ├── CATEGORY
 ├── UNIT
 ├── INVENTORY
 ├── PRICE_HISTORY
 └── DISCOUNT


MEMBER
 │
 ├── TRANSACTION
 └── POINT_TRANSACTION


VOUCHER
 │
 └── VOUCHER_USAGE


WAREHOUSE
 │
 └── INVENTORY
```

---

# 41. Arsitektur Aplikasi

## Backend

```text
POS.Server
│
├── Controllers
├── DTOs
├── Models / Entities
├── Services
├── Repositories
├── Data
├── Middleware
├── Authorization
├── Validators
└── Program.cs
```

Backend menggunakan:

- ASP.NET Core Web API.
- Entity Framework Core.
- PostgreSQL.
- REST API.
- Authentication.
- Authorization.
- DTO.
- Validation.
- Logging.
- Exception handling.

---

# 42. Frontend

```text
POS.Client
│
├── src
│   ├── components
│   ├── layouts
│   ├── pages
│   ├── services
│   ├── hooks
│   ├── stores
│   ├── types
│   ├── utils
│   └── routes
│
├── package.json
└── vite.config.ts
```

Frontend menggunakan:

- React.
- TypeScript.
- Vite.
- React Router.
- API Client.
- State Management.
- Form Validation.
- Responsive UI.

---

# 43. Halaman Frontend

## Authentication

```text
/login
```

## Admin

```text
/admin/dashboard

/admin/products
/admin/categories
/admin/units
/admin/warehouses
/admin/suppliers
/admin/inventory
/admin/employees
/admin/supervisors
/admin/members
/admin/discounts
/admin/vouchers
/admin/reports
/admin/settings
/admin/audit-logs
```

## Supervisor

```text
/supervisor/dashboard
/supervisor/pos
/supervisor/inventory
/supervisor/approvals
/supervisor/transactions
```

## Karyawan

```text
/cashier
/cashier/transactions
/inventory
/stock-opname
/goods-receiving
```

## Owner

```text
/owner/dashboard
/owner/sales
/owner/profit
/owner/inventory
/owner/products
/owner/employees
/owner/members
```

---

# 44. API Concept

Contoh endpoint:

```http
POST   /api/auth/login

GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}

GET    /api/categories
POST   /api/categories

GET    /api/inventory
GET    /api/inventory/movements

POST   /api/goods-receiving
POST   /api/stock-opnames

GET    /api/members
POST   /api/members

POST   /api/transactions
GET    /api/transactions
GET    /api/transactions/{id}

POST   /api/vouchers
POST   /api/vouchers/validate

POST   /api/discounts

GET    /api/approvals
POST   /api/approvals/{id}/approve
POST   /api/approvals/{id}/reject

GET    /api/dashboard/owner
GET    /api/reports/sales
GET    /api/reports/profit
GET    /api/reports/inventory

GET    /api/settings
PUT    /api/settings
```

Endpoint final harus mengikuti domain dan authorization policy yang telah ditetapkan.

---

# 45. Business Rules Penting

## BR-001 — Harga transaksi

Harga pada transaksi harus disimpan sebagai snapshot.

Jika harga produk berubah:

```text
Product Price = Rp15.000
```

transaksi lama tetap menggunakan harga yang tercatat saat transaksi.

---

## BR-002 — Stock

Stok tidak boleh diubah sembarangan melalui frontend.

Perubahan stok harus berasal dari:

- Goods receiving.
- Sales.
- Return.
- Transfer.
- Stock adjustment.
- Stock opname.

---

## BR-003 — Approval

Aktivitas yang memerlukan approval tidak boleh langsung mengubah kondisi final sistem.

---

## BR-004 — Audit

Semua aktivitas sensitif harus memiliki audit trail.

---

## BR-005 — Member

Member hanya dapat digunakan jika fitur member aktif.

---

## BR-006 — Voucher

Voucher hanya dapat digunakan jika:

- Voucher aktif.
- Voucher belum expired.
- Voucher masih memiliki kuota.
- Minimum purchase terpenuhi.
- Member requirement terpenuhi.

---

## BR-007 — Point

Point hanya diberikan berdasarkan aturan loyalty yang sedang aktif pada saat transaksi.

---

## BR-008 — Point Redemption

Point yang ditukarkan harus mengurangi saldo point member secara atomic bersama transaksi.

---

## BR-009 — Transaction Atomicity

Proses transaksi harus bersifat atomic.

Jika pembayaran gagal atau proses transaksi gagal:

```text
Transaction
Stock
Payment
Point
Voucher
```

tidak boleh berada dalam kondisi setengah berhasil.

---

# 46. Security Requirements

Sistem harus menerapkan:

- Password hashing.
- Authentication.
- Authorization.
- Role-based access control.
- Input validation.
- Server-side validation.
- SQL injection protection melalui ORM/parameterized query.
- Rate limiting pada endpoint sensitif jika diperlukan.
- HTTPS.
- Audit logging.
- Secure token handling.
- Validasi ownership terhadap resource.
- Protection terhadap unauthorized API access.

Frontend tidak boleh menjadi sumber kebenaran untuk:

```text
Harga
Diskon
Point
Voucher
Stock
Role
Permission
Total transaksi
```

Semua keputusan tersebut harus divalidasi ulang di backend.

---

# 47. Non-Functional Requirements

## Performance

Target awal:

- API response normal < 500 ms untuk operasi sederhana.
- Search produk harus responsif.
- Kasir dapat mencari produk tanpa reload halaman.
- Dashboard menggunakan query yang teroptimasi.

## Reliability

- Transaction harus atomic.
- Error harus ditangani secara konsisten.
- Database memiliki backup.

## Scalability

Sistem harus dapat dikembangkan untuk:

- Multi warehouse.
- Multi store.
- Payment gateway.
- QRIS.
- E-wallet.
- Printer POS.
- Barcode scanner.
- Mobile application.

## Maintainability

Kode harus:

- Modular.
- Menggunakan DTO.
- Menghindari business logic di controller.
- Menghindari hardcode.
- Memiliki naming convention konsisten.
- Memiliki centralized error handling.
- Memiliki logging.

---

# 48. Future Development

Fitur yang dapat ditambahkan:

### Payment

```text
QRIS
Debit
Credit Card
E-Wallet
Payment Gateway
```

### Inventory

```text
Multi Warehouse
Stock Transfer
Purchase Order
Supplier Management
```

### Customer

```text
Customer Segmentation
Tier Member
Birthday Reward
Personalized Promotion
```

### Loyalty

```text
Tier Member
Bronze
Silver
Gold
Platinum
```

### Sales

```text
Return
Refund
Exchange
Pre-order
Reservation
```

### Integration

```text
Accounting System
Payment Gateway
WhatsApp
Email
Marketplace
E-commerce
```

---

# 49. MVP — Versi Pertama

Agar development tidak terlalu besar sejak awal, MVP harus difokuskan pada core operation.

## Phase 1 — Foundation

```text
[ ] Project POS.Server
[ ] Project POS.Client
[ ] PostgreSQL
[ ] Entity Framework Core
[ ] Database migration
[ ] Authentication
[ ] Role management
```

## Phase 2 — Master Data

```text
[ ] Product
[ ] Category
[ ] Unit
[ ] Warehouse
[ ] Supplier
[ ] Employee
```

## Phase 3 — Inventory

```text
[ ] Inventory
[ ] Goods receiving
[ ] Stock movement
[ ] Stock opname
[ ] Stock adjustment
[ ] Supervisor approval
```

## Phase 4 — POS

```text
[ ] Product search
[ ] Barcode
[ ] Cart
[ ] Transaction
[ ] Cash payment
[ ] Change calculation
[ ] Receipt
```

## Phase 5 — Member

```text
[ ] Member
[ ] Enable/disable member
[ ] Loyalty point
[ ] Point redemption
```

## Phase 6 — Promotion

```text
[ ] Product discount
[ ] Voucher
[ ] Voucher validation
[ ] Member-only voucher
```

## Phase 7 — Dashboard

```text
[ ] Admin dashboard
[ ] Supervisor dashboard
[ ] Owner dashboard
[ ] Sales report
[ ] Profit report
[ ] Inventory report
```

## Phase 8 — Audit & Hardening

```text
[ ] Audit log
[ ] Error handling
[ ] Security review
[ ] Authorization review
[ ] Database optimization
[ ] Testing
```

---

# 50. Acceptance Criteria MVP

MVP dianggap berhasil apabila:

### Authentication

- User dapat login.
- User diarahkan ke dashboard sesuai role.
- User tidak dapat mengakses fitur yang bukan haknya.

### Product

- Admin dapat CRUD produk.
- Produk memiliki kategori dan satuan.
- Harga dapat diubah.
- Histori harga tersimpan.

### Inventory

- Barang masuk dapat dicatat.
- Barang masuk membutuhkan approval jika aturan tersebut aktif.
- Stock bertambah setelah approval.
- Semua perubahan stock tercatat.

### POS

- Kasir dapat mencari produk.
- Kasir dapat membuat cart.
- Sistem menghitung subtotal.
- Sistem menghitung discount.
- Sistem menghitung total.
- Kasir dapat menerima pembayaran cash.
- Sistem menghitung kembalian.
- Transaksi tersimpan.
- Stock berkurang setelah transaksi berhasil.
- Nota dapat dicetak.

### Member

- Admin dapat mengaktifkan/nonaktifkan member.
- Member dapat didaftarkan menggunakan nomor HP.
- Member dapat memperoleh point.
- Point dapat ditukarkan.
- Saldo point tercatat.

### Voucher

- Admin dapat mengaktifkan/nonaktifkan voucher.
- Admin dapat membuat voucher.
- Sistem memvalidasi voucher.
- Voucher dapat dibatasi untuk member.

### Approval

- Karyawan dapat membuat request.
- Supervisor dapat approve/reject.
- Status request berubah sesuai tindakan.

### Owner

- Owner dapat melihat dashboard.
- Dashboard menampilkan informasi penjualan.
- Owner dapat melihat keuntungan.
- Owner dapat melihat produk.
- Owner dapat melihat aktivitas karyawan.

---

# 51. Prinsip Arsitektur Utama

Development sistem harus mengikuti prinsip:

```text
                    BUSINESS RULE
                         │
                         ▼
                   POS.Server
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
         PostgreSQL             REST API
                                    │
                                    ▼
                               POS.Client
```

**Backend adalah sumber kebenaran (source of truth).**

React hanya bertanggung jawab terhadap:

- Presentation.
- User interaction.
- Client-side state.
- Form.
- Navigation.

ASP.NET Core bertanggung jawab terhadap:

- Authentication.
- Authorization.
- Business rules.
- Calculation.
- Validation.
- Transaction processing.
- Inventory.
- Loyalty.
- Voucher.
- Discount.
- Approval.
- Audit.

---

# 52. Prinsip Pengembangan

## Jangan hardcode business configuration

Salah:

```text
if (total >= 100000)
    point = 10;
```

Lebih baik:

```text
Transaction
    ↓
Loyalty Configuration
    ↓
Evaluate Rule
    ↓
Calculate Point
```

---

## Jangan percaya data dari frontend

Frontend dapat mengirim:

```json
{
  "productId": 1,
  "quantity": 2
}
```

Backend harus mengambil harga dari database dan menghitung ulang:

```text
Product
+
Quantity
+
Discount
+
Voucher
+
Point
=
Final Total
```

Bukan menerima:

```json
{
  "total": 5000
}
```

dan mempercayainya begitu saja.

---

# 53. Target Arsitektur Final

```text
┌───────────────────────────────────────────────┐
│                  POS CLIENT                   │
│                                               │
│ React + TypeScript + Vite                     │
│                                               │
│ Dashboard | POS | Inventory | Reports        │
│ Member | Product | Settings                  │
└──────────────────────┬────────────────────────┘
                       │
                       │ REST API / HTTPS
                       ▼
┌───────────────────────────────────────────────┐
│                  POS SERVER                   │
│                                               │
│ ASP.NET Core Web API                          │
│                                               │
│ Authentication                                │
│ Authorization                                 │
│ Product Management                            │
│ Inventory                                     │
│ POS Transaction                               │
│ Loyalty                                       │
│ Voucher                                       │
│ Discount                                      │
│ Approval                                      │
│ Reporting                                     │
│ Audit                                         │
└──────────────────────┬────────────────────────┘
                       │
                       │ EF Core
                       ▼
┌───────────────────────────────────────────────┐
│                  PostgreSQL                   │
│                                               │
│ Master Data                                   │
│ Transaction                                   │
│ Inventory                                     │
│ Member                                        │
│ Promotion                                     │
│ Approval                                      │
│ Audit                                         │
│ Configuration                                 │
└───────────────────────────────────────────────┘
```

---

# 54. Prioritas Development

Urutan development yang direkomendasikan:

```text
1. Project Architecture
        ↓
2. Database Design
        ↓
3. Authentication & Authorization
        ↓
4. Master Data
        ↓
5. Inventory
        ↓
6. Approval Workflow
        ↓
7. POS Transaction
        ↓
8. Member & Loyalty
        ↓
9. Discount & Voucher
        ↓
10. Receipt
        ↓
11. Dashboard
        ↓
12. Reports
        ↓
13. Audit Log
        ↓
14. Testing
        ↓
15. Deployment
```

---

# 55. Definition of Done

Sebuah modul dianggap selesai apabila:

- Database entity telah tersedia.
- Migration berhasil.
- API telah tersedia.
- Authorization telah diterapkan.
- Server-side validation tersedia.
- Business rule telah diuji.
- Frontend telah terhubung ke API.
- Loading state tersedia.
- Error handling tersedia.
- Success feedback tersedia.
- Audit log diterapkan jika diperlukan.
- Tidak ada business logic kritis yang hanya dilakukan di frontend.
- Unit/integration test tersedia untuk logic kritis.

---

# 56. Kesimpulan

POS ini dirancang bukan hanya sebagai aplikasi kasir, tetapi sebagai **sistem manajemen operasional toko terintegrasi**.

Empat role memiliki fungsi yang berbeda:

```text
ADMIN
  → Mengelola sistem dan konfigurasi

OWNER
  → Melihat dan menganalisis informasi bisnis

SUPERVISOR
  → Mengawasi dan menyetujui aktivitas penting

KARYAWAN
  → Menjalankan aktivitas operasional
```

Alur utama sistem:

```text
MASTER DATA
     ↓
WAREHOUSE
     ↓
INVENTORY
     ↓
CASHIER
     ↓
TRANSACTION
     ↓
PAYMENT
     ↓
RECEIPT
     ↓
REPORT
     ↓
OWNER DASHBOARD
```

Sedangkan fitur modern:

```text
MEMBER
  ↓
LOYALTY POINT
  ↓
POINT REDEMPTION

VOUCHER
  ↓
DISCOUNT

PRODUCT DISCOUNT
  ↓
PROMOTION

APPROVAL
  ↓
SUPERVISOR

AUDIT LOG
  ↓
ACCOUNTABILITY
```

**Prinsip paling penting dari sistem ini adalah konfigurabilitas.** Aturan yang merupakan kebijakan toko harus dapat diubah melalui sistem oleh Admin tanpa harus mengubah source code dan melakukan deployment ulang.

Dengan PRD ini, development dapat dimulai dari **database/ERD**, kemudian dilanjutkan ke `POS.Server`, lalu `POS.Client`, sehingga setiap fitur memiliki domain dan business rule yang jelas sebelum masuk ke tahap UI.