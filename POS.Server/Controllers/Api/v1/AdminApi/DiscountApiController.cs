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

public class DiscountFormModel
{
    public List<ProductLookupModel> ListProduct { get; set; } = [];
    public CreateEditDiscountModel? Data { get; set; }
}

[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/discount")]
public class DiscountApiController : BaseApiController
{
    public DiscountApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Diskon";
    }

    #region Query

    [HttpPost("get-list-discount")]
    public async Task<IActionResult> GetListDiscountAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from discount in _db.Discount
                          select new QueryDiscountModel
                          {
                              IdDiscount = discount.IdDiscount,
                              DiscountName = discount.DiscountName,
                              DiscountValueType = discount.DiscountValueType,
                              DiscountValue = discount.DiscountValue,
                              MaximumDiscount = discount.MaximumDiscount,
                              StartDate = discount.StartDate,
                              EndDate = discount.EndDate,
                              IsActive = discount.IsActive,
                              DateCreated = discount.DateCreated,
                              DateModified = discount.DateModified,
                              TotalProduct = discount.ListProduct.Count,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x => EF.Functions.ILike(x.DiscountName, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "StartDate Descending, DiscountName Ascending");
    }

    [HttpPost("get-create")]
    public async Task<IActionResult> GetCreateAsync()
    {
        return Ok(new DiscountFormModel
        {
            ListProduct = await GetListProductAsync(),
            Data = new CreateEditDiscountModel
            {
                StartDate = DateTime.Now.Date,
                EndDate = DateTime.Now.Date.AddDays(7),
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

        Discount? entity = await _db.Discount
            .Include(x => x.ListProduct)
            .FirstOrDefaultAsync(x => x.IdDiscount == model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        return Ok(new DiscountFormModel
        {
            ListProduct = await GetListProductAsync(),
            Data = new CreateEditDiscountModel
            {
                IdDiscount = entity.IdDiscount,
                DiscountName = entity.DiscountName,
                DiscountValueType = entity.DiscountValueType,
                DiscountValue = entity.DiscountValue,
                MaximumDiscount = entity.MaximumDiscount,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                IsActive = entity.IsActive,
                ListIdProduct = entity.ListProduct.Select(x => x.IdProduct).ToList(),
            },
        });
    }

    private async Task<List<ProductLookupModel>> GetListProductAsync()
    {
        return await _db.Product
            .Where(x => x.IsActive)
            .OrderBy(x => x.ProductName)
            .Select(x => new ProductLookupModel
            {
                IdProduct = x.IdProduct,
                Sku = x.Sku,
                ProductName = x.ProductName,
                UnitName = x.Unit!.UnitName,
                SellingPrice = x.SellingPrice,
                CostPrice = x.CostPrice,
            })
            .ToListAsync();
    }

    #endregion

    #region Mutation

    [HttpPost("insert-discount")]
    public async Task<IActionResult> InsertDiscountAsync([FromBody] CreateEditDiscountModel model)
    {
        string? validationMessage = await ValidateAsync(model);

        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        Discount entity = new() { CreatedById = CurrentUserId };
        ApplyModel(entity, model!);

        _db.Discount.Add(entity);
        AddAuditLog("INSERT_DISCOUNT", entity.IdDiscount,
            $"Menambah diskon {entity.DiscountName} untuk {entity.ListProduct.Count} produk.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Diskon"));
        }

        return Ok("Diskon berhasil disimpan.");
    }

    [HttpPost("update-discount")]
    public async Task<IActionResult> UpdateDiscountAsync([FromBody] CreateEditDiscountModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdDiscount))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        string? validationMessage = await ValidateAsync(model);

        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        Discount? entity = await _db.Discount
            .Include(x => x.ListProduct)
            .FirstOrDefaultAsync(x => x.IdDiscount == model.IdDiscount);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string oldValue = $"{entity.DiscountName}, {entity.ListProduct.Count} produk";

        _db.DiscountProduct.RemoveRange(entity.ListProduct);
        entity.ListProduct.Clear();
        ApplyModel(entity, model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        AddAuditLog("UPDATE_DISCOUNT", entity.IdDiscount, "Mengubah diskon.",
            oldValue, $"{entity.DiscountName}, {entity.ListProduct.Count} produk");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nama Diskon"));
        }

        return Ok("Diskon berhasil diperbarui.");
    }

    [HttpPost("delete-discount")]
    public async Task<IActionResult> DeleteDiscountAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Discount? entity = await _db.Discount.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        _db.Discount.Remove(entity);
        AddAuditLog("DELETE_DISCOUNT", entity.IdDiscount, $"Menghapus diskon {entity.DiscountName}.");
        await _db.SaveChangesAsync();

        return Ok("Diskon berhasil dihapus.");
    }

    /// <summary>
    /// Memeriksa periode dan produk yang dipilih. Id produk dari frontend tidak pernah
    /// dipercaya begitu saja.
    /// </summary>
    private async Task<string?> ValidateAsync(CreateEditDiscountModel? model)
    {
        if (model == null)
        {
            return AppErrorMessages.ErrorEmptyParameterWithName("model");
        }

        if (!ModelState.IsValid)
        {
            return GetModelStateErrorMessage();
        }

        if (model.EndDate.Date < model.StartDate.Date)
        {
            return "Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.";
        }

        if (model.DiscountValueType == POS.DataLayer.Enums.DiscountValueType.Percentage && model.DiscountValue > 100)
        {
            return "Potongan persentase tidak boleh lebih dari 100 persen.";
        }

        if (model.ListIdProduct.Count == 0)
        {
            return "Pilih minimal satu produk yang terkena diskon ini.";
        }

        string[] productIds = model.ListIdProduct.Distinct().ToArray();
        int activeProductCount = await _db.Product.CountAsync(x => productIds.Contains(x.IdProduct) && x.IsActive);

        if (activeProductCount != productIds.Length)
        {
            return "Ada produk yang tidak ditemukan atau sedang dinonaktifkan. Muat ulang halaman lalu coba lagi.";
        }

        return null;
    }

    private static void ApplyModel(Discount entity, CreateEditDiscountModel model)
    {
        entity.DiscountName = model.DiscountName.Trim();
        entity.DiscountValueType = model.DiscountValueType;
        entity.DiscountValue = model.DiscountValue;
        entity.MaximumDiscount = model.MaximumDiscount;
        entity.StartDate = model.StartDate.Date;
        entity.EndDate = model.EndDate.Date;
        entity.IsActive = model.IsActive;

        foreach (string idProduct in model.ListIdProduct.Distinct())
        {
            entity.ListProduct.Add(new DiscountProduct
            {
                IdDiscount = entity.IdDiscount,
                IdProduct = idProduct,
            });
        }
    }

    #endregion
}
