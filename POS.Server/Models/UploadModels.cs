namespace POS.Server.Models;

/// <summary>
/// Satu berkas gambar yang diunggah. Dikirim sebagai multipart, bukan JSON, karena isinya
/// berkas biner; kontrak JSON PascalCase tetap berlaku untuk balasannya.
/// </summary>
public class UploadImageRequestModel
{
    public IFormFile? File { get; set; }
}

/// <summary>
/// Hasil unggahan. Nama berkas yang dikembalikan inilah yang dikirim balik frontend saat
/// menyimpan datanya, sehingga unggahan dan penyimpanan data tetap dua langkah terpisah.
/// </summary>
public class UploadImageResponseModel
{
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
}
