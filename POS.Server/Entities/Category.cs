using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Category : TableCategoryModel
{
    public Category()
    {
        IdCategory = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual ICollection<Product> ListProduct { get; set; } = [];
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        builder.HasKey(x => x.IdCategory);
        builder.Property(x => x.IdCategory).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.CategoryName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.Description).HasMaxLength(256);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        // Nama kategori unik tanpa memandang huruf besar kecil, supaya tidak ada
        // "Minuman" dan "minuman" hidup berdampingan.
        builder.HasIndex(x => x.CategoryName).IsUnique();
    }
}

public static class MapperCategory
{
    public static void ApplyCreateEdit(this Category entity, CreateEditCategoryModel model)
    {
        entity.CategoryName = model.CategoryName.Trim();
        entity.Description = model.Description?.Trim();
        entity.IsActive = model.IsActive;
    }
}
