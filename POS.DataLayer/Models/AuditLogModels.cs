using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class AuditLogKeyModel
{
    public string IdAuditLog { get; set; } = string.Empty;
}

public class BaseAuditLogModel : AuditLogKeyModel, IBaseDataInfo
{
    /// <summary>Nama aksi domain, contoh: UPDATE_PRODUCT, APPROVE_GOODS_RECEIVING.</summary>
    [Required]
    [Display(Name = "Aksi")]
    [StringLength(64)]
    public string ActionName { get; set; } = string.Empty;

    [Required]
    [Display(Name = "Modul")]
    [StringLength(64)]
    public string ModuleName { get; set; } = string.Empty;

    /// <summary>Kunci data yang terpengaruh, agar riwayat satu data dapat ditelusuri.</summary>
    [Display(Name = "Referensi")]
    [StringLength(64)]
    public string? ReferenceId { get; set; }

    [Display(Name = "Keterangan")]
    [StringLength(512)]
    public string? Description { get; set; }

    [Display(Name = "Nilai Lama")]
    public string? OldValue { get; set; }

    [Display(Name = "Nilai Baru")]
    public string? NewValue { get; set; }

    [Display(Name = "Alamat IP")]
    [StringLength(64)]
    public string? IpAddress { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableAuditLogModel : BaseAuditLogModel
{
}

public class QueryAuditLogModel : TableAuditLogModel
{
    public string? CreatedBy { get; set; }
    public string? CreatedByRole { get; set; }

    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
}
