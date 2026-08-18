using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Warehouse : TableWarehouseModel
{
    public Warehouse()
    {
        IdWarehouse = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }
}

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("warehouses");
        builder.HasKey(x => x.IdWarehouse);
        builder.Property(x => x.IdWarehouse).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.WarehouseCode).IsRequired().HasMaxLength(16);
        builder.Property(x => x.WarehouseName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.Address).HasMaxLength(256);
        builder.Property(x => x.Description).HasMaxLength(256);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => x.WarehouseCode).IsUnique();

        // Index tersaring PostgreSQL: hanya boleh ada satu baris dengan IsDefault true.
        // Aturan ini ditegakkan database, bukan hanya oleh kode aplikasi.
        builder.HasIndex(x => x.IsDefault)
            .IsUnique()
            .HasFilter("\"IsDefault\" = true");
    }
}

public static class MapperWarehouse
{
    public static void ApplyCreateEdit(this Warehouse entity, CreateEditWarehouseModel model)
    {
        entity.WarehouseCode = model.WarehouseCode.Trim().ToUpperInvariant();
        entity.WarehouseName = model.WarehouseName.Trim();
        entity.Address = model.Address?.Trim();
        entity.Description = model.Description?.Trim();
        entity.IsActive = model.IsActive;
    }
}
