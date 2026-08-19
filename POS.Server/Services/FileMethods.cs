using System.Text.RegularExpressions;

namespace POS.Server.Services;

/// <summary>
/// Penyimpanan berkas gambar yang diunggah pengguna.
///
/// Berkas disimpan di folder pada server, bukan di dalam database, supaya database tetap
/// ringan dan cadangan gambar cukup dengan menyalin satu folder. Yang tersimpan di
/// database hanya nama berkasnya.
///
/// Nama berkas selalu dibuat server, tidak pernah memakai nama dari pengunggah. Ini yang
/// menutup penulisan ke luar folder tujuan sekaligus penimpaan berkas milik data lain.
/// </summary>
public static partial class FileMethods
{
    /// <summary>
    /// Ekstensi yang boleh diunggah beserta tipe kontennya.
    /// SVG sengaja tidak ada: berkas SVG dapat memuat skrip yang ikut berjalan di browser.
    /// </summary>
    private static readonly Dictionary<string, string> AllowedImageExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
    };

    /// <summary>
    /// Kelonggaran untuk batas pembungkus multipart: nama kolom, batas antar bagian, dan
    /// header berkas. Angkanya sama dengan kelonggaran pada atribut RequestSizeLimit.
    /// </summary>
    public const long MultipartOverheadByte = 8192;

    /// <summary>Bentuk nama berkas yang sah, yaitu yang dibuat oleh SaveImageAsync.</summary>
    [GeneratedRegex(@"^[0-9a-f]{32}\.(jpg|jpeg|png|webp)$")]
    private static partial Regex SafeFileNameRegex();

    public static string GetUploadPath(string folderName)
    {
        return Path.Combine(AppSettings.WebRootPath, AppSettings.UploadFolder, folderName);
    }

    /// <summary>Alamat yang dipakai frontend untuk menampilkan gambarnya.</summary>
    public static string GetPublicUrl(string folderName, string fileName)
    {
        return $"/{AppSettings.UploadFolder}/{folderName}/{fileName}";
    }

    /// <summary>Dipanggil sekali saat startup supaya unggahan pertama tidak gagal.</summary>
    public static void EnsureFolder()
    {
        foreach (string folderName in AppData.AllUploadFolder)
        {
            Directory.CreateDirectory(GetUploadPath(folderName));
        }
    }

    /// <summary>
    /// Memeriksa nama berkas yang datang dari frontend. Nama apa pun di luar bentuk yang
    /// dibuat server ditolak, termasuk yang mengandung pemisah folder.
    /// </summary>
    public static bool IsValidFileName(string fileName)
    {
        return SafeFileNameRegex().IsMatch(fileName);
    }

    public static bool Exists(string folderName, string fileName)
    {
        return IsValidFileName(fileName) && File.Exists(Path.Combine(GetUploadPath(folderName), fileName));
    }

    /// <summary>
    /// Menolak permintaan yang jelas kebesaran dari header panjangnya, sebelum isinya
    /// dibaca. Tanpa ini pengunggah berkas kebesaran hanya menerima pesan bahwa berkasnya
    /// belum dipilih, karena badan permintaan sudah dipotong sebelum sampai ke model.
    /// </summary>
    public static string? GetOversizeMessage(long? contentLength)
    {
        if (contentLength is null || contentLength <= AppData.MaxImageSizeByte + MultipartOverheadByte)
        {
            return null;
        }

        decimal sizeInMegaByte = Math.Round((decimal)contentLength.Value / 1024 / 1024, 2);
        return $"Ukuran gambar {sizeInMegaByte} MB melebihi batas 3 MB. Pilih gambar yang lebih kecil.";
    }

    /// <summary>
    /// Menyimpan satu gambar dan mengembalikan nama berkasnya, atau pesan kesalahan
    /// berbahasa Indonesia bila ditolak.
    /// </summary>
    public static async Task<(string? FileName, string? ErrorMessage)> SaveImageAsync(IFormFile? file, string folderName)
    {
        if (file == null || file.Length == 0)
        {
            return (null, "Berkas gambar belum dipilih.");
        }

        if (file.Length > AppData.MaxImageSizeByte)
        {
            decimal sizeInMegaByte = Math.Round((decimal)file.Length / 1024 / 1024, 2);
            return (null, $"Ukuran gambar {sizeInMegaByte} MB melebihi batas 3 MB. Pilih gambar yang lebih kecil.");
        }

        string extension = Path.GetExtension(file.FileName);

        if (!AllowedImageExtension.TryGetValue(extension, out string? contentType))
        {
            return (null, "Format gambar harus JPG, PNG, atau WEBP.");
        }

        // Tipe konten ikut diperiksa supaya berkas yang hanya berganti ekstensi tidak lolos.
        if (!string.Equals(file.ContentType, contentType, StringComparison.OrdinalIgnoreCase))
        {
            return (null, "Isi berkas tidak cocok dengan ekstensinya. Pilih berkas gambar yang benar.");
        }

        // Ekstensi dan tipe konten dua-duanya ditentukan pengunggah, jadi isi berkasnya
        // ikut diperiksa. Tanpa ini berkas apa pun bisa masuk hanya dengan mengganti nama.
        if (!await HasImageSignatureAsync(file))
        {
            return (null, "Isi berkas bukan gambar. Pilih berkas JPG, PNG, atau WEBP yang benar.");
        }

        string fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        string fullPath = Path.Combine(GetUploadPath(folderName), fileName);

        Directory.CreateDirectory(GetUploadPath(folderName));

        await using FileStream stream = File.Create(fullPath);
        await file.CopyToAsync(stream);

        return (fileName, null);
    }

    /// <summary>
    /// Memeriksa penanda awal berkas gambar. Hanya tiga format yang dikenali, sesuai
    /// daftar ekstensi yang diizinkan.
    /// </summary>
    private static async Task<bool> HasImageSignatureAsync(IFormFile file)
    {
        byte[] header = new byte[12];

        await using Stream stream = file.OpenReadStream();
        int readCount = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false);

        if (readCount < 12)
        {
            return false;
        }

        bool isJpeg = header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        bool isPng = header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
            && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A;
        bool isWebp = header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
            && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50;

        return isJpeg || isPng || isWebp;
    }

    /// <summary>
    /// Menghapus berkas lama. Kegagalan sengaja diabaikan: berkas yatim hanya memakan
    /// ruang, sedangkan melemparkan kesalahan di sini akan menggagalkan penyimpanan data
    /// yang sudah benar.
    /// </summary>
    public static void Delete(string folderName, string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName) || !IsValidFileName(fileName))
        {
            return;
        }

        try
        {
            File.Delete(Path.Combine(GetUploadPath(folderName), fileName));
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
