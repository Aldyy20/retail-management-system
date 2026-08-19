using System.ComponentModel.DataAnnotations;
using POS.DataLayer.Enums;
using POS.DataLayer.Interfaces;
using POS.DataLayer.Services;

namespace POS.DataLayer.Models;

/// <summary>
/// Permintaan pengaturan ulang kata sandi dari pengguna yang tidak dapat masuk.
///
/// Toko ini tidak mengirim email, jadi permintaan masuk ke antrean admin dan admin yang
/// menetapkan kata sandi barunya. Baris di sini tidak pernah memuat kata sandi, hanya
/// jejak siapa meminta kapan dan siapa yang menanganinya.
/// </summary>
public class PasswordResetRequestKeyModel
{
    public string IdPasswordResetRequest { get; set; } = string.Empty;
}

public class BasePasswordResetRequestModel : PasswordResetRequestKeyModel, IBaseDataInfo
{
    [Required]
    [StringLength(36)]
    public string IdUser { get; set; } = string.Empty;

    /// <summary>
    /// Nama pengguna saat permintaan dibuat. Disimpan sebagai salinan supaya daftar
    /// permintaan lama tetap terbaca meskipun nama akunnya kemudian diubah.
    /// </summary>
    [Required]
    [Display(Name = "Nama Pengguna")]
    [StringLength(256)]
    public string UserName { get; set; } = string.Empty;

    /// <summary>Keterangan singkat dari pemohon, misalnya di mana ia dapat dihubungi.</summary>
    [Display(Name = "Catatan")]
    [StringLength(256)]
    public string? Note { get; set; }

    [StringLength(64)]
    public string? IpAddress { get; set; }

    public DataStatus Status { get; set; } = DataStatus.Pending;

    [StringLength(36)]
    public string? HandledById { get; set; }

    public DateTime? HandledDate { get; set; }

    /// <summary>Wajib diisi saat menolak, agar alasannya dapat ditelusuri.</summary>
    [StringLength(512)]
    public string? HandledNote { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }
}

public class TablePasswordResetRequestModel : BasePasswordResetRequestModel
{
}

public class QueryPasswordResetRequestModel : TablePasswordResetRequestModel
{
    public string? FullName { get; set; }
    public string? RoleName { get; set; }
    public string? HandledBy { get; set; }

    /// <summary>Akun nonaktif ditandai supaya admin tidak menghidupkan akses yang sengaja ditutup.</summary>
    public bool IsUserActive { get; set; }

    public string StrDateCreated => ((DateTime?)DateCreated).ToStrDateTime();
    public string StrHandledDate => HandledDate.ToStrDateTime();

    public string StrStatus => Status switch
    {
        DataStatus.Pending => "Menunggu ditangani",
        DataStatus.Completed => "Sudah diatur ulang",
        DataStatus.Rejected => "Ditolak",
        _ => "Tidak diketahui",
    };
}

/// <summary>Permintaan dari halaman masuk. Tidak memuat kata sandi apa pun.</summary>
public class CreatePasswordResetRequestModel
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Pengguna")]
    [StringLength(256)]
    public string UserName { get; set; } = string.Empty;

    [Display(Name = "Catatan")]
    [StringLength(256)]
    public string? Note { get; set; }
}

/// <summary>Penyelesaian oleh admin: menetapkan kata sandi baru untuk pemohon.</summary>
public class CompletePasswordResetModel : PasswordResetRequestKeyModel
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Kata Sandi Baru")]
    [StringLength(64, MinimumLength = 8, ErrorMessage = "{0} minimal {2} karakter.")]
    public string NewPassword { get; set; } = string.Empty;
}

/// <summary>Penolakan oleh admin, misalnya karena pemohon tidak dapat dipastikan orangnya.</summary>
public class RejectPasswordResetModel : PasswordResetRequestKeyModel
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Alasan Penolakan")]
    [StringLength(512)]
    public string HandledNote { get; set; } = string.Empty;
}
