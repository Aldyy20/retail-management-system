namespace POS.DataLayer.Interfaces;

/// <summary>
/// Audit pembuatan data. Dipakai seluruh model family pada level Base.
/// </summary>
public interface IBaseDataInfo
{
    DateTime DateCreated { get; set; }
    string? CreatedById { get; set; }
}

/// <summary>
/// Audit perubahan data. Dipakai model family pada level Table (entity).
/// </summary>
public interface ITableDataInfo : IBaseDataInfo
{
    DateTime? DateModified { get; set; }
    string? ModifiedById { get; set; }
}

/// <summary>
/// Kolom tampilan hasil query yang tidak disimpan di tabel.
/// </summary>
public interface IQueryDataInfo : ITableDataInfo
{
    string? CreatedBy { get; set; }
    string? ModifiedBy { get; set; }
}

/// <summary>
/// Entity yang dinonaktifkan, bukan dihapus fisik, karena sudah dipakai transaksi.
/// </summary>
public interface IActivatable
{
    bool IsActive { get; set; }
}
