using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.Server.Data;
using POS.Server.Entities;

namespace POS.Server.Services;

/// <summary>
/// Diskon produk dan voucher.
///
/// Urutan potongan mengikuti aturan yang ditetapkan PRD bagian 25 dan tidak boleh
/// ditukar: harga produk, diskon produk, voucher, lalu penukaran point. Setiap potongan
/// dihitung dari sisa nilai belanja setelah potongan sebelumnya.
/// </summary>
public static class PromotionMethods
{
    public static async Task<bool> IsVoucherEnabledAsync(ApplicationDbContext db)
    {
        return await GlobalList.GetSettingBoolAsync(db, AppData.SettingVoucherEnabled);
    }

    /// <summary>
    /// Potongan diskon per satuan untuk sekumpulan produk, berdasarkan diskon yang aktif
    /// dan sedang berada dalam masa berlakunya.
    ///
    /// Bila satu produk terkena lebih dari satu diskon, yang dipakai adalah potongan
    /// terbesar. Aturan ini dipilih supaya promo tidak pernah ditumpuk dan pembeli selalu
    /// mendapat yang paling menguntungkan (PRD bagian 25).
    /// </summary>
    public static async Task<Dictionary<string, decimal>> GetProductDiscountPerUnitAsync(
        ApplicationDbContext db,
        string[] productIds,
        Dictionary<string, decimal> sellingPriceByProduct)
    {
        Dictionary<string, decimal> result = [];

        if (productIds.Length == 0)
        {
            return result;
        }

        DateTime today = DateTime.Now.Date;

        var candidates = await (
            from link in db.DiscountProduct
            join discount in db.Discount on link.IdDiscount equals discount.IdDiscount
            where productIds.Contains(link.IdProduct)
                && discount.IsActive
                && discount.StartDate.Date <= today
                && discount.EndDate.Date >= today
            select new
            {
                link.IdProduct,
                discount.DiscountValueType,
                discount.DiscountValue,
                discount.MaximumDiscount,
            })
            .ToListAsync();

        foreach (var candidate in candidates)
        {
            if (!sellingPriceByProduct.TryGetValue(candidate.IdProduct, out decimal sellingPrice))
            {
                continue;
            }

            decimal discountPerUnit = candidate.DiscountValueType == DiscountValueType.Percentage
                ? sellingPrice * candidate.DiscountValue / 100m
                : candidate.DiscountValue;

            if (candidate.MaximumDiscount > 0 && discountPerUnit > candidate.MaximumDiscount)
            {
                discountPerUnit = candidate.MaximumDiscount;
            }

            // Potongan tidak pernah melebihi harga barangnya sendiri.
            if (discountPerUnit > sellingPrice)
            {
                discountPerUnit = sellingPrice;
            }

            discountPerUnit = Math.Round(discountPerUnit, 2);

            if (!result.TryGetValue(candidate.IdProduct, out decimal existing) || discountPerUnit > existing)
            {
                result[candidate.IdProduct] = discountPerUnit;
            }
        }

        return result;
    }

    /// <summary>
    /// Memeriksa voucher terhadap satu keranjang. Seluruh syarat BR-006 diperiksa di sini,
    /// dan alasan penolakan dikembalikan apa adanya supaya kasir tahu apa yang kurang.
    /// </summary>
    public static async Task<VoucherValidationModel> ValidateVoucherAsync(
        ApplicationDbContext db,
        string? voucherCode,
        decimal amountAfterProductDiscount,
        bool hasMember)
    {
        VoucherValidationModel result = new();

        if (string.IsNullOrWhiteSpace(voucherCode))
        {
            return result;
        }

        if (!await IsVoucherEnabledAsync(db))
        {
            result.ErrorMessage = "Sistem voucher sedang dinonaktifkan admin.";
            return result;
        }

        string code = voucherCode.Trim().ToUpperInvariant();
        Voucher? voucher = await db.Voucher.FirstOrDefaultAsync(x => x.VoucherCode == code);

        if (voucher == null)
        {
            result.ErrorMessage = $"Voucher {code} tidak ditemukan.";
            return result;
        }

        result.IdVoucher = voucher.IdVoucher;
        result.VoucherCode = voucher.VoucherCode;
        result.VoucherName = voucher.VoucherName;

        DateTime today = DateTime.Now.Date;

        if (!voucher.IsActive)
        {
            result.ErrorMessage = $"Voucher {code} sedang dinonaktifkan.";
            return result;
        }

        if (today < voucher.StartDate.Date)
        {
            result.ErrorMessage = $"Voucher {code} baru berlaku mulai {voucher.StartDate:dd/MM/yyyy}.";
            return result;
        }

        if (today > voucher.EndDate.Date)
        {
            result.ErrorMessage = $"Voucher {code} sudah berakhir pada {voucher.EndDate:dd/MM/yyyy}.";
            return result;
        }

        if (voucher.UsageLimit > 0 && voucher.UsageCount >= voucher.UsageLimit)
        {
            result.ErrorMessage = $"Kuota voucher {code} sudah habis.";
            return result;
        }

        if (voucher.IsMemberOnly && !hasMember)
        {
            result.ErrorMessage = $"Voucher {code} hanya untuk member. Pilih member lebih dulu.";
            return result;
        }

        if (amountAfterProductDiscount < voucher.MinimumPurchase)
        {
            result.ErrorMessage = $"Voucher {code} butuh belanja minimal {voucher.MinimumPurchase:N0}.";
            return result;
        }

        decimal discount = voucher.DiscountValueType == DiscountValueType.Percentage
            ? amountAfterProductDiscount * voucher.DiscountValue / 100m
            : voucher.DiscountValue;

        if (voucher.MaximumDiscount > 0 && discount > voucher.MaximumDiscount)
        {
            discount = voucher.MaximumDiscount;
        }

        if (discount > amountAfterProductDiscount)
        {
            discount = amountAfterProductDiscount;
        }

        result.IsValid = true;
        result.DiscountAmount = Math.Round(discount, 2);
        return result;
    }
}
