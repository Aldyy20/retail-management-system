using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Diskon yang melekat pada produk tertentu dan berlaku pada periode tertentu.
/// Potongan ini dihitung per baris keranjang, sebelum voucher dan penukaran point
/// (PRD bagian 24 dan 25).
/// </summary>
public class DiscountKeyModel
{
    public string IdDiscount { get; set; } = string.Empty;
}

public class BaseDiscountModel : DiscountKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Diskon")]
    [StringLength(96, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string DiscountName { get; set; } = string.Empty;

    [Display(Name = "Jenis Potongan")]
    public DiscountValueType DiscountValueType { get; set; } = DiscountValueType.Percentage;

    [Display(Name = "Nilai Potongan")]
    [Range(0.01, 999999999, ErrorMessage = "{0} harus lebih dari nol.")]
    public decimal DiscountValue { get; set; }

    /// <summary>Batas potongan per satuan barang untuk jenis persentase. Nol berarti tanpa batas.</summary>
    [Display(Name = "Maksimum Potongan per Satuan")]
    [Range(0, 999999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public decimal MaximumDiscount { get; set; }

    [Display(Name = "Mulai Berlaku")]
    public DateTime StartDate { get; set; }

    [Display(Name = "Berakhir")]
    public DateTime EndDate { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableDiscountModel : BaseDiscountModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryDiscountModel : TableDiscountModel
{
    public int TotalProduct { get; set; }

    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrStartDate => ((DateTime?)StartDate).ToStrDate();
    public string StrEndDate => ((DateTime?)EndDate).ToStrDate();
    public string StrPeriod => $"{StrStartDate} sampai {StrEndDate}";

    public string StrDiscountValue => DiscountValueType == DiscountValueType.Percentage
        ? DiscountValue.ToStrPercentage()
        : DiscountValue.ToStrMoney();

    /// <summary>
    /// Keterangan masa berlaku yang dibaca manusia. Diskon aktif tetapi sudah lewat
    /// periodenya tidak dipakai kasir, dan perbedaan itu harus terlihat di daftar.
    /// </summary>
    public string StrPeriodStatus
    {
        get
        {
            DateTime today = DateTime.Now.Date;

            if (!IsActive)
            {
                return "Nonaktif";
            }

            if (today < StartDate.Date)
            {
                return "Belum mulai";
            }

            return today > EndDate.Date ? "Sudah berakhir" : "Sedang berlaku";
        }
    }
}

public class DetailsDiscountModel : QueryDiscountModel
{
    public List<DiscountProductModel> ListProduct { get; set; } = [];
}

public class DiscountProductModel
{
    public string IdProduct { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal SellingPrice { get; set; }

    public string StrSellingPrice => SellingPrice.ToStrMoney();
}

public class CreateEditDiscountModel : BaseDiscountModel
{
    /// <summary>Produk yang terkena diskon ini. Minimal satu.</summary>
    public List<string> ListIdProduct { get; set; } = [];
}
