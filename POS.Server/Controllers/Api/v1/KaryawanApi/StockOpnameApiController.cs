using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.KaryawanApi;

[Authorize(Roles = AppData.RoleNameKaryawan)]
[Route("api/v1/karyawan/stock-opname")]
public class StockOpnameApiController : BaseStockOpnameApiController
{
    public StockOpnameApiController(ApplicationDbContext db) : base(db)
    {
    }

    protected override bool CanSeeAllDocuments => false;
}
