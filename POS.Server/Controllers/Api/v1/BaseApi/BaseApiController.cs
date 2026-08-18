using Microsoft.AspNetCore.Mvc;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.BaseApi;

/// <summary>
/// Induk seluruh API controller. Menyediakan akses database, nama entity untuk pesan
/// kesalahan, dan pencatatan audit yang ikut dalam transaksi pemanggil.
/// </summary>
[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected readonly ApplicationDbContext _db;

    protected BaseApiController(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>Nama entity dalam bahasa Indonesia, dipakai pada pesan kesalahan.</summary>
    protected string EntityName { get; set; } = "Data";

    protected string? CurrentUserId => User.GetUserId();

    /// <summary>Menambahkan entri audit ke change tracker tanpa SaveChanges.</summary>
    protected void AddAuditLog(
        string actionName,
        string? referenceId,
        string? description = null,
        string? oldValue = null,
        string? newValue = null)
    {
        AuditLog log = AppMethods.BuildAuditLog(actionName, EntityName, referenceId, description, oldValue, newValue, HttpContext);
        _db.AuditLog.Add(log);
    }

    /// <summary>Menggabungkan pesan validasi model menjadi satu baris untuk ditampilkan frontend.</summary>
    protected string GetModelStateErrorMessage()
    {
        string[] messages = ModelState.Values
            .SelectMany(x => x.Errors)
            .Select(x => x.ErrorMessage)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToArray();

        return messages.Length > 0 ? string.Join(" ", messages) : AppErrorMessages.ErrorUnexpected;
    }
}
