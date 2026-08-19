using System.Linq.Dynamic.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models.Base;
using POS.DataLayer.Services;
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

    /// <summary>
    /// Menyusun respons list bernomor halaman dari query yang sudah diproyeksikan.
    /// Proyeksi tetap ditulis eksplisit di masing-masing controller; yang dibagi di sini
    /// hanya hitung total, pengurutan, dan pemotongan halaman yang bentuknya selalu sama.
    /// </summary>
    protected async Task<IActionResult> BuildListResponseAsync<TRow>(
        IQueryable<TRow> queryResult,
        BaseGetListRequestModel model,
        string defaultOrderBy)
    {
        int currentPage = model.CurrentPage <= 0 ? 1 : model.CurrentPage;
        int rowsPerPage = Math.Clamp(model.RowsPerPage, 1, DataLayerSettings.MaxRowsPerPage);

        int totalRecords = await queryResult.CountAsync();

        string orderBy = defaultOrderBy;

        if (!string.IsNullOrWhiteSpace(model.SortBy))
        {
            string sortDirection = model.ReverseSort ? "Descending" : "Ascending";
            orderBy = $"{model.SortBy} {sortDirection}, {defaultOrderBy}";
        }

        List<TRow> listData = await queryResult
            .OrderBy(orderBy)
            .Skip((currentPage - 1) * rowsPerPage)
            .Take(rowsPerPage)
            .ToListAsync();

        return Ok(new BaseGetListResponseModel
        {
            CurrentPage = currentPage,
            RowsCount = listData.Count,
            TotalRecords = totalRecords,
            Rows = listData,
        });
    }

    /// <summary>
    /// Menerjemahkan pelanggaran constraint PostgreSQL menjadi pesan yang dimengerti pengguna.
    /// Tanpa ini frontend menerima pesan teknis yang tidak bisa ditindaklanjuti.
    /// </summary>
    protected string TranslateDbUpdateError(DbUpdateException exception, string duplicateFieldName)
    {
        string message = exception.InnerException?.Message ?? exception.Message;

        if (message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase))
        {
            return AppErrorMessages.ErrorDuplicateData(EntityName, duplicateFieldName);
        }

        if (message.Contains("violates foreign key", StringComparison.OrdinalIgnoreCase))
        {
            return AppErrorMessages.ErrorDataInUse(EntityName);
        }

        return AppErrorMessages.ErrorUnexpected;
    }

    /// <summary>
    /// Menerjemahkan kegagalan Identity ke Bahasa Indonesia.
    ///
    /// Identity mengembalikan pesannya dalam Bahasa Inggris, dan pesan itu sampai apa adanya
    /// ke layar pengguna kalau tidak diterjemahkan di sini. Kode yang belum dikenali
    /// dilewatkan apa adanya, supaya kegagalan baru tetap terlihat alih-alih tertelan.
    /// </summary>
    protected static string TranslateIdentityErrors(IdentityResult result)
    {
        List<string> messages = [];

        foreach (IdentityError error in result.Errors)
        {
            messages.Add(error.Code switch
            {
                "DuplicateUserName" => "Nama pengguna tersebut sudah dipakai akun lain.",
                "DuplicateEmail" => "Email tersebut sudah dipakai akun lain.",
                "PasswordMismatch" => "Kata sandi lama yang Anda masukkan salah.",
                "PasswordTooShort" => "Kata sandi minimal 8 karakter.",
                "PasswordRequiresDigit" => "Kata sandi harus memuat angka.",
                "PasswordRequiresUpper" => "Kata sandi harus memuat huruf kapital.",
                "PasswordRequiresLower" => "Kata sandi harus memuat huruf kecil.",
                "PasswordRequiresUniqueChars" => "Kata sandi harus memuat lebih banyak karakter yang berbeda.",
                "InvalidToken" => "Proses ini sudah tidak berlaku. Ulangi dari awal.",
                "InvalidUserName" => "Nama pengguna hanya boleh berisi huruf, angka, titik, dan garis bawah.",
                _ => error.Description,
            });
        }

        return messages.Count > 0 ? string.Join(" ", messages) : AppErrorMessages.ErrorUnexpected;
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
