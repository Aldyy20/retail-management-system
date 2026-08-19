using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using POS.Server.Controllers.Api.v1.BaseApi;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Models;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1;

[Route("api/v1/auth")]
public class AuthApiController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthApiController(ApplicationDbContext db, UserManager<ApplicationUser> userManager) : base(db)
    {
        _userManager = userManager;
        EntityName = "Autentikasi";
    }

    /// <summary>
    /// Identitas toko untuk halaman masuk. Sengaja dibuka tanpa autentikasi supaya
    /// pengguna tahu sedang masuk ke toko yang benar, dan hanya berisi nama serta alamat.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("get-store-info")]
    public async Task<IActionResult> GetStoreInfoAsync()
    {
        return Ok(new StoreInfoModel
        {
            StoreName = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreName, "Toko Saya"),
            StoreAddress = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreAddress),
            StoreLogoUrl = await GetStoreLogoUrlAsync(),
        });
    }

    [AllowAnonymous]
    [EnableRateLimiting(AppData.RateLimitPolicyAuth)]
    [HttpPost("login")]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        ApplicationUser? user = await _userManager.FindByNameAsync(model.UserName)
            ?? await _userManager.FindByEmailAsync(model.UserName);

        // Pesan sengaja disamakan untuk pengguna tidak ada dan kata sandi salah,
        // agar tidak menjadi cara menebak nama pengguna yang terdaftar.
        if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
        {
            return BadRequest(AppErrorMessages.ErrorInvalidLogin);
        }

        if (!user.IsActive)
        {
            return BadRequest(AppErrorMessages.ErrorInactiveUser);
        }

        string roleName = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty;

        if (string.IsNullOrEmpty(roleName))
        {
            return BadRequest("Akun Anda belum memiliki role. Hubungi admin.");
        }

        (string token, DateTime expiresAt) = TokenMethods.CreateToken(user, roleName);

        AuditLog loginLog = AppMethods.BuildAuditLog("LOGIN", "Autentikasi", user.Id,
            $"{user.UserName} masuk sebagai {roleName}.", null, null, HttpContext);
        loginLog.CreatedById = user.Id;
        _db.AuditLog.Add(loginLog);
        await _db.SaveChangesAsync();

        return Ok(new CurrentUserModel
        {
            Id = user.Id,
            UserName = user.UserName ?? string.Empty,
            FullName = user.FullName,
            Role = roleName,
            Token = token,
            ExpiresAt = expiresAt,
            StoreName = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreName, "Toko Saya"),
            StoreLogoUrl = await GetStoreLogoUrlAsync(),
        });
    }

    /// <summary>
    /// Mengantrekan permintaan pengaturan ulang kata sandi untuk ditangani admin.
    ///
    /// Balasannya selalu sama persis, baik nama penggunanya ada maupun tidak. Halaman ini
    /// terbuka tanpa token, jadi balasan yang berbeda akan menjadi cara memastikan nama
    /// pengguna mana yang terdaftar di toko ini.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting(AppData.RateLimitPolicyAuth)]
    [HttpPost("request-password-reset")]
    public async Task<IActionResult> RequestPasswordResetAsync([FromBody] CreatePasswordResetRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        const string sameAnswer = "Permintaan Anda sudah dikirim. Hubungi admin toko untuk menerima kata sandi barunya.";

        string userName = model.UserName.Trim();
        ApplicationUser? user = await _userManager.FindByNameAsync(userName);

        // Akun yang sengaja dinonaktifkan tidak boleh dihidupkan lewat jalur ini.
        if (user == null || !user.IsActive)
        {
            return Ok(sameAnswer);
        }

        // Permintaan yang masih menunggu cukup diperbarui catatannya, bukan ditambah baris
        // baru. Index tersaring di database menegakkan hal yang sama bila dua permintaan
        // tiba bersamaan.
        PasswordResetRequest? pending = await _db.PasswordResetRequest
            .FirstOrDefaultAsync(x => x.IdUser == user.Id && x.Status == DataStatus.Pending);

        if (pending != null)
        {
            pending.Note = string.IsNullOrWhiteSpace(model.Note) ? pending.Note : model.Note.Trim();
            pending.DateCreated = DateTime.Now;
        }
        else
        {
            _db.PasswordResetRequest.Add(new PasswordResetRequest
            {
                IdUser = user.Id,
                UserName = user.UserName ?? userName,
                Note = string.IsNullOrWhiteSpace(model.Note) ? null : model.Note.Trim(),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                Status = DataStatus.Pending,
            });
        }

        AuditLog requestLog = AppMethods.BuildAuditLog("REQUEST_PASSWORD_RESET", "Autentikasi", user.Id,
            $"{user.UserName} meminta pengaturan ulang kata sandi.", null, null, HttpContext);
        requestLog.CreatedById = user.Id;
        _db.AuditLog.Add(requestLog);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Tabrakan pada index tersaring berarti permintaan lain sudah lebih dulu masuk.
            // Bagi pemohon hasilnya sama saja, jadi tidak perlu dijadikan kesalahan.
            return Ok(sameAnswer);
        }

        return Ok(sameAnswer);
    }

    /// <summary>
    /// Memverifikasi token yang tersimpan di browser dan mengembalikan identitas terbaru,
    /// agar akun yang baru dinonaktifkan tidak dapat melanjutkan sesi lama.
    /// </summary>
    [Authorize]
    [HttpPost("get-current-user")]
    public async Task<IActionResult> GetCurrentUserAsync()
    {
        ApplicationUser? user = await _userManager.FindByIdAsync(CurrentUserId ?? string.Empty);

        if (user == null || !user.IsActive)
        {
            return Unauthorized(AppErrorMessages.ErrorInactiveUser);
        }

        return Ok(new CurrentUserModel
        {
            Id = user.Id,
            UserName = user.UserName ?? string.Empty,
            FullName = user.FullName,
            Role = User.GetRoleName() ?? string.Empty,
            Token = string.Empty,
            StoreName = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreName, "Toko Saya"),
            StoreLogoUrl = await GetStoreLogoUrlAsync(),
        });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePasswordAsync([FromBody] ChangePasswordRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        ApplicationUser? user = await _userManager.FindByIdAsync(CurrentUserId ?? string.Empty);

        if (user == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound("Pengguna"));
        }

        IdentityResult result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(TranslateIdentityErrors(result));
        }

        AddAuditLog("CHANGE_PASSWORD", user.Id, $"{user.UserName} mengubah kata sandi.");
        await _db.SaveChangesAsync();

        return Ok("Kata sandi berhasil diubah.");
    }

    /// <summary>
    /// Alamat logo toko. Dikembalikan kosong bila pengaturannya menunjuk berkas yang sudah
    /// tidak ada, supaya frontend tidak pernah merender gambar rusak.
    /// </summary>
    private async Task<string> GetStoreLogoUrlAsync()
    {
        string fileName = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreLogo);

        return FileMethods.Exists(AppData.UploadFolderStore, fileName)
            ? FileMethods.GetPublicUrl(AppData.UploadFolderStore, fileName)
            : string.Empty;
    }
}
