using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Tests;

/// <summary>
/// Pergerakan stok (PRD BR-002). Stok hanya boleh berubah lewat jalur ini, dan setiap
/// perubahan meninggalkan baris riwayat yang menyebutkan stok sebelum dan sesudahnya.
/// </summary>
public class StockMovementTests
{
    [Fact]
    public async Task ApplyMovementAsync_BarangMasuk_MenambahStokDanMencatatRiwayat()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Air Mineral 600ml", sellingPrice: 5000, stock: 10);

        string? error = await InventoryMethods.ApplyMovementAsync(db, product.IdProduct, warehouse.IdWarehouse,
            StockMovementType.In, 5, "GOODS_RECEIVING", null, "GR-00001", null, null);

        await db.SaveChangesAsync();

        Assert.Null(error);
        Assert.Equal(15, await InventoryMethods.GetStockAsync(db, product.IdProduct, warehouse.IdWarehouse));

        StockMovement movement = await db.StockMovement.SingleAsync();
        Assert.Equal(10, movement.QuantityBefore);
        Assert.Equal(15, movement.QuantityAfter);
        Assert.Equal("GR-00001", movement.ReferenceNumber);
    }

    [Fact]
    public async Task ApplyMovementAsync_Penjualan_MenguranginStok()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Teh Kotak", sellingPrice: 4000, stock: 10);

        string? error = await InventoryMethods.ApplyMovementAsync(db, product.IdProduct, warehouse.IdWarehouse,
            StockMovementType.Out, 4, "TRANSACTION", null, "INV-20260819-00001", null, null);

        await db.SaveChangesAsync();

        Assert.Null(error);
        Assert.Equal(6, await InventoryMethods.GetStockAsync(db, product.IdProduct, warehouse.IdWarehouse));
    }

    /// <summary>Stok tidak pernah menjadi negatif, dan pesannya menyebutkan angka sebenarnya.</summary>
    [Fact]
    public async Task ApplyMovementAsync_StokTidakCukup_DitolakDanTidakBerubah()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Beras Premium 5kg", sellingPrice: 70000, stock: 3);

        string? error = await InventoryMethods.ApplyMovementAsync(db, product.IdProduct, warehouse.IdWarehouse,
            StockMovementType.Out, 10, "TRANSACTION", null, null, null, null);

        Assert.NotNull(error);
        Assert.Contains("3", error);
        Assert.Contains("10", error);
        Assert.Empty(db.StockMovement.Local);
        Assert.Equal(3, await InventoryMethods.GetStockAsync(db, product.IdProduct, warehouse.IdWarehouse));
    }

    [Fact]
    public async Task ApplyMovementAsync_JumlahNol_Ditolak()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Teh Kotak", sellingPrice: 4000, stock: 10);

        string? error = await InventoryMethods.ApplyMovementAsync(db, product.IdProduct, warehouse.IdWarehouse,
            StockMovementType.In, 0, "GOODS_RECEIVING", null, null, null, null);

        Assert.NotNull(error);
        Assert.Empty(db.StockMovement.Local);
    }

    /// <summary>
    /// Satu dokumen boleh memuat produk yang sama dua kali. Baris kedua harus melanjutkan
    /// stok hasil baris pertama, bukan membaca ulang stok lama dari database.
    /// </summary>
    [Fact]
    public async Task ApplyMovementAsync_ProdukBerulangDalamSatuDokumen_Berurutan()
    {
        using ApplicationDbContext db = TestDb.Create();
        (Warehouse warehouse, Product product) = TestDb.SeedProduct(db, "Air Mineral 600ml", sellingPrice: 5000, stock: 0);

        await InventoryMethods.ApplyMovementAsync(db, product.IdProduct, warehouse.IdWarehouse,
            StockMovementType.In, 6, "GOODS_RECEIVING", null, "GR-00001", null, null);
        await InventoryMethods.ApplyMovementAsync(db, product.IdProduct, warehouse.IdWarehouse,
            StockMovementType.In, 4, "GOODS_RECEIVING", null, "GR-00001", null, null);

        await db.SaveChangesAsync();

        Assert.Equal(10, await InventoryMethods.GetStockAsync(db, product.IdProduct, warehouse.IdWarehouse));

        List<StockMovement> movements = await db.StockMovement.OrderBy(x => x.QuantityAfter).ToListAsync();
        Assert.Equal([0, 6], movements.Select(x => x.QuantityBefore));
        Assert.Equal([6, 10], movements.Select(x => x.QuantityAfter));
    }

    [Fact]
    public void BuildDocumentNumber_MelanjutkanNomorTerakhir()
    {
        Assert.Equal("GR-00001", InventoryMethods.BuildDocumentNumber("GR", null));
        Assert.Equal("GR-00002", InventoryMethods.BuildDocumentNumber("GR", "GR-00001"));
        Assert.Equal("SO-00100", InventoryMethods.BuildDocumentNumber("SO", "SO-00099"));
    }
}
