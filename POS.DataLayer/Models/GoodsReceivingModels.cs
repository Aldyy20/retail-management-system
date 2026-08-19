using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class GoodsReceivingKeyModel
{
    public string IdGoodsReceiving { get; set; } = string.Empty;
}

public class BaseGoodsReceivingModel : GoodsReceivingKeyModel, IBaseDataInfo
{
    /// <summary>Nomor dokumen berpola GR-00001. Dibuat server, tidak dikirim frontend.</summary>
    [StringLength(32)]
    public string ReceivingNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib dipilih.")]
    [Display(Name = "Gudang Tujuan")]
    [StringLength(36)]
    public string IdWarehouse { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib dipilih.")]
    [Display(Name = "Supplier")]
    [StringLength(36)]
    public string IdSupplier { get; set; } = string.Empty;

    [Display(Name = "Tanggal Terima")]
    public DateTime ReceivingDate { get; set; }

    [Display(Name = "Nomor Faktur Supplier")]
    [StringLength(64)]
    public string? InvoiceNumber { get; set; }

    [Display(Name = "Catatan")]
    [StringLength(512)]
    public string? Note { get; set; }

    public DataStatus Status { get; set; } = DataStatus.Draft;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableGoodsReceivingModel : BaseGoodsReceivingModel, ITableDataInfo
{
    /// <summary>Jumlah baris barang, disimpan agar daftar tidak perlu menghitung ulang.</summary>
    public int TotalItem { get; set; }

    /// <summary>Total nilai pembelian, dihitung server dari detailnya.</summary>
    public decimal TotalCost { get; set; }

    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryGoodsReceivingModel : TableGoodsReceivingModel
{
    public string WarehouseName { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }

    public string StrReceivingDate => ((DateTime?)ReceivingDate).ToStrDate();
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrTotalCost => TotalCost.ToStrMoney();

    public string StrStatus => Status switch
    {
        DataStatus.Draft => "Draft",
        DataStatus.Pending => "Menunggu persetujuan",
        DataStatus.Approved => "Disetujui",
        DataStatus.Rejected => "Ditolak",
        DataStatus.Completed => "Selesai",
        DataStatus.Cancelled => "Dibatalkan",
        _ => "Tidak dikenal",
    };
}

public class DetailsGoodsReceivingModel : QueryGoodsReceivingModel
{
    public List<QueryGoodsReceivingDetailModel> ListDetail { get; set; } = [];

    /// <summary>Keputusan persetujuan bila dokumen ini pernah diajukan.</summary>
    public QueryApprovalRequestModel? ApprovalRequest { get; set; }
}

// --- Detail -----------------------------------------------------------------

public class QueryGoodsReceivingDetailModel
{
    public string IdGoodsReceivingDetail { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }

    public decimal Subtotal => Quantity * CostPrice;
    public string StrCostPrice => CostPrice.ToStrMoney();
    public string StrSubtotal => Subtotal.ToStrMoney();
}

/// <summary>Satu baris barang yang dikirim frontend saat menyimpan dokumen.</summary>
public class CreateEditGoodsReceivingDetailModel
{
    [Required(ErrorMessage = "Produk wajib dipilih.")]
    [StringLength(36)]
    public string IdProduct { get; set; } = string.Empty;

    [Range(1, 1000000, ErrorMessage = "Jumlah barang minimal 1.")]
    public int Quantity { get; set; }

    [Range(0, 999999999, ErrorMessage = "Harga modal tidak boleh negatif.")]
    public decimal CostPrice { get; set; }
}

public class CreateEditGoodsReceivingModel : BaseGoodsReceivingModel
{
    public List<CreateEditGoodsReceivingDetailModel> ListDetail { get; set; } = [];

    /// <summary>
    /// Bila true, dokumen langsung diajukan setelah disimpan. Bila false, dokumen
    /// tersimpan sebagai draft dan dapat diperbaiki lebih dulu.
    /// </summary>
    public bool IsSubmitted { get; set; }
}
