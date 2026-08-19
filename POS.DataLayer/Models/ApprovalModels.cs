using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Permintaan persetujuan yang berlaku untuk seluruh modul.
///
/// Jenis tindakan disimpan sebagai kode, bukan enum tertutup, sehingga jenis baru dapat
/// ditambahkan tanpa mengubah struktur tabel (PRD bagian 6.2). Efek dari persetujuan
/// tetap ditulis eksplisit per jenis di server, karena setiap modul punya aturannya sendiri.
/// </summary>
public class ApprovalRequestKeyModel
{
    public string IdApprovalRequest { get; set; } = string.Empty;
}

public class BaseApprovalRequestModel : ApprovalRequestKeyModel, IBaseDataInfo
{
    /// <summary>Kode jenis tindakan, contoh GOODS_RECEIVING atau STOCK_ADJUSTMENT.</summary>
    [Required]
    [StringLength(32)]
    public string ApprovalTypeCode { get; set; } = string.Empty;

    [Required]
    [StringLength(64)]
    public string ModuleName { get; set; } = string.Empty;

    [Required]
    [StringLength(36)]
    public string ReferenceId { get; set; } = string.Empty;

    [StringLength(32)]
    public string? ReferenceNumber { get; set; }

    [Required]
    [StringLength(128)]
    public string Title { get; set; } = string.Empty;

    [StringLength(512)]
    public string? Description { get; set; }

    public DataStatus Status { get; set; } = DataStatus.Pending;

    [StringLength(36)]
    public string? DecidedById { get; set; }

    public DateTime? DecidedDate { get; set; }

    /// <summary>Wajib diisi supervisor saat menolak, agar pengaju tahu apa yang harus diperbaiki.</summary>
    [StringLength(512)]
    public string? DecisionNote { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableApprovalRequestModel : BaseApprovalRequestModel
{
}

public class QueryApprovalRequestModel : TableApprovalRequestModel
{
    public string? RequestedBy { get; set; }
    public string? DecidedBy { get; set; }

    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrDecidedDate => DecidedDate.ToStrDateTime();

    public string StrStatus => Status switch
    {
        DataStatus.Pending => "Menunggu persetujuan",
        DataStatus.Approved => "Disetujui",
        DataStatus.Rejected => "Ditolak",
        DataStatus.Cancelled => "Dibatalkan",
        _ => "Draft",
    };

    public string StrApprovalType => ApprovalTypeCode switch
    {
        "GOODS_RECEIVING" => "Barang masuk",
        "STOCK_ADJUSTMENT" => "Penyesuaian stok",
        "VOID_TRANSACTION" => "Pembatalan transaksi",
        _ => ApprovalTypeCode,
    };
}

/// <summary>Keputusan supervisor terhadap satu permintaan.</summary>
public class ApprovalDecisionModel
{
    [Required(ErrorMessage = "Permintaan yang diputuskan tidak dikenali.")]
    [StringLength(36)]
    public string IdApprovalRequest { get; set; } = string.Empty;

    [Display(Name = "Catatan Keputusan")]
    [StringLength(512)]
    public string? DecisionNote { get; set; }
}
