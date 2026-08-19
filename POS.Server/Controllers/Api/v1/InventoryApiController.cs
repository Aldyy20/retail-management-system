using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1;

public class GetListInventoryRequestModel : BaseGetListRequestModel
{
    /// <summary>Kosong berarti seluruh gudang.</summary>
    public string? IdWarehouse { get; set; }

    /// <summary>aman, menipis, atau habis. Kosong berarti semua kondisi stok.</summary>
    public string? StockStatus { get; set; }
}

public class GetListStockMovementRequestModel : BaseGetListRequestModel
{
    public string? IdProduct { get; set; }
    public string? IdWarehouse { get; set; }
}

/// <summary>
/// Tampilan stok dan riwayat pergerakannya. Seluruh role yang sudah masuk boleh membacanya
/// karena isinya sama untuk semua, dan tidak ada endpoint yang mengubah stok di sini.
/// Perubahan stok hanya berasal dari barang masuk, stock opname, dan transaksi kasir.
/// </summary>
[Authorize]
[Route("api/v1/inventory")]
public class InventoryApiController : BaseApiController
{
    public InventoryApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Stok";
    }

    [HttpPost("get-list-inventory")]
    public async Task<IActionResult> GetListInventoryAsync([FromBody] GetListInventoryRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        // Produk tanpa baris stok tetap muncul dengan nilai nol, supaya barang yang belum
        // pernah masuk gudang tidak menghilang dari daftar.
        var queryResult = from product in _db.Product
                          from warehouse in _db.Warehouse.Where(x => x.IsActive)
                          join inventory in _db.Inventory
                              on new { product.IdProduct, warehouse.IdWarehouse }
                              equals new { inventory.IdProduct, inventory.IdWarehouse } into inventoryGroup
                          from inventory in inventoryGroup.DefaultIfEmpty()
                          where product.IsActive
                          select new QueryInventoryModel
                          {
                              IdInventory = inventory != null ? inventory.IdInventory : string.Empty,
                              IdProduct = product.IdProduct,
                              IdWarehouse = warehouse.IdWarehouse,
                              Quantity = inventory != null ? inventory.Quantity : 0,
                              DateModified = inventory != null ? inventory.DateModified : null,
                              Sku = product.Sku,
                              Barcode = product.Barcode,
                              ProductName = product.ProductName,
                              CategoryName = product.Category!.CategoryName,
                              UnitName = product.Unit!.UnitName,
                              WarehouseName = warehouse.WarehouseName,
                              MinimumStock = product.MinimumStock,
                              CostPrice = product.CostPrice,
                              SellingPrice = product.SellingPrice,
                          };

        if (!string.IsNullOrWhiteSpace(model.IdWarehouse))
        {
            queryResult = queryResult.Where(x => x.IdWarehouse == model.IdWarehouse);
        }

        // Penyaringan kondisi stok dilakukan di database agar penomoran halaman tetap benar.
        queryResult = model.StockStatus switch
        {
            "habis" => queryResult.Where(x => x.Quantity <= 0),
            "menipis" => queryResult.Where(x => x.Quantity > 0 && x.Quantity <= x.MinimumStock),
            "aman" => queryResult.Where(x => x.Quantity > x.MinimumStock),
            _ => queryResult,
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

        return await BuildListResponseAsync(queryResult, model, "ProductName Ascending, WarehouseName Ascending");
    }

    [HttpPost("get-list-stock-movement")]
    public async Task<IActionResult> GetListStockMovementAsync([FromBody] GetListStockMovementRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from movement in _db.StockMovement
                          join user in _db.Users on movement.CreatedById equals user.Id into userGroup
                          from user in userGroup.DefaultIfEmpty()
                          select new QueryStockMovementModel
                          {
                              IdStockMovement = movement.IdStockMovement,
                              IdProduct = movement.IdProduct,
                              IdWarehouse = movement.IdWarehouse,
                              MovementType = movement.MovementType,
                              Quantity = movement.Quantity,
                              QuantityBefore = movement.QuantityBefore,
                              QuantityAfter = movement.QuantityAfter,
                              ReferenceType = movement.ReferenceType,
                              ReferenceId = movement.ReferenceId,
                              ReferenceNumber = movement.ReferenceNumber,
                              Note = movement.Note,
                              DateCreated = movement.DateCreated,
                              Sku = movement.Product!.Sku,
                              ProductName = movement.Product!.ProductName,
                              UnitName = movement.Product!.Unit!.UnitName,
                              WarehouseName = movement.Warehouse!.WarehouseName,
                              CreatedBy = user != null ? user.FullName : null,
                          };

        if (!string.IsNullOrWhiteSpace(model.IdProduct))
        {
            queryResult = queryResult.Where(x => x.IdProduct == model.IdProduct);
        }

        if (!string.IsNullOrWhiteSpace(model.IdWarehouse))
        {
            queryResult = queryResult.Where(x => x.IdWarehouse == model.IdWarehouse);
        }

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.ProductName, searchPhrase)
                || EF.Functions.ILike(x.Sku, searchPhrase)
                || (x.ReferenceNumber != null && EF.Functions.ILike(x.ReferenceNumber, searchPhrase)));
        }

        return await BuildListResponseAsync(queryResult, model, "DateCreated Descending, IdStockMovement Ascending");
    }

    /// <summary>Daftar gudang aktif untuk penyaring pada halaman stok.</summary>
    [HttpPost("get-list-select-warehouse")]
    public async Task<IActionResult> GetListSelectWarehouseAsync()
    {
        List<SelectListItemModel> listData = await _db.Warehouse
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.WarehouseName)
            .Select(x => new SelectListItemModel { Value = x.IdWarehouse, Text = x.WarehouseName })
            .ToListAsync();

        return Ok(listData);
    }
}
