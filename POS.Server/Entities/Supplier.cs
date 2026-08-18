using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;
using POS.DataLayer.Services;

namespace POS.Server.Entities;

public class Supplier : TableSupplierModel
{
    public Supplier()
    {
        IdSupplier = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }
}

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("suppliers");
        builder.HasKey(x => x.IdSupplier);
        builder.Property(x => x.IdSupplier).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.SupplierName).IsRequired().HasMaxLength(96);
        builder.Property(x => x.ContactName).HasMaxLength(96);
        builder.Property(x => x.PhoneNumber).HasMaxLength(20);
        builder.Property(x => x.Email).HasMaxLength(128);
        builder.Property(x => x.Address).HasMaxLength(256);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        builder.HasIndex(x => x.SupplierName);
    }
}

public static class MapperSupplier
{
    public static void ApplyCreateEdit(this Supplier entity, CreateEditSupplierModel model)
    {
        entity.SupplierName = model.SupplierName.Trim();
        entity.ContactName = model.ContactName?.Trim();
        string phoneNumber = DataLayerMethods.NormalizePhoneNumber(model.PhoneNumber);
        entity.PhoneNumber = phoneNumber.Length == 0 ? null : phoneNumber;
        entity.Email = model.Email?.Trim();
        entity.Address = model.Address?.Trim();
        entity.IsActive = model.IsActive;
    }
}
