using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.Server.Data;
using POS.Server.Entities;

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
        List<CartItemModel> listItem,
        string? idMember = null,
        string? idPointRedemptionRule = null,
        string? voucherCode = null)
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

        Dictionary<string, decimal> sellingPriceByProduct = products
            .ToDictionary(x => x.IdProduct, x => x.SellingPrice);

        Dictionary<string, decimal> discountPerUnit = await PromotionMethods.GetProductDiscountPerUnitAsync(
            db, productIds, sellingPriceByProduct);

        foreach (var item in groupedItems)
        {
            var product = products.FirstOrDefault(x => x.IdProduct == item.IdProduct);

            if (product == null || !product.IsActive)
            {
                result.ListWarning.Add("Ada barang yang tidak ditemukan atau sedang dinonaktifkan. Hapus dari keranjang lalu pindai ulang.");
                continue;
            }

            // Diskon produk berlaku per satuan, jadi dikalikan jumlah barangnya.
            decimal discountAmount = discountPerUnit.TryGetValue(product.IdProduct, out decimal perUnit)
                ? perUnit * item.Quantity
                : 0;

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

        // Voucher dihitung dari nilai belanja setelah diskon produk, lalu penukaran point
        // dihitung dari sisa setelah voucher. Urutan ini tidak boleh ditukar.
        decimal amountAfterProductDiscount = result.SubtotalAmount - result.DiscountAmount;
        result.Voucher = await PromotionMethods.ValidateVoucherAsync(
            db, voucherCode, amountAfterProductDiscount, !string.IsNullOrWhiteSpace(idMember));

        if (result.Voucher.IsValid)
        {
            result.VoucherDiscountAmount = result.Voucher.DiscountAmount;
        }
        else if (result.Voucher.ErrorMessage != null)
        {
            result.ListWarning.Add(result.Voucher.ErrorMessage);
        }

        await ApplyMemberAsync(db, result, idMember, idPointRedemptionRule);

        // Urutan potongan mengikuti aturan yang ditetapkan PRD bagian 25:
        // harga produk, diskon produk, voucher, lalu penukaran point.
        result.TotalAmount = result.SubtotalAmount
            - result.DiscountAmount
            - result.VoucherDiscountAmount
            - result.PointDiscountAmount;

        result.PointEarned = await LoyaltyMethods.CalculateEarnedPointAsync(db, result.TotalAmount);

        return result;
    }

    /// <summary>
    /// Melekatkan member pada keranjang dan menerapkan penukaran point bila dipilih.
    /// Member diabaikan sepenuhnya bila sistem member sedang dinonaktifkan (PRD BR-005).
    /// </summary>
    private static async Task ApplyMemberAsync(
        ApplicationDbContext db,
        CalculatedCartModel result,
        string? idMember,
        string? idPointRedemptionRule)
    {
        if (string.IsNullOrWhiteSpace(idMember) || !await LoyaltyMethods.IsMemberEnabledAsync(db))
        {
            return;
        }

        Member? member = await db.Member.FirstOrDefaultAsync(x => x.IdMember == idMember && x.IsActive);

        if (member == null)
        {
            result.ListWarning.Add("Member yang dipilih tidak ditemukan atau sedang dinonaktifkan.");
            return;
        }

        result.Member = new QueryMemberModel
        {
            IdMember = member.IdMember,
            PhoneNumber = member.PhoneNumber,
            MemberName = member.MemberName,
            PointBalance = member.PointBalance,
            TotalSpending = member.TotalSpending,
            TotalTransaction = member.TotalTransaction,
            IsActive = member.IsActive,
        };

        decimal amountBeforePoint = result.SubtotalAmount - result.DiscountAmount - result.VoucherDiscountAmount;
        result.ListRedemptionOption = await LoyaltyMethods.GetRedemptionOptionsAsync(db, member, amountBeforePoint);

        if (string.IsNullOrWhiteSpace(idPointRedemptionRule))
        {
            return;
        }

        PointRedemptionOptionModel? option = result.ListRedemptionOption
            .FirstOrDefault(x => x.IdPointRedemptionRule == idPointRedemptionRule);

        if (option == null)
        {
            result.ListWarning.Add("Aturan penukaran point yang dipilih tidak tersedia.");
            return;
        }

        if (!option.IsAvailable)
        {
            result.ListWarning.Add(option.UnavailableReason ?? "Penukaran point tidak dapat dipakai.");
            return;
        }

        result.IdPointRedemptionRule = option.IdPointRedemptionRule;
        result.PointDiscountAmount = option.DiscountAmount;
        result.PointRedeemed = option.PointRequired;
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
