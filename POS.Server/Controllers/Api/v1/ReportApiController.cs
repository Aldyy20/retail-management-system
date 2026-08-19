using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POS.DataLayer.Enums;
using POS.DataLayer.Models;
using POS.DataLayer.Services;
using POS.Server.Controllers.Api.v1.BaseApi;
using POS.Server.Data;
using POS.Server.Services;

namespace POS.Server.Controllers.Api.v1;

/// <summary>Rentang tanggal laporan. Bila kosong, dipakai bulan berjalan.</summary>
public class ReportPeriodRequestModel
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public DateTime ResolvedStartDate => StartDate?.Date ?? new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
    public DateTime ResolvedEndDate => EndDate?.Date ?? DateTime.Now.Date;
}

public class SalesReportModel
{
    public SalesSummaryModel Summary { get; set; } = new();
    public List<DailySalesModel> ListDailySales { get; set; } = [];
    public List<CategorySalesModel> ListCategorySales { get; set; } = [];
    public List<CashierSalesModel> ListCashierSales { get; set; } = [];
}

public class ProfitReportModel
{
    public SalesSummaryModel Summary { get; set; } = new();
    public List<ProductSalesModel> ListTopProfit { get; set; } = [];
    public List<ProductSalesModel> ListTopSelling { get; set; } = [];
    public List<ProductSalesModel> ListLeastSelling { get; set; } = [];
}

public class InventoryReportModel
{
    public InventorySummaryModel Summary { get; set; } = new();
    public List<LowStockModel> ListLowStock { get; set; } = [];
}

public class MemberReportRowModel
{
    public string MemberName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public int TransactionCount { get; set; }
    public decimal TotalSpending { get; set; }
    public int PointBalance { get; set; }

    public string StrTotalSpending => TotalSpending.ToStrMoney();
}

/// <summary>
/// Laporan penjualan, keuntungan, persediaan, karyawan, dan member.
///
/// Owner dan admin sama-sama boleh membacanya. Angka dihitung dari transaksi yang
/// berstatus selesai saja, sehingga transaksi yang dibatalkan tidak pernah ikut.
/// </summary>
[Authorize(Roles = AppData.RoleNameOwner + "," + AppData.RoleNameAdmin)]
[Route("api/v1/report")]
public class ReportApiController : BaseApiController
{
    public ReportApiController(ApplicationDbContext db) : base(db)
    {
        EntityName = "Laporan";
    }

    [HttpPost("get-sales-report")]
    public async Task<IActionResult> GetSalesReportAsync([FromBody] ReportPeriodRequestModel model)
    {
        model ??= new ReportPeriodRequestModel();
        DateTime start = model.ResolvedStartDate;
        DateTime end = model.ResolvedEndDate;

        if (end < start)
        {
            return BadRequest("Tanggal akhir tidak boleh lebih awal dari tanggal mulai.");
        }

        return Ok(new SalesReportModel
        {
            Summary = await DashboardMethods.GetSalesSummaryAsync(_db, start, end),
            ListDailySales = await DashboardMethods.GetDailySalesAsync(_db, start, end),
            ListCategorySales = await DashboardMethods.GetCategorySalesAsync(_db, start, end),
            ListCashierSales = await DashboardMethods.GetCashierSalesAsync(_db, start, end),
        });
    }

    [HttpPost("get-profit-report")]
    public async Task<IActionResult> GetProfitReportAsync([FromBody] ReportPeriodRequestModel model)
    {
        model ??= new ReportPeriodRequestModel();
        DateTime start = model.ResolvedStartDate;
        DateTime end = model.ResolvedEndDate;

        if (end < start)
        {
            return BadRequest("Tanggal akhir tidak boleh lebih awal dari tanggal mulai.");
        }

        List<ProductSalesModel> topSelling = await DashboardMethods.GetTopProductAsync(_db, start, end, 10);

        return Ok(new ProfitReportModel
        {
            Summary = await DashboardMethods.GetSalesSummaryAsync(_db, start, end),
            ListTopSelling = topSelling,
            ListLeastSelling = await DashboardMethods.GetTopProductAsync(_db, start, end, 10, isAscending: true),
            ListTopProfit = topSelling.OrderByDescending(x => x.GrossProfit).ToList(),
        });
    }

    [HttpPost("get-inventory-report")]
    public async Task<IActionResult> GetInventoryReportAsync()
    {
        return Ok(new InventoryReportModel
        {
            Summary = await DashboardMethods.GetInventorySummaryAsync(_db),
            ListLowStock = await DashboardMethods.GetLowStockAsync(_db, 100),
        });
    }

    [HttpPost("get-employee-report")]
    public async Task<IActionResult> GetEmployeeReportAsync([FromBody] ReportPeriodRequestModel model)
    {
        model ??= new ReportPeriodRequestModel();

        return Ok(await DashboardMethods.GetCashierSalesAsync(_db, model.ResolvedStartDate, model.ResolvedEndDate));
    }

    [HttpPost("get-member-report")]
    public async Task<IActionResult> GetMemberReportAsync([FromBody] ReportPeriodRequestModel model)
    {
        model ??= new ReportPeriodRequestModel();
        DateTime start = model.ResolvedStartDate;
        DateTime end = model.ResolvedEndDate.AddDays(1);

        // Jumlah transaksi dihitung ulang dari periode yang diminta, bukan dari akumulasi
        // seumur hidup member, supaya laporan periode benar-benar mencerminkan periodenya.
        return Ok(await (
            from member in _db.Member
            join transaction in DashboardMethods.ValidTransactions(_db)
                    .Where(x => x.TransactionDate >= start && x.TransactionDate < end)
                on member.IdMember equals transaction.IdMember into transactionGroup
            where transactionGroup.Any()
            orderby transactionGroup.Sum(x => x.TotalAmount) descending
            select new MemberReportRowModel
            {
                MemberName = member.MemberName,
                PhoneNumber = member.PhoneNumber,
                PointBalance = member.PointBalance,
                TransactionCount = transactionGroup.Count(),
                TotalSpending = transactionGroup.Sum(x => x.TotalAmount),
            })
            .Take(100)
            .ToListAsync());
    }
}
