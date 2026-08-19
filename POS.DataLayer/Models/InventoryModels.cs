using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Stok satu produk pada satu gudang.
///
/// Nilai di sini tidak pernah diubah langsung dari frontend. Perubahannya hanya berasal
/// dari barang masuk, penjualan, retur, transfer, dan penyesuaian stok (PRD BR-002),
/// dan setiap perubahan meninggalkan catatan pada stock_movements.
/// </summary>
public class InventoryKeyModel
{
    public string IdInventory { get; set; } = string.Empty;
}

public class BaseInventoryModel : InventoryKeyModel, IBaseDataInfo
{
    [Required]
    [StringLength(36)]
    public string IdProduct { get; set; } = string.Empty;

    [Required]
    [StringLength(36)]
    public string IdWarehouse { get; set; } = string.Empty;

    [Display(Name = "Jumlah Stok")]
    public int Quantity { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableInventoryModel : BaseInventoryModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryInventoryModel : TableInventoryModel
{
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int MinimumStock { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }

    /// <summary>Nilai persediaan berdasarkan harga modal saat ini.</summary>
    public decimal StockValue => Quantity * CostPrice;

    public string StrStockValue => StockValue.ToStrMoney();
    public string StrSellingPrice => SellingPrice.ToStrMoney();
    public string StrDateModified => DateModified.ToStrDateTime();

    /// <summary>habis, menipis, atau aman. Dipakai frontend untuk memilih penanda status.</summary>
    public string StockStatus => Quantity <= 0 ? "habis" : Quantity <= MinimumStock ? "menipis" : "aman";

    public string StrStockStatus => Quantity <= 0
        ? "Habis"
        : Quantity <= MinimumStock ? "Menipis" : "Aman";
}
