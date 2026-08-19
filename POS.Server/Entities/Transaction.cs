using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Transaction : TableTransactionModel
{
    public Transaction()
    {
        IdTransaction = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
        TransactionDate = DateTime.Now;
    }

    public virtual Warehouse? Warehouse { get; set; }
    public virtual PaymentMethod? PaymentMethod { get; set; }
    public virtual ApplicationUser? Cashier { get; set; }
    public virtual Member? Member { get; set; }
    public virtual ICollection<TransactionDetail> ListDetail { get; set; } = [];
}

public class TransactionDetail
{
    public TransactionDetail()
    {
        IdTransactionDetail = Guid.NewGuid().ToString();
    }

    public string IdTransactionDetail { get; set; } = string.Empty;
    public string IdTransaction { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;

    /// <summary>
    /// Nama, SKU, satuan, harga jual, dan harga modal dibekukan saat transaksi terjadi.
    /// Perubahan data produk di kemudian hari tidak boleh mengubah nota lama (PRD BR-001).
    /// </summary>
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Subtotal { get; set; }

    public virtual Transaction? Transaction { get; set; }
    public virtual Product? Product { get; set; }
}

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");
        builder.HasKey(x => x.IdTransaction);
        builder.Property(x => x.IdTransaction).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.InvoiceNumber).IsRequired().HasMaxLength(32);
        builder.Property(x => x.IdWarehouse).IsRequired().HasMaxLength(36);
        builder.Property(x => x.PaymentMethodCode).IsRequired().HasMaxLength(24);
        builder.Property(x => x.Note).HasMaxLength(512);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        foreach (string column in new[]
                 {
                     nameof(Transaction.SubtotalAmount), nameof(Transaction.DiscountAmount),
                     nameof(Transaction.VoucherDiscountAmount), nameof(Transaction.PointDiscountAmount),
                     nameof(Transaction.TotalAmount), nameof(Transaction.PaidAmount),
                     nameof(Transaction.ChangeAmount), nameof(Transaction.TotalCost),
                 })
        {
            builder.Property(column).HasPrecision(18, 2);
        }

        builder.HasIndex(x => x.InvoiceNumber).IsUnique();
        builder.HasIndex(x => x.TransactionDate);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.IdWarehouse)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.PaymentMethod)
            .WithMany()
            .HasForeignKey(x => x.PaymentMethodCode)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Cashier)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Member yang sudah pernah berbelanja tidak dapat dihapus, karena notanya
        // masih merujuk ke sana.
        builder.Property(x => x.IdMember).HasMaxLength(36);
        builder.Property(x => x.IdVoucher).HasMaxLength(36);
        builder.Property(x => x.VoucherCode).HasMaxLength(32);
        builder.HasOne(x => x.Member)
            .WithMany()
            .HasForeignKey(x => x.IdMember)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TransactionDetailConfiguration : IEntityTypeConfiguration<TransactionDetail>
{
    public void Configure(EntityTypeBuilder<TransactionDetail> builder)
    {
        builder.ToTable("transaction_details");
        builder.HasKey(x => x.IdTransactionDetail);
        builder.Property(x => x.IdTransactionDetail).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdTransaction).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdProduct).IsRequired().HasMaxLength(36);
        builder.Property(x => x.Sku).IsRequired().HasMaxLength(32);
        builder.Property(x => x.ProductName).IsRequired().HasMaxLength(128);
        builder.Property(x => x.UnitName).HasMaxLength(32);
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.CostPrice).HasPrecision(18, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2);
        builder.Property(x => x.Subtotal).HasPrecision(18, 2);

        builder.HasOne(x => x.Transaction)
            .WithMany(x => x.ListDetail)
            .HasForeignKey(x => x.IdTransaction)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.IdProduct)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
