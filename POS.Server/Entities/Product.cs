using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Product : TableProductModel
{
    public Product()
    {
        IdProduct = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual Category? Category { get; set; }
    public virtual Unit? Unit { get; set; }
    public virtual ICollection<PriceHistory> ListPriceHistory { get; set; } = [];
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.HasKey(x => x.IdProduct);
        builder.Property(x => x.IdProduct).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.Sku).IsRequired().HasMaxLength(32);
        builder.Property(x => x.Barcode).HasMaxLength(64);
        builder.Property(x => x.ProductName).IsRequired().HasMaxLength(128);
        builder.Property(x => x.Description).HasMaxLength(512);
        builder.Property(x => x.IdCategory).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdUnit).IsRequired().HasMaxLength(36);
        builder.Property(x => x.CostPrice).HasPrecision(18, 2);
        builder.Property(x => x.SellingPrice).HasPrecision(18, 2);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => x.Sku).IsUnique();
        builder.HasIndex(x => x.ProductName);

        // Barcode boleh kosong untuk barang tanpa kemasan pabrik, tetapi kalau diisi
        // harus unik supaya pemindaian di kasir tidak pernah ambigu.
        builder.HasIndex(x => x.Barcode)
            .IsUnique()
            .HasFilter("\"Barcode\" IS NOT NULL");

        // Kategori dan satuan yang sudah dipakai produk tidak boleh terhapus.
        // Admin menonaktifkannya, dan produk lama tetap utuh.
        builder.HasOne(x => x.Category)
            .WithMany(x => x.ListProduct)
            .HasForeignKey(x => x.IdCategory)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Unit)
            .WithMany(x => x.ListProduct)
            .HasForeignKey(x => x.IdUnit)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public static class MapperProduct
{
    public static void ApplyCreateEdit(this Product entity, CreateEditProductModel model)
    {
        entity.Barcode = string.IsNullOrWhiteSpace(model.Barcode) ? null : model.Barcode.Trim();
        entity.ProductName = model.ProductName.Trim();
        entity.Description = model.Description?.Trim();
        entity.IdCategory = model.IdCategory;
        entity.IdUnit = model.IdUnit;
        entity.CostPrice = model.CostPrice;
        entity.SellingPrice = model.SellingPrice;
        entity.MinimumStock = model.MinimumStock;
        entity.IsActive = model.IsActive;
    }
}
