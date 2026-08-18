namespace POS.Server.Services;

/// <summary>
/// Pesan kesalahan berbahasa Indonesia agar frontend tidak perlu menerjemahkan kode error.
/// </summary>
public static class AppErrorMessages
{
    public const string ErrorEmptyParameter = "Parameter permintaan tidak boleh kosong.";
    public const string ErrorUnauthorized = "Anda tidak memiliki hak akses untuk tindakan ini.";
    public const string ErrorInvalidLogin = "Nama pengguna atau kata sandi salah.";
    public const string ErrorInactiveUser = "Akun Anda sedang dinonaktifkan. Hubungi admin.";
    public const string ErrorUnexpected = "Terjadi kesalahan pada sistem. Silakan coba lagi.";

    public static string ErrorEmptyParameterWithName(string parameterName)
    {
        return $"Parameter {parameterName} tidak boleh kosong.";
    }

    public static string ErrorDataNotFound(string entityName)
    {
        return $"Data {entityName} tidak ditemukan.";
    }

    public static string ErrorDuplicateData(string entityName, string fieldName)
    {
        return $"{fieldName} tersebut sudah digunakan oleh {entityName} lain.";
    }

    public static string ErrorDataInUse(string entityName)
    {
        return $"Data {entityName} tidak dapat dihapus karena sudah digunakan. Nonaktifkan saja.";
    }
}
