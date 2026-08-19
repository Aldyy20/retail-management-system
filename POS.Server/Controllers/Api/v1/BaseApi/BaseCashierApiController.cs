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

public class SearchMemberRequestModel
{
    public string? SearchPhrase { get; set; }
}

public class SearchProductRequestModel
{
    public string IdWarehouse { get; set; } = string.Empty;

    /// <summary>Nama, SKU, atau barcode. Barcode yang cocok persis diprioritaskan.</summary>
    public string? SearchPhrase { get; set; }
}

/// <summary>
/// Layar kasir dan riwayat transaksinya.
///
/// Seluruh angka pada transaksi dihitung server dari data produk terkini, lalu dibekukan
/// pada baris transaksi. Frontend tidak pernah mengirim harga maupun total.
/// </summary>
public abstract class BaseCashierApiController : BaseApiController
{
    protected BaseCashierApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Transaksi";
    }

    /// <summary>Supervisor melihat transaksi seluruh kasir; karyawan hanya miliknya sendiri.</summary>
    protected abstract bool CanSeeAllTransactions { get; }

    #region Kasir

    [HttpPost("get-init")]
    public async Task<IActionResult> GetInitAsync()
    {
        List<SelectListItemModel> listWarehouse = await _db.Warehouse
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

        List<QueryPaymentMethodModel> listPaymentMethod = await _db.PaymentMethod
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .Select(x => new QueryPaymentMethodModel
            {
                PaymentMethodCode = x.PaymentMethodCode,
                PaymentMethodName = x.PaymentMethodName,
                Description = x.Description,
                RequiresChange = x.RequiresChange,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive,
            })
            .ToListAsync();

        return Ok(new CashierInitModel
        {
            ListWarehouse = listWarehouse,
            ListPaymentMethod = listPaymentMethod,
            DefaultWarehouseId = listWarehouse.FirstOrDefault()?.Value ?? string.Empty,
            StoreName = await GlobalList.GetSettingTextAsync(_db, AppData.SettingStoreName, "Toko Saya"),
            IsMemberEnabled = await LoyaltyMethods.IsMemberEnabledAsync(_db),
            IsLoyaltyEnabled = await LoyaltyMethods.IsLoyaltyEnabledAsync(_db),
            IsVoucherEnabled = await PromotionMethods.IsVoucherEnabledAsync(_db),
        });
    }

    /// <summary>
    /// Pencarian produk untuk kasir. Barcode yang cocok persis dikembalikan sendirian,
    /// supaya hasil pindaian langsung masuk keranjang tanpa memilih lagi.
    /// </summary>
    [HttpPost("search-product")]
    public async Task<IActionResult> SearchProductAsync([FromBody] SearchProductRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdWarehouse))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("gudang"));
        }

        string searchPhrase = model.SearchPhrase?.Trim() ?? string.Empty;

        var baseQuery = from product in _db.Product
                        join inventory in _db.Inventory.Where(x => x.IdWarehouse == model.IdWarehouse)
                            on product.IdProduct equals inventory.IdProduct into inventoryGroup
                        from inventory in inventoryGroup.DefaultIfEmpty()
                        where product.IsActive
                        select new ProductLookupModel
                        {
                            IdProduct = product.IdProduct,
                            Sku = product.Sku,
                            Barcode = product.Barcode,
                            ProductName = product.ProductName,
                            UnitName = product.Unit!.UnitName,
                            CostPrice = product.CostPrice,
                            SellingPrice = product.SellingPrice,
                            PhotoFileName = product.PhotoFileName,
                            Stock = inventory != null ? inventory.Quantity : 0,
                        };

        if (searchPhrase.Length > 0)
        {
            ProductLookupModel? exactBarcode = await baseQuery
                .Where(x => x.Barcode == searchPhrase)
                .FirstOrDefaultAsync();

            if (exactBarcode != null)
            {
                return Ok(new List<ProductLookupModel> { exactBarcode });
            }

            string pattern = $"%{searchPhrase}%";
            baseQuery = baseQuery.Where(x =>
                EF.Functions.ILike(x.ProductName, pattern)
                || EF.Functions.ILike(x.Sku, pattern)
                || (x.Barcode != null && EF.Functions.ILike(x.Barcode, pattern)));
        }

        List<ProductLookupModel> listData = await baseQuery
            .OrderBy(x => x.ProductName)
            .Take(30)
            .ToListAsync();

        return Ok(listData);
    }

    /// <summary>Menghitung ulang keranjang di server setiap kali isinya berubah.</summary>
    [HttpPost("calculate")]
    public async Task<IActionResult> CalculateAsync([FromBody] CalculateCartRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdWarehouse))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("gudang"));
        }

        return Ok(await TransactionMethods.CalculateAsync(
            _db, model.IdWarehouse, model.ListItem, model.IdMember, model.IdPointRedemptionRule, model.VoucherCode));
    }

    /// <summary>
    /// Mencari member dari nomor HP atau namanya. Hanya tersedia bila sistem member aktif,
    /// sehingga kasir tidak dapat memakai member lewat jalan belakang saat fiturnya dimatikan.
    /// </summary>
    [HttpPost("search-member")]
    public async Task<IActionResult> SearchMemberAsync([FromBody] SearchMemberRequestModel model)
    {
        if (!await LoyaltyMethods.IsMemberEnabledAsync(_db))
        {
            return BadRequest("Sistem member sedang dinonaktifkan admin.");
        }

        string searchPhrase = model?.SearchPhrase?.Trim() ?? string.Empty;

        if (searchPhrase.Length < 3)
        {
            return BadRequest("Ketik minimal 3 karakter nomor HP atau nama member.");
        }

        string pattern = $"%{searchPhrase}%";

        List<QueryMemberModel> listData = await _db.Member
            .Where(x => x.IsActive && (EF.Functions.ILike(x.PhoneNumber, pattern) || EF.Functions.ILike(x.MemberName, pattern)))
            .OrderBy(x => x.MemberName)
            .Take(10)
            .Select(x => new QueryMemberModel
            {
                IdMember = x.IdMember,
                PhoneNumber = x.PhoneNumber,
                MemberName = x.MemberName,
                PointBalance = x.PointBalance,
                TotalSpending = x.TotalSpending,
                TotalTransaction = x.TotalTransaction,
                IsActive = x.IsActive,
            })
            .ToListAsync();

        return Ok(listData);
    }

    /// <summary>
    /// Mendaftarkan member baru langsung dari kasir, supaya pelanggan tidak perlu
    /// menunggu admin saat sedang mengantre.
    /// </summary>
    [HttpPost("register-member")]
    public async Task<IActionResult> RegisterMemberAsync([FromBody] CreateEditMemberModel model)
    {
        if (!await LoyaltyMethods.IsMemberEnabledAsync(_db))
        {
            return BadRequest("Sistem member sedang dinonaktifkan admin.");
        }

        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Member entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);

        _db.Member.Add(entity);
        AddAuditLog("REGISTER_MEMBER", entity.IdMember, $"Mendaftarkan member {entity.MemberName} ({entity.PhoneNumber}).");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nomor HP"));
        }

        return Ok(new QueryMemberModel
        {
            IdMember = entity.IdMember,
            PhoneNumber = entity.PhoneNumber,
            MemberName = entity.MemberName,
            PointBalance = entity.PointBalance,
            IsActive = entity.IsActive,
        });
    }

    #endregion

    #region Transaksi

    /// <summary>
    /// Menyimpan transaksi dan mengurangi stok dalam satu transaksi database.
    /// Bila salah satu gagal, tidak ada satu pun yang tersimpan (PRD BR-009).
    /// </summary>
    [HttpPost("create-transaction")]
    public async Task<IActionResult> CreateTransactionAsync([FromBody] CreateTransactionRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        if (model.ListItem.Count == 0)
        {
            return BadRequest("Keranjang masih kosong. Tambahkan barang lebih dulu.");
        }

        if (!await _db.Warehouse.AnyAsync(x => x.IdWarehouse == model.IdWarehouse && x.IsActive))
        {
            return BadRequest("Gudang yang dipilih tidak ditemukan atau sedang dinonaktifkan.");
        }

        PaymentMethod? paymentMethod = await _db.PaymentMethod
            .FirstOrDefaultAsync(x => x.PaymentMethodCode == model.PaymentMethodCode && x.IsActive);

        if (paymentMethod == null)
        {
            return BadRequest("Metode pembayaran yang dipilih tidak tersedia.");
        }

        CalculatedCartModel cart = await TransactionMethods.CalculateAsync(
            _db, model.IdWarehouse, model.ListItem, model.IdMember, model.IdPointRedemptionRule, model.VoucherCode);

        if (cart.ListItem.Count == 0)
        {
            return BadRequest("Tidak ada barang yang dapat diproses. Periksa kembali keranjang.");
        }

        if (cart.ListWarning.Count > 0)
        {
            return BadRequest(string.Join(" ", cart.ListWarning));
        }

        // Uang tunai yang diterima harus menutup total. Metode non-tunai selalu dibayar pas,
        // sehingga jumlahnya ditetapkan server, bukan diambil dari layar kasir.
        decimal paidAmount = paymentMethod.RequiresChange ? model.PaidAmount : cart.TotalAmount;

        if (paidAmount < cart.TotalAmount)
        {
            return BadRequest($"Uang yang diterima kurang. Total belanja {cart.TotalAmount:N0}, diterima {paidAmount:N0}.");
        }

        DateTime transactionDate = DateTime.Now;

        Transaction entity = new()
        {
            InvoiceNumber = await TransactionMethods.BuildInvoiceNumberAsync(_db, transactionDate),
            IdWarehouse = model.IdWarehouse,
            TransactionDate = transactionDate,
            SubtotalAmount = cart.SubtotalAmount,
            DiscountAmount = cart.DiscountAmount,
            VoucherDiscountAmount = cart.VoucherDiscountAmount,
            PointDiscountAmount = cart.PointDiscountAmount,
            IdMember = cart.Member?.IdMember,
            IdVoucher = cart.Voucher != null && cart.Voucher.IsValid ? cart.Voucher.IdVoucher : null,
            VoucherCode = cart.Voucher != null && cart.Voucher.IsValid ? cart.Voucher.VoucherCode : null,
            PointEarned = cart.PointEarned,
            PointRedeemed = cart.PointRedeemed,
            TotalAmount = cart.TotalAmount,
            PaymentMethodCode = paymentMethod.PaymentMethodCode,
            PaidAmount = paidAmount,
            ChangeAmount = paidAmount - cart.TotalAmount,
            Status = DataStatus.Completed,
            Note = model.Note?.Trim(),
            TotalItem = cart.ListItem.Count,
            CreatedById = CurrentUserId,
        };

        await using IDbContextTransaction dbTransaction = await _db.Database.BeginTransactionAsync();

        try
        {
            foreach (CalculatedCartItemModel item in cart.ListItem)
            {
                decimal costPrice = await _db.Product
                    .Where(x => x.IdProduct == item.IdProduct)
                    .Select(x => x.CostPrice)
                    .FirstAsync();

                entity.ListDetail.Add(new TransactionDetail
                {
                    IdTransaction = entity.IdTransaction,
                    IdProduct = item.IdProduct,
                    Sku = item.Sku,
                    ProductName = item.ProductName,
                    UnitName = item.UnitName,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    CostPrice = costPrice,
                    DiscountAmount = item.DiscountAmount,
                    Subtotal = item.Subtotal,
                });

                string? stockError = await InventoryMethods.ApplyMovementAsync(
                    _db,
                    item.IdProduct,
                    model.IdWarehouse,
                    StockMovementType.Out,
                    item.Quantity,
                    "Penjualan",
                    entity.IdTransaction,
                    entity.InvoiceNumber,
                    null,
                    CurrentUserId);

                if (stockError != null)
                {
                    await dbTransaction.RollbackAsync();
                    return BadRequest(stockError);
                }
            }

            entity.TotalCost = entity.ListDetail.Sum(x => x.CostPrice * x.Quantity);
            _db.Transaction.Add(entity);

            // Kuota voucher diperiksa ulang di sini, bukan hanya saat menghitung, supaya
            // dua kasir yang menebus voucher terakhir pada saat bersamaan tidak lolos berdua.
            if (entity.IdVoucher != null)
            {
                Voucher? voucher = await _db.Voucher.FirstOrDefaultAsync(x => x.IdVoucher == entity.IdVoucher);

                if (voucher == null)
                {
                    await dbTransaction.RollbackAsync();
                    return BadRequest("Voucher yang dipakai tidak ditemukan. Muat ulang halaman lalu coba lagi.");
                }

                if (voucher.UsageLimit > 0 && voucher.UsageCount >= voucher.UsageLimit)
                {
                    await dbTransaction.RollbackAsync();
                    return BadRequest($"Kuota voucher {voucher.VoucherCode} baru saja habis dipakai transaksi lain.");
                }

                voucher.UsageCount += 1;
                voucher.DateModified = DateTime.Now;
                voucher.ModifiedById = CurrentUserId;

                _db.VoucherUsage.Add(new VoucherUsage
                {
                    IdVoucher = voucher.IdVoucher,
                    IdTransaction = entity.IdTransaction,
                    IdMember = entity.IdMember,
                    DiscountAmount = entity.VoucherDiscountAmount,
                    CreatedById = CurrentUserId,
                });
            }

            // Saldo point dan riwayat belanja member ikut berubah pada transaksi database
            // yang sama, sehingga point tidak pernah bertambah tanpa notanya (PRD BR-008).
            if (entity.IdMember != null)
            {
                Member? member = await _db.Member.FirstOrDefaultAsync(x => x.IdMember == entity.IdMember);

                if (member == null)
                {
                    await dbTransaction.RollbackAsync();
                    return BadRequest("Member yang dipilih tidak ditemukan. Muat ulang halaman lalu coba lagi.");
                }

                if (entity.PointRedeemed > 0)
                {
                    if (member.PointBalance < entity.PointRedeemed)
                    {
                        await dbTransaction.RollbackAsync();
                        return BadRequest($"Saldo point tinggal {member.PointBalance}, tidak cukup untuk menukar {entity.PointRedeemed} point.");
                    }

                    LoyaltyMethods.ApplyPointMovement(_db, member, PointMovementType.Redeem, entity.PointRedeemed,
                        "Penjualan", entity.IdTransaction, entity.InvoiceNumber,
                        $"Ditukar menjadi potongan {entity.PointDiscountAmount:N0}.", CurrentUserId);
                }

                if (entity.PointEarned > 0)
                {
                    LoyaltyMethods.ApplyPointMovement(_db, member, PointMovementType.Earn, entity.PointEarned,
                        "Penjualan", entity.IdTransaction, entity.InvoiceNumber, null, CurrentUserId);
                }

                member.TotalTransaction += 1;
                member.TotalSpending += entity.TotalAmount;
            }

            AddAuditLog("CREATE_TRANSACTION", entity.IdTransaction,
                $"Transaksi {entity.InvoiceNumber} senilai {entity.TotalAmount:N0}.");

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();
        }
        catch (DbUpdateException exception)
        {
            await dbTransaction.RollbackAsync();
            return BadRequest(TranslateDbUpdateError(exception, "Nomor Nota"));
        }

        return Ok(new { entity.IdTransaction, entity.InvoiceNumber });
    }

    #endregion

    #region Riwayat

    [HttpPost("get-list-transaction")]
    public async Task<IActionResult> GetListTransactionAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from transaction in _db.Transaction
                          join user in _db.Users on transaction.CreatedById equals user.Id into userGroup
                          from user in userGroup.DefaultIfEmpty()
                          select new QueryTransactionModel
                          {
                              IdTransaction = transaction.IdTransaction,
                              InvoiceNumber = transaction.InvoiceNumber,
                              IdWarehouse = transaction.IdWarehouse,
                              TransactionDate = transaction.TransactionDate,
                              SubtotalAmount = transaction.SubtotalAmount,
                              DiscountAmount = transaction.DiscountAmount,
                              VoucherDiscountAmount = transaction.VoucherDiscountAmount,
                              PointDiscountAmount = transaction.PointDiscountAmount,
                              TotalAmount = transaction.TotalAmount,
                              PaymentMethodCode = transaction.PaymentMethodCode,
                              PaidAmount = transaction.PaidAmount,
                              ChangeAmount = transaction.ChangeAmount,
                              Status = transaction.Status,
                              TotalItem = transaction.TotalItem,
                              TotalCost = transaction.TotalCost,
                              DateCreated = transaction.DateCreated,
                              CreatedById = transaction.CreatedById,
                              WarehouseName = transaction.Warehouse!.WarehouseName,
                              PaymentMethodName = transaction.PaymentMethod!.PaymentMethodName,
                              CashierName = user != null ? user.FullName : null,
                              MemberName = transaction.Member != null ? transaction.Member.MemberName : null,
                              MemberPhoneNumber = transaction.Member != null ? transaction.Member.PhoneNumber : null,
                              IdMember = transaction.IdMember,
                              PointEarned = transaction.PointEarned,
                              PointRedeemed = transaction.PointRedeemed,
                              VoucherCode = transaction.VoucherCode,
                          };

        if (!CanSeeAllTransactions)
        {
            string currentUserId = CurrentUserId ?? string.Empty;
            queryResult = queryResult.Where(x => x.CreatedById == currentUserId);
        }

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x => EF.Functions.ILike(x.InvoiceNumber, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "TransactionDate Descending, IdTransaction Ascending");
    }

    [HttpPost("get-details")]
    public async Task<IActionResult> GetDetailsAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        DetailsTransactionModel? data = await (
            from transaction in _db.Transaction
            join user in _db.Users on transaction.CreatedById equals user.Id into userGroup
            from user in userGroup.DefaultIfEmpty()
            where transaction.IdTransaction == model.Id
            select new DetailsTransactionModel
            {
                IdTransaction = transaction.IdTransaction,
                InvoiceNumber = transaction.InvoiceNumber,
                IdWarehouse = transaction.IdWarehouse,
                TransactionDate = transaction.TransactionDate,
                SubtotalAmount = transaction.SubtotalAmount,
                DiscountAmount = transaction.DiscountAmount,
                VoucherDiscountAmount = transaction.VoucherDiscountAmount,
                PointDiscountAmount = transaction.PointDiscountAmount,
                TotalAmount = transaction.TotalAmount,
                PaymentMethodCode = transaction.PaymentMethodCode,
                PaidAmount = transaction.PaidAmount,
                ChangeAmount = transaction.ChangeAmount,
                Status = transaction.Status,
                Note = transaction.Note,
                TotalItem = transaction.TotalItem,
                TotalCost = transaction.TotalCost,
                DateCreated = transaction.DateCreated,
                CreatedById = transaction.CreatedById,
                WarehouseName = transaction.Warehouse!.WarehouseName,
                PaymentMethodName = transaction.PaymentMethod!.PaymentMethodName,
                CashierName = user != null ? user.FullName : null,
                MemberName = transaction.Member != null ? transaction.Member.MemberName : null,
                MemberPhoneNumber = transaction.Member != null ? transaction.Member.PhoneNumber : null,
                IdMember = transaction.IdMember,
                PointEarned = transaction.PointEarned,
                PointRedeemed = transaction.PointRedeemed,
                VoucherCode = transaction.VoucherCode,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (!CanSeeAllTransactions && data.CreatedById != CurrentUserId)
        {
            return BadRequest("Anda hanya dapat membuka transaksi yang Anda buat sendiri.");
        }

        data.ListDetail = await _db.TransactionDetail
            .Where(x => x.IdTransaction == model.Id)
            .Select(x => new QueryTransactionDetailModel
            {
                IdTransactionDetail = x.IdTransactionDetail,
                IdProduct = x.IdProduct,
                Sku = x.Sku,
                ProductName = x.ProductName,
                UnitName = x.UnitName,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                DiscountAmount = x.DiscountAmount,
                Subtotal = x.Subtotal,
            })
            .ToListAsync();

        data.Receipt = await TransactionMethods.GetReceiptSettingAsync(_db);
        data.VoidRequest = await GetVoidRequestAsync(model.Id);

        return Ok(data);
    }

    #endregion

    #region Pembatalan

    /// <summary>
    /// Mengajukan pembatalan transaksi. Kasir tidak dapat membatalkan sendiri bila
    /// aturan approval void sedang aktif; stok baru dikembalikan setelah disetujui.
    /// </summary>
    [HttpPost("request-void")]
    public async Task<IActionResult> RequestVoidAsync([FromBody] VoidTransactionRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdTransaction))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Transaction? entity = await _db.Transaction
            .Include(x => x.ListDetail)
            .FirstOrDefaultAsync(x => x.IdTransaction == model.IdTransaction);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (!CanSeeAllTransactions && entity.CreatedById != CurrentUserId)
        {
            return BadRequest("Anda hanya dapat membatalkan transaksi yang Anda buat sendiri.");
        }

        if (entity.Status == DataStatus.Void)
        {
            return BadRequest("Transaksi ini sudah dibatalkan.");
        }

        if (entity.Status == DataStatus.Pending)
        {
            return BadRequest("Pembatalan transaksi ini sudah diajukan dan sedang menunggu keputusan supervisor.");
        }

        bool isApprovalRequired = await ApprovalMethods.IsApprovalRequiredAsync(_db, AppData.ApprovalTypeVoidTransaction);

        await using IDbContextTransaction dbTransaction = await _db.Database.BeginTransactionAsync();

        try
        {
            if (isApprovalRequired)
            {
                entity.Status = DataStatus.Pending;

                _db.ApprovalRequest.Add(ApprovalMethods.BuildRequest(
                    AppData.ApprovalTypeVoidTransaction,
                    EntityName,
                    entity.IdTransaction,
                    entity.InvoiceNumber,
                    $"Pembatalan transaksi {entity.InvoiceNumber}",
                    model.Reason.Trim(),
                    CurrentUserId));

                AddAuditLog("REQUEST_VOID_TRANSACTION", entity.IdTransaction,
                    $"Mengajukan pembatalan {entity.InvoiceNumber}. Alasan: {model.Reason.Trim()}");

                await _db.SaveChangesAsync();
                await dbTransaction.CommitAsync();

                return Ok("Pembatalan diajukan dan sedang menunggu persetujuan supervisor.");
            }

            string? errorMessage = await ApprovalMethods.ApplyVoidTransactionAsync(_db, entity.IdTransaction, CurrentUserId);

            if (errorMessage != null)
            {
                await dbTransaction.RollbackAsync();
                return BadRequest(errorMessage);
            }

            AddAuditLog("VOID_TRANSACTION", entity.IdTransaction,
                $"Membatalkan {entity.InvoiceNumber} tanpa approval karena aturannya sedang nonaktif. Alasan: {model.Reason.Trim()}");

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok("Transaksi dibatalkan dan stok sudah dikembalikan.");
        }
        catch (DbUpdateException exception)
        {
            await dbTransaction.RollbackAsync();
            return BadRequest(TranslateDbUpdateError(exception, "Transaksi"));
        }
    }

    private async Task<QueryApprovalRequestModel?> GetVoidRequestAsync(string idTransaction)
    {
        return await (
            from request in _db.ApprovalRequest
            join requester in _db.Users on request.CreatedById equals requester.Id into requesterGroup
            from requester in requesterGroup.DefaultIfEmpty()
            join decider in _db.Users on request.DecidedById equals decider.Id into deciderGroup
            from decider in deciderGroup.DefaultIfEmpty()
            where request.ReferenceId == idTransaction && request.ApprovalTypeCode == AppData.ApprovalTypeVoidTransaction
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

    #endregion
}
