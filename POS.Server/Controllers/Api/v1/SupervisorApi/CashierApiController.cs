using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.SupervisorApi;

[Authorize(Roles = AppData.RoleNameSupervisor)]
[Route("api/v1/supervisor/cashier")]
public class CashierApiController : BaseCashierApiController
{
    public CashierApiController(ApplicationDbContext db) : base(db)
    {
    }

    protected override bool CanSeeAllTransactions => true;
}
