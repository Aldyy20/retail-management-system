/** Cermin TypeScript untuk model master data pada POS.DataLayer. */

interface AuditFields {
    DateCreated: string;
    DateModified: string | null;
    StrDateCreated: string;
    StrDateModified: string;
}

// --- Kategori ---------------------------------------------------------------

export interface CreateEditCategoryModel {
    IdCategory: string;
    CategoryName: string;
    Description: string | null;
    IsActive: boolean;
}

export interface QueryCategoryModel extends CreateEditCategoryModel, AuditFields {
    TotalProduct: number;
    StrStatus: string;
}

// --- Satuan -----------------------------------------------------------------

export interface CreateEditUnitModel {
    IdUnit: string;
    UnitName: string;
    Description: string | null;
    IsActive: boolean;
}

export interface QueryUnitModel extends CreateEditUnitModel, AuditFields {
    TotalProduct: number;
    StrStatus: string;
}

// --- Gudang -----------------------------------------------------------------

export interface CreateEditWarehouseModel {
    IdWarehouse: string;
    WarehouseCode: string;
    WarehouseName: string;
    Address: string | null;
    Description: string | null;
    IsDefault: boolean;
    IsActive: boolean;
}

export interface QueryWarehouseModel extends CreateEditWarehouseModel, AuditFields {
    StrStatus: string;
    StrDefault: string;
}

// --- Supplier ---------------------------------------------------------------

export interface CreateEditSupplierModel {
    IdSupplier: string;
    SupplierName: string;
    ContactName: string | null;
    PhoneNumber: string | null;
    Email: string | null;
    Address: string | null;
    IsActive: boolean;
}

export interface QuerySupplierModel extends CreateEditSupplierModel, AuditFields {
    StrStatus: string;
    StrContact: string;
}

// --- Produk -----------------------------------------------------------------

export interface CreateEditProductModel {
    IdProduct: string;
    Sku: string;
    Barcode: string | null;
    ProductName: string;
    Description: string | null;
    IdCategory: string;
    IdUnit: string;
    CostPrice: number;
    SellingPrice: number;
    MinimumStock: number;
    IsActive: boolean;
    PriceChangeNote?: string | null;
}

export interface QueryProductModel extends CreateEditProductModel, AuditFields {
    CategoryName: string;
    UnitName: string;
    StrCostPrice: string;
    StrSellingPrice: string;
    StrProfitPerUnit: string;
    StrMargin: string;
    StrStatus: string;
    MarginPercentage: number;
}

export interface QueryPriceHistoryModel {
    IdPriceHistory: string;
    IdProduct: string;
    CostPrice: number;
    SellingPrice: number;
    PreviousCostPrice: number;
    PreviousSellingPrice: number;
    Note: string | null;
    IsInitialPrice: boolean;
    CreatedBy: string | null;
    StrCostPrice: string;
    StrSellingPrice: string;
    StrPreviousCostPrice: string;
    StrPreviousSellingPrice: string;
    StrDateCreated: string;
}

export interface DetailsProductModel extends QueryProductModel {
    ListPriceHistory: QueryPriceHistoryModel[];
}
