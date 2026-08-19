using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class StockOpname : TableStockOpnameModel
{
    public StockOpname()
    {
        IdStockOpname = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
        OpnameDate = DateTime.Now;
    }

    public virtual Warehouse? Warehouse { get; set; }
    public virtual ICollection<StockOpnameDetail> ListDetail { get; set; } = [];
}

public class StockOpnameDetail
{
    public StockOpnameDetail()
    {
        IdStockOpnameDetail = Guid.NewGuid().ToString();
    }

    public string IdStockOpnameDetail { get; set; } = string.Empty;
    public string IdStockOpname { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;

    /// <summary>
    /// Stok menurut sistem saat dokumen dibuat. Dibekukan supaya selisihnya tetap
    /// bermakna meski stok berubah karena penjualan sementara opname berjalan.
    /// </summary>
    public int SystemStock { get; set; }

    public int PhysicalStock { get; set; }

    public virtual StockOpname? StockOpname { get; set; }
    public virtual Product? Product { get; set; }
}

public class StockOpnameConfiguration : IEntityTypeConfiguration<StockOpname>
{
    public void Configure(EntityTypeBuilder<StockOpname> builder)
    {
        builder.ToTable("stock_opnames");
        builder.HasKey(x => x.IdStockOpname);
        builder.Property(x => x.IdStockOpname).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.OpnameNumber).IsRequired().HasMaxLength(32);
        builder.Property(x => x.IdWarehouse).IsRequired().HasMaxLength(36);
        builder.Property(x => x.Note).HasMaxLength(512);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => x.OpnameNumber).IsUnique();
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.IdWarehouse)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockOpnameDetailConfiguration : IEntityTypeConfiguration<StockOpnameDetail>
{
    public void Configure(EntityTypeBuilder<StockOpnameDetail> builder)
    {
        builder.ToTable("stock_opname_details");
        builder.HasKey(x => x.IdStockOpnameDetail);
        builder.Property(x => x.IdStockOpnameDetail).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdStockOpname).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdProduct).IsRequired().HasMaxLength(36);

        builder.HasOne(x => x.StockOpname)
            .WithMany(x => x.ListDetail)
            .HasForeignKey(x => x.IdStockOpname)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.IdProduct)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
