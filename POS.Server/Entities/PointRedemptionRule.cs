using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class PointRedemptionRule : TablePointRedemptionRuleModel
{
    public PointRedemptionRule()
    {
        IdPointRedemptionRule = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }
}

public class PointRedemptionRuleConfiguration : IEntityTypeConfiguration<PointRedemptionRule>
{
    public void Configure(EntityTypeBuilder<PointRedemptionRule> builder)
    {
        builder.ToTable("point_redemption_rules");
        builder.HasKey(x => x.IdPointRedemptionRule);
        builder.Property(x => x.IdPointRedemptionRule).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.RuleName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.DiscountValueType).HasConversion<int>();
        builder.Property(x => x.DiscountValue).HasPrecision(18, 2);
        builder.Property(x => x.MaximumDiscount).HasPrecision(18, 2);
        builder.Property(x => x.MinimumPurchase).HasPrecision(18, 2);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => x.PointRequired);
    }
}

public static class MapperPointRedemptionRule
{
    public static void ApplyCreateEdit(this PointRedemptionRule entity, CreateEditPointRedemptionRuleModel model)
    {
        entity.RuleName = model.RuleName.Trim();
        entity.PointRequired = model.PointRequired;
        entity.DiscountValueType = model.DiscountValueType;
        entity.DiscountValue = model.DiscountValue;
        entity.MaximumDiscount = model.MaximumDiscount;
        entity.MinimumPurchase = model.MinimumPurchase;
        entity.IsActive = model.IsActive;
    }
}
