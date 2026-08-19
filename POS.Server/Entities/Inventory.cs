using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Inventory : TableInventoryModel
{
    public Inventory()
    {
        IdInventory = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual Product? Product { get; set; }
    public virtual Warehouse? Warehouse { get; set; }
}

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.ToTable("inventories");
        builder.HasKey(x => x.IdInventory);
        builder.Property(x => x.IdInventory).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdProduct).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdWarehouse).IsRequired().HasMaxLength(36);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        // Satu produk hanya boleh punya satu baris stok per gudang. Aturan ini ditegakkan
        // database supaya dua proses bersamaan tidak pernah membuat baris kembar.
        builder.HasIndex(x => new { x.IdProduct, x.IdWarehouse }).IsUnique();

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.IdProduct)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.IdWarehouse)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
