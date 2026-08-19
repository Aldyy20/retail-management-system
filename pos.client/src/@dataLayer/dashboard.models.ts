export interface SalesSummaryModel {
    Revenue: number;
    GrossProfit: number;
    TotalDiscount: number;
    TransactionCount: number;
    ItemSold: number;
    MemberTransactionCount: number;
    VoucherUsedCount: number;
    AverageTransactionValue: number;
    MarginPercentage: number;
    StrRevenue: string;
    StrGrossProfit: string;
    StrTotalDiscount: string;
    StrAverageTransactionValue: string;
    StrMargin: string;
}

export interface DailySalesModel {
    Date: string;
    Revenue: number;
    GrossProfit: number;
    TransactionCount: number;
    StrDate: string;
    StrShortDate: string;
    StrRevenue: string;
    StrGrossProfit: string;
}

export interface CategorySalesModel {
    CategoryName: string;
    Revenue: number;
    ItemSold: number;
    StrRevenue: string;
}

export interface ProductSalesModel {
    Sku: string;
    ProductName: string;
    ItemSold: number;
    Revenue: number;
    GrossProfit: number;
    StrRevenue: string;
    StrGrossProfit: string;
}

export interface CashierSalesModel {
    CashierName: string;
    TransactionCount: number;
    Revenue: number;
    StrRevenue: string;
}

export interface LowStockModel {
    Sku: string;
    ProductName: string;
    WarehouseName: string;
    UnitName: string;
    Quantity: number;
    MinimumStock: number;
    StockStatus: "habis" | "menipis";
    StrStockStatus: string;
}

export interface InventorySummaryModel {
    TotalProduct: number;
    TotalStockQuantity: number;
    TotalStockValue: number;
    LowStockCount: number;
    OutOfStockCount: number;
    StrTotalStockValue: string;
}

export interface ApprovalSummaryModel {
    PendingTotal: number;
    PendingGoodsReceiving: number;
    PendingStockAdjustment: number;
    PendingVoidTransaction: number;
}

export interface DashboardActivityModel {
    ActionName: string;
    ModuleName: string;
    Description: string | null;
    CreatedBy: string;
    StrDateCreated: string;
}

export interface DashboardModel {
    StoreName: string;
    RoleName: string;
    Today: SalesSummaryModel;
    ThisMonth: SalesSummaryModel;
    ListDailySales: DailySalesModel[];
    ListCategorySales: CategorySalesModel[];
    ListTopProduct: ProductSalesModel[];
    ListCashierSales: CashierSalesModel[];
    ListLowStock: LowStockModel[];
    ListActivity: DashboardActivityModel[];
    Inventory: InventorySummaryModel;
    Approval: ApprovalSummaryModel;
}

export interface SalesReportModel {
    Summary: SalesSummaryModel;
    ListDailySales: DailySalesModel[];
    ListCategorySales: CategorySalesModel[];
    ListCashierSales: CashierSalesModel[];
}

export interface ProfitReportModel {
    Summary: SalesSummaryModel;
    ListTopProfit: ProductSalesModel[];
    ListTopSelling: ProductSalesModel[];
    ListLeastSelling: ProductSalesModel[];
}

export interface InventoryReportModel {
    Summary: InventorySummaryModel;
    ListLowStock: LowStockModel[];
}

export interface MemberReportRowModel {
    MemberName: string;
    PhoneNumber: string;
    TransactionCount: number;
    TotalSpending: number;
    PointBalance: number;
    StrTotalSpending: string;
}
