using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class GoodsReceiving : TableGoodsReceivingModel
{
    public GoodsReceiving()
    {
        IdGoodsReceiving = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
        ReceivingDate = DateTime.Now;
    }

    public virtual Warehouse? Warehouse { get; set; }
    public virtual Supplier? Supplier { get; set; }
    public virtual ICollection<GoodsReceivingDetail> ListDetail { get; set; } = [];
}

public class GoodsReceivingDetail
{
    public GoodsReceivingDetail()
    {
        IdGoodsReceivingDetail = Guid.NewGuid().ToString();
    }

    public string IdGoodsReceivingDetail { get; set; } = string.Empty;
    public string IdGoodsReceiving { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;
    public int Quantity { get; set; }

    /// <summary>
    /// Harga modal saat barang diterima, disimpan sebagai snapshot. Perubahan harga
    /// produk di kemudian hari tidak boleh mengubah nilai pembelian yang sudah tercatat.
    /// </summary>
    public decimal CostPrice { get; set; }

    public virtual GoodsReceiving? GoodsReceiving { get; set; }
    public virtual Product? Product { get; set; }
}

public class GoodsReceivingConfiguration : IEntityTypeConfiguration<GoodsReceiving>
{
    public void Configure(EntityTypeBuilder<GoodsReceiving> builder)
    {
        builder.ToTable("goods_receivings");
        builder.HasKey(x => x.IdGoodsReceiving);
        builder.Property(x => x.IdGoodsReceiving).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.ReceivingNumber).IsRequired().HasMaxLength(32);
        builder.Property(x => x.IdWarehouse).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdSupplier).IsRequired().HasMaxLength(36);
        builder.Property(x => x.InvoiceNumber).HasMaxLength(64);
        builder.Property(x => x.Note).HasMaxLength(512);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.TotalCost).HasPrecision(18, 2);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => x.ReceivingNumber).IsUnique();
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.IdWarehouse)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.IdSupplier)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class GoodsReceivingDetailConfiguration : IEntityTypeConfiguration<GoodsReceivingDetail>
{
    public void Configure(EntityTypeBuilder<GoodsReceivingDetail> builder)
    {
        builder.ToTable("goods_receiving_details");
        builder.HasKey(x => x.IdGoodsReceivingDetail);
        builder.Property(x => x.IdGoodsReceivingDetail).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdGoodsReceiving).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdProduct).IsRequired().HasMaxLength(36);
        builder.Property(x => x.CostPrice).HasPrecision(18, 2);

        builder.HasOne(x => x.GoodsReceiving)
            .WithMany(x => x.ListDetail)
            .HasForeignKey(x => x.IdGoodsReceiving)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.IdProduct)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
