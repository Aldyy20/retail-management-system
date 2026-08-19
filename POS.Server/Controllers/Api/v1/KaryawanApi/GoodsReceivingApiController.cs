using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.KaryawanApi;

/// <summary>
/// Barang masuk untuk karyawan gudang. Karyawan hanya melihat dan mengubah dokumen
/// buatannya sendiri, dan tidak dapat menyetujui apa pun.
/// </summary>
[Authorize(Roles = AppData.RoleNameKaryawan)]
[Route("api/v1/karyawan/goods-receiving")]
public class GoodsReceivingApiController : BaseGoodsReceivingApiController
{
    public GoodsReceivingApiController(ApplicationDbContext db) : base(db)
    {
    }

    protected override bool CanSeeAllDocuments => false;
}
