using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Tests;

/// <summary>
/// Perolehan dan mutasi point (PRD BR-007 dan BR-008). Saldo point adalah uang bagi
/// pembeli, jadi tidak boleh berubah tanpa baris riwayat yang menjelaskannya.
/// </summary>
public class LoyaltyPointTests
{
    private static (string Key, string Value)[] LoyaltyOn(string purchasePerPoint = "10000", string pointPerUnit = "1")
    {
        return
        [
            (AppData.SettingMemberEnabled, "true"),
            (AppData.SettingLoyaltyEnabled, "true"),
            (AppData.SettingLoyaltyPurchasePerPoint, purchasePerPoint),
            (AppData.SettingLoyaltyPointPerUnit, pointPerUnit),
        ];
    }

    [Fact]
    public async Task CalculateEarnedPointAsync_MembulatkanKeBawahPerKelipatan()
    {
        using ApplicationDbContext db = TestDb.Create(LoyaltyOn());

        Assert.Equal(2, await LoyaltyMethods.CalculateEarnedPointAsync(db, 25000));
        Assert.Equal(0, await LoyaltyMethods.CalculateEarnedPointAsync(db, 9999));
    }

    /// <summary>PRD BR-005: tanpa sistem member menyala, point tidak pernah diberikan.</summary>
    [Fact]
    public async Task CalculateEarnedPointAsync_MemberDinonaktifkan_TidakAdaPoint()
    {
        using ApplicationDbContext db = TestDb.Create(
            (AppData.SettingMemberEnabled, "false"),
            (AppData.SettingLoyaltyEnabled, "true"),
            (AppData.SettingLoyaltyPurchasePerPoint, "10000"),
            (AppData.SettingLoyaltyPointPerUnit, "1"));

        Assert.Equal(0, await LoyaltyMethods.CalculateEarnedPointAsync(db, 100000));
    }

    [Fact]
    public void ApplyPointMovement_Perolehan_MenambahSaldoDanMencatatArah()
    {
        using ApplicationDbContext db = TestDb.Create();
        Member member = new() { PhoneNumber = "081234567890", MemberName = "Andi Wijaya", PointBalance = 4 };
        db.Member.Add(member);
        db.SaveChanges();

        LoyaltyMethods.ApplyPointMovement(db, member, PointMovementType.Earn, 2, "TRANSACTION", null, "INV-1", null, null);
        db.SaveChanges();

        Assert.Equal(6, member.PointBalance);

        MemberPointTransaction mutation = db.MemberPointTransaction.Single();
        Assert.Equal(4, mutation.PointBefore);
        Assert.Equal(6, mutation.PointAfter);
    }

    /// <summary>
    /// Jebakan yang pernah terjadi: arah mutasi tidak bisa disimpulkan dari kolom Point
    /// yang selalu positif. Saldo sebelum dan sesudah yang menentukan arahnya.
    /// </summary>
    [Fact]
    public void ApplyPointMovement_Penukaran_MenguranginSaldo()
    {
        using ApplicationDbContext db = TestDb.Create();
        Member member = new() { PhoneNumber = "081298765432", MemberName = "Rina Sari", PointBalance = 150 };
        db.Member.Add(member);
        db.SaveChanges();

        LoyaltyMethods.ApplyPointMovement(db, member, PointMovementType.Redeem, 100, "TRANSACTION", null, "INV-2", null, null);
        db.SaveChanges();

        Assert.Equal(50, member.PointBalance);

        MemberPointTransaction mutation = db.MemberPointTransaction.Single();
        Assert.Equal(100, mutation.Point);
        Assert.Equal(150, mutation.PointBefore);
        Assert.Equal(50, mutation.PointAfter);
        Assert.True(mutation.PointAfter < mutation.PointBefore);
    }

    [Fact]
    public void ApplyPointMovement_NolPoint_TidakMenulisApaPun()
    {
        using ApplicationDbContext db = TestDb.Create();
        Member member = new() { PhoneNumber = "081200000000", MemberName = "Tanpa Mutasi", PointBalance = 10 };
        db.Member.Add(member);
        db.SaveChanges();

        LoyaltyMethods.ApplyPointMovement(db, member, PointMovementType.Earn, 0, "TRANSACTION", null, null, null, null);
        db.SaveChanges();

        Assert.Equal(10, member.PointBalance);
        Assert.Empty(db.MemberPointTransaction);
    }

    /// <summary>Potongan penukaran tidak pernah melebihi nilai belanjanya sendiri.</summary>
    [Fact]
    public void CalculateRedemptionDiscount_DibatasiNilaiBelanja()
    {
        PointRedemptionRule rule = new()
        {
            RuleName = "Potongan 50.000",
            PointRequired = 100,
            DiscountValueType = DiscountValueType.FixedAmount,
            DiscountValue = 50000,
        };

        Assert.Equal(50000, LoyaltyMethods.CalculateRedemptionDiscount(rule, 80000));
        Assert.Equal(30000, LoyaltyMethods.CalculateRedemptionDiscount(rule, 30000));
    }

    [Fact]
    public void CalculateRedemptionDiscount_PersenDibatasiMaksimum()
    {
        PointRedemptionRule rule = new()
        {
            RuleName = "Potongan 10 persen",
            PointRequired = 200,
            DiscountValueType = DiscountValueType.Percentage,
            DiscountValue = 10,
            MaximumDiscount = 15000,
        };

        Assert.Equal(10000, LoyaltyMethods.CalculateRedemptionDiscount(rule, 100000));
        Assert.Equal(15000, LoyaltyMethods.CalculateRedemptionDiscount(rule, 500000));
    }

    /// <summary>Aturan yang tidak terpenuhi tetap ditampilkan, lengkap dengan alasannya.</summary>
    [Fact]
    public async Task GetRedemptionOptionsAsync_SaldoKurang_MenyebutkanKekurangannya()
    {
        using ApplicationDbContext db = TestDb.Create(LoyaltyOn());
        Member member = new() { PhoneNumber = "081211112222", MemberName = "Point Tipis", PointBalance = 40 };
        db.Member.Add(member);
        db.PointRedemptionRule.Add(new PointRedemptionRule
        {
            RuleName = "Potongan 10.000",
            PointRequired = 100,
            DiscountValueType = DiscountValueType.FixedAmount,
            DiscountValue = 10000,
            IsActive = true,
        });
        await db.SaveChangesAsync();

        List<POS.DataLayer.Models.PointRedemptionOptionModel> options =
            await LoyaltyMethods.GetRedemptionOptionsAsync(db, member, 200000);

        POS.DataLayer.Models.PointRedemptionOptionModel option = Assert.Single(options);
        Assert.False(option.IsAvailable);
        Assert.Contains("100", option.UnavailableReason);
        Assert.Contains("40", option.UnavailableReason);
    }
}
