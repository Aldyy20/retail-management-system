using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Voucher potongan belanja yang ditebus lewat kodenya. Seluruh syaratnya diperiksa
/// server saat dipakai, tidak pernah dipercaya dari layar kasir (PRD BR-006).
/// </summary>
public class VoucherKeyModel
{
    public string IdVoucher { get; set; } = string.Empty;
}

public class BaseVoucherModel : VoucherKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Kode Voucher")]
    [StringLength(32, MinimumLength = 3, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string VoucherCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Voucher")]
    [StringLength(96, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string VoucherName { get; set; } = string.Empty;

    [Display(Name = "Jenis Potongan")]
    public DiscountValueType DiscountValueType { get; set; } = DiscountValueType.Percentage;

    [Display(Name = "Nilai Potongan")]
    [Range(0.01, 999999999, ErrorMessage = "{0} harus lebih dari nol.")]
    public decimal DiscountValue { get; set; }

    [Display(Name = "Minimum Belanja")]
    [Range(0, 999999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public decimal MinimumPurchase { get; set; }

    /// <summary>Batas atas potongan untuk jenis persentase. Nol berarti tanpa batas.</summary>
    [Display(Name = "Maksimum Potongan")]
    [Range(0, 999999999, ErrorMessage = "{0} tidak boleh negatif.")]
    public decimal MaximumDiscount { get; set; }

    [Display(Name = "Mulai Berlaku")]
    public DateTime StartDate { get; set; }

    [Display(Name = "Berakhir")]
    public DateTime EndDate { get; set; }

    /// <summary>Kuota pemakaian. Nol berarti tanpa batas.</summary>
    [Display(Name = "Kuota Pemakaian")]
    [Range(0, 1000000, ErrorMessage = "{0} tidak boleh negatif.")]
    public int UsageLimit { get; set; }

    /// <summary>Bila true, voucher hanya dapat dipakai transaksi yang memilih member.</summary>
    [Display(Name = "Khusus Member")]
    public bool IsMemberOnly { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableVoucherModel : BaseVoucherModel, ITableDataInfo
{
    /// <summary>Jumlah pemakaian yang sudah tercatat. Bertambah bersama transaksinya.</summary>
    public int UsageCount { get; set; }

    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryVoucherModel : TableVoucherModel
{
    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrStartDate => ((DateTime?)StartDate).ToStrDate();
    public string StrEndDate => ((DateTime?)EndDate).ToStrDate();
    public string StrPeriod => $"{StrStartDate} sampai {StrEndDate}";
    public string StrMinimumPurchase => MinimumPurchase.ToStrMoney();
    public string StrMaximumDiscount => MaximumDiscount <= 0 ? "Tanpa batas" : MaximumDiscount.ToStrMoney();
    public string StrUsage => UsageLimit <= 0 ? $"{UsageCount} kali, tanpa batas" : $"{UsageCount} dari {UsageLimit}";
    public string StrTarget => IsMemberOnly ? "Khusus member" : "Semua pembeli";

    public string StrDiscountValue => DiscountValueType == DiscountValueType.Percentage
        ? DiscountValue.ToStrPercentage()
        : DiscountValue.ToStrMoney();

    public string StrPeriodStatus
    {
        get
        {
            DateTime today = DateTime.Now.Date;

            if (!IsActive)
            {
                return "Nonaktif";
            }

            if (UsageLimit > 0 && UsageCount >= UsageLimit)
            {
                return "Kuota habis";
            }

            if (today < StartDate.Date)
            {
                return "Belum mulai";
            }

            return today > EndDate.Date ? "Sudah berakhir" : "Sedang berlaku";
        }
    }
}

public class CreateEditVoucherModel : BaseVoucherModel
{
}

/// <summary>Hasil pemeriksaan voucher terhadap satu keranjang tertentu.</summary>
public class VoucherValidationModel
{
    public bool IsValid { get; set; }

    /// <summary>Alasan penolakan yang siap ditampilkan kepada kasir.</summary>
    public string? ErrorMessage { get; set; }

    public string? IdVoucher { get; set; }
    public string? VoucherCode { get; set; }
    public string? VoucherName { get; set; }
    public decimal DiscountAmount { get; set; }

    public string StrDiscountAmount => DiscountAmount.ToStrMoney();
}
