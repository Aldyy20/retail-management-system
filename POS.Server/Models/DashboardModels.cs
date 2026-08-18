namespace POS.Server.Models;

/// <summary>
/// Informasi toko yang boleh dibaca tanpa masuk, hanya untuk mengenali toko
/// pada halaman masuk. Tidak memuat data operasional apa pun.
/// </summary>
public class StoreInfoModel
{
    public string StoreName { get; set; } = string.Empty;
    public string StoreAddress { get; set; } = string.Empty;
}

/// <summary>
/// Ringkasan yang seluruh isinya berasal dari database. Tidak ada angka contoh.
/// </summary>
public class DashboardSummaryModel
{
    public string StoreName { get; set; } = string.Empty;
    public int TotalUserActive { get; set; }
    public bool IsMemberEnabled { get; set; }
    public bool IsLoyaltyEnabled { get; set; }
    public bool IsVoucherEnabled { get; set; }
    public List<DashboardActivityModel> RecentActivities { get; set; } = [];
}

public class DashboardActivityModel
{
    public string ActionName { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string StrDateCreated { get; set; } = string.Empty;

    /// <summary>Nilai mentah untuk pengurutan; frontend memakai StrDateCreated.</summary>
    public DateTime DateCreated { get; set; }
}
