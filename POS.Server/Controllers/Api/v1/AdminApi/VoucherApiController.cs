using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.AdminApi;

[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/voucher")]
public class VoucherApiController : BaseApiController
{
    public VoucherApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Voucher";
    }

    #region Query

    [HttpPost("get-list-voucher")]
    public async Task<IActionResult> GetListVoucherAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from item in _db.Voucher
                          select new QueryVoucherModel
                          {
                              IdVoucher = item.IdVoucher,
                              VoucherName = item.VoucherName,
                              VoucherCode = item.VoucherCode,
                              DiscountValueType = item.DiscountValueType,
                              DiscountValue = item.DiscountValue,
                              MinimumPurchase = item.MinimumPurchase,
                              MaximumDiscount = item.MaximumDiscount,
                              StartDate = item.StartDate,
                              EndDate = item.EndDate,
                              UsageLimit = item.UsageLimit,
                              UsageCount = item.UsageCount,
                              IsMemberOnly = item.IsMemberOnly,
                              IsActive = item.IsActive,
                              DateCreated = item.DateCreated,
                              DateModified = item.DateModified,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.VoucherName, searchPhrase)
                || EF.Functions.ILike(x.VoucherCode, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "StartDate Descending, VoucherCode Ascending");
    }

    /// <summary>Daftar voucher aktif untuk keperluan lookup.</summary>
    [HttpPost("get-list-select-voucher")]
    public async Task<IActionResult> GetListSelectVoucherAsync()
    {
        List<SelectListItemModel> listData = await _db.Voucher
            .Where(x => x.IsActive)
            .OrderBy(x => x.VoucherCode)
            .Select(x => new SelectListItemModel { Value = x.IdVoucher, Text = x.VoucherCode, Description = x.VoucherName })
            .ToListAsync();

        return Ok(listData);
    }

    [HttpPost("get-edit")]
    public async Task<IActionResult> GetEditAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        CreateEditVoucherModel? data = await _db.Voucher
            .Where(x => x.IdVoucher == model.Id)
            .Select(x => new CreateEditVoucherModel
            {
                IdVoucher = x.IdVoucher,
                VoucherName = x.VoucherName,
                VoucherCode = x.VoucherCode,
                DiscountValueType = x.DiscountValueType,
                DiscountValue = x.DiscountValue,
                MinimumPurchase = x.MinimumPurchase,
                MaximumDiscount = x.MaximumDiscount,
                StartDate = x.StartDate,
                EndDate = x.EndDate,
                UsageLimit = x.UsageLimit,
                IsMemberOnly = x.IsMemberOnly,
                IsActive = x.IsActive,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        return Ok(data);
    }

    #endregion

    #region Mutation

    [HttpPost("insert-voucher")]
    public async Task<IActionResult> InsertVoucherAsync([FromBody] CreateEditVoucherModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        string? periodMessage = ValidatePeriod(model);

        if (periodMessage != null)
        {
            return BadRequest(periodMessage);
        }

        Voucher entity = new() { CreatedById = CurrentUserId };
        ApplyModel(entity, model);

        _db.Voucher.Add(entity);
        AddAuditLog("INSERT_VOUCHER", entity.IdVoucher, $"Menambah voucher {entity.VoucherName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Kode Voucher"));
        }

        return Ok("Voucher berhasil disimpan.");
    }

    [HttpPost("update-voucher")]
    public async Task<IActionResult> UpdateVoucherAsync([FromBody] CreateEditVoucherModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdVoucher))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Voucher? entity = await _db.Voucher.FindAsync(model.IdVoucher);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string? periodMessage = ValidatePeriod(model);

        if (periodMessage != null)
        {
            return BadRequest(periodMessage);
        }

        string oldValue = $"{entity.VoucherCode} ({(entity.IsActive ? "Aktif" : "Nonaktif")})";

        ApplyModel(entity, model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        AddAuditLog("UPDATE_VOUCHER", entity.IdVoucher, "Mengubah voucher.",
            oldValue, $"{entity.VoucherCode} ({(entity.IsActive ? "Aktif" : "Nonaktif")})");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Kode Voucher"));
        }

        return Ok("Voucher berhasil diperbarui.");
    }

    [HttpPost("delete-voucher")]
    public async Task<IActionResult> DeleteVoucherAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Voucher? entity = await _db.Voucher.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        // Voucher yang sudah pernah dipakai tidak dihapus, karena catatan pemakaiannya
        // masih merujuk ke sini. Admin diarahkan untuk menonaktifkannya saja.
        if (await _db.VoucherUsage.AnyAsync(x => x.IdVoucher == entity.IdVoucher))
        {
            return BadRequest("Voucher ini sudah pernah dipakai transaksi sehingga tidak dapat dihapus. Nonaktifkan saja.");
        }

        _db.Voucher.Remove(entity);
        AddAuditLog("DELETE_VOUCHER", entity.IdVoucher, $"Menghapus voucher {entity.VoucherName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Kode Voucher"));
        }

        return Ok("Voucher berhasil dihapus.");
    }

    /// <summary>Periode dan besaran potongan diperiksa sebelum voucher disimpan.</summary>
    private static string? ValidatePeriod(CreateEditVoucherModel model)
    {
        if (model.EndDate.Date < model.StartDate.Date)
        {
            return "Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.";
        }

        if (model.DiscountValueType == POS.DataLayer.Enums.DiscountValueType.Percentage && model.DiscountValue > 100)
        {
            return "Potongan persentase tidak boleh lebih dari 100 persen.";
        }

        return null;
    }

    /// <summary>Kode voucher disimpan kapital supaya pencocokan tidak bergantung huruf.</summary>
    private static void ApplyModel(Voucher entity, CreateEditVoucherModel model)
    {
        entity.VoucherCode = model.VoucherCode.Trim().ToUpperInvariant();
        entity.VoucherName = model.VoucherName.Trim();
        entity.DiscountValueType = model.DiscountValueType;
        entity.DiscountValue = model.DiscountValue;
        entity.MinimumPurchase = model.MinimumPurchase;
        entity.MaximumDiscount = model.MaximumDiscount;
        entity.StartDate = model.StartDate.Date;
        entity.EndDate = model.EndDate.Date;
        entity.UsageLimit = model.UsageLimit;
        entity.IsMemberOnly = model.IsMemberOnly;
        entity.IsActive = model.IsActive;
    }

    #endregion
}
