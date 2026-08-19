using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.AdminApi;

public class GetListAuditLogRequestModel : BaseGetListRequestModel
{
    /// <summary>Kosong berarti seluruh modul.</summary>
    public string? ModuleName { get; set; }

    public string? ActionName { get; set; }

    public string? CreatedById { get; set; }

    /// <summary>Batas bawah tanggal, inklusif. Kosong berarti sejak catatan pertama.</summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>Batas atas tanggal, inklusif sampai akhir hari.</summary>
    public DateTime? DateTo { get; set; }
}

/// <summary>Isi penyaring halaman audit log, diambil dari catatan yang benar-benar ada.</summary>
public class AuditLogFilterModel
{
    public List<SelectListItemModel> ListModule { get; set; } = [];
    public List<SelectListItemModel> ListAction { get; set; } = [];
    public List<SelectListItemModel> ListUser { get; set; } = [];
}

/// <summary>
/// Pembacaan jejak aktivitas (PRD bagian 34). Hanya admin yang boleh membukanya, dan
/// tidak ada endpoint yang mengubah atau menghapus baris audit: catatan yang bisa
/// disunting tidak lagi menjadi bukti.
/// </summary>
[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/audit-log")]
public class AuditLogApiController : BaseApiController
{
    public AuditLogApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Audit Log";
    }

    /// <summary>
    /// Pilihan penyaring disusun dari nilai yang pernah tercatat, bukan dari daftar tetap,
    /// supaya modul dan aksi baru muncul dengan sendirinya tanpa mengubah kode ini.
    /// </summary>
    [HttpPost("get-index")]
    public async Task<IActionResult> GetIndexAsync()
    {
        List<SelectListItemModel> listModule = await _db.AuditLog
            .Select(x => x.ModuleName)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new SelectListItemModel { Value = x, Text = x })
            .ToListAsync();

        List<SelectListItemModel> listAction = await _db.AuditLog
            .Select(x => x.ActionName)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new SelectListItemModel { Value = x, Text = x })
            .ToListAsync();

        List<SelectListItemModel> listUser = await (
            from user in _db.Users
            where _db.AuditLog.Any(log => log.CreatedById == user.Id)
            orderby user.FullName
            select new SelectListItemModel { Value = user.Id, Text = user.FullName, Description = user.UserName })
            .ToListAsync();

        return Ok(new AuditLogFilterModel
        {
            ListModule = listModule,
            ListAction = listAction,
            ListUser = listUser,
        });
    }

    [HttpPost("get-list-audit-log")]
    public async Task<IActionResult> GetListAuditLogAsync([FromBody] GetListAuditLogRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from log in _db.AuditLog
                          join user in _db.Users on log.CreatedById equals user.Id into userGroup
                          from user in userGroup.DefaultIfEmpty()
                          join userRole in _db.UserRoles on user.Id equals userRole.UserId into userRoleGroup
                          from userRole in userRoleGroup.DefaultIfEmpty()
                          join role in _db.Roles on userRole.RoleId equals role.Id into roleGroup
                          from role in roleGroup.DefaultIfEmpty()
                          select new QueryAuditLogModel
                          {
                              IdAuditLog = log.IdAuditLog,
                              ActionName = log.ActionName,
                              ModuleName = log.ModuleName,
                              ReferenceId = log.ReferenceId,
                              Description = log.Description,
                              OldValue = log.OldValue,
                              NewValue = log.NewValue,
                              IpAddress = log.IpAddress,
                              DateCreated = log.DateCreated,
                              CreatedById = log.CreatedById,
                              CreatedBy = user != null ? user.FullName : null,
                              CreatedByRole = role != null ? role.Name : null,
                          };

        if (!string.IsNullOrWhiteSpace(model.ModuleName))
        {
            queryResult = queryResult.Where(x => x.ModuleName == model.ModuleName);
        }

        if (!string.IsNullOrWhiteSpace(model.ActionName))
        {
            queryResult = queryResult.Where(x => x.ActionName == model.ActionName);
        }

        if (!string.IsNullOrWhiteSpace(model.CreatedById))
        {
            queryResult = queryResult.Where(x => x.CreatedById == model.CreatedById);
        }

        if (model.DateFrom.HasValue)
        {
            DateTime dateFrom = model.DateFrom.Value.Date;
            queryResult = queryResult.Where(x => x.DateCreated >= dateFrom);
        }

        // Batas atas dinaikkan satu hari supaya kejadian pada tanggal itu sendiri ikut
        // terbawa, berapa pun jamnya.
        if (model.DateTo.HasValue)
        {
            DateTime dateToExclusive = model.DateTo.Value.Date.AddDays(1);
            queryResult = queryResult.Where(x => x.DateCreated < dateToExclusive);
        }

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.ActionName, searchPhrase)
                || (x.Description != null && EF.Functions.ILike(x.Description, searchPhrase))
                || (x.ReferenceId != null && EF.Functions.ILike(x.ReferenceId, searchPhrase))
                || (x.CreatedBy != null && EF.Functions.ILike(x.CreatedBy, searchPhrase)));
        }

        return await BuildListResponseAsync(queryResult, model, "DateCreated Descending, IdAuditLog Descending");
    }
}
