using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using POS.Server.Entities;

namespace POS.Server.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    #region Konfigurasi Sistem

    public DbSet<SystemSetting> SystemSetting => Set<SystemSetting>();
    public DbSet<AuditLog> AuditLog => Set<AuditLog>();

    #endregion

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Nama tabel Identity disesuaikan dengan penamaan tabel pada PRD bagian 39.
        builder.Entity<ApplicationUser>(x =>
        {
            x.ToTable("users");
            x.Property(p => p.FullName).IsRequired().HasMaxLength(128);
            x.Property(p => p.CreatedById).HasMaxLength(36);
            x.Property(p => p.ModifiedById).HasMaxLength(36);
        });
        builder.Entity<ApplicationRole>(x =>
        {
            x.ToTable("roles");
            x.Property(p => p.Description).HasMaxLength(256);
        });
        builder.Entity<IdentityUserRole<string>>().ToTable("user_roles");
        builder.Entity<IdentityUserClaim<string>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<string>>().ToTable("user_tokens");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("role_claims");

        builder.ApplyConfiguration(new SystemSettingConfiguration());
        builder.ApplyConfiguration(new AuditLogConfiguration());
    }
}
