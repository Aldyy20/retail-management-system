using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Enums;

namespace POS.Server.Entities;

/// <summary>
/// Riwayat perubahan saldo point. Sama seperti stok, saldo tidak pernah diubah
/// tanpa meninggalkan baris di sini (PRD BR-008).
/// </summary>
public class MemberPointTransaction
{
    public MemberPointTransaction()
    {
        IdMemberPointTransaction = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public string IdMemberPointTransaction { get; set; } = string.Empty;
    public string IdMember { get; set; } = string.Empty;
    public PointMovementType MovementType { get; set; }

    /// <summary>Jumlah point yang berubah. Selalu positif; arahnya ditentukan MovementType.</summary>
    public int Point { get; set; }

    public int PointBefore { get; set; }
    public int PointAfter { get; set; }

    public string ReferenceType { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Note { get; set; }

    public DateTime DateCreated { get; set; }
    public string? CreatedById { get; set; }

    public virtual Member? Member { get; set; }
}

public class MemberPointTransactionConfiguration : IEntityTypeConfiguration<MemberPointTransaction>
{
    public void Configure(EntityTypeBuilder<MemberPointTransaction> builder)
    {
        builder.ToTable("member_point_transactions");
        builder.HasKey(x => x.IdMemberPointTransaction);
        builder.Property(x => x.IdMemberPointTransaction).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdMember).IsRequired().HasMaxLength(36);
        builder.Property(x => x.MovementType).HasConversion<int>();
        builder.Property(x => x.ReferenceType).IsRequired().HasMaxLength(64);
        builder.Property(x => x.ReferenceId).HasMaxLength(36);
        builder.Property(x => x.ReferenceNumber).HasMaxLength(32);
        builder.Property(x => x.Note).HasMaxLength(256);
        builder.Property(x => x.CreatedById).HasMaxLength(36);

        builder.HasOne(x => x.Member)
            .WithMany(x => x.ListPointTransaction)
            .HasForeignKey(x => x.IdMember)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.IdMember, x.DateCreated });
    }
}
