namespace POS.DataLayer.Services;

/// <summary>
/// Nilai tetap milik domain yang dipakai bersama backend dan frontend.
/// Konfigurasi yang boleh diubah admin tidak boleh berada di sini, tetapi di tabel system_settings.
/// </summary>
public static class DataLayerSettings
{
    public const string DateFormat = "dd/MM/yyyy";
    public const string DateTimeFormat = "dd/MM/yyyy HH:mm";
    public const string CultureName = "id-ID";

    public const int DefaultRowsPerPage = 10;
    public const int MaxRowsPerPage = 100;

    /// <summary>Panjang maksimum kunci GUID string yang dipakai seluruh entity domain.</summary>
    public const int KeyLength = 36;
}
