using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using POS.Server.Controllers.Api.v1.BaseApi;
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

    [AllowAnonymous]
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
        });
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
            return BadRequest(string.Join(" ", result.Errors.Select(x => x.Description)));
        }

        AddAuditLog("CHANGE_PASSWORD", user.Id, $"{user.UserName} mengubah kata sandi.");
        await _db.SaveChangesAsync();

        return Ok("Kata sandi berhasil diubah.");
    }
}
