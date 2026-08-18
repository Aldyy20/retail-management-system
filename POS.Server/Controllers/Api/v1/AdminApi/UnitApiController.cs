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
[Route("api/v1/admin/unit")]
public class UnitApiController : BaseApiController
{
    public UnitApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Satuan";
    }

    #region Query

    [HttpPost("get-list-unit")]
    public async Task<IActionResult> GetListUnitAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from item in _db.Unit
                          select new QueryUnitModel
                          {
                              IdUnit = item.IdUnit,
                              UnitName = item.UnitName,
                              Description = item.Description,
                              IsActive = item.IsActive,
                              DateCreated = item.DateCreated,
                              DateModified = item.DateModified,
                              TotalProduct = item.ListProduct.Count,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.UnitName, searchPhrase)
                || (x.Description != null && EF.Functions.ILike(x.Description, searchPhrase)));
        }

        return await BuildListResponseAsync(queryResult, model, "UnitName Ascending, IdUnit Ascending");
    }

    /// <summary>Daftar satuan aktif untuk dropdown pada form produk.</summary>
    [HttpPost("get-list-select-unit")]
    public async Task<IActionResult> GetListSelectUnitAsync()
    {
        List<SelectListItemModel> listData = await _db.Unit
            .Where(x => x.IsActive)
            .OrderBy(x => x.UnitName)
            .Select(x => new SelectListItemModel { Value = x.IdUnit, Text = x.UnitName })
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

        CreateEditUnitModel? data = await _db.Unit
            .Where(x => x.IdUnit == model.Id)
            .Select(x => new CreateEditUnitModel
            {
                IdUnit = x.IdUnit,
                UnitName = x.UnitName,
                Description = x.Description,
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

    [HttpPost("insert-unit")]
    public async Task<IActionResult> InsertUnitAsync([FromBody] CreateEditUnitModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Unit entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);

        _db.Unit.Add(entity);
        AddAuditLog("INSERT_UNIT", entity.IdUnit, $"Menambah satuan {entity.UnitName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Satuan"));
        }

        return Ok("Satuan berhasil disimpan.");
    }

    [HttpPost("update-unit")]
    public async Task<IActionResult> UpdateUnitAsync([FromBody] CreateEditUnitModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdUnit))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Unit? entity = await _db.Unit.FindAsync(model.IdUnit);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string oldValue = $"{entity.UnitName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})";

        entity.ApplyCreateEdit(model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        AddAuditLog("UPDATE_UNIT", entity.IdUnit, "Mengubah satuan.",
            oldValue, $"{entity.UnitName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Satuan"));
        }

        return Ok("Satuan berhasil diperbarui.");
    }

    [HttpPost("delete-unit")]
    public async Task<IActionResult> DeleteUnitAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Unit? entity = await _db.Unit.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        // Satuan yang sudah dipakai produk tidak dihapus fisik, karena produk lama
        // akan kehilangan acuannya. Admin diarahkan untuk menonaktifkan saja (PRD bagian 10).
        bool isUsed = await _db.Product.AnyAsync(x => x.IdUnit == entity.IdUnit);

        if (isUsed)
        {
            return BadRequest(AppErrorMessages.ErrorDataInUse(EntityName));
        }

        _db.Unit.Remove(entity);
        AddAuditLog("DELETE_UNIT", entity.IdUnit, $"Menghapus satuan {entity.UnitName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Satuan"));
        }

        return Ok("Satuan berhasil dihapus.");
    }

    #endregion
}
