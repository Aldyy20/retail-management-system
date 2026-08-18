using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class PriceHistory : TablePriceHistoryModel
{
    public PriceHistory()
    {
        IdPriceHistory = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual Product? Product { get; set; }
}

public class PriceHistoryConfiguration : IEntityTypeConfiguration<PriceHistory>
{
    public void Configure(EntityTypeBuilder<PriceHistory> builder)
    {
        builder.ToTable("price_histories");
        builder.HasKey(x => x.IdPriceHistory);
        builder.Property(x => x.IdPriceHistory).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdProduct).IsRequired().HasMaxLength(36);
        builder.Property(x => x.CostPrice).HasPrecision(18, 2);
        builder.Property(x => x.SellingPrice).HasPrecision(18, 2);
        builder.Property(x => x.PreviousCostPrice).HasPrecision(18, 2);
        builder.Property(x => x.PreviousSellingPrice).HasPrecision(18, 2);
        builder.Property(x => x.Note).HasMaxLength(256);
        builder.Property(x => x.CreatedById).HasMaxLength(36);

        // Histori ikut terhapus bila produknya benar-benar dihapus, karena tanpa
        // produknya catatan harga tidak punya arti.
        builder.HasOne(x => x.Product)
            .WithMany(x => x.ListPriceHistory)
            .HasForeignKey(x => x.IdProduct)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.IdProduct, x.DateCreated });
    }
}
