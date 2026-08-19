using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

public class TransactionKeyModel
{
    public string IdTransaction { get; set; } = string.Empty;
}

public class BaseTransactionModel : TransactionKeyModel, IBaseDataInfo
{
    /// <summary>Nomor nota berpola INV-20260819-00001. Dibuat server.</summary>
    [StringLength(32)]
    public string InvoiceNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(36)]
    public string IdWarehouse { get; set; } = string.Empty;

    public DateTime TransactionDate { get; set; }

    /// <summary>Jumlah seluruh baris sebelum potongan apa pun.</summary>
    public decimal SubtotalAmount { get; set; }

    /// <summary>Potongan dari diskon produk.</summary>
    public decimal DiscountAmount { get; set; }

    /// <summary>
    /// Potongan voucher dan penukaran point dipisah sejak awal karena laporan keuntungan
    /// dan nota memecahnya, dan menambahkannya kemudian berarti menghitung ulang
    /// transaksi lama yang sudah tersimpan.
    /// </summary>
    public decimal VoucherDiscountAmount { get; set; }

    public decimal PointDiscountAmount { get; set; }

    /// <summary>Member yang berbelanja. Kosong berarti pembeli umum.</summary>
    [StringLength(36)]
    public string? IdMember { get; set; }

    /// <summary>Point yang diperoleh dari transaksi ini menurut aturan yang berlaku saat itu.</summary>
    public int PointEarned { get; set; }

    /// <summary>Point yang ditukarkan menjadi potongan pada transaksi ini.</summary>
    public int PointRedeemed { get; set; }

    /// <summary>Voucher yang dipakai, bila ada.</summary>
    [StringLength(36)]
    public string? IdVoucher { get; set; }

    /// <summary>Kode voucher dibekukan, supaya nota lama tetap terbaca meski kodenya diubah.</summary>
    [StringLength(32)]
    public string? VoucherCode { get; set; }

    public decimal TotalAmount { get; set; }

    [Required]
    [StringLength(24)]
    public string PaymentMethodCode { get; set; } = string.Empty;

    public decimal PaidAmount { get; set; }

    public decimal ChangeAmount { get; set; }

    public DataStatus Status { get; set; } = DataStatus.Completed;

    [Display(Name = "Catatan")]
    [StringLength(512)]
    public string? Note { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableTransactionModel : BaseTransactionModel, ITableDataInfo
{
    public int TotalItem { get; set; }

    /// <summary>Total modal barang terjual, dibekukan agar laporan keuntungan tetap benar.</summary>
    public decimal TotalCost { get; set; }

    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryTransactionModel : TableTransactionModel
{
    public string WarehouseName { get; set; } = string.Empty;
    public string PaymentMethodName { get; set; } = string.Empty;
    public string? CashierName { get; set; }
    public string? MemberName { get; set; }
    public string? MemberPhoneNumber { get; set; }

    public decimal GrossProfit => TotalAmount - TotalCost;

    public string StrTransactionDate => ((DateTime?)TransactionDate).ToStrDateTime();
    public string StrSubtotalAmount => SubtotalAmount.ToStrMoney();
    public string StrTotalAmount => TotalAmount.ToStrMoney();
    public string StrPaidAmount => PaidAmount.ToStrMoney();
    public string StrChangeAmount => ChangeAmount.ToStrMoney();
    public string StrGrossProfit => GrossProfit.ToStrMoney();

    public decimal TotalDiscountAmount => DiscountAmount + VoucherDiscountAmount + PointDiscountAmount;
    public string StrTotalDiscountAmount => TotalDiscountAmount.ToStrMoney();

    public string StrStatus => Status switch
    {
        DataStatus.Completed => "Selesai",
        DataStatus.Pending => "Menunggu pembatalan",
        DataStatus.Void => "Dibatalkan",
        _ => "Tidak dikenal",
    };
}

public class QueryTransactionDetailModel
{
    public string IdTransactionDetail { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;

    /// <summary>Nama, SKU, satuan, dan harga dibekukan saat transaksi (PRD BR-001).</summary>
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Subtotal { get; set; }

    public string StrUnitPrice => UnitPrice.ToStrMoney();
    public string StrSubtotal => Subtotal.ToStrMoney();
}

public class DetailsTransactionModel : QueryTransactionModel
{
    public List<QueryTransactionDetailModel> ListDetail { get; set; } = [];
    public QueryApprovalRequestModel? VoidRequest { get; set; }

    /// <summary>Isi nota yang dapat diubah admin lewat pengaturan toko.</summary>
    public ReceiptSettingModel Receipt { get; set; } = new();
}

/// <summary>
/// Teks nota berasal dari pengaturan, tidak pernah ditulis tetap di kode,
/// sehingga toko dapat mengubahnya sendiri (PRD bagian 30).
/// </summary>
public class ReceiptSettingModel
{
    public string StoreName { get; set; } = string.Empty;
    public string StoreAddress { get; set; } = string.Empty;
    public string StorePhone { get; set; } = string.Empty;

    /// <summary>Alamat logo toko, kosong bila belum diunggah.</summary>
    public string StoreLogoUrl { get; set; } = string.Empty;

    public string Header { get; set; } = string.Empty;
    public string Footer { get; set; } = string.Empty;
    public string ThankYouMessage { get; set; } = string.Empty;
    public string ReturnPolicy { get; set; } = string.Empty;
}
