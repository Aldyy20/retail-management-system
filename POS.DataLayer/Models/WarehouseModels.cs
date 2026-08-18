using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class WarehouseKeyModel
{
    public string IdWarehouse { get; set; } = string.Empty;
}

public class BaseWarehouseModel : WarehouseKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Kode Gudang")]
    [StringLength(16, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string WarehouseCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Gudang")]
    [StringLength(64, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string WarehouseName { get; set; } = string.Empty;

    [Display(Name = "Alamat")]
    [StringLength(256)]
    public string? Address { get; set; }

    [Display(Name = "Keterangan")]
    [StringLength(256)]
    public string? Description { get; set; }

    /// <summary>
    /// Gudang tujuan bawaan untuk barang masuk dan transaksi kasir.
    /// Hanya satu gudang yang boleh menyandang status ini pada satu waktu.
    /// </summary>
    [Display(Name = "Gudang Utama")]
    public bool IsDefault { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableWarehouseModel : BaseWarehouseModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryWarehouseModel : TableWarehouseModel, IQueryDataInfo
{
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrDefault => IsDefault ? "Gudang utama" : string.Empty;
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrDateModified => DateModified.ToStrDateTime();
}

public class CreateEditWarehouseModel : BaseWarehouseModel
{
}
