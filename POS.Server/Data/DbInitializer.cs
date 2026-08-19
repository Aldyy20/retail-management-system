using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Data;

/// <summary>
/// Menyiapkan data minimum agar sistem dapat dipakai setelah migrasi:
/// role, akun admin pertama, dan pengaturan default yang boleh diubah admin.
/// </summary>
public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        using IServiceScope scope = services.CreateScope();
        ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        RoleManager<ApplicationRole> roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        UserManager<ApplicationUser> userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await db.Database.MigrateAsync();
        await SeedRolesAsync(roleManager);
        await SeedAdminAsync(userManager, configuration);
        await SeedSystemSettingAsync(db);
        await SeedPaymentMethodAsync(db);
    }

    /// <summary>
    /// Metode pembayaran awal. Versi pertama hanya tunai, tetapi metode lain dapat
    /// ditambahkan admin sebagai data tanpa mengubah kode (PRD bagian 26).
    /// </summary>
    private static async Task SeedPaymentMethodAsync(ApplicationDbContext db)
    {
        if (await db.PaymentMethod.AnyAsync())
        {
            return;
        }

        db.PaymentMethod.Add(new PaymentMethod
        {
            PaymentMethodCode = "CASH",
            PaymentMethodName = "Tunai",
            Description = "Pembayaran dengan uang tunai, sistem menghitung kembalian.",
            RequiresChange = true,
            SortOrder = 1,
            IsActive = true,
        });

        await db.SaveChangesAsync();
    }

    private static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        (string Name, string Description)[] roles =
        [
            (AppData.RoleNameAdmin, "Mengelola master data, konfigurasi sistem, dan hak akses."),
            (AppData.RoleNameOwner, "Melihat dashboard dan laporan bisnis tanpa mengubah data operasional."),
            (AppData.RoleNameSupervisor, "Mengawasi operasional dan menyetujui tindakan yang membutuhkan approval."),
            (AppData.RoleNameKaryawan, "Menjalankan kasir dan aktivitas gudang harian."),
        ];

        foreach ((string name, string description) in roles)
        {
            if (!await roleManager.RoleExistsAsync(name))
            {
                await roleManager.CreateAsync(new ApplicationRole(name) { Description = description });
            }
        }
    }

    private static async Task SeedAdminAsync(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        string userName = configuration["SeedAdmin:UserName"] ?? "admin";

        if (await userManager.FindByNameAsync(userName) != null)
        {
            return;
        }

        string password = configuration["SeedAdmin:Password"]
            ?? throw new InvalidOperationException(
                "SeedAdmin:Password belum diisi. Isi pada appsettings.Development.json atau user-secrets sebelum menjalankan seeding.");

        ApplicationUser admin = new()
        {
            UserName = userName,
            Email = configuration["SeedAdmin:Email"] ?? "admin@pos.local",
            EmailConfirmed = true,
            FullName = configuration["SeedAdmin:FullName"] ?? "Administrator",
            IsActive = true,
        };

        IdentityResult result = await userManager.CreateAsync(admin, password);

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                "Gagal membuat akun admin awal: " + string.Join(" ", result.Errors.Select(x => x.Description)));
        }

        await userManager.AddToRoleAsync(admin, AppData.RoleNameAdmin);
    }

    private static async Task SeedSystemSettingAsync(ApplicationDbContext db)
    {
        SystemSetting[] defaults =
        [
            Setting(AppData.SettingStoreName, "Toko Saya", "text", "store", "Nama Toko", "Nama yang tercetak pada nota dan header aplikasi.", 1),
            Setting(AppData.SettingStoreAddress, "", "text", "store", "Alamat Toko", "Alamat lengkap yang tercetak pada nota.", 2),
            Setting(AppData.SettingStorePhone, "", "text", "store", "Nomor Telepon", null, 3),
            Setting(AppData.SettingStoreEmail, "", "text", "store", "Email Toko", null, 4),
            Setting(AppData.SettingStoreLogo, "", "image", "store", "Logo Toko", "Berkas logo yang tampil pada nota dan header aplikasi.", 5),
            Setting(AppData.SettingStoreCurrency, "IDR", "text", "store", "Mata Uang", null, 6),
            Setting(AppData.SettingStoreTimezone, "Asia/Makassar", "text", "store", "Zona Waktu", null, 7),

            Setting(AppData.SettingReceiptHeader, "", "text", "receipt", "Header Nota", "Baris tambahan di atas nota, misalnya slogan toko.", 1),
            Setting(AppData.SettingReceiptFooter, "", "text", "receipt", "Footer Nota", "Baris penutup nota.", 2),
            Setting(AppData.SettingReceiptThankYou, "", "text", "receipt", "Pesan Terima Kasih", null, 3),
            Setting(AppData.SettingReceiptReturnPolicy, "", "text", "receipt", "Kebijakan Retur", "Ketentuan pengembalian barang yang tercetak pada nota.", 4),

            Setting(AppData.SettingMemberEnabled, "false", "boolean", "member", "Aktifkan Sistem Member", "Jika nonaktif, menu member tidak tersedia bagi kasir.", 1),
            Setting(AppData.SettingLoyaltyEnabled, "false", "boolean", "member", "Aktifkan Loyalty Point", "Point hanya diproses jika sistem member juga aktif.", 2),
            Setting(AppData.SettingLoyaltyPurchasePerPoint, "10000", "decimal", "member", "Nilai Belanja per Point", "Setiap kelipatan nilai ini memberikan sejumlah point.", 3),
            Setting(AppData.SettingLoyaltyPointPerUnit, "1", "integer", "member", "Point per Kelipatan", "Jumlah point yang diberikan setiap kelipatan nilai belanja.", 4),

            Setting(AppData.SettingVoucherEnabled, "false", "boolean", "voucher", "Aktifkan Voucher", "Jika nonaktif, voucher tidak dapat dipakai pada transaksi.", 1),

            Setting(AppData.SettingInventoryDefaultMinStock, "0", "integer", "inventory", "Minimum Stok Default", "Dipakai saat produk baru dibuat tanpa mengisi minimum stok.", 1),
            Setting(AppData.SettingInventoryApprovalGoodsReceiving, "true", "boolean", "inventory", "Approval Barang Masuk", "Stok baru bertambah setelah supervisor menyetujui.", 2),
            Setting(AppData.SettingInventoryApprovalStockAdjustment, "true", "boolean", "inventory", "Approval Penyesuaian Stok", "Selisih stock opname baru diterapkan setelah disetujui.", 3),

            Setting(AppData.SettingTransactionApprovalVoid, "true", "boolean", "transaction", "Approval Pembatalan Transaksi", "Void transaksi menunggu persetujuan supervisor.", 1),
        ];

        // store.logo dulu bertipe text karena unggahan berkas belum ada. Diperbaiki di
        // tempat supaya database yang sudah berjalan ikut memakai kontrol unggah gambar.
        SystemSetting? logoSetting = await db.SystemSetting
            .FirstOrDefaultAsync(x => x.SettingKey == AppData.SettingStoreLogo && x.ValueType != "image");

        if (logoSetting != null)
        {
            logoSetting.ValueType = "image";
            logoSetting.SettingValue = string.Empty;
            await db.SaveChangesAsync();
            GlobalList.ClearSystemSetting();
        }

        string[] existingKeys = await db.SystemSetting.Select(x => x.SettingKey).ToArrayAsync();
        SystemSetting[] missing = defaults.Where(x => !existingKeys.Contains(x.SettingKey)).ToArray();

        if (missing.Length == 0)
        {
            return;
        }

        db.SystemSetting.AddRange(missing);
        await db.SaveChangesAsync();
        GlobalList.ClearSystemSetting();
    }

    private static SystemSetting Setting(
        string key, string value, string valueType, string groupName, string displayName, string? description, int sortOrder)
    {
        return new SystemSetting
        {
            SettingKey = key,
            SettingValue = value,
            ValueType = valueType,
            GroupName = groupName,
            DisplayName = displayName,
            Description = description,
            SortOrder = sortOrder,
            IsEditable = true,
        };
    }
}
