using System.Globalization;

namespace POS.DataLayer.Services;

/// <summary>
/// Helper format dan validasi yang dipakai model, controller, dan report.
/// </summary>
public static class DataLayerMethods
{
    private static readonly CultureInfo Culture = new(DataLayerSettings.CultureName);

    public static string ToStrDate(this DateTime? value)
    {
        return value.HasValue ? value.Value.ToString(DataLayerSettings.DateFormat, Culture) : string.Empty;
    }

    public static string ToStrDateTime(this DateTime? value)
    {
        return value.HasValue ? value.Value.ToString(DataLayerSettings.DateTimeFormat, Culture) : string.Empty;
    }

    /// <summary>Format rupiah tanpa desimal, contoh: Rp25.000.</summary>
    public static string ToStrMoney(this decimal value)
    {
        return "Rp" + value.ToString("#,##0", Culture);
    }

    public static string ToStrPercentage(this decimal value)
    {
        return value.ToString("0.##", Culture) + "%";
    }

    /// <summary>
    /// Normalisasi nomor HP Indonesia menjadi format 08xxxxxxxxxx.
    /// Nomor HP adalah business identifier member sehingga penyimpanannya harus konsisten.
    /// </summary>
    public static string NormalizePhoneNumber(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        string digits = new(value.Where(char.IsDigit).ToArray());

        if (digits.StartsWith("62"))
        {
            digits = "0" + digits[2..];
        }
        else if (!digits.StartsWith('0'))
        {
            digits = "0" + digits;
        }

        return digits;
    }
}
