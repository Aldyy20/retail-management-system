using System.Security.Claims;
using POS.Server.Entities;

namespace POS.Server.Services;

/// <summary>
/// Helper lintas controller: identitas pengguna, kunci baru, dan pembuatan audit log.
/// </summary>
public static class AppMethods
{
    public static string NewKey()
    {
        return Guid.NewGuid().ToString();
    }

    public static string? GetUserId(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    public static string? GetUserName(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Name);
    }

    public static string? GetRoleName(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Role);
    }

    /// <summary>
    /// Menyusun entri audit tanpa menyimpannya, agar pemanggil dapat ikut serta
    /// dalam transaksi database yang sama dengan perubahan datanya.
    /// </summary>
    public static AuditLog BuildAuditLog(
        string actionName,
        string moduleName,
        string? referenceId,
        string? description,
        string? oldValue,
        string? newValue,
        HttpContext? httpContext)
    {
        return new AuditLog
        {
            ActionName = actionName,
            ModuleName = moduleName,
            ReferenceId = referenceId,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue,
            IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
            CreatedById = httpContext?.User.GetUserId(),
        };
    }
}
