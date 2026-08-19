namespace POS.Server.Services;

/// <summary>
/// Pengaturan runtime yang berasal dari appsettings dan environment.
/// Diisi sekali pada startup agar helper statis dapat membacanya tanpa injeksi.
/// </summary>
public static class AppSettings
{
    public static string JwtIssuer { get; private set; } = "POS.Server";
    public static string JwtAudience { get; private set; } = "POS.Client";
    public static string JwtSecret { get; private set; } = string.Empty;
    public static int JwtExpiryMinutes { get; private set; } = 480;
    public static string[] AllowedOrigins { get; private set; } = [];
    public static string UploadFolder { get; private set; } = "uploads";

    /// <summary>
    /// Folder akar berkas statis. Dibaca dari environment, dengan cadangan wwwroot di
    /// bawah content root, karena WebRootPath kosong selama folder itu belum ada.
    /// </summary>
    public static string WebRootPath { get; private set; } = string.Empty;

    public static void Initialize(IConfiguration configuration, IWebHostEnvironment environment)
    {
        JwtIssuer = configuration["Jwt:Issuer"] ?? JwtIssuer;
        JwtAudience = configuration["Jwt:Audience"] ?? JwtAudience;
        JwtSecret = configuration["Jwt:Secret"] ?? string.Empty;
        JwtExpiryMinutes = int.TryParse(configuration["Jwt:ExpiryMinutes"], out int minutes) ? minutes : JwtExpiryMinutes;
        AllowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
        UploadFolder = configuration["UploadFolder"] ?? UploadFolder;

        WebRootPath = string.IsNullOrWhiteSpace(environment.WebRootPath)
            ? Path.Combine(environment.ContentRootPath, "wwwroot")
            : environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(JwtSecret) || JwtSecret.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:Secret belum diisi atau kurang dari 32 karakter. Isi pada appsettings.Development.json atau user-secrets.");
        }
    }
}
