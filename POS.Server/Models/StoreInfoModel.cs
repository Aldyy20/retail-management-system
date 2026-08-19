namespace POS.Server.Models;

/// <summary>
/// Informasi toko yang boleh dibaca tanpa masuk, hanya untuk mengenali toko
/// pada halaman masuk. Tidak memuat data operasional apa pun.
/// </summary>
public class StoreInfoModel
{
    public string StoreName { get; set; } = string.Empty;
    public string StoreAddress { get; set; } = string.Empty;
}
