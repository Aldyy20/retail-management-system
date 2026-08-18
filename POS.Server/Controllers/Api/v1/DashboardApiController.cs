using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Services;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Models;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1;

/// <summary>
/// Ringkasan beranda. Isi yang ditampilkan berbeda per role akan dikembangkan
/// bersama modulnya; untuk sekarang seluruh role melihat status sistem yang sama.
/// </summary>
[Authorize]
[Route("api/v1/dashboard")]
public class DashboardApiController : BaseApiController
{
    public DashboardApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Dashboard";
    }

    [HttpPost("get-summary")]
    public async Task<IActionResult> GetSummaryAsync()
    {
        List<DashboardActivityModel> recentActivities = await (
            from log in _db.AuditLog
            join user in _db.Users on log.CreatedById equals user.Id into userGroup
            from user in userGroup.DefaultIfEmpty()
            orderby log.DateCreated descending
            select new DashboardActivityModel
            {
                ActionName = log.ActionName,
                ModuleName = log.ModuleName,
                Description = log.Description,
                CreatedBy = user != null ? user.FullName : "Sistem",
                StrDateCreated = string.Empty,
                DateCreated = log.DateCreated,
            })
            .Take(8)
            .ToListAsync();

        foreach (DashboardActivityModel activity in recentActivities)
        {
            activity.StrDateCreated = ((DateTime?)activity.DateCreated).ToStrDateTime();
        }

        return Ok(new DashboardSummaryModel
        {
            StoreName = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreName, "Toko Saya"),
            TotalUserActive = await _db.Users.CountAsync(x => x.IsActive),
            IsMemberEnabled = await GlobalList.GetSettingBoolAsync(_db, AppData.SettingMemberEnabled),
            IsLoyaltyEnabled = await GlobalList.GetSettingBoolAsync(_db, AppData.SettingLoyaltyEnabled),
            IsVoucherEnabled = await GlobalList.GetSettingBoolAsync(_db, AppData.SettingVoucherEnabled),
            RecentActivities = recentActivities,
        });
    }
}
