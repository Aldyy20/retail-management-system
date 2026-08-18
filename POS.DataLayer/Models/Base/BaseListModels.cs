namespace POS.DataLayer.Models.Base;

/// <summary>
/// Request standar untuk seluruh endpoint list bernomor halaman.
/// SortBy memakai nama properti backend (PascalCase) karena dipakai langsung oleh dynamic LINQ.
/// </summary>
public class BaseGetListRequestModel
{
    public int CurrentPage { get; set; } = 1;
    public int RowsPerPage { get; set; } = 10;
    public string? SortBy { get; set; }
    public bool ReverseSort { get; set; }
    public string? SearchPhrase { get; set; }
}

/// <summary>
/// Response standar untuk seluruh endpoint list bernomor halaman.
/// </summary>
public class BaseGetListResponseModel
{
    public int CurrentPage { get; set; }
    public int RowsCount { get; set; }
    public int TotalRecords { get; set; }
    public object? Rows { get; set; }
}

/// <summary>
/// Request pemilihan satu baris data berdasarkan kunci.
/// Dipakai agar kontrak API tetap POST-only tanpa query string.
/// </summary>
public class BaseIdRequestModel
{
    public string Id { get; set; } = string.Empty;
}

/// <summary>
/// Item untuk dropdown/lookup di frontend.
/// </summary>
public class SelectListItemModel
{
    public string Value { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? Description { get; set; }
}
