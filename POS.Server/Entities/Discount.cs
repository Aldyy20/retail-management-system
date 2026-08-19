using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Discount : TableDiscountModel
{
    public Discount()
    {
        IdDiscount = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
        StartDate = DateTime.Now.Date;
        EndDate = DateTime.Now.Date;
    }

    public virtual ICollection<DiscountProduct> ListProduct { get; set; } = [];
}

/// <summary>Penghubung antara satu diskon dan produk yang terkena diskon itu.</summary>
public class DiscountProduct
{
    public DiscountProduct()
    {
        IdDiscountProduct = Guid.NewGuid().ToString();
    }

    public string IdDiscountProduct { get; set; } = string.Empty;
    public string IdDiscount { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;

    public virtual Discount? Discount { get; set; }
    public virtual Product? Product { get; set; }
}

public class DiscountConfiguration : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.ToTable("discounts");
        builder.HasKey(x => x.IdDiscount);
        builder.Property(x => x.IdDiscount).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.DiscountName).IsRequired().HasMaxLength(96);
        builder.Property(x => x.DiscountValueType).HasConversion<int>();
        builder.Property(x => x.DiscountValue).HasPrecision(18, 2);
        builder.Property(x => x.MaximumDiscount).HasPrecision(18, 2);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => new { x.IsActive, x.StartDate, x.EndDate });
    }
}

public class DiscountProductConfiguration : IEntityTypeConfiguration<DiscountProduct>
{
    public void Configure(EntityTypeBuilder<DiscountProduct> builder)
    {
        builder.ToTable("discount_products");
        builder.HasKey(x => x.IdDiscountProduct);
        builder.Property(x => x.IdDiscountProduct).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdDiscount).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdProduct).IsRequired().HasMaxLength(36);

        // Satu produk hanya boleh terdaftar sekali pada satu diskon.
        builder.HasIndex(x => new { x.IdDiscount, x.IdProduct }).IsUnique();

        builder.HasOne(x => x.Discount)
            .WithMany(x => x.ListProduct)
            .HasForeignKey(x => x.IdDiscount)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.IdProduct)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
