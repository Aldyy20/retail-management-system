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

public class GoodsReceivingFormModel
{
    public List<SelectListItemModel> ListWarehouse { get; set; } = [];
    public List<SelectListItemModel> ListSupplier { get; set; } = [];
    public List<ProductLookupModel> ListProduct { get; set; } = [];
    public CreateEditGoodsReceivingModel? Data { get; set; }
}

/// <summary>
/// Perilaku bersama modul barang masuk. Controller per role mewarisinya dan hanya
/// menentukan rute, otorisasi, serta seberapa luas dokumen yang boleh dilihat.
/// </summary>
public abstract class BaseGoodsReceivingApiController : BaseApiController
{
    protected BaseGoodsReceivingApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Barang Masuk";
    }

    /// <summary>
    /// Supervisor melihat seluruh dokumen karena tugasnya mengawasi. Karyawan hanya
    /// melihat dokumen buatannya sendiri.
    /// </summary>
    protected abstract bool CanSeeAllDocuments { get; }

    #region Query

    [HttpPost("get-list-goods-receiving")]
    public async Task<IActionResult> GetListGoodsReceivingAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from receiving in _db.GoodsReceiving
                          join user in _db.Users on receiving.CreatedById equals user.Id into userGroup
                          from user in userGroup.DefaultIfEmpty()
                          select new QueryGoodsReceivingModel
                          {
                              IdGoodsReceiving = receiving.IdGoodsReceiving,
                              ReceivingNumber = receiving.ReceivingNumber,
                              IdWarehouse = receiving.IdWarehouse,
                              IdSupplier = receiving.IdSupplier,
                              ReceivingDate = receiving.ReceivingDate,
                              InvoiceNumber = receiving.InvoiceNumber,
                              Note = receiving.Note,
                              Status = receiving.Status,
                              TotalItem = receiving.TotalItem,
                              TotalCost = receiving.TotalCost,
                              DateCreated = receiving.DateCreated,
                              CreatedById = receiving.CreatedById,
                              WarehouseName = receiving.Warehouse!.WarehouseName,
                              SupplierName = receiving.Supplier!.SupplierName,
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
                EF.Functions.ILike(x.ReceivingNumber, searchPhrase)
                || EF.Functions.ILike(x.SupplierName, searchPhrase)
                || (x.InvoiceNumber != null && EF.Functions.ILike(x.InvoiceNumber, searchPhrase)));
        }

        return await BuildListResponseAsync(queryResult, model, "DateCreated Descending, IdGoodsReceiving Ascending");
    }

    [HttpPost("get-create")]
    public async Task<IActionResult> GetCreateAsync()
    {
        return Ok(new GoodsReceivingFormModel
        {
            ListWarehouse = await GetListWarehouseAsync(),
            ListSupplier = await GetListSupplierAsync(),
            ListProduct = await GetListProductAsync(),
            Data = new CreateEditGoodsReceivingModel { ReceivingDate = DateTime.Now },
        });
    }

    [HttpPost("get-edit")]
    public async Task<IActionResult> GetEditAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        GoodsReceiving? entity = await _db.GoodsReceiving
            .Include(x => x.ListDetail)
            .FirstOrDefaultAsync(x => x.IdGoodsReceiving == model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string? accessMessage = CheckDocumentAccess(entity);

        if (accessMessage != null)
        {
            return BadRequest(accessMessage);
        }

        // Dokumen yang sudah diajukan tidak boleh diubah, karena isinya sedang dinilai
        // supervisor atau sudah terlanjur mengubah stok.
        if (entity.Status != DataStatus.Draft && entity.Status != DataStatus.Rejected)
        {
            return BadRequest("Dokumen ini tidak dapat diubah lagi karena statusnya sudah " + entity.Status.ToString().ToLowerInvariant() + ".");
        }

        return Ok(new GoodsReceivingFormModel
        {
            ListWarehouse = await GetListWarehouseAsync(),
            ListSupplier = await GetListSupplierAsync(),
            ListProduct = await GetListProductAsync(),
            Data = new CreateEditGoodsReceivingModel
            {
                IdGoodsReceiving = entity.IdGoodsReceiving,
                ReceivingNumber = entity.ReceivingNumber,
                IdWarehouse = entity.IdWarehouse,
                IdSupplier = entity.IdSupplier,
                ReceivingDate = entity.ReceivingDate,
                InvoiceNumber = entity.InvoiceNumber,
                Note = entity.Note,
                Status = entity.Status,
                ListDetail = entity.ListDetail
                    .Select(x => new CreateEditGoodsReceivingDetailModel
                    {
                        IdProduct = x.IdProduct,
                        Quantity = x.Quantity,
                        CostPrice = x.CostPrice,
                    })
                    .ToList(),
            },
        });
    }

    [HttpPost("get-details")]
    public async Task<IActionResult> GetDetailsAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        DetailsGoodsReceivingModel? data = await (
            from receiving in _db.GoodsReceiving
            join user in _db.Users on receiving.CreatedById equals user.Id into userGroup
            from user in userGroup.DefaultIfEmpty()
            where receiving.IdGoodsReceiving == model.Id
            select new DetailsGoodsReceivingModel
            {
                IdGoodsReceiving = receiving.IdGoodsReceiving,
                ReceivingNumber = receiving.ReceivingNumber,
                IdWarehouse = receiving.IdWarehouse,
                IdSupplier = receiving.IdSupplier,
                ReceivingDate = receiving.ReceivingDate,
                InvoiceNumber = receiving.InvoiceNumber,
                Note = receiving.Note,
                Status = receiving.Status,
                TotalItem = receiving.TotalItem,
                TotalCost = receiving.TotalCost,
                DateCreated = receiving.DateCreated,
                CreatedById = receiving.CreatedById,
                WarehouseName = receiving.Warehouse!.WarehouseName,
                SupplierName = receiving.Supplier!.SupplierName,
                CreatedBy = user != null ? user.FullName : null,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (!CanSeeAllDocuments && data.CreatedById != CurrentUserId)
        {
            return BadRequest("Anda hanya dapat membuka dokumen barang masuk yang Anda buat sendiri.");
        }

        data.ListDetail = await _db.GoodsReceivingDetail
            .Where(x => x.IdGoodsReceiving == model.Id)
            .Select(x => new QueryGoodsReceivingDetailModel
            {
                IdGoodsReceivingDetail = x.IdGoodsReceivingDetail,
                IdProduct = x.IdProduct,
                Sku = x.Product!.Sku,
                ProductName = x.Product!.ProductName,
                UnitName = x.Product!.Unit!.UnitName,
                Quantity = x.Quantity,
                CostPrice = x.CostPrice,
            })
            .OrderBy(x => x.ProductName)
            .ToListAsync();

        data.ApprovalRequest = await GetApprovalRequestAsync(model.Id);

        return Ok(data);
    }

    /// <summary>Permintaan persetujuan terakhir untuk dokumen ini, bila pernah diajukan.</summary>
    protected async Task<QueryApprovalRequestModel?> GetApprovalRequestAsync(string referenceId)
    {
        return await (
            from request in _db.ApprovalRequest
            join requester in _db.Users on request.CreatedById equals requester.Id into requesterGroup
            from requester in requesterGroup.DefaultIfEmpty()
            join decider in _db.Users on request.DecidedById equals decider.Id into deciderGroup
            from decider in deciderGroup.DefaultIfEmpty()
            where request.ReferenceId == referenceId
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

    protected async Task<List<SelectListItemModel>> GetListSupplierAsync()
    {
        return await _db.Supplier
            .Where(x => x.IsActive)
            .OrderBy(x => x.SupplierName)
            .Select(x => new SelectListItemModel { Value = x.IdSupplier, Text = x.SupplierName })
            .ToListAsync();
    }

    protected async Task<List<ProductLookupModel>> GetListProductAsync()
    {
        return await _db.Product
            .Where(x => x.IsActive)
            .OrderBy(x => x.ProductName)
            .Select(x => new ProductLookupModel
            {
                IdProduct = x.IdProduct,
                Sku = x.Sku,
                Barcode = x.Barcode,
                ProductName = x.ProductName,
                UnitName = x.Unit!.UnitName,
                CostPrice = x.CostPrice,
                SellingPrice = x.SellingPrice,
            })
            .ToListAsync();
    }

    /// <summary>Menolak akses karyawan ke dokumen milik orang lain.</summary>
    protected string? CheckDocumentAccess(GoodsReceiving entity)
    {
        if (!CanSeeAllDocuments && entity.CreatedById != CurrentUserId)
        {
            return "Anda hanya dapat mengubah dokumen barang masuk yang Anda buat sendiri.";
        }

        return null;
    }

    #endregion

    #region Mutation

    [HttpPost("insert-goods-receiving")]
    public async Task<IActionResult> InsertGoodsReceivingAsync([FromBody] CreateEditGoodsReceivingModel model)
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

        string? lastNumber = await _db.GoodsReceiving
            .OrderByDescending(x => x.ReceivingNumber)
            .Select(x => x.ReceivingNumber)
            .FirstOrDefaultAsync();

        GoodsReceiving entity = new()
        {
            ReceivingNumber = InventoryMethods.BuildDocumentNumber(AppData.PrefixGoodsReceiving, lastNumber),
            IdWarehouse = model.IdWarehouse,
            IdSupplier = model.IdSupplier,
            ReceivingDate = model.ReceivingDate == default ? DateTime.Now : model.ReceivingDate,
            InvoiceNumber = model.InvoiceNumber?.Trim(),
            Note = model.Note?.Trim(),
            Status = DataStatus.Draft,
            CreatedById = CurrentUserId,
        };

        ApplyDetail(entity, model);
        _db.GoodsReceiving.Add(entity);

        return await SaveAndMaybeSubmitAsync(entity, model.IsSubmitted, "INSERT_GOODS_RECEIVING");
    }

    [HttpPost("update-goods-receiving")]
    public async Task<IActionResult> UpdateGoodsReceivingAsync([FromBody] CreateEditGoodsReceivingModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdGoodsReceiving))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        GoodsReceiving? entity = await _db.GoodsReceiving
            .Include(x => x.ListDetail)
            .FirstOrDefaultAsync(x => x.IdGoodsReceiving == model.IdGoodsReceiving);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string? accessMessage = CheckDocumentAccess(entity);

        if (accessMessage != null)
        {
            return BadRequest(accessMessage);
        }

        if (entity.Status != DataStatus.Draft && entity.Status != DataStatus.Rejected)
        {
            return BadRequest("Dokumen yang sudah diajukan atau sudah diterapkan ke stok tidak dapat diubah.");
        }

        string? validationMessage = await ValidateDocumentAsync(model);

        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        entity.IdWarehouse = model.IdWarehouse;
        entity.IdSupplier = model.IdSupplier;
        entity.ReceivingDate = model.ReceivingDate == default ? entity.ReceivingDate : model.ReceivingDate;
        entity.InvoiceNumber = model.InvoiceNumber?.Trim();
        entity.Note = model.Note?.Trim();
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;
        entity.Status = DataStatus.Draft;

        _db.GoodsReceivingDetail.RemoveRange(entity.ListDetail);
        entity.ListDetail.Clear();
        ApplyDetail(entity, model);

        return await SaveAndMaybeSubmitAsync(entity, model.IsSubmitted, "UPDATE_GOODS_RECEIVING");
    }

    [HttpPost("delete-goods-receiving")]
    public async Task<IActionResult> DeleteGoodsReceivingAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        GoodsReceiving? entity = await _db.GoodsReceiving.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string? accessMessage = CheckDocumentAccess(entity);

        if (accessMessage != null)
        {
            return BadRequest(accessMessage);
        }

        // Dokumen yang sudah mengubah stok tidak boleh hilang, karena riwayat stoknya
        // merujuk ke sini. Yang sudah diajukan pun sedang menunggu keputusan supervisor.
        if (entity.Status != DataStatus.Draft && entity.Status != DataStatus.Rejected)
        {
            return BadRequest("Hanya dokumen berstatus draft atau ditolak yang dapat dihapus.");
        }

        _db.GoodsReceiving.Remove(entity);
        AddAuditLog("DELETE_GOODS_RECEIVING", entity.IdGoodsReceiving, $"Menghapus dokumen {entity.ReceivingNumber}.");
        await _db.SaveChangesAsync();

        return Ok("Dokumen barang masuk berhasil dihapus.");
    }

    /// <summary>Mengajukan dokumen draft untuk diproses.</summary>
    [HttpPost("submit-goods-receiving")]
    public async Task<IActionResult> SubmitGoodsReceivingAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        GoodsReceiving? entity = await _db.GoodsReceiving
            .Include(x => x.ListDetail)
            .FirstOrDefaultAsync(x => x.IdGoodsReceiving == model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string? accessMessage = CheckDocumentAccess(entity);

        if (accessMessage != null)
        {
            return BadRequest(accessMessage);
        }

        if (entity.Status != DataStatus.Draft && entity.Status != DataStatus.Rejected)
        {
            return BadRequest("Dokumen ini sudah pernah diajukan.");
        }

        if (entity.ListDetail.Count == 0)
        {
            return BadRequest("Dokumen tanpa barang tidak dapat diajukan.");
        }

        return await SubmitDocumentAsync(entity);
    }

    #endregion

    #region Helper

    /// <summary>
    /// Memastikan gudang, supplier, dan seluruh produk yang dipilih benar-benar ada dan
    /// masih aktif. Id yang dikirim frontend tidak pernah dipercaya begitu saja.
    /// </summary>
    private async Task<string?> ValidateDocumentAsync(CreateEditGoodsReceivingModel model)
    {
        if (model.ListDetail.Count == 0)
        {
            return "Tambahkan minimal satu barang sebelum menyimpan dokumen.";
        }

        if (model.ListDetail.Any(x => x.Quantity <= 0))
        {
            return "Jumlah setiap barang harus lebih dari nol.";
        }

        if (model.ListDetail.Any(x => x.CostPrice < 0))
        {
            return "Harga modal tidak boleh negatif.";
        }

        string[] duplicateProducts = model.ListDetail
            .GroupBy(x => x.IdProduct)
            .Where(x => x.Count() > 1)
            .Select(x => x.Key)
            .ToArray();

        if (duplicateProducts.Length > 0)
        {
            return "Ada barang yang tercatat lebih dari sekali. Gabungkan jumlahnya menjadi satu baris.";
        }

        if (!await _db.Warehouse.AnyAsync(x => x.IdWarehouse == model.IdWarehouse && x.IsActive))
        {
            return "Gudang yang dipilih tidak ditemukan atau sedang dinonaktifkan.";
        }

        if (!await _db.Supplier.AnyAsync(x => x.IdSupplier == model.IdSupplier && x.IsActive))
        {
            return "Supplier yang dipilih tidak ditemukan atau sedang dinonaktifkan.";
        }

        string[] productIds = model.ListDetail.Select(x => x.IdProduct).ToArray();
        int activeProductCount = await _db.Product.CountAsync(x => productIds.Contains(x.IdProduct) && x.IsActive);

        if (activeProductCount != productIds.Length)
        {
            return "Ada produk yang tidak ditemukan atau sedang dinonaktifkan. Muat ulang halaman lalu coba lagi.";
        }

        return null;
    }

    /// <summary>Menyusun ulang baris barang beserta total yang dihitung server, bukan frontend.</summary>
    private static void ApplyDetail(GoodsReceiving entity, CreateEditGoodsReceivingModel model)
    {
        foreach (CreateEditGoodsReceivingDetailModel detail in model.ListDetail)
        {
            entity.ListDetail.Add(new GoodsReceivingDetail
            {
                IdGoodsReceiving = entity.IdGoodsReceiving,
                IdProduct = detail.IdProduct,
                Quantity = detail.Quantity,
                CostPrice = detail.CostPrice,
            });
        }

        entity.TotalItem = entity.ListDetail.Count;
        entity.TotalCost = entity.ListDetail.Sum(x => x.Quantity * x.CostPrice);
    }

    private async Task<IActionResult> SaveAndMaybeSubmitAsync(GoodsReceiving entity, bool isSubmitted, string auditAction)
    {
        AddAuditLog(auditAction, entity.IdGoodsReceiving,
            $"Menyimpan dokumen {entity.ReceivingNumber} berisi {entity.TotalItem} barang.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nomor Dokumen"));
        }

        if (!isSubmitted)
        {
            return Ok("Dokumen barang masuk tersimpan sebagai draft.");
        }

        return await SubmitDocumentAsync(entity);
    }

    /// <summary>
    /// Mengajukan dokumen. Bila aturan persetujuan barang masuk sedang aktif, dokumen
    /// menunggu supervisor. Bila tidak, stok langsung bertambah pada transaksi yang sama,
    /// sehingga dokumen dan stok tidak pernah berada dalam kondisi setengah jadi.
    /// </summary>
    private async Task<IActionResult> SubmitDocumentAsync(GoodsReceiving entity)
    {
        bool isApprovalRequired = await ApprovalMethods.IsApprovalRequiredAsync(_db, AppData.ApprovalTypeGoodsReceiving);

        await using IDbContextTransaction transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            if (isApprovalRequired)
            {
                entity.Status = DataStatus.Pending;

                _db.ApprovalRequest.Add(ApprovalMethods.BuildRequest(
                    AppData.ApprovalTypeGoodsReceiving,
                    EntityName,
                    entity.IdGoodsReceiving,
                    entity.ReceivingNumber,
                    $"Barang masuk {entity.ReceivingNumber}",
                    $"{entity.TotalItem} barang senilai {entity.TotalCost:N0} menunggu persetujuan.",
                    CurrentUserId));

                AddAuditLog("SUBMIT_GOODS_RECEIVING", entity.IdGoodsReceiving,
                    $"Mengajukan dokumen {entity.ReceivingNumber} untuk disetujui.");

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok("Dokumen diajukan dan sedang menunggu persetujuan supervisor.");
            }

            string? errorMessage = await ApprovalMethods.ApplyGoodsReceivingAsync(_db, entity.IdGoodsReceiving, CurrentUserId);

            if (errorMessage != null)
            {
                await transaction.RollbackAsync();
                return BadRequest(errorMessage);
            }

            AddAuditLog("COMPLETE_GOODS_RECEIVING", entity.IdGoodsReceiving,
                $"Dokumen {entity.ReceivingNumber} langsung menambah stok karena approval barang masuk sedang nonaktif.");

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok("Dokumen tersimpan dan stok gudang sudah bertambah.");
        }
        catch (DbUpdateException exception)
        {
            await transaction.RollbackAsync();
            return BadRequest(TranslateDbUpdateError(exception, "Nomor Dokumen"));
        }
    }

    #endregion
}
