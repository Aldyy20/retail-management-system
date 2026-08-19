using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Models;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.AdminApi;

/// <summary>
/// Halaman kebijakan toko (PRD bagian 37 dan 38).
///
/// Kunci pengaturan tidak dapat ditambah atau dihapus lewat API ini: yang boleh berubah
/// hanya nilainya. Kunci baru selalu datang dari seeder bersama kode yang memakainya,
/// sehingga tidak pernah ada pengaturan yang tidak dibaca siapa pun.
/// </summary>
[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/system-setting")]
public class SystemSettingApiController : BaseApiController
{
    public SystemSettingApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Pengaturan";
    }

    /// <summary>
    /// Seluruh pengaturan yang boleh diubah admin sekaligus. Jumlahnya puluhan dan
    /// dibaca sebagai satu formulir, jadi tidak dibuat bernomor halaman.
    /// </summary>
    [HttpPost("get-list-system-setting")]
    public async Task<IActionResult> GetListSystemSettingAsync()
    {
        List<QuerySystemSettingModel> listData = await _db.SystemSetting
            .Where(x => x.IsEditable)
            .OrderBy(x => x.GroupName)
            .ThenBy(x => x.SortOrder)
            .Select(x => new QuerySystemSettingModel
            {
                SettingKey = x.SettingKey,
                SettingValue = x.SettingValue,
                ValueType = x.ValueType,
                GroupName = x.GroupName,
                DisplayName = x.DisplayName,
                Description = x.Description,
                SortOrder = x.SortOrder,
                IsEditable = x.IsEditable,
                DateModified = x.DateModified,
            })
            .ToListAsync();

        return Ok(listData);
    }

    [HttpPost("update-system-setting")]
    public async Task<IActionResult> UpdateSystemSettingAsync([FromBody] UpdateSystemSettingModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.GroupName))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        if (model.ListSetting.Count == 0)
        {
            return BadRequest("Tidak ada pengaturan yang dikirim untuk disimpan.");
        }

        string[] settingKeys = model.ListSetting.Select(x => x.SettingKey).ToArray();

        // Kunci yang datang dari frontend selalu dicocokkan ulang ke database beserta
        // kelompoknya, supaya satu permintaan tidak bisa mengubah kelompok lain.
        List<SystemSetting> listEntity = await _db.SystemSetting
            .Where(x => x.GroupName == model.GroupName && x.IsEditable && settingKeys.Contains(x.SettingKey))
            .ToListAsync();

        if (listEntity.Count != settingKeys.Length)
        {
            return BadRequest($"Ada pengaturan yang tidak dikenal pada kelompok {model.GroupName}. Muat ulang halaman lalu simpan lagi.");
        }

        List<string> listChange = [];

        foreach (SystemSetting entity in listEntity)
        {
            CreateEditSystemSettingModel input = model.ListSetting.First(x => x.SettingKey == entity.SettingKey);
            string? newValue = NormalizeValue(entity.ValueType, input.SettingValue);

            if (newValue == null)
            {
                return BadRequest($"Nilai {entity.DisplayName} tidak sesuai. {DescribeValueType(entity.ValueType)}");
            }

            if (newValue == (entity.SettingValue ?? string.Empty))
            {
                continue;
            }

            listChange.Add($"{entity.DisplayName}: {Display(entity.SettingValue)} menjadi {Display(newValue)}");

            entity.SettingValue = newValue;
            entity.ModifiedById = CurrentUserId;
            entity.DateModified = DateTime.Now;
        }

        if (listChange.Count == 0)
        {
            return Ok("Tidak ada perubahan yang perlu disimpan.");
        }

        AddAuditLog("UPDATE_SYSTEM_SETTING", model.GroupName,
            $"Mengubah pengaturan kelompok {model.GroupName}.",
            null, string.Join("; ", listChange));

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Kunci Pengaturan"));
        }

        // Tanpa ini nilai baru tidak berlaku sampai server dijalankan ulang, karena
        // pengaturan dibaca dari cache pada hampir setiap transaksi kasir.
        GlobalList.ClearSystemSetting();

        return Ok($"{listChange.Count} pengaturan berhasil disimpan.");
    }

    /// <summary>
    /// Mengembalikan nilai yang sudah dibakukan, atau null bila tidak sesuai tipenya.
    /// Pembakuan penting karena pembacanya memakai bool.TryParse dan int.TryParse
    /// yang tidak menerima sembarang penulisan.
    /// </summary>
    private static string? NormalizeValue(string valueType, string? value)
    {
        string trimmed = (value ?? string.Empty).Trim();

        switch (valueType)
        {
            case "boolean":
                return bool.TryParse(trimmed, out bool parsedBool) ? parsedBool.ToString() : null;

            case "integer":
                return int.TryParse(trimmed, out int parsedInt) ? parsedInt.ToString(CultureInfo.InvariantCulture) : null;

            case "decimal":
                return decimal.TryParse(trimmed, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal parsedDecimal)
                    ? parsedDecimal.ToString(CultureInfo.InvariantCulture)
                    : null;

            default:
                return trimmed;
        }
    }

    private static string DescribeValueType(string valueType)
    {
        return valueType switch
        {
            "boolean" => "Isinya harus aktif atau nonaktif.",
            "integer" => "Isinya harus bilangan bulat, contoh 10.",
            "decimal" => "Isinya harus angka, contoh 10000 atau 10000.5.",
            _ => "Periksa kembali isiannya.",
        };
    }

    private static string Display(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? "(kosong)" : value;
    }
}
