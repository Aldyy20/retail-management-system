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

    #region Master Data

    public DbSet<Category> Category => Set<Category>();
    public DbSet<Unit> Unit => Set<Unit>();
    public DbSet<Warehouse> Warehouse => Set<Warehouse>();
    public DbSet<Supplier> Supplier => Set<Supplier>();
    public DbSet<Product> Product => Set<Product>();
    public DbSet<PriceHistory> PriceHistory => Set<PriceHistory>();

    #endregion

    #region Inventory

    public DbSet<Inventory> Inventory => Set<Inventory>();
    public DbSet<StockMovement> StockMovement => Set<StockMovement>();
    public DbSet<GoodsReceiving> GoodsReceiving => Set<GoodsReceiving>();
    public DbSet<GoodsReceivingDetail> GoodsReceivingDetail => Set<GoodsReceivingDetail>();
    public DbSet<StockOpname> StockOpname => Set<StockOpname>();
    public DbSet<StockOpnameDetail> StockOpnameDetail => Set<StockOpnameDetail>();

    #endregion

    #region Approval

    public DbSet<ApprovalRequest> ApprovalRequest => Set<ApprovalRequest>();

    #endregion

    /// <summary>
    /// Seluruh waktu disimpan sebagai waktu lokal toko tanpa zona waktu, karena laporan
    /// harian dikelompokkan menurut tanggal buka toko, bukan menurut UTC.
    /// ponytail: cukup untuk satu toko satu zona waktu. Jika nanti ada cabang lintas zona,
    /// pindahkan ke timestamptz berbasis UTC dan konversi saat menampilkan.
    /// </summary>
    protected override void ConfigureConventions(ModelConfigurationBuilder builder)
    {
        builder.Properties<DateTime>().HaveColumnType("timestamp without time zone");
        builder.Properties<DateTime?>().HaveColumnType("timestamp without time zone");
    }

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

        builder.ApplyConfiguration(new CategoryConfiguration());
        builder.ApplyConfiguration(new UnitConfiguration());
        builder.ApplyConfiguration(new WarehouseConfiguration());
        builder.ApplyConfiguration(new SupplierConfiguration());
        builder.ApplyConfiguration(new ProductConfiguration());
        builder.ApplyConfiguration(new PriceHistoryConfiguration());

        builder.ApplyConfiguration(new InventoryConfiguration());
        builder.ApplyConfiguration(new StockMovementConfiguration());
        builder.ApplyConfiguration(new GoodsReceivingConfiguration());
        builder.ApplyConfiguration(new GoodsReceivingDetailConfiguration());
        builder.ApplyConfiguration(new StockOpnameConfiguration());
        builder.ApplyConfiguration(new StockOpnameDetailConfiguration());
        builder.ApplyConfiguration(new ApprovalRequestConfiguration());
    }
}
