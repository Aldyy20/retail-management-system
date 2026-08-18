using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Satuan barang. Tidak boleh hardcode: admin menambah dan menonaktifkannya sendiri.
/// Satuan yang sudah dipakai transaksi dinonaktifkan, bukan dihapus (PRD bagian 10).
/// </summary>
public class UnitKeyModel
{
    public string IdUnit { get; set; } = string.Empty;
}

public class BaseUnitModel : UnitKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Satuan")]
    [StringLength(32, MinimumLength = 1, ErrorMessage = "{0} maksimal {1} karakter.")]
    public string UnitName { get; set; } = string.Empty;

    [Display(Name = "Keterangan")]
    [StringLength(256)]
    public string? Description { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableUnitModel : BaseUnitModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryUnitModel : TableUnitModel, IQueryDataInfo
{
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    public int TotalProduct { get; set; }

    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrDateModified => DateModified.ToStrDateTime();
}

public class CreateEditUnitModel : BaseUnitModel
{
}
