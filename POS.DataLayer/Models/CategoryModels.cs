using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class CategoryKeyModel
{
    public string IdCategory { get; set; } = string.Empty;
}

public class BaseCategoryModel : CategoryKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Kategori")]
    [StringLength(64, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string CategoryName { get; set; } = string.Empty;

    [Display(Name = "Keterangan")]
    [StringLength(256)]
    public string? Description { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableCategoryModel : BaseCategoryModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryCategoryModel : TableCategoryModel, IQueryDataInfo
{
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    /// <summary>Jumlah produk yang memakai kategori ini, dipakai untuk memutuskan boleh dihapus atau tidak.</summary>
    public int TotalProduct { get; set; }

    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrDateModified => DateModified.ToStrDateTime();
}

public class CreateEditCategoryModel : BaseCategoryModel
{
}
