namespace POS.DataLayer.Enums;

/// <summary>
/// Jenis pergerakan stok. Dikontrol domain, bukan string bebas dari frontend (PRD bagian 13.1).
/// </summary>
public enum StockMovementType
{
    In = 1,
    Out = 2,
    AdjustmentIn = 3,
    AdjustmentOut = 4,
    TransferIn = 5,
    TransferOut = 6,
    ReturnIn = 7,
    ReturnOut = 8,
}

/// <summary>
/// Lifecycle data operasional (PRD bagian 36). Tidak semua entity memakai seluruh status.
/// </summary>
public enum DataStatus
{
    Draft = 1,
    Pending = 2,
    Approved = 3,
    Rejected = 4,
    Cancelled = 5,
    Completed = 6,
    Void = 7,
}

/// <summary>
/// Jenis potongan yang dipakai diskon produk, voucher, dan penukaran point.
/// </summary>
public enum DiscountValueType
{
    Percentage = 1,
    FixedAmount = 2,
}

/// <summary>
/// Arah mutasi saldo point member.
/// </summary>
public enum PointMovementType
{
    Earn = 1,
    Redeem = 2,
    Adjustment = 3,
}
