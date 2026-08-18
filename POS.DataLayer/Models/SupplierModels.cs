using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class SupplierKeyModel
{
    public string IdSupplier { get; set; } = string.Empty;
}

public class BaseSupplierModel : SupplierKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Supplier")]
    [StringLength(96, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string SupplierName { get; set; } = string.Empty;

    [Display(Name = "Nama Kontak")]
    [StringLength(96)]
    public string? ContactName { get; set; }

    [Display(Name = "Nomor Telepon")]
    [StringLength(20)]
    public string? PhoneNumber { get; set; }

    [EmailAddress(ErrorMessage = "Format {0} tidak valid.")]
    [Display(Name = "Email")]
    [StringLength(128)]
    public string? Email { get; set; }

    [Display(Name = "Alamat")]
    [StringLength(256)]
    public string? Address { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableSupplierModel : BaseSupplierModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QuerySupplierModel : TableSupplierModel, IQueryDataInfo
{
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrContact => string.IsNullOrWhiteSpace(PhoneNumber) ? (Email ?? string.Empty) : PhoneNumber;
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrDateModified => DateModified.ToStrDateTime();
}

public class CreateEditSupplierModel : BaseSupplierModel
{
}
