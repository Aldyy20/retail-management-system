namespace POS.Server.Services;

/// <summary>
/// Konstanta domain yang tidak boleh diubah lewat halaman pengaturan.
/// Kebijakan toko yang dapat berubah berada di tabel system_settings, bukan di sini.
/// </summary>
public static class AppData
{
    public const string RoleNameAdmin = "Admin";
    public const string RoleNameOwner = "Owner";
    public const string RoleNameSupervisor = "Supervisor";
    public const string RoleNameKaryawan = "Karyawan";

    public static readonly string[] AllRoles =
    [
        RoleNameAdmin,
        RoleNameOwner,
        RoleNameSupervisor,
        RoleNameKaryawan,
    ];

    /// <summary>Role yang boleh mengakses layar kasir.</summary>
    public const string RolesCashier = RoleNameKaryawan + "," + RoleNameSupervisor;

    #region Kunci Pengaturan Sistem

    public const string SettingStoreName = "store.name";
    public const string SettingStoreAddress = "store.address";
    public const string SettingStorePhone = "store.phone";
    public const string SettingStoreEmail = "store.email";
    public const string SettingStoreLogo = "store.logo";
    public const string SettingStoreCurrency = "store.currency";
    public const string SettingStoreTimezone = "store.timezone";

    public const string SettingReceiptHeader = "receipt.header";
    public const string SettingReceiptFooter = "receipt.footer";
    public const string SettingReceiptReturnPolicy = "receipt.return_policy";
    public const string SettingReceiptThankYou = "receipt.thank_you";

    public const string SettingMemberEnabled = "member.enabled";
    public const string SettingLoyaltyEnabled = "loyalty.enabled";
    public const string SettingLoyaltyPurchasePerPoint = "loyalty.purchase_per_point";
    public const string SettingLoyaltyPointPerUnit = "loyalty.point_per_unit";

    public const string SettingVoucherEnabled = "voucher.enabled";

    public const string SettingInventoryDefaultMinStock = "inventory.default_min_stock";
    public const string SettingInventoryApprovalGoodsReceiving = "inventory.approval_goods_receiving";
    public const string SettingInventoryApprovalStockAdjustment = "inventory.approval_stock_adjustment";

    public const string SettingTransactionApprovalVoid = "transaction.approval_void";

    #endregion

    #region Jenis Approval

    /// <summary>
    /// Kode jenis tindakan yang dapat membutuhkan persetujuan. Disimpan sebagai kode
    /// pada approval_requests, sehingga jenis baru dapat ditambahkan tanpa mengubah tabel.
    /// </summary>
    public const string ApprovalTypeGoodsReceiving = "GOODS_RECEIVING";
    public const string ApprovalTypeStockAdjustment = "STOCK_ADJUSTMENT";
    public const string ApprovalTypeVoidTransaction = "VOID_TRANSACTION";

    /// <summary>Pengaturan yang menentukan apakah jenis tindakan tersebut butuh persetujuan.</summary>
    public static string GetApprovalSettingKey(string approvalTypeCode)
    {
        return approvalTypeCode switch
        {
            ApprovalTypeGoodsReceiving => SettingInventoryApprovalGoodsReceiving,
            ApprovalTypeStockAdjustment => SettingInventoryApprovalStockAdjustment,
            ApprovalTypeVoidTransaction => SettingTransactionApprovalVoid,
            _ => string.Empty,
        };
    }

    #endregion

    #region Awalan Nomor Dokumen

    public const string PrefixGoodsReceiving = "GR";
    public const string PrefixStockOpname = "SO";
    public const string PrefixTransaction = "INV";

    #endregion

    #region Berkas Unggahan

    /// <summary>Sub folder di dalam wwwroot/uploads. Satu folder per jenis berkas.</summary>
    public const string UploadFolderProduct = "product";
    public const string UploadFolderStore = "store";

    public static readonly string[] AllUploadFolder =
    [
        UploadFolderProduct,
        UploadFolderStore,
    ];

    /// <summary>Batas ukuran satu berkas gambar: 3 MB.</summary>
    public const long MaxImageSizeByte = 3 * 1024 * 1024;

    #endregion

    #region Pembatasan Laju

    /// <summary>Kebijakan pembatasan laju untuk endpoint autentikasi publik.</summary>
    public const string RateLimitPolicyAuth = "auth";

    #endregion

    #region Kunci Cache

    public const string CacheKeySystemSetting = "SystemSetting";

    #endregion
}
