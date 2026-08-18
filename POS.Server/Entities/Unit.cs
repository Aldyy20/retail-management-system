using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Unit : TableUnitModel
{
    public Unit()
    {
        IdUnit = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual ICollection<Product> ListProduct { get; set; } = [];
}

public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.ToTable("units");
        builder.HasKey(x => x.IdUnit);
        builder.Property(x => x.IdUnit).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.UnitName).IsRequired().HasMaxLength(32);
        builder.Property(x => x.Description).HasMaxLength(256);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => x.UnitName).IsUnique();
    }
}

public static class MapperUnit
{
    public static void ApplyCreateEdit(this Unit entity, CreateEditUnitModel model)
    {
        entity.UnitName = model.UnitName.Trim().ToUpperInvariant();
        entity.Description = model.Description?.Trim();
        entity.IsActive = model.IsActive;
    }
}
