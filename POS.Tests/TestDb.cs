using Microsoft.EntityFrameworkCore;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Tests;

/// <summary>
/// Database sementara di memori untuk menguji perhitungan.
///
/// Yang diuji di sini adalah aturan bisnis, bukan PostgreSQL, jadi tidak perlu database
/// sungguhan. Setiap pengujian mendapat database sendiri supaya datanya tidak bercampur.
/// </summary>
public static class TestDb
{
    public static ApplicationDbContext Create(params (string Key, string Value)[] settings)
    {
        DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"pos-test-{Guid.NewGuid()}")
            .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        ApplicationDbContext db = new(options);

        foreach ((string key, string value) in settings)
        {
            db.SystemSetting.Add(new SystemSetting
            {
                SettingKey = key,
                SettingValue = value,
                ValueType = "text",
                GroupName = "test",
                DisplayName = key,
            });
        }

        db.SaveChanges();

        // GlobalList menyimpan pengaturan pada cache statis yang dipakai bersama seluruh
        // pengujian. Tanpa pembersihan ini, pengujian kedua akan membaca pengaturan milik
        // pengujian pertama.
        GlobalList.ClearSystemSetting();

        return db;
    }

    /// <summary>Satu gudang dengan satu produk siap jual, beserta stok awalnya.</summary>
    public static (Warehouse Warehouse, Product Product) SeedProduct(
        ApplicationDbContext db,
        string productName,
        decimal sellingPrice,
        int stock,
        decimal costPrice = 0)
    {
        Category category = new() { CategoryName = $"Kategori {productName}" };
        Unit unit = new() { UnitName = $"PCS-{Guid.NewGuid():N}" };
        Warehouse warehouse = new() { WarehouseCode = $"GD-{Guid.NewGuid():N}", WarehouseName = "Gudang Uji" };

        Product product = new()
        {
            Sku = $"SKU-{Guid.NewGuid():N}",
            ProductName = productName,
            IdCategory = category.IdCategory,
            IdUnit = unit.IdUnit,
            SellingPrice = sellingPrice,
            CostPrice = costPrice,
            IsActive = true,
        };

        db.Category.Add(category);
        db.Unit.Add(unit);
        db.Warehouse.Add(warehouse);
        db.Product.Add(product);
        db.Inventory.Add(new Inventory
        {
            IdProduct = product.IdProduct,
            IdWarehouse = warehouse.IdWarehouse,
            Quantity = stock,
        });

        db.SaveChanges();

        return (warehouse, product);
    }
}
