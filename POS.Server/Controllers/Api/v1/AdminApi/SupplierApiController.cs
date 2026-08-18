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
[Route("api/v1/admin/supplier")]
public class SupplierApiController : BaseApiController
{
    public SupplierApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Supplier";
    }

    #region Query

    [HttpPost("get-list-supplier")]
    public async Task<IActionResult> GetListSupplierAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from item in _db.Supplier
                          select new QuerySupplierModel
                          {
                              IdSupplier = item.IdSupplier,
                              SupplierName = item.SupplierName,
                              ContactName = item.ContactName,
                              PhoneNumber = item.PhoneNumber,
                              Email = item.Email,
                              Address = item.Address,
                              IsActive = item.IsActive,
                              DateCreated = item.DateCreated,
                              DateModified = item.DateModified,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.SupplierName, searchPhrase)
                || (x.ContactName != null && EF.Functions.ILike(x.ContactName, searchPhrase))
                || (x.PhoneNumber != null && EF.Functions.ILike(x.PhoneNumber, searchPhrase)));
        }

        return await BuildListResponseAsync(queryResult, model, "SupplierName Ascending, IdSupplier Ascending");
    }

    /// <summary>Daftar supplier aktif untuk dropdown pada form barang masuk.</summary>
    [HttpPost("get-list-select-supplier")]
    public async Task<IActionResult> GetListSelectSupplierAsync()
    {
        List<SelectListItemModel> listData = await _db.Supplier
            .Where(x => x.IsActive)
            .OrderBy(x => x.SupplierName)
            .Select(x => new SelectListItemModel { Value = x.IdSupplier, Text = x.SupplierName, Description = x.PhoneNumber })
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

        CreateEditSupplierModel? data = await _db.Supplier
            .Where(x => x.IdSupplier == model.Id)
            .Select(x => new CreateEditSupplierModel
            {
                IdSupplier = x.IdSupplier,
                SupplierName = x.SupplierName,
                ContactName = x.ContactName,
                PhoneNumber = x.PhoneNumber,
                Email = x.Email,
                Address = x.Address,
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

    [HttpPost("insert-supplier")]
    public async Task<IActionResult> InsertSupplierAsync([FromBody] CreateEditSupplierModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Supplier entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);

        _db.Supplier.Add(entity);
        AddAuditLog("INSERT_SUPPLIER", entity.IdSupplier, $"Menambah supplier {entity.SupplierName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Supplier"));
        }

        return Ok("Supplier berhasil disimpan.");
    }

    [HttpPost("update-supplier")]
    public async Task<IActionResult> UpdateSupplierAsync([FromBody] CreateEditSupplierModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdSupplier))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Supplier? entity = await _db.Supplier.FindAsync(model.IdSupplier);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string oldValue = $"{entity.SupplierName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})";

        entity.ApplyCreateEdit(model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        AddAuditLog("UPDATE_SUPPLIER", entity.IdSupplier, "Mengubah supplier.",
            oldValue, $"{entity.SupplierName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Supplier"));
        }

        return Ok("Supplier berhasil diperbarui.");
    }

    [HttpPost("delete-supplier")]
    public async Task<IActionResult> DeleteSupplierAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Supplier? entity = await _db.Supplier.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        _db.Supplier.Remove(entity);
        AddAuditLog("DELETE_SUPPLIER", entity.IdSupplier, $"Menghapus supplier {entity.SupplierName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Supplier"));
        }

        return Ok("Supplier berhasil dihapus.");
    }

    #endregion
}
