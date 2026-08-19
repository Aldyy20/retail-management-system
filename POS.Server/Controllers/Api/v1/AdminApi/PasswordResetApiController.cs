using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.AdminApi;

public class GetListPasswordResetRequestModel : BaseGetListRequestModel
{
    /// <summary>Kosong berarti seluruh status.</summary>
    public string? Status { get; set; }
}

/// <summary>
/// Antrean permintaan pengaturan ulang kata sandi.
///
/// Toko ini tidak mengirim email, sehingga pemulihan akses berjalan lewat orang: pemohon
/// mengantre di sini, admin memastikan siapa yang meminta, lalu menetapkan kata sandi
/// barunya. Yang ditegakkan sistem adalah jejaknya, bukan pemastian identitasnya.
/// </summary>
[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/password-reset")]
public class PasswordResetApiController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;

    public PasswordResetApiController(ApplicationDbContext db, UserManager<ApplicationUser> userManager) : base(db)
    {
        _userManager = userManager;
        EntityName = "Permintaan Reset Kata Sandi";
    }

    #region Query

    [HttpPost("get-list-password-reset")]
    public async Task<IActionResult> GetListPasswordResetAsync([FromBody] GetListPasswordResetRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from request in _db.PasswordResetRequest
                          join user in _db.Users on request.IdUser equals user.Id
                          join userRole in _db.UserRoles on user.Id equals userRole.UserId into userRoleGroup
                          from userRole in userRoleGroup.DefaultIfEmpty()
                          join role in _db.Roles on userRole.RoleId equals role.Id into roleGroup
                          from role in roleGroup.DefaultIfEmpty()
                          join handledBy in _db.Users on request.HandledById equals handledBy.Id into handledByGroup
                          from handledBy in handledByGroup.DefaultIfEmpty()
                          select new QueryPasswordResetRequestModel
                          {
                              IdPasswordResetRequest = request.IdPasswordResetRequest,
                              IdUser = request.IdUser,
                              UserName = request.UserName,
                              Note = request.Note,
                              IpAddress = request.IpAddress,
                              Status = request.Status,
                              HandledById = request.HandledById,
                              HandledDate = request.HandledDate,
                              HandledNote = request.HandledNote,
                              DateCreated = request.DateCreated,
                              FullName = user.FullName,
                              RoleName = role != null ? role.Name : null,
                              HandledBy = handledBy != null ? handledBy.FullName : null,
                              IsUserActive = user.IsActive,
                          };

        if (!string.IsNullOrWhiteSpace(model.Status))
        {
            DataStatus status = model.Status switch
            {
                "pending" => DataStatus.Pending,
                "completed" => DataStatus.Completed,
                "rejected" => DataStatus.Rejected,
                _ => DataStatus.Pending,
            };

            queryResult = queryResult.Where(x => x.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.UserName, searchPhrase)
                || (x.FullName != null && EF.Functions.ILike(x.FullName, searchPhrase)));
        }

        return await BuildListResponseAsync(queryResult, model,
            "DateCreated Descending, IdPasswordResetRequest Descending");
    }

    /// <summary>Jumlah permintaan yang belum ditangani, untuk penanda pada navigasi admin.</summary>
    [HttpPost("get-pending-count")]
    public async Task<IActionResult> GetPendingCountAsync()
    {
        return Ok(await _db.PasswordResetRequest.CountAsync(x => x.Status == DataStatus.Pending));
    }

    #endregion

    #region Mutation

    /// <summary>
    /// Menetapkan kata sandi baru bagi pemohon dan menutup permintaannya dalam satu
    /// transaksi, supaya tidak pernah ada kata sandi yang berubah tanpa permintaannya
    /// ikut tertutup, maupun sebaliknya.
    /// </summary>
    [HttpPost("complete-password-reset")]
    public async Task<IActionResult> CompletePasswordResetAsync([FromBody] CompletePasswordResetModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdPasswordResetRequest))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        PasswordResetRequest? request = await _db.PasswordResetRequest
            .FirstOrDefaultAsync(x => x.IdPasswordResetRequest == model.IdPasswordResetRequest);

        if (request == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (request.Status != DataStatus.Pending)
        {
            return BadRequest("Permintaan ini sudah ditangani. Muat ulang daftarnya untuk melihat keadaan terbaru.");
        }

        ApplicationUser? user = await _userManager.FindByIdAsync(request.IdUser);

        if (user == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound("Pengguna"));
        }

        if (!user.IsActive)
        {
            return BadRequest($"Akun {user.UserName} sedang dinonaktifkan. Aktifkan dulu lewat halaman Pengguna bila memang boleh dipakai lagi.");
        }

        // Kata sandi lama tidak pernah dibaca. Yang dilakukan adalah menetapkan yang baru
        // lewat token reset milik Identity, sama seperti pada halaman Pengguna.
        string resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        IdentityResult result = await _userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(TranslateIdentityErrors(result));
        }

        request.Status = DataStatus.Completed;
        request.HandledById = CurrentUserId;
        request.HandledDate = DateTime.Now;

        AddAuditLog("COMPLETE_PASSWORD_RESET", request.IdPasswordResetRequest,
            $"Mengatur ulang kata sandi {user.UserName} atas permintaan reset.");

        await _db.SaveChangesAsync();

        return Ok($"Kata sandi {user.UserName} berhasil diatur ulang. Sampaikan kata sandi barunya langsung kepada yang bersangkutan.");
    }

    [HttpPost("reject-password-reset")]
    public async Task<IActionResult> RejectPasswordResetAsync([FromBody] RejectPasswordResetModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdPasswordResetRequest))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        PasswordResetRequest? request = await _db.PasswordResetRequest
            .FirstOrDefaultAsync(x => x.IdPasswordResetRequest == model.IdPasswordResetRequest);

        if (request == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (request.Status != DataStatus.Pending)
        {
            return BadRequest("Permintaan ini sudah ditangani. Muat ulang daftarnya untuk melihat keadaan terbaru.");
        }

        request.Status = DataStatus.Rejected;
        request.HandledById = CurrentUserId;
        request.HandledDate = DateTime.Now;
        request.HandledNote = model.HandledNote.Trim();

        AddAuditLog("REJECT_PASSWORD_RESET", request.IdPasswordResetRequest,
            $"Menolak permintaan reset kata sandi {request.UserName}.", null, request.HandledNote);

        await _db.SaveChangesAsync();

        return Ok("Permintaan ditolak. Kata sandi pemohon tidak berubah.");
    }

    #endregion
}
