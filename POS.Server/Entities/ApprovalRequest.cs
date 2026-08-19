using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using POS.DataLayer.Models;

namespace POS.Server.Entities;

public class ApprovalRequest : TableApprovalRequestModel
{
    public ApprovalRequest()
    {
        IdApprovalRequest = Guid.NewGuid().ToString();
        DateCreated = DateTime.Now;
    }

    public virtual ApplicationUser? RequestedByUser { get; set; }
    public virtual ApplicationUser? DecidedByUser { get; set; }
}

public class ApprovalRequestConfiguration : IEntityTypeConfiguration<ApprovalRequest>
{
    public void Configure(EntityTypeBuilder<ApprovalRequest> builder)
    {
        builder.ToTable("approval_requests");
        builder.HasKey(x => x.IdApprovalRequest);
        builder.Property(x => x.IdApprovalRequest).ValueGeneratedNever().HasMaxLength(36);
        builder.Property(x => x.ApprovalTypeCode).IsRequired().HasMaxLength(32);
        builder.Property(x => x.ModuleName).IsRequired().HasMaxLength(64);
        builder.Property(x => x.ReferenceId).IsRequired().HasMaxLength(36);
        builder.Property(x => x.ReferenceNumber).HasMaxLength(32);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(128);
        builder.Property(x => x.Description).HasMaxLength(512);
        builder.Property(x => x.DecisionNote).HasMaxLength(512);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.CreatedById).HasMaxLength(36);
        builder.Property(x => x.DecidedById).HasMaxLength(36);

        builder.HasOne(x => x.RequestedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DecidedByUser)
            .WithMany()
            .HasForeignKey(x => x.DecidedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Satu dokumen hanya boleh punya satu permintaan yang masih menunggu keputusan.
        builder.HasIndex(x => new { x.ApprovalTypeCode, x.ReferenceId })
            .IsUnique()
            .HasFilter("\"Status\" = 2");

        builder.HasIndex(x => x.Status);
    }
}
