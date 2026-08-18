using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using POS.Server.Entities;

namespace POS.Server.Services;

/// <summary>
/// Pembuatan JWT untuk sesi pengguna. Role ikut ditandatangani agar otorisasi
/// tidak perlu membaca database pada setiap permintaan.
/// </summary>
public static class TokenMethods
{
    public static SymmetricSecurityKey GetSigningKey()
    {
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AppSettings.JwtSecret));
    }

    public static (string Token, DateTime ExpiresAt) CreateToken(ApplicationUser user, string roleName)
    {
        DateTime expiresAt = DateTime.UtcNow.AddMinutes(AppSettings.JwtExpiryMinutes);

        Claim[] claims =
        [
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(ClaimTypes.Role, roleName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        ];

        JwtSecurityToken token = new(
            issuer: AppSettings.JwtIssuer,
            audience: AppSettings.JwtAudience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: new SigningCredentials(GetSigningKey(), SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt.ToLocalTime());
    }
}
