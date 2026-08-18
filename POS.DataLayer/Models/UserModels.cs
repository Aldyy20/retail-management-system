using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class UserKeyModel
{
    public string Id { get; set; } = string.Empty;
}

public class BaseUserModel : UserKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Pengguna")]
    [StringLength(64, MinimumLength = 3, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string UserName { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Lengkap")]
    [StringLength(128)]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Format {0} tidak valid.")]
    [Display(Name = "Email")]
    [StringLength(128)]
    public string? Email { get; set; }

    [Display(Name = "Nomor HP")]
    [StringLength(20)]
    public string? PhoneNumber { get; set; }

    [Required(ErrorMessage = "{0} wajib dipilih.")]
    [Display(Name = "Role")]
    [StringLength(32)]
    public string RoleName { get; set; } = string.Empty;

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableUserModel : BaseUserModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryUserModel : TableUserModel, IQueryDataInfo
{
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrDateModified => DateModified.ToStrDateTime();
    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
}

public class CreateEditUserModel : BaseUserModel
{
    [Display(Name = "Kata Sandi")]
    [StringLength(64, MinimumLength = 8, ErrorMessage = "{0} minimal {2} karakter.")]
    public string? Password { get; set; }

    [Display(Name = "Konfirmasi Kata Sandi")]
    [Compare(nameof(Password), ErrorMessage = "{0} tidak sama dengan Kata Sandi.")]
    public string? ConfirmPassword { get; set; }
}
