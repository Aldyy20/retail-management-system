using System.ComponentModel.DataAnnotations;

namespace POS.Server.Models;

public class LoginRequestModel
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Nama Pengguna")]
    public string UserName { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Kata Sandi")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Identitas yang disimpan frontend setelah login. Role di sini hanya untuk navigasi;
/// setiap permintaan tetap diverifikasi ulang di server.
/// </summary>
public class CurrentUserModel
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string StoreName { get; set; } = string.Empty;
}

public class ChangePasswordRequestModel
{
    [Required(ErrorMessage = "{0} wajib diisi.")]
    [Display(Name = "Kata Sandi Lama")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "{0} wajib diisi.")]
    [StringLength(64, MinimumLength = 8, ErrorMessage = "{0} minimal {2} karakter.")]
    [Display(Name = "Kata Sandi Baru")]
    public string NewPassword { get; set; } = string.Empty;

    [Compare(nameof(NewPassword), ErrorMessage = "{0} tidak sama dengan Kata Sandi Baru.")]
    [Display(Name = "Konfirmasi Kata Sandi Baru")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
