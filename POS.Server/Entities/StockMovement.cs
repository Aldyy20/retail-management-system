using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class StockMovement : TableStockMovementModel
{
    public StockMovement()
    {
        IdStockMovement = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual Product? Product { get; set; }
    public virtual Warehouse? Warehouse { get; set; }
}

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("stock_movements");
        builder.HasKey(x => x.IdStockMovement);
        builder.Property(x => x.IdStockMovement).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdProduct).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdWarehouse).IsRequired().HasMaxLength(36);
        builder.Property(x => x.MovementType).HasConversion<int>();
        builder.Property(x => x.ReferenceType).IsRequired().HasMaxLength(64);
        builder.Property(x => x.ReferenceId).HasMaxLength(36);
        builder.Property(x => x.ReferenceNumber).HasMaxLength(32);
        builder.Property(x => x.Note).HasMaxLength(256);
        builder.Property(x => x.CreatedById).HasMaxLength(36);

        // Riwayat pergerakan tidak boleh hilang bersama produknya, karena laporan
        // periode lalu masih membutuhkannya.
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.IdProduct)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.IdWarehouse)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.IdProduct, x.DateCreated });
        builder.HasIndex(x => new { x.ReferenceType, x.ReferenceId });
    }
}
