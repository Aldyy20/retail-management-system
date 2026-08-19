using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.Server.Data;

namespace POS.Server.Services;

/// <summary>
/// Perhitungan transaksi kasir.
///
/// Frontend hanya mengirim produk dan jumlahnya. Harga, potongan, dan total selalu
/// diambil dan dihitung ulang di sini dari database, tidak pernah dipercaya dari
/// keranjang di layar (PRD bagian 52).
/// </summary>
public static class TransactionMethods
{
    /// <summary>
    /// Menghitung isi keranjang beserta stok tersedianya.
    /// Peringatan stok dikembalikan sebagai daftar, bukan kesalahan, supaya kasir dapat
    /// memperbaiki jumlahnya tanpa kehilangan seluruh keranjang.
    /// </summary>
    public static async Task<CalculatedCartModel> CalculateAsync(
        ApplicationDbContext db,
        string idWarehouse,
        List<CartItemModel> listItem)
    {
        CalculatedCartModel result = new();

        // Baris dengan produk yang sama digabung supaya satu produk tidak pernah
        // muncul dua kali dan pemeriksaan stoknya tetap benar.
        var groupedItems = listItem
            .Where(x => !string.IsNullOrWhiteSpace(x.IdProduct) && x.Quantity > 0)
            .GroupBy(x => x.IdProduct)
            .Select(x => new { IdProduct = x.Key, Quantity = x.Sum(item => item.Quantity) })
            .ToList();

        if (groupedItems.Count == 0)
        {
            return result;
        }

        string[] productIds = groupedItems.Select(x => x.IdProduct).ToArray();

        var products = await (
            from product in db.Product
            join inventory in db.Inventory.Where(x => x.IdWarehouse == idWarehouse)
                on product.IdProduct equals inventory.IdProduct into inventoryGroup
            from inventory in inventoryGroup.DefaultIfEmpty()
            where productIds.Contains(product.IdProduct)
            select new
            {
                product.IdProduct,
                product.Sku,
                product.ProductName,
                UnitName = product.Unit!.UnitName,
                product.SellingPrice,
                product.CostPrice,
                product.IsActive,
                Stock = inventory != null ? inventory.Quantity : 0,
            })
            .ToListAsync();

        foreach (var item in groupedItems)
        {
            var product = products.FirstOrDefault(x => x.IdProduct == item.IdProduct);

            if (product == null || !product.IsActive)
            {
                result.ListWarning.Add("Ada barang yang tidak ditemukan atau sedang dinonaktifkan. Hapus dari keranjang lalu pindai ulang.");
                continue;
            }

            // Diskon produk masih nol pada tahap ini. Modul promo yang akan mengisinya,
            // dan urutan hitungnya sudah disiapkan: diskon produk, lalu voucher, lalu point.
            decimal discountAmount = 0;
            decimal subtotal = product.SellingPrice * item.Quantity - discountAmount;

            result.ListItem.Add(new CalculatedCartItemModel
            {
                IdProduct = product.IdProduct,
                Sku = product.Sku,
                ProductName = product.ProductName,
                UnitName = product.UnitName,
                Quantity = item.Quantity,
                UnitPrice = product.SellingPrice,
                DiscountAmount = discountAmount,
                Subtotal = subtotal,
                AvailableStock = product.Stock,
            });

            if (product.Stock < item.Quantity)
            {
                result.ListWarning.Add($"Stok {product.ProductName} tinggal {product.Stock}, sedangkan keranjang meminta {item.Quantity}.");
            }
        }

        result.SubtotalAmount = result.ListItem.Sum(x => x.UnitPrice * x.Quantity);
        result.DiscountAmount = result.ListItem.Sum(x => x.DiscountAmount);
        result.TotalQuantity = result.ListItem.Sum(x => x.Quantity);
        result.TotalAmount = result.SubtotalAmount
            - result.DiscountAmount
            - result.VoucherDiscountAmount
            - result.PointDiscountAmount;

        return result;
    }

    /// <summary>
    /// Nomor nota berurut per hari, contoh INV-20260819-00001.
    /// ponytail: urutan diambil dari nota terakhir hari itu, bukan sequence database.
    /// Index unik pada kolom nomor yang menolak tabrakan bila dua kasir menyimpan bersamaan.
    /// </summary>
    public static async Task<string> BuildInvoiceNumberAsync(ApplicationDbContext db, DateTime transactionDate)
    {
        string prefix = $"INV-{transactionDate:yyyyMMdd}";

        string? lastNumber = await db.Transaction
            .Where(x => x.InvoiceNumber.StartsWith(prefix))
            .OrderByDescending(x => x.InvoiceNumber)
            .Select(x => x.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;

        if (lastNumber != null && int.TryParse(lastNumber[(prefix.Length + 1)..], out int parsed))
        {
            nextNumber = parsed + 1;
        }

        return $"{prefix}-{nextNumber:D5}";
    }

    /// <summary>Isi nota yang dapat diubah admin lewat halaman pengaturan.</summary>
    public static async Task<ReceiptSettingModel> GetReceiptSettingAsync(ApplicationDbContext db)
    {
        return new ReceiptSettingModel
        {
            StoreName = await GlobalList.GetSettingTextAsync(db, AppData.SettingStoreName, "Toko Saya"),
            StoreAddress = await GlobalList.GetSettingTextAsync(db, AppData.SettingStoreAddress),
            StorePhone = await GlobalList.GetSettingTextAsync(db, AppData.SettingStorePhone),
            Header = await GlobalList.GetSettingTextAsync(db, AppData.SettingReceiptHeader),
            Footer = await GlobalList.GetSettingTextAsync(db, AppData.SettingReceiptFooter),
            ThankYouMessage = await GlobalList.GetSettingTextAsync(db, AppData.SettingReceiptThankYou),
            ReturnPolicy = await GlobalList.GetSettingTextAsync(db, AppData.SettingReceiptReturnPolicy),
        };
    }
}
