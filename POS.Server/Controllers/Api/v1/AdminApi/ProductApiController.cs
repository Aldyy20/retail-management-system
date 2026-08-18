using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.DataLayer.Services;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.AdminApi;

/// <summary>
/// Metadata form produk. Kategori dan satuan ikut dikirim bersama data produk supaya
/// halaman form cukup satu kali memanggil server.
/// </summary>
public class ProductFormModel
{
    public List<SelectListItemModel> ListCategory { get; set; } = [];
    public List<SelectListItemModel> ListUnit { get; set; } = [];
    public CreateEditProductModel? Data { get; set; }
}

[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/product")]
public class ProductApiController : BaseApiController
{
    public ProductApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Produk";
    }

    #region Query

    [HttpPost("get-list-product")]
    public async Task<IActionResult> GetListProductAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from item in _db.Product
                          select new QueryProductModel
                          {
                              IdProduct = item.IdProduct,
                              Sku = item.Sku,
                              Barcode = item.Barcode,
                              ProductName = item.ProductName,
                              Description = item.Description,
                              IdCategory = item.IdCategory,
                              IdUnit = item.IdUnit,
                              CategoryName = item.Category!.CategoryName,
                              UnitName = item.Unit!.UnitName,
                              CostPrice = item.CostPrice,
                              SellingPrice = item.SellingPrice,
                              MinimumStock = item.MinimumStock,
                              IsActive = item.IsActive,
                              DateCreated = item.DateCreated,
                              DateModified = item.DateModified,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.ProductName, searchPhrase)
                || EF.Functions.ILike(x.Sku, searchPhrase)
                || (x.Barcode != null && EF.Functions.ILike(x.Barcode, searchPhrase))
                || EF.Functions.ILike(x.CategoryName, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "ProductName Ascending, IdProduct Ascending");
    }

    [HttpPost("get-create")]
    public async Task<IActionResult> GetCreateAsync()
    {
        return Ok(new ProductFormModel
        {
            ListCategory = await GetListCategoryAsync(),
            ListUnit = await GetListUnitAsync(),
            Data = new CreateEditProductModel
            {
                MinimumStock = await GlobalList.GetSettingIntAsync(_db, AppData.SettingInventoryDefaultMinStock),
            },
        });
    }

    [HttpPost("get-edit")]
    public async Task<IActionResult> GetEditAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        CreateEditProductModel? data = await _db.Product
            .Where(x => x.IdProduct == model.Id)
            .Select(x => new CreateEditProductModel
            {
                IdProduct = x.IdProduct,
                Sku = x.Sku,
                Barcode = x.Barcode,
                ProductName = x.ProductName,
                Description = x.Description,
                IdCategory = x.IdCategory,
                IdUnit = x.IdUnit,
                CostPrice = x.CostPrice,
                SellingPrice = x.SellingPrice,
                MinimumStock = x.MinimumStock,
                IsActive = x.IsActive,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        return Ok(new ProductFormModel
        {
            ListCategory = await GetListCategoryAsync(),
            ListUnit = await GetListUnitAsync(),
            Data = data,
        });
    }

    [HttpPost("get-details")]
    public async Task<IActionResult> GetDetailsAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        DetailsProductModel? data = await _db.Product
            .Where(x => x.IdProduct == model.Id)
            .Select(x => new DetailsProductModel
            {
                IdProduct = x.IdProduct,
                Sku = x.Sku,
                Barcode = x.Barcode,
                ProductName = x.ProductName,
                Description = x.Description,
                IdCategory = x.IdCategory,
                IdUnit = x.IdUnit,
                CategoryName = x.Category!.CategoryName,
                UnitName = x.Unit!.UnitName,
                CostPrice = x.CostPrice,
                SellingPrice = x.SellingPrice,
                MinimumStock = x.MinimumStock,
                IsActive = x.IsActive,
                DateCreated = x.DateCreated,
                DateModified = x.DateModified,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        data.ListPriceHistory = await (
            from history in _db.PriceHistory
            join user in _db.Users on history.CreatedById equals user.Id into userGroup
            from user in userGroup.DefaultIfEmpty()
            where history.IdProduct == model.Id
            orderby history.DateCreated descending
            select new QueryPriceHistoryModel
            {
                IdPriceHistory = history.IdPriceHistory,
                IdProduct = history.IdProduct,
                CostPrice = history.CostPrice,
                SellingPrice = history.SellingPrice,
                PreviousCostPrice = history.PreviousCostPrice,
                PreviousSellingPrice = history.PreviousSellingPrice,
                Note = history.Note,
                IsInitialPrice = history.IsInitialPrice,
                DateCreated = history.DateCreated,
                CreatedBy = user != null ? user.FullName : null,
            })
            .Take(50)
            .ToListAsync();

        return Ok(data);
    }

    private async Task<List<SelectListItemModel>> GetListCategoryAsync()
    {
        return await _db.Category
            .Where(x => x.IsActive)
            .OrderBy(x => x.CategoryName)
            .Select(x => new SelectListItemModel { Value = x.IdCategory, Text = x.CategoryName })
            .ToListAsync();
    }

    private async Task<List<SelectListItemModel>> GetListUnitAsync()
    {
        return await _db.Unit
            .Where(x => x.IsActive)
            .OrderBy(x => x.UnitName)
            .Select(x => new SelectListItemModel { Value = x.IdUnit, Text = x.UnitName })
            .ToListAsync();
    }

    #endregion

    #region Mutation

    [HttpPost("insert-product")]
    public async Task<IActionResult> InsertProductAsync([FromBody] CreateEditProductModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        string? validationMessage = await ValidateReferenceAsync(model);

        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        Product entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);
        entity.Sku = string.IsNullOrWhiteSpace(model.Sku) ? await GenerateSkuAsync() : model.Sku.Trim().ToUpperInvariant();

        _db.Product.Add(entity);

        // Harga awal ikut tercatat sebagai histori, sehingga setiap produk punya
        // titik awal yang jelas saat harganya nanti berubah.
        _db.PriceHistory.Add(new PriceHistory
        {
            IdProduct = entity.IdProduct,
            CostPrice = entity.CostPrice,
            SellingPrice = entity.SellingPrice,
            Note = "Harga awal saat produk dibuat.",
            IsInitialPrice = true,
            CreatedById = CurrentUserId,
        });

        AddAuditLog("INSERT_PRODUCT", entity.IdProduct, $"Menambah produk {entity.ProductName} ({entity.Sku}).");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "SKU atau Barcode"));
        }

        return Ok("Produk berhasil disimpan.");
    }

    [HttpPost("update-product")]
    public async Task<IActionResult> UpdateProductAsync([FromBody] CreateEditProductModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdProduct))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        string? validationMessage = await ValidateReferenceAsync(model);

        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        Product? entity = await _db.Product.FindAsync(model.IdProduct);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        decimal previousCostPrice = entity.CostPrice;
        decimal previousSellingPrice = entity.SellingPrice;
        string oldValue = $"Modal {previousCostPrice.ToStrMoney()}, Jual {previousSellingPrice.ToStrMoney()}";

        entity.ApplyCreateEdit(model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        // SKU tidak boleh berubah setelah produk terbentuk, karena sudah dipakai
        // sebagai acuan pada nota dan catatan pergerakan stok.
        bool isPriceChanged = previousCostPrice != entity.CostPrice || previousSellingPrice != entity.SellingPrice;

        if (isPriceChanged)
        {
            _db.PriceHistory.Add(new PriceHistory
            {
                IdProduct = entity.IdProduct,
                CostPrice = entity.CostPrice,
                SellingPrice = entity.SellingPrice,
                PreviousCostPrice = previousCostPrice,
                PreviousSellingPrice = previousSellingPrice,
                Note = string.IsNullOrWhiteSpace(model.PriceChangeNote) ? null : model.PriceChangeNote.Trim(),
                CreatedById = CurrentUserId,
            });
        }

        AddAuditLog("UPDATE_PRODUCT", entity.IdProduct, $"Mengubah produk {entity.ProductName}.",
            oldValue, $"Modal {entity.CostPrice.ToStrMoney()}, Jual {entity.SellingPrice.ToStrMoney()}");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "SKU atau Barcode"));
        }

        return Ok(isPriceChanged
            ? "Produk berhasil diperbarui. Perubahan harga tercatat pada histori."
            : "Produk berhasil diperbarui.");
    }

    [HttpPost("delete-product")]
    public async Task<IActionResult> DeleteProductAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Product? entity = await _db.Product.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        _db.Product.Remove(entity);
        AddAuditLog("DELETE_PRODUCT", entity.IdProduct, $"Menghapus produk {entity.ProductName} ({entity.Sku}).");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "SKU"));
        }

        return Ok("Produk berhasil dihapus.");
    }

    /// <summary>
    /// Memastikan kategori dan satuan yang dipilih benar ada dan masih aktif.
    /// Frontend mengirim id, dan id itu tidak boleh dipercaya begitu saja.
    /// </summary>
    private async Task<string?> ValidateReferenceAsync(CreateEditProductModel model)
    {
        bool isCategoryValid = await _db.Category.AnyAsync(x => x.IdCategory == model.IdCategory && x.IsActive);

        if (!isCategoryValid)
        {
            return "Kategori yang dipilih tidak ditemukan atau sedang dinonaktifkan.";
        }

        bool isUnitValid = await _db.Unit.AnyAsync(x => x.IdUnit == model.IdUnit && x.IsActive);

        if (!isUnitValid)
        {
            return "Satuan yang dipilih tidak ditemukan atau sedang dinonaktifkan.";
        }

        if (model.SellingPrice < model.CostPrice)
        {
            return "Harga jual lebih rendah dari harga modal. Periksa kembali angkanya.";
        }

        return null;
    }

    /// <summary>
    /// Membuat SKU berurut dengan pola PRD-00001.
    /// ponytail: nomor diambil dari baris terakhir, bukan dari sequence database.
    /// Kalau dua admin menyimpan pada detik yang sama, index unik pada kolom Sku yang
    /// menolak duplikatnya. Pindahkan ke sequence PostgreSQL kalau itu jadi sering terjadi.
    /// </summary>
    private async Task<string> GenerateSkuAsync()
    {
        string? lastSku = await _db.Product
            .Where(x => x.Sku.StartsWith("PRD-"))
            .OrderByDescending(x => x.Sku)
            .Select(x => x.Sku)
            .FirstOrDefaultAsync();

        int nextNumber = 1;

        if (lastSku != null && int.TryParse(lastSku[4..], out int lastNumber))
        {
            nextNumber = lastNumber + 1;
        }

        return $"PRD-{nextNumber:D5}";
    }

    #endregion
}
