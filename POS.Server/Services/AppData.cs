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

    #region Kunci Cache

    public const string CacheKeySystemSetting = "SystemSetting";

    #endregion
}
