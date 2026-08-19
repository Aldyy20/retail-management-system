using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class PaymentMethod : TablePaymentMethodModel
{
}

public class PaymentMethodConfiguration : IEntityTypeConfiguration<PaymentMethod>
{
    public void Configure(EntityTypeBuilder<PaymentMethod> builder)
    {
        builder.ToTable("payment_methods");
        builder.HasKey(x => x.PaymentMethodCode);
        builder.Property(x => x.PaymentMethodCode).ValueGeneratedNever().HasMaxLength(24);
        builder.Property(x => x.PaymentMethodName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.Description).HasMaxLength(256);
    }
}
