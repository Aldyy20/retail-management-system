using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.Server.Data;
using POS.Server.Entities;

namespace POS.Server.Services;

/// <summary>
/// Alur persetujuan yang berlaku lintas modul.
///
/// Apakah sebuah tindakan butuh persetujuan ditentukan pengaturan sistem, bukan kode,
/// sehingga admin dapat mengubahnya tanpa deployment ulang (PRD bagian 38). Efek yang
/// terjadi setelah disetujui tetap ditulis eksplisit per jenis, karena tiap modul
/// memiliki aturan stok dan status yang berbeda.
/// </summary>
public static class ApprovalMethods
{
    public static async Task<bool> IsApprovalRequiredAsync(ApplicationDbContext db, string approvalTypeCode)
    {
        string settingKey = AppData.GetApprovalSettingKey(approvalTypeCode);

        // Jenis tindakan tanpa pengaturan pendamping dianggap selalu butuh persetujuan,
        // supaya penambahan jenis baru tidak diam-diam melewati pengawasan.
        return string.IsNullOrEmpty(settingKey) || await GlobalList.GetSettingBoolAsync(db, settingKey, true);
    }

    public static ApprovalRequest BuildRequest(
        string approvalTypeCode,
        string moduleName,
        string referenceId,
        string? referenceNumber,
        string title,
        string? description,
        string? userId)
    {
        return new ApprovalRequest
        {
            ApprovalTypeCode = approvalTypeCode,
            ModuleName = moduleName,
            ReferenceId = referenceId,
            ReferenceNumber = referenceNumber,
            Title = title,
            Description = description,
            Status = DataStatus.Pending,
            CreatedById = userId,
        };
    }

    /// <summary>
    /// Menerapkan akibat dari persetujuan. Mengembalikan pesan kesalahan berbahasa
    /// Indonesia bila tidak dapat diterapkan, atau null bila berhasil.
    /// Pemanggil yang membungkusnya dalam transaksi dan menyimpan perubahan.
    /// </summary>
    public static async Task<string?> ApplyApprovedEffectAsync(
        ApplicationDbContext db,
        ApprovalRequest request,
        string? userId)
    {
        return request.ApprovalTypeCode switch
        {
            AppData.ApprovalTypeGoodsReceiving => await ApplyGoodsReceivingAsync(db, request.ReferenceId, userId),
            AppData.ApprovalTypeStockAdjustment => await ApplyStockAdjustmentAsync(db, request.ReferenceId, userId),
            _ => $"Jenis persetujuan {request.ApprovalTypeCode} belum memiliki penanganan di server.",
        };
    }

    /// <summary>Menolak permintaan berarti mengembalikan dokumen asalnya ke status ditolak.</summary>
    public static async Task<string?> ApplyRejectedEffectAsync(ApplicationDbContext db, ApprovalRequest request)
    {
        switch (request.ApprovalTypeCode)
        {
            case AppData.ApprovalTypeGoodsReceiving:
                GoodsReceiving? receiving = await db.GoodsReceiving.FindAsync(request.ReferenceId);

                if (receiving == null)
                {
                    return "Dokumen barang masuk yang dirujuk tidak ditemukan.";
                }

                receiving.Status = DataStatus.Rejected;
                return null;

            case AppData.ApprovalTypeStockAdjustment:
                StockOpname? opname = await db.StockOpname.FindAsync(request.ReferenceId);

                if (opname == null)
                {
                    return "Dokumen stock opname yang dirujuk tidak ditemukan.";
                }

                opname.Status = DataStatus.Rejected;
                return null;

            default:
                return $"Jenis persetujuan {request.ApprovalTypeCode} belum memiliki penanganan di server.";
        }
    }

    /// <summary>Barang masuk yang disetujui menambah stok gudang tujuan.</summary>
    public static async Task<string?> ApplyGoodsReceivingAsync(ApplicationDbContext db, string idGoodsReceiving, string? userId)
    {
        GoodsReceiving? receiving = await db.GoodsReceiving
            .Include(x => x.ListDetail)
            .FirstOrDefaultAsync(x => x.IdGoodsReceiving == idGoodsReceiving);

        if (receiving == null)
        {
            return "Dokumen barang masuk yang dirujuk tidak ditemukan.";
        }

        if (receiving.Status == DataStatus.Completed)
        {
            return "Dokumen barang masuk ini sudah pernah diterapkan ke stok.";
        }

        foreach (GoodsReceivingDetail detail in receiving.ListDetail)
        {
            string? errorMessage = await InventoryMethods.ApplyMovementAsync(
                db,
                detail.IdProduct,
                receiving.IdWarehouse,
                StockMovementType.In,
                detail.Quantity,
                "Barang Masuk",
                receiving.IdGoodsReceiving,
                receiving.ReceivingNumber,
                null,
                userId);

            if (errorMessage != null)
            {
                return errorMessage;
            }
        }

        receiving.Status = DataStatus.Completed;
        receiving.ModifiedById = userId;
        receiving.DateModified = DateTime.Now;
        return null;
    }

    /// <summary>
    /// Stock opname yang disetujui menyamakan stok sistem dengan hasil hitung fisik.
    /// Hanya baris yang berselisih yang menghasilkan pergerakan stok.
    /// </summary>
    public static async Task<string?> ApplyStockAdjustmentAsync(ApplicationDbContext db, string idStockOpname, string? userId)
    {
        StockOpname? opname = await db.StockOpname
            .Include(x => x.ListDetail)
            .FirstOrDefaultAsync(x => x.IdStockOpname == idStockOpname);

        if (opname == null)
        {
            return "Dokumen stock opname yang dirujuk tidak ditemukan.";
        }

        if (opname.Status == DataStatus.Completed)
        {
            return "Dokumen stock opname ini sudah pernah diterapkan ke stok.";
        }

        foreach (StockOpnameDetail detail in opname.ListDetail)
        {
            // Selisih dihitung ulang terhadap stok saat ini, bukan terhadap stok yang
            // dibekukan saat dokumen dibuat, supaya penjualan yang terjadi selama proses
            // opname tidak ikut terhapus oleh penyesuaian.
            int currentStock = await InventoryMethods.GetStockAsync(db, detail.IdProduct, opname.IdWarehouse);
            int difference = detail.PhysicalStock - currentStock;

            if (difference == 0)
            {
                continue;
            }

            string? errorMessage = await InventoryMethods.ApplyMovementAsync(
                db,
                detail.IdProduct,
                opname.IdWarehouse,
                difference > 0 ? StockMovementType.AdjustmentIn : StockMovementType.AdjustmentOut,
                Math.Abs(difference),
                "Stock Opname",
                opname.IdStockOpname,
                opname.OpnameNumber,
                $"Penyesuaian dari stok {currentStock} menjadi {detail.PhysicalStock}.",
                userId);

            if (errorMessage != null)
            {
                return errorMessage;
            }
        }

        opname.Status = DataStatus.Completed;
        opname.ModifiedById = userId;
        opname.DateModified = DateTime.Now;
        return null;
    }
}
