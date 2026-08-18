using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Kunci pengaturan memakai notasi titik, contoh: member.enabled, receipt.footer.
/// Kunci itu sendiri menjadi primary key sehingga tidak perlu id tambahan.
/// </summary>
public class SystemSettingKeyModel
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Kunci Pengaturan")]
    [StringLength(96)]
    public string SettingKey { get; set; } = string.Empty;
}

public class BaseSystemSettingModel : SystemSettingKeyModel, IBaseDataInfo
{
    [Display(Name = "Nilai")]
    [StringLength(2048)]
    public string? SettingValue { get; set; }

    /// <summary>Tipe nilai: text, boolean, integer, decimal, atau json. Menentukan kontrol input di frontend.</summary>
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Tipe Nilai")]
    [StringLength(16)]
    public string ValueType { get; set; } = "text";

    /// <summary>Kelompok tampilan: store, receipt, member, voucher, inventory, transaction.</summary>
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Kelompok")]
    [StringLength(32)]
    public string GroupName { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Tampilan")]
    [StringLength(128)]
    public string DisplayName { get; set; } = string.Empty;

    [Display(Name = "Keterangan")]
    [StringLength(512)]
    public string? Description { get; set; }

    [Display(Name = "Urutan")]
    public int SortOrder { get; set; }

    /// <summary>Pengaturan internal sistem tidak ditampilkan pada halaman pengaturan admin.</summary>
    [Display(Name = "Dapat Diubah Admin")]
    public bool IsEditable { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableSystemSettingModel : BaseSystemSettingModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QuerySystemSettingModel : TableSystemSettingModel, IQueryDataInfo
{
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    public string StrDateModified => DateModified.ToStrDateTime();
}

/// <summary>Satu baris perubahan pengaturan yang dikirim frontend saat menyimpan satu kelompok.</summary>
public class CreateEditSystemSettingModel : SystemSettingKeyModel
{
    [StringLength(2048)]
    public string? SettingValue { get; set; }
}
