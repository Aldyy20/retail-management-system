using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Pelanggan terdaftar.
///
/// Nomor HP menjadi identitas yang dipakai manusia, tetapi kunci teknisnya tetap id
/// internal, supaya nomor HP yang berganti tidak memutus riwayat transaksi (PRD bagian 19).
/// </summary>
public class MemberKeyModel
{
    public string IdMember { get; set; } = string.Empty;
}

public class BaseMemberModel : MemberKeyModel, IBaseDataInfo, IActivatable
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nomor HP")]
    [StringLength(20, MinimumLength = 8, ErrorMessage = "{0} harus antara {2} sampai {1} digit.")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Member")]
    [StringLength(96, MinimumLength = 2, ErrorMessage = "{0} harus antara {2} sampai {1} karakter.")]
    public string MemberName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Format {0} tidak valid.")]
    [Display(Name = "Email")]
    [StringLength(128)]
    public string? Email { get; set; }

    [Display(Name = "Alamat")]
    [StringLength(256)]
    public string? Address { get; set; }

    [Display(Name = "Status Aktif")]
    public bool IsActive { get; set; } = true;

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TableMemberModel : BaseMemberModel, ITableDataInfo
{
    /// <summary>
    /// Saldo point berjalan. Nilainya hanya berubah lewat mutasi point yang tercatat,
    /// sehingga saldo selalu dapat direkonstruksi dari riwayatnya.
    /// </summary>
    public int PointBalance { get; set; }

    /// <summary>Akumulasi nilai belanja, dipakai laporan member.</summary>
    public decimal TotalSpending { get; set; }

    public int TotalTransaction { get; set; }

    public DateTime? DateModified { get; set; }
    public string? ModifiedById { get; set; }
}

public class QueryMemberModel : TableMemberModel
{
    public string? CreatedBy { get; set; }

    public string StrStatus => IsActive ? "Aktif" : "Nonaktif";
    public string StrTotalSpending => TotalSpending.ToStrMoney();
    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
}

public class DetailsMemberModel : QueryMemberModel
{
    public List<QueryMemberPointModel> ListPointHistory { get; set; } = [];
}

public class CreateEditMemberModel : BaseMemberModel
{
}

// --- Mutasi point -----------------------------------------------------------

/// <summary>
/// Satu baris perubahan saldo point. Baris ini tidak pernah diubah atau dihapus,
/// sehingga saldo member selalu dapat ditelusuri sampai transaksi asalnya.
/// </summary>
public class QueryMemberPointModel
{
    public string IdMemberPointTransaction { get; set; } = string.Empty;
    public string IdMember { get; set; } = string.Empty;
    public PointMovementType MovementType { get; set; }
    public int Point { get; set; }
    public int PointBefore { get; set; }
    public int PointAfter { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Note { get; set; }
    public DateTime DateCreated { get; set; }
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Arah mutasi disimpulkan dari saldo sebelum dan sesudah, bukan dari kolom Point yang
    /// selalu positif. Penyesuaian bisa menambah maupun mengurangi, dan hanya saldolah
    /// yang tahu ke arah mana.
    /// </summary>
    public bool IsIncoming => PointAfter >= PointBefore;

    /// <summary>Perubahan bertanda, contoh +3 atau -100, supaya arahnya langsung terbaca.</summary>
    public string StrPointChange => (IsIncoming ? "+" : "-") + Math.Abs(Point);

    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();

    public string StrMovementType => MovementType switch
    {
        PointMovementType.Earn => "Perolehan",
        PointMovementType.Redeem => "Penukaran",
        PointMovementType.Adjustment => "Penyesuaian",
        _ => "Tidak dikenal",
    };
}
