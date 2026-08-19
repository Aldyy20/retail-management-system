using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Models.Base;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Satu baris keranjang yang dikirim kasir. Hanya berisi produk dan jumlah;
/// harga tidak pernah dikirim frontend karena server yang menentukannya (PRD bagian 52).
/// </summary>
public class CartItemModel
{
    [Required(ErrorMessage = "Produk wajib dipilih.")]
    [StringLength(36)]
    public string IdProduct { get; set; } = string.Empty;

    [Range(1, 100000, ErrorMessage = "Jumlah barang minimal 1.")]
    public int Quantity { get; set; }
}

public class CalculateCartRequestModel
{
    [Required(ErrorMessage = "Gudang wajib dipilih.")]
    [StringLength(36)]
    public string IdWarehouse { get; set; } = string.Empty;

    public List<CartItemModel> ListItem { get; set; } = [];
}

/// <summary>Satu baris keranjang setelah dihitung server, siap ditampilkan kasir.</summary>
public class CalculatedCartItemModel
{
    public string IdProduct { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Subtotal { get; set; }

    /// <summary>Stok tersedia di gudang terpilih, dipakai memperingatkan kasir lebih awal.</summary>
    public int AvailableStock { get; set; }

    public bool IsStockSufficient => AvailableStock >= Quantity;

    public string StrUnitPrice => UnitPrice.ToStrMoney();
    public string StrSubtotal => Subtotal.ToStrMoney();
}

/// <summary>
/// Hasil perhitungan server. Frontend hanya menampilkannya dan tidak pernah
/// menghitung sendiri, supaya total di layar selalu sama dengan total yang tersimpan.
/// </summary>
public class CalculatedCartModel
{
    public List<CalculatedCartItemModel> ListItem { get; set; } = [];
    public decimal SubtotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal VoucherDiscountAmount { get; set; }
    public decimal PointDiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalQuantity { get; set; }

    /// <summary>Peringatan yang tidak menghalangi, misalnya stok kurang untuk satu baris.</summary>
    public List<string> ListWarning { get; set; } = [];

    public string StrSubtotalAmount => SubtotalAmount.ToStrMoney();
    public string StrDiscountAmount => DiscountAmount.ToStrMoney();
    public string StrTotalAmount => TotalAmount.ToStrMoney();
    public bool IsReadyToPay => ListItem.Count > 0 && ListWarning.Count == 0;
}

public class CreateTransactionRequestModel
{
    [Required(ErrorMessage = "Gudang wajib dipilih.")]
    [StringLength(36)]
    public string IdWarehouse { get; set; } = string.Empty;

    [Required(ErrorMessage = "Metode pembayaran wajib dipilih.")]
    [StringLength(24)]
    public string PaymentMethodCode { get; set; } = string.Empty;

    /// <summary>Uang yang diterima kasir. Untuk metode non-tunai diisi sama dengan total.</summary>
    public decimal PaidAmount { get; set; }

    [StringLength(512)]
    public string? Note { get; set; }

    public List<CartItemModel> ListItem { get; set; } = [];
}

/// <summary>Permintaan pembatalan transaksi yang sudah tersimpan.</summary>
public class VoidTransactionRequestModel
{
    [Required]
    [StringLength(36)]
    public string IdTransaction { get; set; } = string.Empty;

    [Required(ErrorMessage = "Alasan pembatalan wajib diisi.")]
    [StringLength(512, MinimumLength = 5, ErrorMessage = "Alasan pembatalan minimal {2} karakter.")]
    public string Reason { get; set; } = string.Empty;
}

/// <summary>Data awal layar kasir: gudang, metode pembayaran, dan identitas toko.</summary>
public class CashierInitModel
{
    public List<SelectListItemModel> ListWarehouse { get; set; } = [];
    public List<QueryPaymentMethodModel> ListPaymentMethod { get; set; } = [];
    public string DefaultWarehouseId { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
}
