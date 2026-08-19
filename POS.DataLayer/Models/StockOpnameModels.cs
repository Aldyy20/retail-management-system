using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Audit fisik gudang: membandingkan stok menurut sistem dengan hasil hitung di rak.
/// Selisihnya baru mengubah stok setelah disetujui, bila aturan approval sedang aktif.
/// </summary>
public class StockOpnameKeyModel
{
    public string IdStockOpname { get; set; } = string.Empty;
}

public class BaseStockOpnameModel : StockOpnameKeyModel, IBaseDataInfo
{
    /// <summary>Nomor dokumen berpola SO-00001. Dibuat server.</summary>
    [StringLength(32)]
    public string OpnameNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib dipilih.")]
    [Display(Name = "Gudang")]
    [StringLength(36)]
    public string IdWarehouse { get; set; } = string.Empty;

    [Display(Name = "Tanggal Opname")]
    public DateTime OpnameDate { get; set; }

    [Display(Name = "Catatan")]
    [StringLength(512)]
    public string? Note { get; set; }

    public DataStatus Status { get; set; } = DataStatus.Draft;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableStockOpnameModel : BaseStockOpnameModel, ITableDataInfo
{
    public int TotalItem { get; set; }

    /// <summary>Jumlah baris yang stok fisiknya berbeda dari stok sistem.</summary>
    public int TotalDifference { get; set; }

    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryStockOpnameModel : TableStockOpnameModel
{
    public string WarehouseName { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }

    public string StrOpnameDate => ((DateTime?)OpnameDate).ToStrDate();
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();

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

    public string StrTotalDifference => TotalDifference == 0 ? "Tidak ada selisih" : TotalDifference + " barang";
}

public class DetailsStockOpnameModel : QueryStockOpnameModel
{
    public List<QueryStockOpnameDetailModel> ListDetail { get; set; } = [];
    public QueryApprovalRequestModel? ApprovalRequest { get; set; }
}

// --- Detail -----------------------------------------------------------------

public class QueryStockOpnameDetailModel
{
    public string IdStockOpnameDetail { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;

    /// <summary>Stok menurut sistem, dibekukan saat dokumen dibuat.</summary>
    public int SystemStock { get; set; }

    public int PhysicalStock { get; set; }

    public int Difference => PhysicalStock - SystemStock;

    public string StrDifference => Difference == 0 ? "0" : (Difference > 0 ? "+" : "") + Difference;
}

public class CreateEditStockOpnameDetailModel
{
    [Required(ErrorMessage = "Produk wajib dipilih.")]
    [StringLength(36)]
    public string IdProduct { get; set; } = string.Empty;

    [Range(0, 1000000, ErrorMessage = "Stok fisik tidak boleh negatif.")]
    public int PhysicalStock { get; set; }
}

public class CreateEditStockOpnameModel : BaseStockOpnameModel
{
    public List<CreateEditStockOpnameDetailModel> ListDetail { get; set; } = [];
    public bool IsSubmitted { get; set; }
}
