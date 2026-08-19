using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Catatan setiap perubahan stok. Baris di sini tidak pernah diubah atau dihapus,
/// sehingga stok akhir selalu dapat direkonstruksi dari riwayatnya (PRD bagian 13.1).
/// </summary>
public class StockMovementKeyModel
{
    public string IdStockMovement { get; set; } = string.Empty;
}

public class BaseStockMovementModel : StockMovementKeyModel, IBaseDataInfo
{
    [Required]
    [StringLength(36)]
    public string IdProduct { get; set; } = string.Empty;

    [Required]
    [StringLength(36)]
    public string IdWarehouse { get; set; } = string.Empty;

    [Display(Name = "Jenis Pergerakan")]
    public StockMovementType MovementType { get; set; }

    /// <summary>Selalu positif. Arah penambahan atau pengurangan ditentukan MovementType.</summary>
    [Display(Name = "Jumlah")]
    public int Quantity { get; set; }

    [Display(Name = "Stok Sebelum")]
    public int QuantityBefore { get; set; }

    [Display(Name = "Stok Sesudah")]
    public int QuantityAfter { get; set; }

    /// <summary>Modul asal pergerakan, contoh: Barang Masuk, Stock Opname, Penjualan.</summary>
    [StringLength(64)]
    public string ReferenceType { get; set; } = string.Empty;

    [StringLength(36)]
    public string? ReferenceId { get; set; }

    /// <summary>Nomor dokumen asal, contoh GR-00001, supaya mudah ditelusuri manusia.</summary>
    [StringLength(32)]
    public string? ReferenceNumber { get; set; }

    [Display(Name = "Catatan")]
    [StringLength(256)]
    public string? Note { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableStockMovementModel : BaseStockMovementModel
{
}

public class QueryStockMovementModel : TableStockMovementModel
{
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }

    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();

    public bool IsIncoming => MovementType is StockMovementType.In
        or StockMovementType.AdjustmentIn
        or StockMovementType.TransferIn
        or StockMovementType.ReturnIn;

    /// <summary>Jumlah bertanda, contoh +100 atau -5, supaya arah pergerakan langsung terbaca.</summary>
    public string StrQuantityChange => (IsIncoming ? "+" : "-") + Quantity;

    public string StrMovementType => MovementType switch
    {
        StockMovementType.In => "Barang masuk",
        StockMovementType.Out => "Barang keluar",
        StockMovementType.AdjustmentIn => "Penyesuaian tambah",
        StockMovementType.AdjustmentOut => "Penyesuaian kurang",
        StockMovementType.TransferIn => "Transfer masuk",
        StockMovementType.TransferOut => "Transfer keluar",
        StockMovementType.ReturnIn => "Retur masuk",
        StockMovementType.ReturnOut => "Retur keluar",
        _ => "Tidak dikenal",
    };
}
