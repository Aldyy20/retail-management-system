using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.SupervisorApi;

/// <summary>
/// Barang masuk untuk supervisor. Supervisor melihat seluruh dokumen karena tugasnya
/// mengawasi, dan tetap dapat mencatat barang masuk sendiri.
/// </summary>
[Authorize(Roles = AppData.RoleNameSupervisor)]
[Route("api/v1/supervisor/goods-receiving")]
public class GoodsReceivingApiController : BaseGoodsReceivingApiController
{
    public GoodsReceivingApiController(ApplicationDbContext db) : base(db)
    {
    }

    protected override bool CanSeeAllDocuments => true;
}
