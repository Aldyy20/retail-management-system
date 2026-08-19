using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

/// <summary>
/// Jejak aktivitas sensitif: siapa melakukan apa, kapan, dan terhadap data apa (PRD BR-004).
/// </summary>
public class AuditLog : TableAuditLogModel
{
    public AuditLog()
    {
        IdAuditLog = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual ApplicationUser? CreatedByUser { get; set; }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(x => x.IdAuditLog);
        builder.Property(x => x.IdAuditLog).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.ActionName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.ModuleName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.ReferenceId).HasMaxLength(64);
        builder.Property(x => x.Description).HasMaxLength(512);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.Property(x => x.CreatedById).HasMaxLength(36);

        builder.HasOne(x => x.CreatedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.DateCreated);
        builder.HasIndex(x => new { x.ModuleName, x.ReferenceId });

        // Halaman audit menyaring menurut aksi, dan tabel ini yang paling cepat membesar
        // dari seluruh tabel di sistem.
        builder.HasIndex(x => x.ActionName);
    }
}
