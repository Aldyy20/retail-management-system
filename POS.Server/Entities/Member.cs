using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;
using POS.DataLayer.Services;

namespace POS.Server.Entities;

public class Member : TableMemberModel
{
    public Member()
    {
        IdMember = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual ICollection<MemberPointTransaction> ListPointTransaction { get; set; } = [];
}

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.ToTable("members");
        builder.HasKey(x => x.IdMember);
        builder.Property(x => x.IdMember).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.PhoneNumber).IsRequired().HasMaxLength(20);
        builder.Property(x => x.MemberName).IsRequired().HasMaxLength(96);
        builder.Property(x => x.Email).HasMaxLength(128);
        builder.Property(x => x.Address).HasMaxLength(256);
        builder.Property(x => x.TotalSpending).HasPrecision(18, 2);
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.ModifiedById).HasMaxLength(36);

        // Nomor HP adalah identitas bisnis yang dipakai kasir untuk mencari member,
        // jadi tidak boleh ada dua member dengan nomor yang sama.
        builder.HasIndex(x => x.PhoneNumber).IsUnique();
        builder.HasIndex(x => x.MemberName);
    }
}

public static class MapperMember
{
    public static void ApplyCreateEdit(this Member entity, CreateEditMemberModel model)
    {
        entity.PhoneNumber = DataLayerMethods.NormalizePhoneNumber(model.PhoneNumber);
        entity.MemberName = model.MemberName.Trim();
        entity.Email = string.IsNullOrWhiteSpace(model.Email) ? null : model.Email.Trim();
        entity.Address = model.Address?.Trim();
        entity.IsActive = model.IsActive;
    }
}
