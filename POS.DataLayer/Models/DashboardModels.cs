using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Ringkasan beranda. Seluruh nilainya dihitung dari database; tidak ada angka contoh.
/// Bagian yang tidak relevan bagi sebuah role dikirim kosong, bukan diisi nol palsu.
/// </summary>
public class DashboardModel
{
    public string StoreName { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;

    /// <summary>Ringkasan penjualan hari ini.</summary>
    public SalesSummaryModel Today { get; set; } = new();

    /// <summary>Ringkasan bulan berjalan, dipakai owner untuk melihat tren.</summary>
    public SalesSummaryModel ThisMonth { get; set; } = new();

    /// <summary>Penjualan harian untuk grafik tren. Kosong bila belum ada transaksi.</summary>
    public List<DailySalesModel> ListDailySales { get; set; } = [];

    public List<CategorySalesModel> ListCategorySales { get; set; } = [];
    public List<ProductSalesModel> ListTopProduct { get; set; } = [];
    public List<CashierSalesModel> ListCashierSales { get; set; } = [];
    public List<LowStockModel> ListLowStock { get; set; } = [];
    public List<DashboardActivityModel> ListActivity { get; set; } = [];

    public InventorySummaryModel Inventory { get; set; } = new();
    public ApprovalSummaryModel Approval { get; set; } = new();
}

public class SalesSummaryModel
{
    public decimal Revenue { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal TotalDiscount { get; set; }
    public int TransactionCount { get; set; }
    public int ItemSold { get; set; }
    public int MemberTransactionCount { get; set; }
    public int VoucherUsedCount { get; set; }

    public decimal AverageTransactionValue => TransactionCount == 0 ? 0 : Revenue / TransactionCount;

    public string StrRevenue => Revenue.ToStrMoney();
    public string StrGrossProfit => GrossProfit.ToStrMoney();
    public string StrTotalDiscount => TotalDiscount.ToStrMoney();
    public string StrAverageTransactionValue => AverageTransactionValue.ToStrMoney();

    /// <summary>Margin kotor terhadap pendapatan. Nol bila belum ada penjualan.</summary>
    public decimal MarginPercentage => Revenue <= 0 ? 0 : Math.Round(GrossProfit / Revenue * 100, 2);

    public string StrMargin => Revenue <= 0 ? "-" : MarginPercentage.ToStrPercentage();
}

public class DailySalesModel
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public decimal GrossProfit { get; set; }
    public int TransactionCount { get; set; }

    public string StrDate => ((DateTime?)Date).ToStrDate();
    public string StrShortDate => Date.ToString("dd/MM");
    public string StrRevenue => Revenue.ToStrMoney();
    public string StrGrossProfit => GrossProfit.ToStrMoney();
}

public class CategorySalesModel
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int ItemSold { get; set; }

    public string StrRevenue => Revenue.ToStrMoney();
}

public class ProductSalesModel
{
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int ItemSold { get; set; }
    public decimal Revenue { get; set; }
    public decimal GrossProfit { get; set; }

    public string StrRevenue => Revenue.ToStrMoney();
    public string StrGrossProfit => GrossProfit.ToStrMoney();
}

public class CashierSalesModel
{
    public string CashierName { get; set; } = string.Empty;
    public int TransactionCount { get; set; }
    public decimal Revenue { get; set; }

    public string StrRevenue => Revenue.ToStrMoney();
}

public class LowStockModel
{
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int MinimumStock { get; set; }

    public string StockStatus => Quantity <= 0 ? "habis" : "menipis";
    public string StrStockStatus => Quantity <= 0 ? "Habis" : "Menipis";
}

public class InventorySummaryModel
{
    public int TotalProduct { get; set; }
    public int TotalStockQuantity { get; set; }
    public decimal TotalStockValue { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }

    public string StrTotalStockValue => TotalStockValue.ToStrMoney();
}

public class ApprovalSummaryModel
{
    public int PendingTotal { get; set; }
    public int PendingGoodsReceiving { get; set; }
    public int PendingStockAdjustment { get; set; }
    public int PendingVoidTransaction { get; set; }
}

public class DashboardActivityModel
{
    public string ActionName { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string StrDateCreated { get; set; } = string.Empty;
    public DateTime DateCreated { get; set; }
}
