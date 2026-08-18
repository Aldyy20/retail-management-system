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
[Route("api/v1/admin/category")]
public class CategoryApiController : BaseApiController
{
    public CategoryApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Kategori";
    }

    #region Query

    [HttpPost("get-list-category")]
    public async Task<IActionResult> GetListCategoryAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from category in _db.Category
                          select new QueryCategoryModel
                          {
                              IdCategory = category.IdCategory,
                              CategoryName = category.CategoryName,
                              Description = category.Description,
                              IsActive = category.IsActive,
                              DateCreated = category.DateCreated,
                              DateModified = category.DateModified,
                              TotalProduct = category.ListProduct.Count,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.CategoryName, searchPhrase)
                || (x.Description != null && EF.Functions.ILike(x.Description, searchPhrase)));
        }

        return await BuildListResponseAsync(queryResult, model, "CategoryName Ascending, IdCategory Ascending");
    }

    /// <summary>Daftar kategori aktif untuk dropdown pada form produk.</summary>
    [HttpPost("get-list-select-category")]
    public async Task<IActionResult> GetListSelectCategoryAsync()
    {
        List<SelectListItemModel> listData = await _db.Category
            .Where(x => x.IsActive)
            .OrderBy(x => x.CategoryName)
            .Select(x => new SelectListItemModel { Value = x.IdCategory, Text = x.CategoryName })
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

        CreateEditCategoryModel? data = await _db.Category
            .Where(x => x.IdCategory == model.Id)
            .Select(x => new CreateEditCategoryModel
            {
                IdCategory = x.IdCategory,
                CategoryName = x.CategoryName,
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

    [HttpPost("insert-category")]
    public async Task<IActionResult> InsertCategoryAsync([FromBody] CreateEditCategoryModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Category entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);

        _db.Category.Add(entity);
        AddAuditLog("INSERT_CATEGORY", entity.IdCategory, $"Menambah kategori {entity.CategoryName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Kategori"));
        }

        return Ok("Kategori berhasil disimpan.");
    }

    [HttpPost("update-category")]
    public async Task<IActionResult> UpdateCategoryAsync([FromBody] CreateEditCategoryModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdCategory))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Category? entity = await _db.Category.FindAsync(model.IdCategory);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string oldValue = $"{entity.CategoryName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})";

        entity.ApplyCreateEdit(model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        AddAuditLog("UPDATE_CATEGORY", entity.IdCategory, "Mengubah kategori.",
            oldValue, $"{entity.CategoryName} ({(entity.IsActive ? "Aktif" : "Nonaktif")})");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Kategori"));
        }

        return Ok("Kategori berhasil diperbarui.");
    }

    [HttpPost("delete-category")]
    public async Task<IActionResult> DeleteCategoryAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Category? entity = await _db.Category.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        // Kategori yang sudah dipakai produk tidak dihapus fisik, karena produk lama
        // akan kehilangan acuannya. Admin diarahkan untuk menonaktifkan saja.
        bool isUsed = await _db.Product.AnyAsync(x => x.IdCategory == entity.IdCategory);

        if (isUsed)
        {
            return BadRequest(AppErrorMessages.ErrorDataInUse(EntityName));
        }

        _db.Category.Remove(entity);
        AddAuditLog("DELETE_CATEGORY", entity.IdCategory, $"Menghapus kategori {entity.CategoryName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Kategori"));
        }

        return Ok("Kategori berhasil dihapus.");
    }

    #endregion
}
