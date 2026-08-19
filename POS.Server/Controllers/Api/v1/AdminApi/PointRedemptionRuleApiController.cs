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
[Route("api/v1/admin/point-redemption-rule")]
public class PointRedemptionRuleApiController : BaseApiController
{
    public PointRedemptionRuleApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Aturan Penukaran Point";
    }

    #region Query

    [HttpPost("get-list-point-redemption-rule")]
    public async Task<IActionResult> GetListPointRedemptionRuleAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from item in _db.PointRedemptionRule
                          select new QueryPointRedemptionRuleModel
                          {
                              IdPointRedemptionRule = item.IdPointRedemptionRule,
                              RuleName = item.RuleName,
                              PointRequired = item.PointRequired,
                              DiscountValueType = item.DiscountValueType,
                              DiscountValue = item.DiscountValue,
                              MaximumDiscount = item.MaximumDiscount,
                              MinimumPurchase = item.MinimumPurchase,
                              IsActive = item.IsActive,
                              DateCreated = item.DateCreated,
                              DateModified = item.DateModified,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x => EF.Functions.ILike(x.RuleName, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "PointRequired Ascending, RuleName Ascending");
    }

    /// <summary>Daftar aturan aktif untuk dropdown.</summary>
    [HttpPost("get-list-select-point-redemption-rule")]
    public async Task<IActionResult> GetListSelectPointRedemptionRuleAsync()
    {
        List<SelectListItemModel> listData = await _db.PointRedemptionRule
            .Where(x => x.IsActive)
            .Select(x => new SelectListItemModel { Value = x.IdPointRedemptionRule, Text = x.RuleName })
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

        CreateEditPointRedemptionRuleModel? data = await _db.PointRedemptionRule
            .Where(x => x.IdPointRedemptionRule == model.Id)
            .Select(x => new CreateEditPointRedemptionRuleModel
            {
                IdPointRedemptionRule = x.IdPointRedemptionRule,
                RuleName = x.RuleName,
                PointRequired = x.PointRequired,
                DiscountValueType = x.DiscountValueType,
                DiscountValue = x.DiscountValue,
                MaximumDiscount = x.MaximumDiscount,
                MinimumPurchase = x.MinimumPurchase,
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

    [HttpPost("insert-point-redemption-rule")]
    public async Task<IActionResult> InsertPointRedemptionRuleAsync([FromBody] CreateEditPointRedemptionRuleModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        PointRedemptionRule entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);

        _db.PointRedemptionRule.Add(entity);
        AddAuditLog("INSERT_POINT_RULE", entity.IdPointRedemptionRule, $"Menambah aturan penukaran point {entity.RuleName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Aturan"));
        }

        return Ok("Aturan berhasil disimpan.");
    }

    [HttpPost("update-point-redemption-rule")]
    public async Task<IActionResult> UpdatePointRedemptionRuleAsync([FromBody] CreateEditPointRedemptionRuleModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdPointRedemptionRule))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        PointRedemptionRule? entity = await _db.PointRedemptionRule.FindAsync(model.IdPointRedemptionRule);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string oldValue = $"{entity.RuleName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})";

        entity.ApplyCreateEdit(model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        AddAuditLog("UPDATE_POINT_RULE", entity.IdPointRedemptionRule, "Mengubah aturan penukaran point.",
            oldValue, $"{entity.RuleName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Aturan"));
        }

        return Ok("Aturan berhasil diperbarui.");
    }

    [HttpPost("delete-point-redemption-rule")]
    public async Task<IActionResult> DeletePointRedemptionRuleAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        PointRedemptionRule? entity = await _db.PointRedemptionRule.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        _db.PointRedemptionRule.Remove(entity);
        AddAuditLog("DELETE_POINT_RULE", entity.IdPointRedemptionRule, $"Menghapus aturan penukaran point {entity.RuleName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Aturan"));
        }

        return Ok("Aturan berhasil dihapus.");
    }

    #endregion
}
