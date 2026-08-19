using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.DataLayer.Models.Base;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Entities;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1.SupervisorApi;

public class GetListApprovalRequestModel : BaseGetListRequestModel
{
    /// <summary>Kosong berarti menampilkan seluruh status.</summary>
    public string? Status { get; set; }
}

/// <summary>
/// Pusat persetujuan supervisor. Satu tempat untuk seluruh jenis tindakan, sehingga
/// jenis baru cukup menambah kode dan penanganannya tanpa membuat halaman baru
/// (PRD bagian 6.2).
/// </summary>
[Authorize(Roles = AppData.RoleNameSupervisor)]
[Route("api/v1/supervisor/approval")]
public class ApprovalApiController : BaseApiController
{
    public ApprovalApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Persetujuan";
    }

    [HttpPost("get-list-approval")]
    public async Task<IActionResult> GetListApprovalAsync([FromBody] GetListApprovalRequestModel model)
    {
        if (model == null)
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        var queryResult = from request in _db.ApprovalRequest
                          join requester in _db.Users on request.CreatedById equals requester.Id into requesterGroup
                          from requester in requesterGroup.DefaultIfEmpty()
                          join decider in _db.Users on request.DecidedById equals decider.Id into deciderGroup
                          from decider in deciderGroup.DefaultIfEmpty()
                          select new QueryApprovalRequestModel
                          {
                              IdApprovalRequest = request.IdApprovalRequest,
                              ApprovalTypeCode = request.ApprovalTypeCode,
                              ModuleName = request.ModuleName,
                              ReferenceId = request.ReferenceId,
                              ReferenceNumber = request.ReferenceNumber,
                              Title = request.Title,
                              Description = request.Description,
                              Status = request.Status,
                              DecidedById = request.DecidedById,
                              DecidedDate = request.DecidedDate,
                              DecisionNote = request.DecisionNote,
                              DateCreated = request.DateCreated,
                              CreatedById = request.CreatedById,
                              RequestedBy = requester != null ? requester.FullName : null,
                              DecidedBy = decider != null ? decider.FullName : null,
                          };

        queryResult = model.Status switch
        {
            "pending" => queryResult.Where(x => x.Status == DataStatus.Pending),
            "approved" => queryResult.Where(x => x.Status == DataStatus.Approved),
            "rejected" => queryResult.Where(x => x.Status == DataStatus.Rejected),
            _ => queryResult,
        };

        if (!string.IsNullOrWhiteSpace(model.SearchPhrase))
        {
            string searchPhrase = $"%{model.SearchPhrase.Trim()}%";
            queryResult = queryResult.Where(x =>
                EF.Functions.ILike(x.Title, searchPhrase)
                || (x.ReferenceNumber != null && EF.Functions.ILike(x.ReferenceNumber, searchPhrase)));
        }

        // Yang menunggu keputusan selalu di atas, karena itulah pekerjaan supervisor.
        return await BuildListResponseAsync(queryResult, model,
            "Status Ascending, DateCreated Descending, IdApprovalRequest Ascending");
    }

    /// <summary>Jumlah permintaan yang masih menunggu, untuk penanda pada navigasi.</summary>
    [HttpPost("get-pending-count")]
    public async Task<IActionResult> GetPendingCountAsync()
    {
        return Ok(await _db.ApprovalRequest.CountAsync(x => x.Status == DataStatus.Pending));
    }

    [HttpPost("approve")]
    public async Task<IActionResult> ApproveAsync([FromBody] ApprovalDecisionModel model)
    {
        return await DecideAsync(model, isApproved: true);
    }

    [HttpPost("reject")]
    public async Task<IActionResult> RejectAsync([FromBody] ApprovalDecisionModel model)
    {
        if (model != null && string.IsNullOrWhiteSpace(model.DecisionNote))
        {
            return BadRequest("Alasan penolakan wajib diisi supaya pengaju tahu apa yang harus diperbaiki.");
        }

        return await DecideAsync(model, isApproved: false);
    }

    /// <summary>
    /// Menyimpan keputusan dan akibatnya dalam satu transaksi database, sehingga status
    /// permintaan, status dokumen, dan perubahan stok tidak pernah berbeda satu sama lain.
    /// </summary>
    private async Task<IActionResult> DecideAsync(ApprovalDecisionModel? model, bool isApproved)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.IdApprovalRequest))
        {
            return BadRequest(AppErrorMessages.ErrorEmptyParameterWithName("model"));
        }

        ApprovalRequest? request = await _db.ApprovalRequest.FindAsync(model.IdApprovalRequest);

        if (request == null)
        {
            return BadRequest(AppErrorMessages.ErrorDataNotFound(EntityName));
        }

        if (request.Status != DataStatus.Pending)
        {
            return BadRequest("Permintaan ini sudah diputuskan sebelumnya.");
        }

        // Supervisor tidak boleh menyetujui pengajuannya sendiri, karena itu meniadakan
        // gunanya pengawasan.
        if (request.CreatedById == CurrentUserId)
        {
            return BadRequest("Anda tidak dapat memutuskan permintaan yang Anda ajukan sendiri.");
        }

        await using IDbContextTransaction transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            string? errorMessage = isApproved
                ? await ApprovalMethods.ApplyApprovedEffectAsync(_db, request, CurrentUserId)
                : await ApprovalMethods.ApplyRejectedEffectAsync(_db, request);

            if (errorMessage != null)
            {
                await transaction.RollbackAsync();
                return BadRequest(errorMessage);
            }

            request.Status = isApproved ? DataStatus.Approved : DataStatus.Rejected;
            request.DecidedById = CurrentUserId;
            request.DecidedDate = DateTime.Now;
            request.DecisionNote = model.DecisionNote?.Trim();

            AddAuditLog(
                isApproved ? "APPROVE_REQUEST" : "REJECT_REQUEST",
                request.IdApprovalRequest,
                $"{(isApproved ? "Menyetujui" : "Menolak")} {request.Title}.",
                "Menunggu persetujuan",
                isApproved ? "Disetujui" : "Ditolak");

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(isApproved
                ? "Permintaan disetujui dan perubahannya sudah diterapkan."
                : "Permintaan ditolak. Pengaju dapat memperbaiki dokumennya lalu mengajukan ulang.");
        }
        catch (DbUpdateException exception)
        {
            await transaction.RollbackAsync();
            return BadRequest(TranslateDbUpdateError(exception, "Permintaan"));
        }
    }
}
