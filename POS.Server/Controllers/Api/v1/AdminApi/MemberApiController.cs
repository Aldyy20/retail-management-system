using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.AdminApi;

public class AdjustPointRequestModel
{
    public string IdMember { get; set; } = string.Empty;

    /// <summary>Positif menambah saldo, negatif mengurangi.</summary>
    public int Point { get; set; }

    public string? Note { get; set; }
}

[Authorize(Roles = AppData.RoleNameAdmin)]
[Route("api/v1/admin/member")]
public class MemberApiController : BaseApiController
{
    public MemberApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Member";
    }

    #region Query

    [HttpPost("get-list-member")]
    public async Task<IActionResult> GetListMemberAsync([FromBody] BaseGetListRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from member in _db.Member
                          select new QueryMemberModel
                          {
                              IdMember = member.IdMember,
                              PhoneNumber = member.PhoneNumber,
                              MemberName = member.MemberName,
                              Email = member.Email,
                              Address = member.Address,
                              PointBalance = member.PointBalance,
                              TotalSpending = member.TotalSpending,
                              TotalTransaction = member.TotalTransaction,
                              IsActive = member.IsActive,
                              DateCreated = member.DateCreated,
                              DateModified = member.DateModified,
                          };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.MemberName, searchPhrase)
                || EF.Functions.ILike(x.PhoneNumber, searchPhrase));
        }

        return await BuildListResponseAsync(queryResult, model, "MemberName Ascending, IdMember Ascending");
    }

    [HttpPost("get-edit")]
    public async Task<IActionResult> GetEditAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        CreateEditMemberModel? data = await _db.Member
            .Where(x => x.IdMember == model.Id)
            .Select(x => new CreateEditMemberModel
            {
                IdMember = x.IdMember,
                PhoneNumber = x.PhoneNumber,
                MemberName = x.MemberName,
                Email = x.Email,
                Address = x.Address,
                IsActive = x.IsActive,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        return Ok(data);
    }

    [HttpPost("get-details")]
    public async Task<IActionResult> GetDetailsAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        DetailsMemberModel? data = await _db.Member
            .Where(x => x.IdMember == model.Id)
            .Select(x => new DetailsMemberModel
            {
                IdMember = x.IdMember,
                PhoneNumber = x.PhoneNumber,
                MemberName = x.MemberName,
                Email = x.Email,
                Address = x.Address,
                PointBalance = x.PointBalance,
                TotalSpending = x.TotalSpending,
                TotalTransaction = x.TotalTransaction,
                IsActive = x.IsActive,
                DateCreated = x.DateCreated,
                DateModified = x.DateModified,
            })
            .FirstOrDefaultAsync();

        if (data == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        data.ListPointHistory = await (
            from point in _db.MemberPointTransaction
            join user in _db.Users on point.CreatedById equals user.Id into userGroup
            from user in userGroup.DefaultIfEmpty()
            where point.IdMember == model.Id
            orderby point.DateCreated descending
            select new QueryMemberPointModel
            {
                IdMemberPointTransaction = point.IdMemberPointTransaction,
                IdMember = point.IdMember,
                MovementType = point.MovementType,
                Point = point.Point,
                PointBefore = point.PointBefore,
                PointAfter = point.PointAfter,
                ReferenceType = point.ReferenceType,
                ReferenceNumber = point.ReferenceNumber,
                Note = point.Note,
                DateCreated = point.DateCreated,
                CreatedBy = user != null ? user.FullName : null,
            })
            .Take(100)
            .ToListAsync();

        return Ok(data);
    }

    #endregion

    #region Mutation

    [HttpPost("insert-member")]
    public async Task<IActionResult> InsertMemberAsync([FromBody] CreateEditMemberModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Member entity = new() { CreatedById = CurrentUserId };
        entity.ApplyCreateEdit(model);

        _db.Member.Add(entity);
        AddAuditLog("INSERT_MEMBER", entity.IdMember, $"Menambah member {entity.MemberName} ({entity.PhoneNumber}).");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nomor HP"));
        }

        return Ok("Member berhasil disimpan.");
    }

    [HttpPost("update-member")]
    public async Task<IActionResult> UpdateMemberAsync([FromBody] CreateEditMemberModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdMember))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(GetModelStateErrorMessage());
        }

        Member? entity = await _db.Member.FindAsync(model.IdMember);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        string oldValue = $"{entity.MemberName} ({entity.PhoneNumber})";

        entity.ApplyCreateEdit(model);
        entity.ModifiedById = CurrentUserId;
        entity.DateModified = DateTime.Now;

        AddAuditLog("UPDATE_MEMBER", entity.IdMember, "Mengubah data member.",
            oldValue, $"{entity.MemberName} ({entity.PhoneNumber})");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nomor HP"));
        }

        return Ok("Member berhasil diperbarui.");
    }

    [HttpPost("delete-member")]
    public async Task<IActionResult> DeleteMemberAsync([FromBody] BaseIdRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Id))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        Member? entity = await _db.Member.FindAsync(model.Id);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        // Member yang sudah pernah berbelanja tidak dihapus, karena notanya merujuk ke sini.
        if (await _db.Transaction.AnyAsync(x => x.IdMember == entity.IdMember))
        {
            return BadRequest("Member ini sudah memiliki riwayat transaksi sehingga tidak dapat dihapus. Nonaktifkan saja.");
        }

        _db.Member.Remove(entity);
        AddAuditLog("DELETE_MEMBER", entity.IdMember, $"Menghapus member {entity.MemberName}.");

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
        {
            return BadRequest(TranslateDbUpdateError(exception, "Nomor HP"));
        }

        return Ok("Member berhasil dihapus.");
    }

    /// <summary>
    /// Penyesuaian saldo point secara manual, misalnya untuk mengoreksi kesalahan.
    /// Tetap tercatat sebagai mutasi supaya saldo tidak pernah berubah diam-diam.
    /// </summary>
    [HttpPost("adjust-point")]
    public async Task<IActionResult> AdjustPointAsync([FromBody] AdjustPointRequestModel model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdMember))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        if (model.Point == 0)
        {
            return BadRequest("Jumlah penyesuaian point tidak boleh nol.");
        }

        if (string.IsNullOrWhiteSpace(model.Note))
        {
            return BadRequest("Alasan penyesuaian wajib diisi supaya perubahannya dapat ditelusuri.");
        }

        Member? entity = await _db.Member.FindAsync(model.IdMember);

        if (entity == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (model.Point < 0 && entity.PointBalance < Math.Abs(model.Point))
        {
            return BadRequest($"Saldo point tinggal {entity.PointBalance}, tidak cukup untuk dikurangi {Math.Abs(model.Point)}.");
        }

        LoyaltyMethods.ApplyPointMovement(_db, entity, PointMovementType.Adjustment, model.Point,
            "Penyesuaian Admin", null, null, model.Note.Trim(), CurrentUserId);

        AddAuditLog("ADJUST_MEMBER_POINT", entity.IdMember,
            $"Menyesuaikan point {entity.MemberName} sebanyak {model.Point}. Alasan: {model.Note.Trim()}");

        await _db.SaveChangesAsync();

        return Ok($"Saldo point {entity.MemberName} kini {entity.PointBalance}.");
    }

    #endregion
}
