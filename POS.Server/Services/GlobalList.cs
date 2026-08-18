using Microsoft.EntityFrameworkCore;
using POS.Server.Data;

namespace POS.Server.Services;

/// <summary>
/// Cache data rujukan yang sering dibaca dan jarang berubah.
/// Pengaturan sistem dibaca pada hampir setiap transaksi kasir, sehingga menghindari
/// query berulang di jalur panas. Cache dibersihkan manual setelah mutasi.
/// </summary>
public static class GlobalList
{
    private static Dictionary<string, string?>? _systemSetting;
    private static readonly Lock CacheLock = new();

    public static void ClearSystemSetting()
    {
        lock (CacheLock)
        {
            _systemSetting = null;
        }
    }

    public static async Task<Dictionary<string, string?>> GetSystemSettingAsync(ApplicationDbContext db)
    {
        Dictionary<string, string?>? cached = _systemSetting;

        if (cached != null)
        {
            return cached;
        }

        Dictionary<string, string?> loaded = await db.SystemSetting
            .AsNoTracking()
            .ToDictionaryAsync(x => x.SettingKey, x => x.SettingValue);

        lock (CacheLock)
        {
            _systemSetting = loaded;
        }

        return loaded;
    }

    public static async Task<string> GetSettingTextAsync(ApplicationDbContext db, string key, string defaultValue = "")
    {
        Dictionary<string, string?> settings = await GetSystemSettingAsync(db);
        return settings.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value) ? value : defaultValue;
    }

    public static async Task<bool> GetSettingBoolAsync(ApplicationDbContext db, string key, bool defaultValue = false)
    {
        string value = await GetSettingTextAsync(db, key, defaultValue.ToString());
        return bool.TryParse(value, out bool parsed) ? parsed : defaultValue;
    }

    public static async Task<decimal> GetSettingDecimalAsync(ApplicationDbContext db, string key, decimal defaultValue = 0)
    {
        string value = await GetSettingTextAsync(db, key, string.Empty);
        return decimal.TryParse(value, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out decimal parsed) ? parsed : defaultValue;
    }

    public static async Task<int> GetSettingIntAsync(ApplicationDbContext db, string key, int defaultValue = 0)
    {
        string value = await GetSettingTextAsync(db, key, string.Empty);
        return int.TryParse(value, out int parsed) ? parsed : defaultValue;
    }
}
