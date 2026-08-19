/** Cermin TypeScript untuk model inventory, barang masuk, stock opname, dan approval. */

/** Nilai enum DataStatus pada POS.DataLayer. Angkanya harus sama persis dengan C#. */
export const DATA_STATUS = {
    Draft: 1,
    Pending: 2,
    Approved: 3,
    Rejected: 4,
    Cancelled: 5,
    Completed: 6,
    Void: 7,
} as const;

export interface QueryInventoryModel {
    IdInventory: string;
    IdProduct: string;
    IdWarehouse: string;
    Quantity: number;
    Sku: string;
    Barcode: string | null;
    ProductName: string;
    CategoryName: string;
    UnitName: string;
    WarehouseName: string;
    MinimumStock: number;
    CostPrice: number;
    SellingPrice: number;
    StockValue: number;
    StrStockValue: string;
    StrSellingPrice: string;
    StrDateModified: string;
    StockStatus: "aman" | "menipis" | "habis";
    StrStockStatus: string;
}

export interface QueryStockMovementModel {
    IdStockMovement: string;
    IdProduct: string;
    IdWarehouse: string;
    MovementType: number;
    Quantity: number;
    QuantityBefore: number;
    QuantityAfter: number;
    ReferenceType: string;
    ReferenceId: string | null;
    ReferenceNumber: string | null;
    Note: string | null;
    Sku: string;
    ProductName: string;
    UnitName: string;
    WarehouseName: string;
    CreatedBy: string | null;
    StrDateCreated: string;
    IsIncoming: boolean;
    StrQuantityChange: string;
    StrMovementType: string;
}

export interface QueryApprovalRequestModel {
    IdApprovalRequest: string;
    ApprovalTypeCode: string;
    ModuleName: string;
    ReferenceId: string;
    ReferenceNumber: string | null;
    Title: string;
    Description: string | null;
    Status: number;
    DecidedById: string | null;
    DecisionNote: string | null;
    CreatedById: string | null;
    RequestedBy: string | null;
    DecidedBy: string | null;
    StrDateCreated: string;
    StrDecidedDate: string;
    StrStatus: string;
    StrApprovalType: string;
}

export interface ProductLookupModel {
    IdProduct: string;
    Sku: string;
    Barcode: string | null;
    ProductName: string;
    UnitName: string;
    CostPrice: number;
    SellingPrice: number;
    PhotoFileName: string | null;
    Stock: number;
    StrCostPrice: string;
    StrSellingPrice: string;
}
