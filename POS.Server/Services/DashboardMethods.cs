using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.DataLayer.Services;
using POS.Server.Data;

namespace POS.Server.Services;

/// <summary>
/// Perhitungan ringkasan beranda dan laporan.
///
/// Seluruh angka berasal dari transaksi yang benar-benar tersimpan. Transaksi yang
/// dibatalkan tidak pernah ikut dihitung, supaya laporan tidak menampilkan penjualan
/// yang sudah tidak berlaku.
/// </summary>
public static class DashboardMethods
{
    /// <summary>Transaksi yang sah dihitung: hanya yang berstatus selesai.</summary>
    public static IQueryable<Entities.Transaction> ValidTransactions(ApplicationDbContext db)
    {
        return db.Transaction.Where(x => x.Status == DataStatus.Completed);
    }

    public static async Task<SalesSummaryModel> GetSalesSummaryAsync(
        ApplicationDbContext db,
        DateTime startDate,
        DateTime endDate)
    {
        DateTime start = startDate.Date;
        DateTime end = endDate.Date.AddDays(1);

        var query = ValidTransactions(db).Where(x => x.TransactionDate >= start && x.TransactionDate < end);

        var aggregate = await query
            .GroupBy(x => 1)
            .Select(x => new
            {
                Revenue = x.Sum(t => t.TotalAmount),
                Cost = x.Sum(t => t.TotalCost),
                Discount = x.Sum(t => t.DiscountAmount + t.VoucherDiscountAmount + t.PointDiscountAmount),
                TransactionCount = x.Count(),
                MemberCount = x.Count(t => t.IdMember != null),
                VoucherCount = x.Count(t => t.IdVoucher != null),
            })
            .FirstOrDefaultAsync();

        if (aggregate == null)
        {
            return new SalesSummaryModel();
        }

        int itemSold = await (
            from detail in db.TransactionDetail
            join transaction in query on detail.IdTransaction equals transaction.IdTransaction
            select detail.Quantity)
            .SumAsync();

        return new SalesSummaryModel
        {
            Revenue = aggregate.Revenue,
            GrossProfit = aggregate.Revenue - aggregate.Cost,
            TotalDiscount = aggregate.Discount,
            TransactionCount = aggregate.TransactionCount,
            ItemSold = itemSold,
            MemberTransactionCount = aggregate.MemberCount,
            VoucherUsedCount = aggregate.VoucherCount,
        };
    }

    /// <summary>
    /// Penjualan harian untuk grafik tren. Hari tanpa transaksi tetap dikirim dengan
    /// nilai nol, supaya garis tidak melompati tanggal dan menyesatkan pembacanya.
    /// </summary>
    public static async Task<List<DailySalesModel>> GetDailySalesAsync(
        ApplicationDbContext db,
        DateTime startDate,
        DateTime endDate)
    {
        DateTime start = startDate.Date;
        DateTime end = endDate.Date.AddDays(1);

        var rows = await ValidTransactions(db)
            .Where(x => x.TransactionDate >= start && x.TransactionDate < end)
            .GroupBy(x => x.TransactionDate.Date)
            .Select(x => new
            {
                Date = x.Key,
                Revenue = x.Sum(t => t.TotalAmount),
                Cost = x.Sum(t => t.TotalCost),
                TransactionCount = x.Count(),
            })
            .ToListAsync();

        List<DailySalesModel> result = [];

        for (DateTime day = start; day < end; day = day.AddDays(1))
        {
            var row = rows.FirstOrDefault(x => x.Date == day);

            result.Add(new DailySalesModel
            {
                Date = day,
                Revenue = row?.Revenue ?? 0,
                GrossProfit = row == null ? 0 : row.Revenue - row.Cost,
                TransactionCount = row?.TransactionCount ?? 0,
            });
        }

        return result;
    }

    public static async Task<List<CategorySalesModel>> GetCategorySalesAsync(
        ApplicationDbContext db,
        DateTime startDate,
        DateTime endDate,
        int take = 8)
    {
        DateTime start = startDate.Date;
        DateTime end = endDate.Date.AddDays(1);

        return await (
            from detail in db.TransactionDetail
            join transaction in ValidTransactions(db) on detail.IdTransaction equals transaction.IdTransaction
            join product in db.Product on detail.IdProduct equals product.IdProduct
            join category in db.Category on product.IdCategory equals category.IdCategory
            where transaction.TransactionDate >= start && transaction.TransactionDate < end
            group detail by category.CategoryName into grouped
            orderby grouped.Sum(x => x.Subtotal) descending
            select new CategorySalesModel
            {
                CategoryName = grouped.Key,
                Revenue = grouped.Sum(x => x.Subtotal),
                ItemSold = grouped.Sum(x => x.Quantity),
            })
            .Take(take)
            .ToListAsync();
    }

    public static async Task<List<ProductSalesModel>> GetTopProductAsync(
        ApplicationDbContext db,
        DateTime startDate,
        DateTime endDate,
        int take = 10,
        bool isAscending = false)
    {
        DateTime start = startDate.Date;
        DateTime end = endDate.Date.AddDays(1);

        var query = from detail in db.TransactionDetail
                    join transaction in ValidTransactions(db) on detail.IdTransaction equals transaction.IdTransaction
                    where transaction.TransactionDate >= start && transaction.TransactionDate < end
                    group detail by new { detail.Sku, detail.ProductName } into grouped
                    select new ProductSalesModel
                    {
                        Sku = grouped.Key.Sku,
                        ProductName = grouped.Key.ProductName,
                        ItemSold = grouped.Sum(x => x.Quantity),
                        Revenue = grouped.Sum(x => x.Subtotal),
                        GrossProfit = grouped.Sum(x => x.Subtotal - x.CostPrice * x.Quantity),
                    };

        query = isAscending ? query.OrderBy(x => x.ItemSold) : query.OrderByDescending(x => x.ItemSold);

        return await query.Take(take).ToListAsync();
    }

    public static async Task<List<CashierSalesModel>> GetCashierSalesAsync(
        ApplicationDbContext db,
        DateTime startDate,
        DateTime endDate)
    {
        DateTime start = startDate.Date;
        DateTime end = endDate.Date.AddDays(1);

        return await (
            from transaction in ValidTransactions(db)
            join user in db.Users on transaction.CreatedById equals user.Id
            where transaction.TransactionDate >= start && transaction.TransactionDate < end
            group transaction by user.FullName into grouped
            orderby grouped.Sum(x => x.TotalAmount) descending
            select new CashierSalesModel
            {
                CashierName = grouped.Key,
                TransactionCount = grouped.Count(),
                Revenue = grouped.Sum(x => x.TotalAmount),
            })
            .ToListAsync();
    }

    /// <summary>
    /// Barang yang stoknya habis atau sudah menyentuh batas minimum.
    ///
    /// Stok dijumlahkan seluruh gudang, bukan dinilai per gudang. Barang yang memang
    /// tidak pernah disimpan di gudang cadangan bukan berarti habis, dan menampilkannya
    /// sebagai peringatan hanya membuat daftar ini berisik lalu diabaikan orang.
    /// </summary>
    public static async Task<List<LowStockModel>> GetLowStockAsync(ApplicationDbContext db, int take = 10)
    {
        return await (
            from product in db.Product
            where product.IsActive
            let totalStock = db.Inventory
                .Where(x => x.IdProduct == product.IdProduct)
                .Sum(x => (int?)x.Quantity) ?? 0
            where totalStock <= product.MinimumStock
            orderby totalStock, product.ProductName
            select new LowStockModel
            {
                Sku = product.Sku,
                ProductName = product.ProductName,
                WarehouseName = "Seluruh gudang",
                UnitName = product.Unit!.UnitName,
                Quantity = totalStock,
                MinimumStock = product.MinimumStock,
            })
            .Take(take)
            .ToListAsync();
    }

    public static async Task<InventorySummaryModel> GetInventorySummaryAsync(ApplicationDbContext db)
    {
        int totalProduct = await db.Product.CountAsync(x => x.IsActive);

        // Stok dijumlahkan per produk lintas gudang, memakai definisi yang sama dengan
        // daftar stok kritis, supaya ringkasan dan daftarnya tidak pernah bertentangan.
        var stock = await (
            from product in db.Product
            where product.IsActive
            select new
            {
                product.CostPrice,
                product.MinimumStock,
                Quantity = db.Inventory.Where(x => x.IdProduct == product.IdProduct).Sum(x => (int?)x.Quantity) ?? 0,
            })
            .ToListAsync();

        return new InventorySummaryModel
        {
            TotalProduct = totalProduct,
            TotalStockQuantity = stock.Sum(x => x.Quantity),
            TotalStockValue = stock.Sum(x => x.Quantity * x.CostPrice),
            OutOfStockCount = stock.Count(x => x.Quantity <= 0),
            LowStockCount = stock.Count(x => x.Quantity > 0 && x.Quantity <= x.MinimumStock),
        };
    }

    public static async Task<ApprovalSummaryModel> GetApprovalSummaryAsync(ApplicationDbContext db)
    {
        var pending = await db.ApprovalRequest
            .Where(x => x.Status == DataStatus.Pending)
            .GroupBy(x => x.ApprovalTypeCode)
            .Select(x => new { TypeCode = x.Key, Total = x.Count() })
            .ToListAsync();

        return new ApprovalSummaryModel
        {
            PendingTotal = pending.Sum(x => x.Total),
            PendingGoodsReceiving = pending.FirstOrDefault(x => x.TypeCode == AppData.ApprovalTypeGoodsReceiving)?.Total ?? 0,
            PendingStockAdjustment = pending.FirstOrDefault(x => x.TypeCode == AppData.ApprovalTypeStockAdjustment)?.Total ?? 0,
            PendingVoidTransaction = pending.FirstOrDefault(x => x.TypeCode == AppData.ApprovalTypeVoidTransaction)?.Total ?? 0,
        };
    }

    public static async Task<List<DashboardActivityModel>> GetRecentActivityAsync(ApplicationDbContext db, int take = 8)
    {
        List<DashboardActivityModel> listData = await (
            from log in db.AuditLog
            join user in db.Users on log.CreatedById equals user.Id into userGroup
            from user in userGroup.DefaultIfEmpty()
            orderby log.DateCreated descending
            select new DashboardActivityModel
            {
                ActionName = log.ActionName,
                ModuleName = log.ModuleName,
                Description = log.Description,
                CreatedBy = user != null ? user.FullName : "Sistem",
                DateCreated = log.DateCreated,
            })
            .Take(take)
            .ToListAsync();

        foreach (DashboardActivityModel activity in listData)
        {
            activity.StrDateCreated = ((DateTime?)activity.DateCreated).ToStrDateTime();
        }

        return listData;
    }
}
