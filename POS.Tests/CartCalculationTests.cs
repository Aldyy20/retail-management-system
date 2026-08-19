using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Tests;

/// <summary>
/// Perhitungan keranjang kasir. Ini logika paling kritis di sistem: kalau salah, uang
/// yang diterima toko ikut salah, dan kesalahannya baru ketahuan saat tutup buku.
/// </summary>
public class CartCalculationTests
{
    /// <summary>PRD BR-001 dan bagian 52: harga tidak pernah datang dari layar kasir.</summary>
    [Fact]
    public async Task CalculateAsync_MemakaiHargaDatabase_BukanHargaDariFrontend()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Air Mineral 600ml", sellingPrice: 5000, stock: 10);

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
            [new CartItemModel { IdProduct = product.IdProduct, Quantity = 2 }]);

        Assert.Equal(5000, result.ListItem.Single().UnitPrice);
        Assert.Equal(10000, result.SubtotalAmount);
        Assert.Equal(10000, result.TotalAmount);
    }

    /// <summary>Baris kembar digabung, supaya pemeriksaan stok memakai jumlah sebenarnya.</summary>
    [Fact]
    public async Task CalculateAsync_ProdukSamaDuaBaris_DigabungJadiSatu()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Teh Kotak", sellingPrice: 4000, stock: 10);

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
        [
            new CartItemModel { IdProduct = product.IdProduct, Quantity = 3 },
            new CartItemModel { IdProduct = product.IdProduct, Quantity = 2 },
        ]);

        Assert.Equal(5, result.ListItem.Single().Quantity);
        Assert.Equal(20000, result.TotalAmount);
    }

    /// <summary>Stok kurang tidak membatalkan keranjang, hanya memberi peringatan berisi angkanya.</summary>
    [Fact]
    public async Task CalculateAsync_StokKurang_MemberiPeringatanDenganAngka()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Beras Premium 5kg", sellingPrice: 70000, stock: 27);

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
            [new CartItemModel { IdProduct = product.IdProduct, Quantity = 500 }]);

        Assert.Single(result.ListItem);
        Assert.Contains(result.ListWarning, x => x.Contains("27") && x.Contains("500"));
    }
}

/// <summary>Diskon produk, prioritas diskon, dan voucher (PRD bagian 25 dan BR-006).</summary>
public class CartPromotionTests
{
    private static Discount AddDiscount(ApplicationDbContext db, Product product, decimal percentage)
    {
        Discount discount = new()
        {
            DiscountName = $"Promo {percentage}",
            DiscountValueType = DiscountValueType.Percentage,
            DiscountValue = percentage,
            StartDate = DateTime.Now.Date.AddDays(-1),
            EndDate = DateTime.Now.Date.AddDays(1),
            IsActive = true,
        };

        db.Discount.Add(discount);
        db.DiscountProduct.Add(new DiscountProduct { IdDiscount = discount.IdDiscount, IdProduct = product.IdProduct });
        return discount;
    }

    private static Voucher AddVoucher(ApplicationDbContext db, string code, decimal percentage, bool isMemberOnly)
    {
        Voucher voucher = new()
        {
            VoucherCode = code,
            VoucherName = code,
            DiscountValueType = DiscountValueType.Percentage,
            DiscountValue = percentage,
            StartDate = DateTime.Now.Date.AddDays(-1),
            EndDate = DateTime.Now.Date.AddDays(1),
            IsMemberOnly = isMemberOnly,
            IsActive = true,
        };

        db.Voucher.Add(voucher);
        return voucher;
    }

    [Fact]
    public async Task CalculateAsync_DiskonPersen_DipotongPerSatuan()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Teh Kotak", sellingPrice: 5000, stock: 10);

        AddDiscount(db, product, 20);
        await db.SaveChangesAsync();

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
            [new CartItemModel { IdProduct = product.IdProduct, Quantity = 3 }]);

        Assert.Equal(15000, result.SubtotalAmount);
        Assert.Equal(3000, result.DiscountAmount);
        Assert.Equal(12000, result.TotalAmount);
    }

    /// <summary>Keputusan tetap: beberapa diskon aktif tidak ditumpuk, diambil yang terbesar.</summary>
    [Fact]
    public async Task CalculateAsync_DuaDiskonAktif_MemakaiPotonganTerbesar()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Teh Kotak", sellingPrice: 5000, stock: 10);

        AddDiscount(db, product, 10);
        AddDiscount(db, product, 25);
        await db.SaveChangesAsync();

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
            [new CartItemModel { IdProduct = product.IdProduct, Quantity = 1 }]);

        Assert.Equal(1250, result.DiscountAmount);
    }

    /// <summary>PRD BR-006: voucher khusus member ditolak bila transaksi tidak memilih member.</summary>
    [Fact]
    public async Task CalculateAsync_VoucherKhususMemberTanpaMember_Ditolak()
    {
        using ApplicationDbContext db = TestDb.Create((AppData.SettingVoucherEnabled, "true"));
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Beras Premium 5kg", sellingPrice: 70000, stock: 10);

        AddVoucher(db, "HEMAT20", 20, isMemberOnly: true);
        await db.SaveChangesAsync();

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
            [new CartItemModel { IdProduct = product.IdProduct, Quantity = 1 }], voucherCode: "HEMAT20");

        Assert.NotNull(result.Voucher);
        Assert.False(result.Voucher.IsValid);
        Assert.Equal(0, result.VoucherDiscountAmount);
        Assert.Equal(70000, result.TotalAmount);
    }

    /// <summary>Urutan potongan: harga, diskon produk, lalu voucher dari sisanya.</summary>
    [Fact]
    public async Task CalculateAsync_VoucherPersen_DihitungSetelahDiskonProduk()
    {
        using ApplicationDbContext db = TestDb.Create((AppData.SettingVoucherEnabled, "true"));
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Teh Kotak", sellingPrice: 5000, stock: 20);

        AddDiscount(db, product, 20);
        AddVoucher(db, "UMUM10", 10, isMemberOnly: false);
        await db.SaveChangesAsync();

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
            [new CartItemModel { IdProduct = product.IdProduct, Quantity = 10 }], voucherCode: "UMUM10");

        // 50.000 dikurangi diskon produk 10.000 menjadi 40.000, lalu voucher 10% dari 40.000.
        Assert.Equal(10000, result.DiscountAmount);
        Assert.Equal(4000, result.VoucherDiscountAmount);
        Assert.Equal(36000, result.TotalAmount);
    }

    /// <summary>Voucher tidak berlaku sama sekali ketika admin mematikan fiturnya.</summary>
    [Fact]
    public async Task CalculateAsync_VoucherDinonaktifkan_TidakMemotong()
    {
        using ApplicationDbContext db = TestDb.Create((AppData.SettingVoucherEnabled, "false"));
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Teh Kotak", sellingPrice: 5000, stock: 20);

        AddVoucher(db, "UMUM10", 10, isMemberOnly: false);
        await db.SaveChangesAsync();

        CalculatedCartModel result = await TransactionMethods.CalculateAsync(db, warehouse.IdWarehouse,
            [new CartItemModel { IdProduct = product.IdProduct, Quantity = 1 }], voucherCode: "UMUM10");

        Assert.Equal(0, result.VoucherDiscountAmount);
        Assert.Equal(5000, result.TotalAmount);
    }
}
