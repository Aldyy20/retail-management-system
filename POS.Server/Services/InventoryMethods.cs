using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.Server.Data;
using POS.Server.Entities;

namespace POS.Server.Services;

/// <summary>
/// Satu-satunya jalan mengubah stok.
///
/// Barang masuk, penjualan, retur, transfer, dan penyesuaian semuanya lewat sini, sehingga
/// tidak ada perubahan stok yang lolos tanpa meninggalkan catatan (PRD BR-002 dan BR-004).
/// Pemanggil bertanggung jawab membungkusnya dalam transaksi database dan memanggil
/// SaveChanges, supaya seluruh efek satu dokumen berhasil atau gagal bersama-sama.
/// </summary>
public static class InventoryMethods
{
    private static readonly StockMovementType[] IncomingTypes =
    [
        StockMovementType.In,
        StockMovementType.AdjustmentIn,
        StockMovementType.TransferIn,
        StockMovementType.ReturnIn,
    ];

    public static bool IsIncoming(StockMovementType movementType)
    {
        return IncomingTypes.Contains(movementType);
    }

    /// <summary>
    /// Menerapkan satu pergerakan stok dan mencatat riwayatnya.
    /// Mengembalikan pesan kesalahan berbahasa Indonesia bila gagal, atau null bila berhasil.
    /// </summary>
    public static async Task<string?> ApplyMovementAsync(
        ApplicationDbContext db,
        string idProduct,
        string idWarehouse,
        StockMovementType movementType,
        int quantity,
        string referenceType,
        string? referenceId,
        string? referenceNumber,
        string? note,
        string? userId)
    {
        if (quantity <= 0)
        {
            return "Jumlah pergerakan stok harus lebih dari nol.";
        }

        Inventory? inventory = await FindInventoryAsync(db, idProduct, idWarehouse);

        if (inventory == null)
        {
            inventory = new Inventory
            {
                IdProduct = idProduct,
                IdWarehouse = idWarehouse,
                Quantity = 0,
                CreatedById = userId,
            };
            db.Inventory.Add(inventory);
        }

        int quantityBefore = inventory.Quantity;
        int quantityAfter = IsIncoming(movementType) ? quantityBefore + quantity : quantityBefore - quantity;

        // Stok tidak boleh menjadi negatif. Kalau ini terjadi, ada barang keluar yang
        // tidak pernah tercatat masuk, dan itu harus diperbaiki lewat stock opname.
        if (quantityAfter < 0)
        {
            string productName = await db.Product
                .Where(x => x.IdProduct == idProduct)
                .Select(x => x.ProductName)
                .FirstOrDefaultAsync() ?? "Produk";

            return $"Stok {productName} tidak mencukupi. Tersedia {quantityBefore}, dibutuhkan {quantity}.";
        }

        inventory.Quantity = quantityAfter;
        inventory.ModifiedById = userId;
        inventory.DateModified = DateTime.Now;

        db.StockMovement.Add(new StockMovement
        {
            IdProduct = idProduct,
            IdWarehouse = idWarehouse,
            MovementType = movementType,
            Quantity = quantity,
            QuantityBefore = quantityBefore,
            QuantityAfter = quantityAfter,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            ReferenceNumber = referenceNumber,
            Note = note,
            CreatedById = userId,
        });

        return null;
    }

    /// <summary>
    /// Mencari baris stok, termasuk yang baru dibuat pada operasi yang sama tetapi
    /// belum tersimpan, supaya satu dokumen dengan produk berulang tetap benar.
    /// </summary>
    private static async Task<Inventory?> FindInventoryAsync(ApplicationDbContext db, string idProduct, string idWarehouse)
    {
        Inventory? pending = db.Inventory.Local
            .FirstOrDefault(x => x.IdProduct == idProduct && x.IdWarehouse == idWarehouse);

        if (pending != null)
        {
            return pending;
        }

        return await db.Inventory
            .FirstOrDefaultAsync(x => x.IdProduct == idProduct && x.IdWarehouse == idWarehouse);
    }

    /// <summary>Stok satu produk pada satu gudang, nol bila belum pernah ada.</summary>
    public static async Task<int> GetStockAsync(ApplicationDbContext db, string idProduct, string idWarehouse)
    {
        return await db.Inventory
            .Where(x => x.IdProduct == idProduct && x.IdWarehouse == idWarehouse)
            .Select(x => x.Quantity)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Menyusun nomor dokumen berurut, contoh GR-00001.
    /// ponytail: nomor diambil dari baris terakhir, bukan sequence database. Index unik pada
    /// kolom nomor yang menolak tabrakan. Pindah ke sequence bila nanti sering bertabrakan.
    /// </summary>
    public static string BuildDocumentNumber(string prefix, string? lastNumber)
    {
        int nextNumber = 1;

        if (!string.IsNullOrEmpty(lastNumber) && int.TryParse(lastNumber[(prefix.Length + 1)..], out int parsed))
        {
            nextNumber = parsed + 1;
        }

        return $"{prefix}-{nextNumber:D5}";
    }
}
