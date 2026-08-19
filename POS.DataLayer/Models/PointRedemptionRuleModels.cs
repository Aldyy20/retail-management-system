using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Aturan penukaran point menjadi potongan belanja.
///
/// Nilai tukarnya diatur admin sebagai data, bukan ditulis di kode, sehingga toko dapat
/// mengubah kebijakan loyalty tanpa deployment ulang (PRD bagian 21).
/// </summary>
public class PointRedemptionRuleKeyModel
{
    public string IdPointRedemptionRule { get; set; } = string.Empty;
}

public class BasePointRedemptionRuleModel : PointRedemptionRuleKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Aturan")]
    [StringLength(64, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string RuleName { get; set; } = string.Empty;

    [Display(Name = "Point Dibutuhkan")]
    [Range(1, 1000000, ErrorMessage = "{0} minimal 1.")]
    public int PointRequired { get; set; }

    [Display(Name = "Jenis Potongan")]
    public DiscountValueType DiscountValueType { get; set; } = DiscountValueType.Percentage;

    /// <summary>Persen bila jenisnya persentase, rupiah bila jenisnya nominal tetap.</summary>
    [Display(Name = "Nilai Potongan")]
    [Range(0.01, 999999999, ErrorMessage = "{0} harus lebih dari nol.")]
    public decimal DiscountValue { get; set; }

    /// <summary>Batas atas potongan untuk jenis persentase. Nol berarti tanpa batas.</summary>
    [Display(Name = "Maksimum Potongan")]
    [Range(0, 999999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public decimal MaximumDiscount { get; set; }

    [Display(Name = "Minimum Belanja")]
    [Range(0, 999999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public decimal MinimumPurchase { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TablePointRedemptionRuleModel : BasePointRedemptionRuleModel, ITableDataInfo
{
    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryPointRedemptionRuleModel : TablePointRedemptionRuleModel
{
    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrMinimumPurchase => MinimumPurchase.ToStrMoney();
    public string StrMaximumDiscount => MaximumDiscount <= 0 ? "Tanpa batas" : MaximumDiscount.ToStrMoney();

    public string StrDiscountValue => DiscountValueType == DiscountValueType.Percentage
        ? DiscountValue.ToStrPercentage()
        : DiscountValue.ToStrMoney();

    public string StrRuleSummary => $"{PointRequired} point menjadi potongan {StrDiscountValue}";
}

public class CreateEditPointRedemptionRuleModel : BasePointRedemptionRuleModel
{
}

/// <summary>
/// Pilihan penukaran yang ditawarkan kepada kasir untuk satu keranjang tertentu,
/// sudah memperhitungkan saldo point member dan nilai belanjanya.
/// </summary>
public class PointRedemptionOptionModel
{
    public string IdPointRedemptionRule { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public int PointRequired { get; set; }

    /// <summary>Potongan rupiah yang benar-benar didapat untuk keranjang ini.</summary>
    public decimal DiscountAmount { get; set; }

    public bool IsAvailable { get; set; }

    /// <summary>Alasan aturan tidak dapat dipakai, ditampilkan apa adanya kepada kasir.</summary>
    public string? UnavailableReason { get; set; }

    public string StrDiscountAmount => DiscountAmount.ToStrMoney();
}
