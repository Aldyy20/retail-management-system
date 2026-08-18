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
[Route("api/v1/admin/warehouse")]
public class WarehouseApiController : BaseApiController
{
    public WarehouseApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Gudang";
    }

    #region Query

    [HttpPost("get-list-warehouse")]
    public async Task<IActionResult> GetListWarehouseAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from item in _db.Warehouse
                          select new QueryWarehouseModel
                          {
                              IdWarehouse = item.IdWarehouse,
                              WarehouseCode = item.WarehouseCode,
                              WarehouseName = item.WarehouseName,
                              Address = item.Address,
                              Description = item.Description,
                              IsDefault = item.IsDefault,
                              IsActive = item.IsActive,
                              DateCreated = item.DateCreated,
                              DateModified = item.DateModified,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.WarehouseCode, searchPhrase)
                || EF.Functions.ILike(x.WarehouseName, searchPhrase)
                || (x.Address != null && EF.Functions.ILike(x.Address, searchPhrase)));
        }

        // Gudang utama selalu di baris pertama agar mudah dikenali.
        return await BuildListResponseAsync(queryResult, model,
            "IsDefault Descending, WarehouseName Ascending, IdWarehouse Ascending");
    }

    /// <summary>Daftar gudang aktif untuk dropdown barang masuk dan stock opname.</summary>
    [HttpPost("get-list-select-warehouse")]
    public async Task<IActionResult> GetListSelectWarehouseAsync()
    {
        List<SelectListItemModel> listData = await _db.Warehouse
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.WarehouseName)
            .Select(x => new SelectListItemModel
            {
                Value = x.IdWarehouse,
                Text = x.WarehouseName,
                Description = x.IsDefault ? "Gudang utama" : x.WarehouseCode,
            })
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

        CreateEditWarehouseModel? data = await _db.Warehouse
            .Where(x => x.IdWarehouse == model.Id)
            .Select(x => new CreateEditWarehouseModel
            {
                IdWarehouse = x.IdWarehouse,
                WarehouseCode = x.WarehouseCode,
                WarehouseName = x.WarehouseName,
                Address = x.Address,
                Description = x.Description,
                IsDefault = x.IsDefault,
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

    [HttpPost("insert-warehouse")]
    public async Task<IActionResult> InsertWarehouseAsync([FromBody] CreateEditWarehouseModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Warehouse entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);

        // Gudang pertama otomatis menjadi gudang utama, supaya sistem selalu punya
        // tujuan bawaan untuk barang masuk dan transaksi kasir.
        bool hasAnyWarehouse = await _db.Warehouse.AnyAsync();
        entity.IsDefault = hasAnyWarehouse ? model.IsDefault : true;

        if (entity.IsDefault)
        {
            await ClearOtherDefaultAsync(entity.IdWarehouse);
        }

        _db.Warehouse.Add(entity);
        AddAuditLog("INSERT_WAREHOUSE", entity.IdWarehouse, $"Menambah gudang {entity.WarehouseName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Kode Gudang"));
        }

        return Ok("Gudang berhasil disimpan.");
    }

    [HttpPost("update-warehouse")]
    public async Task<IActionResult> UpdateWarehouseAsync([FromBody] CreateEditWarehouseModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdWarehouse))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Warehouse? entity = await _db.Warehouse.FindAsync(model.IdWarehouse);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        // Status gudang utama tidak boleh dilepas begitu saja, karena sistem akan
        // kehilangan tujuan bawaannya. Penggantinya ditunjuk lebih dulu dari gudang lain.
        if (entity.IsDefault && !model.IsDefault)
        {
            return BadRequest("Tetapkan gudang lain sebagai gudang utama lebih dulu sebelum melepas status ini.");
        }

        if (entity.IsDefault && !model.IsActive)
        {
            return BadRequest("Gudang utama tidak dapat dinonaktifkan. Pindahkan status gudang utama lebih dulu.");
        }

        string oldValue = $"{entity.WarehouseCode} - {entity.WarehouseName}";
        bool wasDefault = entity.IsDefault;

        entity.ApplyCreateEdit(model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        if (model.IsDefault && !wasDefault)
        {
            await ClearOtherDefaultAsync(entity.IdWarehouse);
        }

        entity.IsDefault = model.IsDefault;

        AddAuditLog("UPDATE_WAREHOUSE", entity.IdWarehouse, "Mengubah gudang.",
            oldValue, $"{entity.WarehouseCode} - {entity.WarehouseName}");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Kode Gudang"));
        }

        return Ok("Gudang berhasil diperbarui.");
    }

    [HttpPost("delete-warehouse")]
    public async Task<IActionResult> DeleteWarehouseAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Warehouse? entity = await _db.Warehouse.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (entity.IsDefault)
        {
            return BadRequest("Gudang utama tidak dapat dihapus. Tetapkan gudang lain sebagai gudang utama lebih dulu.");
        }

        _db.Warehouse.Remove(entity);
        AddAuditLog("DELETE_WAREHOUSE", entity.IdWarehouse, $"Menghapus gudang {entity.WarehouseName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Kode Gudang"));
        }

        return Ok("Gudang berhasil dihapus.");
    }

    /// <summary>
    /// Melepas status gudang utama dari gudang lain. Database menegakkan aturan
    /// hanya satu gudang utama lewat index tersaring, jadi pelepasan ini harus
    /// dijalankan sebelum perubahan disimpan.
    /// </summary>
    private async Task ClearOtherDefaultAsync(string idWarehouse)
    {
        List<Warehouse> listOther = await _db.Warehouse
            .Where(x => x.IsDefault && x.IdWarehouse != idWarehouse)
            .ToListAsync();

        foreach (Warehouse other in listOther)
        {
            other.IsDefault = false;
        }
    }

    #endregion
}
