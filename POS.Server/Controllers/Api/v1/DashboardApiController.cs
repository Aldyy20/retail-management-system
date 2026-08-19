using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.DataLayer.Models;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1;

/// <summary>
/// Beranda tiap role.
///
/// Isinya berbeda karena tugasnya berbeda: admin melihat kesehatan data dan stok,
/// supervisor melihat antrean persetujuan, owner melihat uang dan tren. Bagian yang
/// tidak relevan tidak dikirim sama sekali, bukan dikirim kosong sebagai hiasan.
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
        string roleName = User.GetRoleName() ?? string.Empty;
        DateTime today = DateTime.Now.Date;

        DashboardModel result = new()
        {
            StoreName = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreName, "Toko Saya"),
            RoleName = roleName,
            Today = await DashboardMethods.GetSalesSummaryAsync(_db, today, today),
            ListActivity = await DashboardMethods.GetRecentActivityAsync(_db),
        };

        if (roleName == AppData.RoleNameAdmin)
        {
            result.Inventory = await DashboardMethods.GetInventorySummaryAsync(_db);
            result.Approval = await DashboardMethods.GetApprovalSummaryAsync(_db);
            result.ListLowStock = await DashboardMethods.GetLowStockAsync(_db);
        }

        if (roleName == AppData.RoleNameSupervisor)
        {
            result.Approval = await DashboardMethods.GetApprovalSummaryAsync(_db);
            result.Inventory = await DashboardMethods.GetInventorySummaryAsync(_db);
            result.ListLowStock = await DashboardMethods.GetLowStockAsync(_db, 5);
            result.ListCashierSales = await DashboardMethods.GetCashierSalesAsync(_db, today, today);
        }

        if (roleName == AppData.RoleNameKaryawan)
        {
            result.ListLowStock = await DashboardMethods.GetLowStockAsync(_db, 5);
        }

        if (roleName == AppData.RoleNameOwner)
        {
            DateTime firstDayOfMonth = new(today.Year, today.Month, 1);

            result.ThisMonth = await DashboardMethods.GetSalesSummaryAsync(_db, firstDayOfMonth, today);
            result.ListDailySales = await DashboardMethods.GetDailySalesAsync(_db, today.AddDays(-13), today);
            result.ListCategorySales = await DashboardMethods.GetCategorySalesAsync(_db, firstDayOfMonth, today);
            result.ListTopProduct = await DashboardMethods.GetTopProductAsync(_db, firstDayOfMonth, today);
            result.ListCashierSales = await DashboardMethods.GetCashierSalesAsync(_db, firstDayOfMonth, today);
            result.Inventory = await DashboardMethods.GetInventorySummaryAsync(_db);
            result.ListLowStock = await DashboardMethods.GetLowStockAsync(_db);
        }

        return Ok(result);
    }
}
