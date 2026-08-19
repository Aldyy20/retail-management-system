using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class Voucher : TableVoucherModel
{
    public Voucher()
    {
        IdVoucher = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
        StartDate = DateTime.Now.Date;
        EndDate = DateTime.Now.Date;
    }
}

/// <summary>
/// Catatan setiap pemakaian voucher. Dipakai untuk menghitung kuota dan menelusuri
/// siapa yang memakainya pada transaksi mana (PRD bagian 39).
/// </summary>
public class VoucherUsage
{
    public VoucherUsage()
    {
        IdVoucherUsage = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public string IdVoucherUsage { get; set; } = string.Empty;
    public string IdVoucher { get; set; } = string.Empty;
    public string IdTransaction { get; set; } = string.Empty;
    public string? IdMember { get; set; }
    public decimal DiscountAmount { get; set; }
    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }

    public virtual Voucher? Voucher { get; set; }
    public virtual Transaction? Transaction { get; set; }
}

public class VoucherConfiguration : IEntityTypeConfiguration<Voucher>
{
    public void Configure(EntityTypeBuilder<Voucher> builder)
    {
        builder.ToTable("vouchers");
        builder.HasKey(x => x.IdVoucher);
        builder.Property(x => x.IdVoucher).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.VoucherCode).IsRequired().HasMaxLength(32);
        builder.Property(x => x.VoucherName).IsRequired().HasMaxLength(96);
        builder.Property(x => x.DiscountValueType).HasConversion<int>();
        builder.Property(x => x.DiscountValue).HasPrecision(18, 2);
        builder.Property(x => x.MinimumPurchase).HasPrecision(18, 2);
        builder.Property(x => x.MaximumDiscount).HasPrecision(18, 2);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        // Kode voucher adalah yang diketik kasir, jadi tidak boleh ada yang kembar.
        builder.HasIndex(x => x.VoucherCode).IsUnique();
    }
}

public class VoucherUsageConfiguration : IEntityTypeConfiguration<VoucherUsage>
{
    public void Configure(EntityTypeBuilder<VoucherUsage> builder)
    {
        builder.ToTable("voucher_usages");
        builder.HasKey(x => x.IdVoucherUsage);
        builder.Property(x => x.IdVoucherUsage).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdVoucher).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdTransaction).IsRequired().HasMaxLength(36);
        builder.Property(x => x.IdMember).HasMaxLength(36);
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2);
        builder.Property(x => x.CreatedById).HasMaxLength(36);

        builder.HasOne(x => x.Voucher)
            .WithMany()
            .HasForeignKey(x => x.IdVoucher)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Transaction)
            .WithMany()
            .HasForeignKey(x => x.IdTransaction)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.IdVoucher);
    }
}
