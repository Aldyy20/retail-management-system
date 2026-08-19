using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.SupervisorApi;

[Authorize(Roles = AppData.RoleNameSupervisor)]
[Route("api/v1/supervisor/stock-opname")]
public class StockOpnameApiController : BaseStockOpnameApiController
{
    public StockOpnameApiController(ApplicationDbContext db) : base(db)
    {
    }

    protected override bool CanSeeAllDocuments => true;
}
