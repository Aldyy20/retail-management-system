using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.Server.Data;
using POS.Server.Entities;

namespace POS.Server.Services;

/// <summary>
/// Aturan member dan loyalty point.
///
/// Seluruh angkanya berasal dari pengaturan sistem dan tabel aturan penukaran, tidak ada
/// yang ditulis tetap di kode, sehingga toko dapat mengubah kebijakan loyalty sendiri
/// (PRD bagian 20, 21, dan 52).
/// </summary>
public static class LoyaltyMethods
{
    /// <summary>Sistem member aktif atau tidak. Menentukan seluruh perilaku di bawah.</summary>
    public static async Task<bool> IsMemberEnabledAsync(ApplicationDbContext db)
    {
        return await GlobalList.GetSettingBoolAsync(db, AppData.SettingMemberEnabled);
    }

    /// <summary>Point hanya diproses bila sistem member dan loyalty dua-duanya aktif.</summary>
    public static async Task<bool> IsLoyaltyEnabledAsync(ApplicationDbContext db)
    {
        return await IsMemberEnabledAsync(db)
            && await GlobalList.GetSettingBoolAsync(db, AppData.SettingLoyaltyEnabled);
    }

    /// <summary>
    /// Menghitung point yang diperoleh dari satu transaksi menurut aturan yang sedang
    /// berlaku, bukan aturan saat laporan dibuka (PRD BR-007).
    /// </summary>
    public static async Task<int> CalculateEarnedPointAsync(ApplicationDbContext db, decimal totalAmount)
    {
        if (totalAmount <= 0 || !await IsLoyaltyEnabledAsync(db))
        {
            return 0;
        }

        decimal purchasePerPoint = await GlobalList.GetSettingDecimalAsync(db, AppData.SettingLoyaltyPurchasePerPoint);
        int pointPerUnit = await GlobalList.GetSettingIntAsync(db, AppData.SettingLoyaltyPointPerUnit);

        if (purchasePerPoint <= 0 || pointPerUnit <= 0)
        {
            return 0;
        }

        return (int)Math.Floor(totalAmount / purchasePerPoint) * pointPerUnit;
    }

    /// <summary>
    /// Potongan rupiah dari satu aturan penukaran untuk nilai belanja tertentu.
    /// Potongan tidak pernah melebihi nilai belanjanya sendiri.
    /// </summary>
    public static decimal CalculateRedemptionDiscount(PointRedemptionRule rule, decimal amountBeforePoint)
    {
        decimal discount = rule.DiscountValueType == DiscountValueType.Percentage
            ? amountBeforePoint * rule.DiscountValue / 100m
            : rule.DiscountValue;

        if (rule.MaximumDiscount > 0 && discount > rule.MaximumDiscount)
        {
            discount = rule.MaximumDiscount;
        }

        if (discount > amountBeforePoint)
        {
            discount = amountBeforePoint;
        }

        return Math.Round(discount, 2);
    }

    /// <summary>
    /// Menyusun pilihan penukaran untuk kasir, lengkap dengan alasan bila sebuah aturan
    /// tidak dapat dipakai, supaya kasir tahu apa yang kurang tanpa menebak.
    /// </summary>
    public static async Task<List<PointRedemptionOptionModel>> GetRedemptionOptionsAsync(
        ApplicationDbContext db,
        Member? member,
        decimal amountBeforePoint)
    {
        List<PointRedemptionOptionModel> options = [];

        if (member == null || !await IsLoyaltyEnabledAsync(db))
        {
            return options;
        }

        List<PointRedemptionRule> rules = await db.PointRedemptionRule
            .Where(x => x.IsActive)
            .OrderBy(x => x.PointRequired)
            .ToListAsync();

        foreach (PointRedemptionRule rule in rules)
        {
            string? unavailableReason = null;

            if (member.PointBalance < rule.PointRequired)
            {
                unavailableReason = $"Saldo point kurang. Dibutuhkan {rule.PointRequired}, tersedia {member.PointBalance}.";
            }
            else if (amountBeforePoint < rule.MinimumPurchase)
            {
                unavailableReason = $"Minimum belanja {rule.MinimumPurchase:N0} belum terpenuhi.";
            }

            options.Add(new PointRedemptionOptionModel
            {
                IdPointRedemptionRule = rule.IdPointRedemptionRule,
                RuleName = rule.RuleName,
                PointRequired = rule.PointRequired,
                DiscountAmount = CalculateRedemptionDiscount(rule, amountBeforePoint),
                IsAvailable = unavailableReason == null,
                UnavailableReason = unavailableReason,
            });
        }

        return options;
    }

    /// <summary>
    /// Mengubah saldo point sekaligus mencatat mutasinya. Sama seperti stok, saldo tidak
    /// pernah berubah tanpa meninggalkan riwayat. Pemanggil yang menyimpan perubahannya.
    /// </summary>
    public static void ApplyPointMovement(
        ApplicationDbContext db,
        Member member,
        PointMovementType movementType,
        int point,
        string referenceType,
        string? referenceId,
        string? referenceNumber,
        string? note,
        string? userId)
    {
        if (point == 0)
        {
            return;
        }

        int pointBefore = member.PointBalance;
        bool isIncoming = movementType == PointMovementType.Earn
            || (movementType == PointMovementType.Adjustment && point > 0);

        int pointAfter = isIncoming ? pointBefore + Math.Abs(point) : pointBefore - Math.Abs(point);

        member.PointBalance = pointAfter;
        member.DateModified = DateTime.Now;
        member.ModifiedById = userId;

        db.MemberPointTransaction.Add(new MemberPointTransaction
        {
            IdMember = member.IdMember,
            MovementType = movementType,
            Point = Math.Abs(point),
            PointBefore = pointBefore,
            PointAfter = pointAfter,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            ReferenceNumber = referenceNumber,
            Note = note,
            CreatedById = userId,
        });
    }
}
