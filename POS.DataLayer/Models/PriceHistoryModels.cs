using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Catatan harga produk pada satu titik waktu. Dicatat setiap kali harga berubah,
/// sehingga perubahan harga tidak menghapus jejak harga sebelumnya (PRD bagian 17).
/// </summary>
public class PriceHistoryKeyModel
{
    public string IdPriceHistory { get; set; } = string.Empty;
}

public class BasePriceHistoryModel : PriceHistoryKeyModel, IBaseDataInfo
{
    [Required]
    [StringLength(36)]
    public string IdProduct { get; set; } = string.Empty;

    [Display(Name = "Harga Modal")]
    public decimal CostPrice { get; set; }

    [Display(Name = "Harga Jual")]
    public decimal SellingPrice { get; set; }

    [Display(Name = "Harga Modal Sebelumnya")]
    public decimal PreviousCostPrice { get; set; }

    [Display(Name = "Harga Jual Sebelumnya")]
    public decimal PreviousSellingPrice { get; set; }

    [Display(Name = "Catatan")]
    [StringLength(256)]
    public string? Note { get; set; }

    /// <summary>
    /// Menandai baris harga pertama saat produk dibuat. Tanpa penanda ini, baris pertama
    /// terbaca seolah harga berubah dari Rp0, padahal sebelumnya memang belum ada harga.
    /// </summary>
    public bool IsInitialPrice { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TablePriceHistoryModel : BasePriceHistoryModel
{
}

public class QueryPriceHistoryModel : TablePriceHistoryModel
{
    public string? CreatedBy { get; set; }

    public string StrCostPrice => CostPrice.ToStrMoney();
    public string StrSellingPrice => SellingPrice.ToStrMoney();
    public string StrPreviousCostPrice => PreviousCostPrice.ToStrMoney();
    public string StrPreviousSellingPrice => PreviousSellingPrice.ToStrMoney();
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
}
