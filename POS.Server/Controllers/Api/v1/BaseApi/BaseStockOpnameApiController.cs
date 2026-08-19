using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.BaseApi;

public class StockOpnameFormModel
{
    public List<SelectListItemModel> ListWarehouse { get; set; } = [];
    public CreateEditStockOpnameModel? Data { get; set; }
}

public class GetProductStockRequestModel
{
    public string IdWarehouse { get; set; } = string.Empty;
}

/// <summary>
/// Perilaku bersama modul stock opname: membandingkan stok sistem dengan hasil hitung
/// fisik, lalu mengajukan selisihnya untuk disetujui (PRD bagian 15).
/// </summary>
public abstract class BaseStockOpnameApiController : BaseApiController
{
    protected BaseStockOpnameApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Stock Opname";
    }

    protected abstract bool CanSeeAllDocuments { get; }

    #region Query

    [HttpPost("get-list-stock-opname")]
    public async Task<IActionResult> GetListStockOpnameAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from opname in _db.StockOpname
                          join user in _db.Users on opname.CreatedById equals user.Id into userGroup
                          from user in userGroup.DefaultIfEmpty()
                          select new QueryStockOpnameModel
                          {
                              IdStockOpname = opname.IdStockOpname,
                              OpnameNumber = opname.OpnameNumber,
                              IdWarehouse = opname.IdWarehouse,
                              OpnameDate = opname.OpnameDate,
                              Note = opname.Note,
                              Status = opname.Status,
                              TotalItem = opname.TotalItem,
                              TotalDifference = opname.TotalDifference,
                              DateCreated = opname.DateCreated,
                              CreatedById = opname.CreatedById,
                              WarehouseName = opname.Warehouse!.WarehouseName,
                              CreatedBy = user != null ? user.FullName : null,
                          };

        if (!CanSeeAllDocuments)
        {
            string currentUserId = CurrentUserId ?? string.Empty;
            queryResult = queryResult.Where(x => x.CreatedById == currentUserId);
        }

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.OpnameNumber, searchPhrase)
                || EF.Functions.ILike(x.WarehouseName, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "DateCreated Descending, IdStockOpname Ascending");
    }

    [HttpPost("get-create")]
    public async Task<IActionResult> GetCreateAsync()
    {
        return Ok(new StockOpnameFormModel
        {
            ListWarehouse = await GetListWarehouseAsync(),
            Data = new CreateEditStockOpnameModel { OpnameDate = DateTime.Now },
        });
    }

    /// <summary>
    /// Produk beserta stok sistem pada gudang terpilih. Nilai inilah yang dibandingkan
    /// dengan hasil hitung fisik di rak.
    /// </summary>
    [HttpPost("get-list-product-stock")]
    public async Task<IActionResult> GetListProductStockAsync([FromBody] GetProductStockRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdWarehouse))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("gudang"));
        }

        List<ProductLookupModel> listData = await (
            from product in _db.Product
            join inventory in _db.Inventory.Where(x => x.IdWarehouse == model.IdWarehouse)
                on product.IdProduct equals inventory.IdProduct into inventoryGroup
            from inventory in inventoryGroup.DefaultIfEmpty()
            where product.IsActive
            orderby product.ProductName
            select new ProductLookupModel
            {
                IdProduct = product.IdProduct,
                Sku = product.Sku,
                Barcode = product.Barcode,
                ProductName = product.ProductName,
                UnitName = product.Unit!.UnitName,
                CostPrice = product.CostPrice,
                SellingPrice = product.SellingPrice,
                Stock = inventory != null ? inventory.Quantity : 0,
            })
            .ToListAsync();

        return Ok(listData);
    }

    protected async Task<List<SelectListItemModel>> GetListWarehouseAsync()
    {
        return await _db.Warehouse
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.WarehouseName)
            .Select(x => new SelectListItemModel
            {
                Value = x.IdWarehouse,
                Text = x.WarehouseName,
                Description = x.IsDefault ? "Gudang utama" : null,
            })
            .ToListAsync();
    }

    #endregion

    #region Details

    [HttpPost("get-details")]
    public async Task<IActionResult> GetDetailsAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        DetailsStockOpnameModel? data = await (
            from opname in _db.StockOpname
            join user in _db.Users on opname.CreatedById equals user.Id into userGroup
            from user in userGroup.DefaultIfEmpty()
            where opname.IdStockOpname == model.Id
            select new DetailsStockOpnameModel
            {
                IdStockOpname = opname.IdStockOpname,
                OpnameNumber = opname.OpnameNumber,
                IdWarehouse = opname.IdWarehouse,
                OpnameDate = opname.OpnameDate,
                Note = opname.Note,
                Status = opname.Status,
                TotalItem = opname.TotalItem,
                TotalDifference = opname.TotalDifference,
                DateCreated = opname.DateCreated,
                CreatedById = opname.CreatedById,
                WarehouseName = opname.Warehouse!.WarehouseName,
                CreatedBy = user != null ? user.FullName : null,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (!CanSeeAllDocuments && data.CreatedById != CurrentUserId)
        {
            return BadRequest("Anda hanya dapat membuka dokumen stock opname yang Anda buat sendiri.");
        }

        data.ListDetail = await _db.StockOpnameDetail
            .Where(x => x.IdStockOpname == model.Id)
            .Select(x => new QueryStockOpnameDetailModel
            {
                IdStockOpnameDetail = x.IdStockOpnameDetail,
                IdProduct = x.IdProduct,
                Sku = x.Product!.Sku,
                ProductName = x.Product!.ProductName,
                UnitName = x.Product!.Unit!.UnitName,
                SystemStock = x.SystemStock,
                PhysicalStock = x.PhysicalStock,
            })
            .OrderBy(x => x.ProductName)
            .ToListAsync();

        data.ApprovalRequest = await (
            from request in _db.ApprovalRequest
            join requester in _db.Users on request.CreatedById equals requester.Id into requesterGroup
            from requester in requesterGroup.DefaultIfEmpty()
            join decider in _db.Users on request.DecidedById equals decider.Id into deciderGroup
            from decider in deciderGroup.DefaultIfEmpty()
            where request.ReferenceId == model.Id
            orderby request.DateCreated descending
            select new QueryApprovalRequestModel
            {
                IdApprovalRequest = request.IdApprovalRequest,
                ApprovalTypeCode = request.ApprovalTypeCode,
                ModuleName = request.ModuleName,
                ReferenceId = request.ReferenceId,
                ReferenceNumber = request.ReferenceNumber,
                Title = request.Title,
                Description = request.Description,
                Status = request.Status,
                DecidedById = request.DecidedById,
                DecidedDate = request.DecidedDate,
                DecisionNote = request.DecisionNote,
                DateCreated = request.DateCreated,
                RequestedBy = requester != null ? requester.FullName : null,
                DecidedBy = decider != null ? decider.FullName : null,
            })
            .FirstOrDefaultAsync();

        return Ok(data);
    }

    #endregion

    #region Mutation

    [HttpPost("insert-stock-opname")]
    public async Task<IActionResult> InsertStockOpnameAsync([FromBody] CreateEditStockOpnameModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        string? validationMessage = await ValidateDocumentAsync(model);

        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        string? lastNumber = await _db.StockOpname
            .OrderByDescending(x => x.OpnameNumber)
            .Select(x => x.OpnameNumber)
            .FirstOrDefaultAsync();

        StockOpname entity = new()
        {
            OpnameNumber = InventoryMethods.BuildDocumentNumber(AppData.PrefixStockOpname, lastNumber),
            IdWarehouse = model.IdWarehouse,
            OpnameDate = model.OpnameDate == default ? DateTime.Now : model.OpnameDate,
            Note = model.Note?.Trim(),
            Status = DataStatus.Draft,
            CreatedById = CurrentUserId,
        };

        await ApplyDetailAsync(entity, model);
        _db.StockOpname.Add(entity);

        AddAuditLog("INSERT_STOCK_OPNAME", entity.IdStockOpname,
            $"Menyimpan dokumen {entity.OpnameNumber} berisi {entity.TotalItem} barang.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nomor Dokumen"));
        }

        if (!model.IsSubmitted)
        {
            return Ok("Dokumen stock opname tersimpan sebagai draft.");
        }

        return await SubmitDocumentAsync(entity);
    }

    [HttpPost("delete-stock-opname")]
    public async Task<IActionResult> DeleteStockOpnameAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        StockOpname? entity = await _db.StockOpname.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (!CanSeeAllDocuments && entity.CreatedById != CurrentUserId)
        {
            return BadRequest("Anda hanya dapat menghapus dokumen stock opname yang Anda buat sendiri.");
        }

        if (entity.Status != DataStatus.Draft && entity.Status != DataStatus.Rejected)
        {
            return BadRequest("Hanya dokumen berstatus draft atau ditolak yang dapat dihapus.");
        }

        _db.StockOpname.Remove(entity);
        AddAuditLog("DELETE_STOCK_OPNAME", entity.IdStockOpname, $"Menghapus dokumen {entity.OpnameNumber}.");
        await _db.SaveChangesAsync();

        return Ok("Dokumen stock opname berhasil dihapus.");
    }

    [HttpPost("submit-stock-opname")]
    public async Task<IActionResult> SubmitStockOpnameAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        StockOpname? entity = await _db.StockOpname
            .Include(x => x.ListDetail)
            .FirstOrDefaultAsync(x => x.IdStockOpname == model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (!CanSeeAllDocuments && entity.CreatedById != CurrentUserId)
        {
            return BadRequest("Anda hanya dapat mengajukan dokumen stock opname yang Anda buat sendiri.");
        }

        if (entity.Status != DataStatus.Draft && entity.Status != DataStatus.Rejected)
        {
            return BadRequest("Dokumen ini sudah pernah diajukan.");
        }

        return await SubmitDocumentAsync(entity);
    }

    #endregion

    #region Helper

    private async Task<string?> ValidateDocumentAsync(CreateEditStockOpnameModel model)
    {
        if (model.ListDetail.Count == 0)
        {
            return "Tambahkan minimal satu barang yang dihitung sebelum menyimpan dokumen.";
        }

        if (model.ListDetail.Any(x => x.PhysicalStock < 0))
        {
            return "Stok fisik tidak boleh negatif.";
        }

        if (model.ListDetail.GroupBy(x => x.IdProduct).Any(x => x.Count() > 1))
        {
            return "Ada barang yang tercatat lebih dari sekali. Setiap barang hanya boleh muncul satu baris.";
        }

        if (!await _db.Warehouse.AnyAsync(x => x.IdWarehouse == model.IdWarehouse && x.IsActive))
        {
            return "Gudang yang dipilih tidak ditemukan atau sedang dinonaktifkan.";
        }

        string[] productIds = model.ListDetail.Select(x => x.IdProduct).ToArray();
        int activeProductCount = await _db.Product.CountAsync(x => productIds.Contains(x.IdProduct) && x.IsActive);

        if (activeProductCount != productIds.Length)
        {
            return "Ada produk yang tidak ditemukan atau sedang dinonaktifkan. Muat ulang halaman lalu coba lagi.";
        }

        return null;
    }

    /// <summary>
    /// Membekukan stok sistem saat dokumen dibuat. Nilai ini diambil server dari database,
    /// tidak pernah dari frontend, supaya selisih yang dilaporkan tidak dapat direkayasa.
    /// </summary>
    private async Task ApplyDetailAsync(StockOpname entity, CreateEditStockOpnameModel model)
    {
        Dictionary<string, int> currentStock = await _db.Inventory
            .Where(x => x.IdWarehouse == model.IdWarehouse)
            .ToDictionaryAsync(x => x.IdProduct, x => x.Quantity);

        foreach (CreateEditStockOpnameDetailModel detail in model.ListDetail)
        {
            entity.ListDetail.Add(new StockOpnameDetail
            {
                IdStockOpname = entity.IdStockOpname,
                IdProduct = detail.IdProduct,
                SystemStock = currentStock.TryGetValue(detail.IdProduct, out int stock) ? stock : 0,
                PhysicalStock = detail.PhysicalStock,
            });
        }

        entity.TotalItem = entity.ListDetail.Count;
        entity.TotalDifference = entity.ListDetail.Count(x => x.PhysicalStock != x.SystemStock);
    }

    /// <summary>
    /// Mengajukan dokumen. Selisih stok baru diterapkan setelah disetujui bila aturan
    /// approval penyesuaian stok sedang aktif. Dokumen tanpa selisih tidak perlu
    /// persetujuan sama sekali, karena tidak mengubah apa pun.
    /// </summary>
    private async Task<IActionResult> SubmitDocumentAsync(StockOpname entity)
    {
        if (entity.TotalDifference == 0)
        {
            entity.Status = DataStatus.Completed;
            entity.ModifiedById = CurrentUserId;
            entity.DateModified = DateTime.Now;

            AddAuditLog("COMPLETE_STOCK_OPNAME", entity.IdStockOpname,
                $"Dokumen {entity.OpnameNumber} selesai tanpa selisih stok.");

            await _db.SaveChangesAsync();
            return Ok("Stok fisik sudah sesuai dengan catatan sistem. Dokumen ditutup tanpa penyesuaian.");
        }

        bool isApprovalRequired = await ApprovalMethods.IsApprovalRequiredAsync(_db, AppData.ApprovalTypeStockAdjustment);

        await using IDbContextTransaction transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            if (isApprovalRequired)
            {
                entity.Status = DataStatus.Pending;

                _db.ApprovalRequest.Add(ApprovalMethods.BuildRequest(
                    AppData.ApprovalTypeStockAdjustment,
                    EntityName,
                    entity.IdStockOpname,
                    entity.OpnameNumber,
                    $"Penyesuaian stok {entity.OpnameNumber}",
                    $"{entity.TotalDifference} barang berselisih dan menunggu persetujuan.",
                    CurrentUserId));

                AddAuditLog("SUBMIT_STOCK_OPNAME", entity.IdStockOpname,
                    $"Mengajukan dokumen {entity.OpnameNumber} dengan {entity.TotalDifference} selisih.");

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok("Selisih stok diajukan dan sedang menunggu persetujuan supervisor.");
            }

            string? errorMessage = await ApprovalMethods.ApplyStockAdjustmentAsync(_db, entity.IdStockOpname, CurrentUserId);

            if (errorMessage != null)
            {
                await transaction.RollbackAsync();
                return BadRequest(errorMessage);
            }

            AddAuditLog("COMPLETE_STOCK_OPNAME", entity.IdStockOpname,
                $"Dokumen {entity.OpnameNumber} langsung menyesuaikan stok karena approval penyesuaian sedang nonaktif.");

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok("Stok sudah disesuaikan dengan hasil hitung fisik.");
        }
        catch (DbUpdateException exception)
        {
            await transaction.RollbackAsync();
            return BadRequest(TranslateDbUpdateError(exception, "Nomor Dokumen"));
        }
    }

    #endregion
}
