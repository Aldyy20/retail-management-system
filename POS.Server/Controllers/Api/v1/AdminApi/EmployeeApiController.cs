using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.DataLayer.Services;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.AdminApi;

public class EmployeeFormModel
{
    public List<SelectListItemModel> ListRole { get; set; } = [];
    public CreateEditUserModel? Data { get; set; }
}

public class ResetPasswordRequestModel
{
    public string Id { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

/// <summary>
/// Pengelolaan akun seluruh role. Admin membuat akun karyawan, supervisor, dan owner,
/// serta menonaktifkannya bila pegawai berhenti (PRD bagian 4.1).
/// </summary>
[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/employee")]
public class EmployeeApiController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;

    public EmployeeApiController(ApplicationDbContext db, UserManager<ApplicationUser> userManager) : base(db)
    {
        _userManager = userManager;
        EntityName = "Pengguna";
    }

    #region Query

    [HttpPost("get-list-employee")]
    public async Task<IActionResult> GetListEmployeeAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from user in _db.Users
                          join userRole in _db.UserRoles on user.Id equals userRole.UserId into userRoleGroup
                          from userRole in userRoleGroup.DefaultIfEmpty()
                          join role in _db.Roles on userRole.RoleId equals role.Id into roleGroup
                          from role in roleGroup.DefaultIfEmpty()
                          select new QueryUserModel
                          {
                              Id = user.Id,
                              UserName = user.UserName!,
                              FullName = user.FullName,
                              Email = user.Email,
                              PhoneNumber = user.PhoneNumber,
                              RoleName = role != null ? role.Name! : string.Empty,
                              IsActive = user.IsActive,
                              DateCreated = user.DateCreated,
                              DateModified = user.DateModified,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.FullName, searchPhrase)
                || EF.Functions.ILike(x.UserName, searchPhrase)
                || EF.Functions.ILike(x.RoleName, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "FullName Ascending, Id Ascending");
    }

    [HttpPost("get-create")]
    public async Task<IActionResult> GetCreateAsync()
    {
        return Ok(new EmployeeFormModel
        {
            ListRole = await GetListRoleAsync(),
            Data = new CreateEditUserModel { RoleName = AppData.RoleNameKaryawan },
        });
    }

    [HttpPost("get-edit")]
    public async Task<IActionResult> GetEditAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        ApplicationUser? user = await _userManager.FindByIdAsync(model.Id);

        if (user == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        return Ok(new EmployeeFormModel
        {
            ListRole = await GetListRoleAsync(),
            Data = new CreateEditUserModel
            {
                Id = user.Id,
                UserName = user.UserName ?? string.Empty,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                RoleName = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty,
                IsActive = user.IsActive,
            },
        });
    }

    private async Task<List<SelectListItemModel>> GetListRoleAsync()
    {
        return await _db.Roles
            .OrderBy(x => x.Name)
            .Select(x => new SelectListItemModel { Value = x.Name!, Text = x.Name!, Description = x.Description })
            .ToListAsync();
    }

    #endregion

    #region Mutation

    [HttpPost("insert-employee")]
    public async Task<IActionResult> InsertEmployeeAsync([FromBody] CreateEditUserModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        if (string.IsNullOrWhiteSpace(model.Password))
        {
            return BadRequest("Kata sandi wajib diisi untuk pengguna baru.");
        }

        if (!await _db.Roles.AnyAsync(x => x.Name == model.RoleName))
        {
            return BadRequest("Role yang dipilih tidak dikenali.");
        }

        ApplicationUser user = new()
        {
            UserName = model.UserName.Trim(),
            Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim(),
            EmailConfirmed = true,
            PhoneNumber = NormalizeOptionalPhone(model.PhoneNumber),
            FullName = model.FullName.Trim(),
            IsActive = model.IsActive,
            CreatedById = CurrentUserId,
        };

        IdentityResult createResult = await _userManager.CreateAsync(user, model.Password);

        if (!createResult.Succeeded)
        {
            return BadRequest(TranslateIdentityErrors(createResult));
        }

        IdentityResult roleResult = await _userManager.AddToRoleAsync(user, model.RoleName);

        if (!roleResult.Succeeded)
        {
            // Akun tanpa role tidak dapat masuk sama sekali, jadi lebih baik dibatalkan
            // daripada meninggalkan akun setengah jadi.
            await _userManager.DeleteAsync(user);
            return BadRequest(TranslateIdentityErrors(roleResult));
        }

        AddAuditLog("INSERT_USER", user.Id, $"Menambah pengguna {user.UserName} sebagai {model.RoleName}.");
        await _db.SaveChangesAsync();

        return Ok("Pengguna berhasil disimpan.");
    }

    [HttpPost("update-employee")]
    public async Task<IActionResult> UpdateEmployeeAsync([FromBody] CreateEditUserModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        ApplicationUser? user = await _userManager.FindByIdAsync(model.Id);

        if (user == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        // Admin tidak boleh mengunci dirinya sendiri keluar dari sistem.
        if (user.Id == CurrentUserId && !model.IsActive)
        {
            return BadRequest("Anda tidak dapat menonaktifkan akun Anda sendiri.");
        }

        string currentRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty;

        if (user.Id == CurrentUserId && currentRole != model.RoleName)
        {
            return BadRequest("Anda tidak dapat mengubah role akun Anda sendiri.");
        }

        string oldValue = $"{user.UserName} - {currentRole} ({(user.IsActive ? "Aktif" : "Nonaktif")})";

        user.UserName = model.UserName.Trim();
        user.Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim();
        user.PhoneNumber = NormalizeOptionalPhone(model.PhoneNumber);
        user.FullName = model.FullName.Trim();
        user.IsActive = model.IsActive;
        user.ModifiedById = CurrentUserId;
        user.DateModified = DateTime.Now;

        IdentityResult updateResult = await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            return BadRequest(TranslateIdentityErrors(updateResult));
        }

        if (currentRole != model.RoleName)
        {
            if (!await _db.Roles.AnyAsync(x => x.Name == model.RoleName))
            {
                return BadRequest("Role yang dipilih tidak dikenali.");
            }

            if (!string.IsNullOrEmpty(currentRole))
            {
                await _userManager.RemoveFromRoleAsync(user, currentRole);
            }

            await _userManager.AddToRoleAsync(user, model.RoleName);
        }

        AddAuditLog("UPDATE_USER", user.Id, "Mengubah data pengguna.",
            oldValue, $"{user.UserName} - {model.RoleName} ({(user.IsActive ? "Aktif" : "Nonaktif")})");
        await _db.SaveChangesAsync();

        return Ok("Pengguna berhasil diperbarui.");
    }

    /// <summary>
    /// Mengatur ulang kata sandi pengguna lain. Admin tidak pernah melihat kata sandi lama;
    /// yang dilakukan adalah menetapkan kata sandi baru lewat token reset milik Identity.
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (string.IsNullOrWhiteSpace(model.NewPassword) || model.NewPassword.Length < 8)
        {
            return BadRequest("Kata sandi baru minimal 8 karakter.");
        }

        ApplicationUser? user = await _userManager.FindByIdAsync(model.Id);

        if (user == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        IdentityResult result = await _userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(TranslateIdentityErrors(result));
        }

        AddAuditLog("RESET_PASSWORD", user.Id, $"Mengatur ulang kata sandi {user.UserName}.");
        await _db.SaveChangesAsync();

        return Ok("Kata sandi berhasil diatur ulang.");
    }

    [HttpPost("delete-employee")]
    public async Task<IActionResult> DeleteEmployeeAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (model.Id == CurrentUserId)
        {
            return BadRequest("Anda tidak dapat menghapus akun Anda sendiri.");
        }

        ApplicationUser? user = await _userManager.FindByIdAsync(model.Id);

        if (user == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        AddAuditLog("DELETE_USER", user.Id, $"Menghapus pengguna {user.UserName}.");
        await _db.SaveChangesAsync();

        IdentityResult result = await _userManager.DeleteAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest("Pengguna tidak dapat dihapus karena sudah memiliki riwayat aktivitas. Nonaktifkan saja.");
        }

        return Ok("Pengguna berhasil dihapus.");
    }

    private static string? NormalizeOptionalPhone(string? phoneNumber)
    {
        string normalized = DataLayerMethods.NormalizePhoneNumber(phoneNumber);
        return normalized.Length == 0 ? null : normalized;
    }

    /// <summary>Menggabungkan pesan Identity menjadi satu baris berbahasa Indonesia.</summary>
    private static string TranslateIdentityErrors(IdentityResult result)
    {
        List<string> messages = [];

        foreach (IdentityError error in result.Errors)
        {
            messages.Add(error.Code switch
            {
                "DuplicateUserName" => "Nama pengguna tersebut sudah dipakai akun lain.",
                "DuplicateEmail" => "Email tersebut sudah dipakai akun lain.",
                "PasswordTooShort" => "Kata sandi minimal 8 karakter.",
                "PasswordRequiresDigit" => "Kata sandi harus memuat angka.",
                "PasswordRequiresUpper" => "Kata sandi harus memuat huruf kapital.",
                "PasswordRequiresLower" => "Kata sandi harus memuat huruf kecil.",
                "InvalidUserName" => "Nama pengguna hanya boleh berisi huruf, angka, titik, dan garis bawah.",
                _ => error.Description,
            });
        }

        return messages.Count > 0 ? string.Join(" ", messages) : AppErrorMessages.ErrorUnexpected;
    }

    #endregion
}
