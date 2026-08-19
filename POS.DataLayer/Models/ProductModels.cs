using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class ProductKeyModel
{
    public string IdProduct { get; set; } = string.Empty;
}

public class BaseProductModel : ProductKeyModel, IBaseDataInfo, IActivatable
{
    /// <summary>Kode barang internal. Dibuat otomatis oleh server bila dikosongkan.</summary>
    [Display(Name = "SKU")]
    [StringLength(32)]
    public string Sku { get; set; } = string.Empty;

    [Display(Name = "Barcode")]
    [StringLength(64)]
    public string? Barcode { get; set; }

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Barang")]
    [StringLength(128, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string ProductName { get; set; } = string.Empty;

    [Display(Name = "Deskripsi")]
    [StringLength(512)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "{0} wajib dipilih.")]
    [Display(Name = "Kategori")]
    [StringLength(36)]
    public string IdCategory { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib dipilih.")]
    [Display(Name = "Satuan")]
    [StringLength(36)]
    public string IdUnit { get; set; } = string.Empty;

    [Display(Name = "Harga Modal")]
    [Range(0, 999999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public decimal CostPrice { get; set; }

    [Display(Name = "Harga Jual")]
    [Range(0, 999999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public decimal SellingPrice { get; set; }

    [Display(Name = "Minimum Stok")]
    [Range(0, 999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public int MinimumStock { get; set; }

    /// <summary>
    /// Nama berkas foto di dalam wwwroot/uploads/product. Hanya namanya yang disimpan,
    /// bukan alamat lengkap, supaya folder unggahan dapat dipindah tanpa menyentuh data.
    /// </summary>
    [Display(Name = "Foto Barang")]
    [StringLength(128)]
    public string? PhotoFileName { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableProductModel : BaseProductModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryProductModel : TableProductModel, IQueryDataInfo
{
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    public string CategoryName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;

    public string StrCostPrice => CostPrice.ToStrMoney();
    public string StrSellingPrice => SellingPrice.ToStrMoney();
    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrDateModified => DateModified.ToStrDateTime();

    /// <summary>Keuntungan per satuan dalam rupiah.</summary>
    public decimal ProfitPerUnit => SellingPrice - CostPrice;

    /// <summary>
    /// Margin terhadap harga jual. Dihitung dari harga yang tersimpan saat ini,
    /// bukan dari transaksi, sehingga hanya menggambarkan potensi keuntungan.
    /// </summary>
    public decimal MarginPercentage => SellingPrice <= 0 ? 0 : Math.Round(ProfitPerUnit / SellingPrice * 100, 2);

    public string StrProfitPerUnit => ProfitPerUnit.ToStrMoney();
    public string StrMargin => SellingPrice <= 0 ? "-" : MarginPercentage.ToStrPercentage();
}

public class DetailsProductModel : QueryProductModel
{
    public List<QueryPriceHistoryModel> ListPriceHistory { get; set; } = [];
}

public class CreateEditProductModel : BaseProductModel
{
    /// <summary>Alasan perubahan harga, tersimpan pada histori harga bila harga berubah.</summary>
    [Display(Name = "Catatan Perubahan Harga")]
    [StringLength(256)]
    public string? PriceChangeNote { get; set; }
}

/// <summary>
/// Produk dalam bentuk ringkas untuk pencarian cepat pada form barang masuk,
/// stock opname, dan layar kasir.
/// </summary>
public class ProductLookupModel
{
    public string IdProduct { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public string? PhotoFileName { get; set; }

    /// <summary>Stok pada gudang yang sedang dipilih. Nol bila produk belum pernah masuk.</summary>
    public int Stock { get; set; }

    public string StrCostPrice => CostPrice.ToStrMoney();
    public string StrSellingPrice => SellingPrice.ToStrMoney();
}
