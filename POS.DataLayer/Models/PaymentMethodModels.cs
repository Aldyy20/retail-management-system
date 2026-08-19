using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Interfaces;

namespace POS.DataLayer.Models;

/// <summary>
/// Metode pembayaran disimpan sebagai data, bukan percabangan di kode, sehingga metode
/// baru seperti QRIS atau kartu debit dapat ditambahkan tanpa mengubah struktur sistem
/// (PRD bagian 26). Kodenya menjadi primary key dan ikut tersimpan pada transaksi.
/// </summary>
public class PaymentMethodKeyModel
{
    [Required]
    [StringLength(24)]
    public string PaymentMethodCode { get; set; } = string.Empty;
}

public class BasePaymentMethodModel : PaymentMethodKeyModel, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Metode")]
    [StringLength(64)]
    public string PaymentMethodName { get; set; } = string.Empty;

    [Display(Name = "Keterangan")]
    [StringLength(256)]
    public string? Description { get; set; }

    /// <summary>
    /// Metode tunai menerima uang lebih dan mengembalikan kembalian. Metode non-tunai
    /// selalu dibayar pas, sehingga kasir tidak perlu memasukkan jumlah uang diterima.
    /// </summary>
    [Display(Name = "Menghitung Kembalian")]
    public bool RequiresChange { get; set; }

    [Display(Name = "Urutan")]
    public int SortOrder { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;
}

public class TablePaymentMethodModel : BasePaymentMethodModel
{
}

public class QueryPaymentMethodModel : TablePaymentMethodModel
{
    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
}
