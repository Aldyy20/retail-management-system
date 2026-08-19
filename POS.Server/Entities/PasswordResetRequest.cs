using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

/// <summary>
/// Antrean permintaan pengaturan ulang kata sandi yang ditangani admin (PRD bagian 8).
/// </summary>
public class PasswordResetRequest : TablePasswordResetRequestModel
{
    public PasswordResetRequest()
    {
        IdPasswordResetRequest = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual ApplicationUser? User { get; set; }
    public virtual ApplicationUser? HandledByUser { get; set; }
}

public class PasswordResetRequestConfiguration : IEntityTypeConfiguration<PasswordResetRequest>
{
    public void Configure(EntityTypeBuilder<PasswordResetRequest> builder)
    {
        builder.ToTable("password_reset_requests");
        builder.HasKey(x => x.IdPasswordResetRequest);
        builder.Property(x => x.IdPasswordResetRequest).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.IdUser).IsRequired().HasMaxLength(36);
        builder.Property(x => x.UserName).IsRequired().HasMaxLength(256);
        builder.Property(x => x.Note).HasMaxLength(256);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.HandledById).HasMaxLength(36);
        builder.Property(x => x.HandledNote).HasMaxLength(512);
        builder.Property(x => x.CreatedById).HasMaxLength(36);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.IdUser)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.HandledByUser)
            .WithMany()
            .HasForeignKey(x => x.HandledById)
            .OnDelete(DeleteBehavior.Restrict);

        // Satu akun hanya boleh punya satu permintaan yang masih menunggu. Ditegakkan
        // database, sehingga permintaan berulang dari halaman masuk tidak menumpuk
        // menjadi antrean palsu meskipun tombolnya ditekan berkali-kali.
        builder.HasIndex(x => x.IdUser)
            .IsUnique()
            .HasFilter("\"Status\" = 2");

        builder.HasIndex(x => x.Status);
    }
}
