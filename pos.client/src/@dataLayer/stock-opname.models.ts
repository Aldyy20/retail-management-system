import type { QueryApprovalRequestModel } from "@/@dataLayer/inventory.models";

export interface CreateEditStockOpnameDetailModel {
    IdProduct: string;
    PhysicalStock: number;
}

export interface CreateEditStockOpnameModel {
    IdStockOpname: string;
    OpnameNumber: string;
    IdWarehouse: string;
    OpnameDate: string;
    Note: string | null;
    Status: number;
    ListDetail: CreateEditStockOpnameDetailModel[];
    IsSubmitted: boolean;
}

export interface QueryStockOpnameModel {
    IdStockOpname: string;
    OpnameNumber: string;
    IdWarehouse: string;
    Note: string | null;
    Status: number;
    TotalItem: number;
    TotalDifference: number;
    CreatedById: string | null;
    WarehouseName: string;
    CreatedBy: string | null;
    StrOpnameDate: string;
    StrDateCreated: string;
    StrStatus: string;
    StrTotalDifference: string;
}

export interface QueryStockOpnameDetailModel {
    IdStockOpnameDetail: string;
    IdProduct: string;
    Sku: string;
    ProductName: string;
    UnitName: string;
    SystemStock: number;
    PhysicalStock: number;
    Difference: number;
    StrDifference: string;
}

export interface DetailsStockOpnameModel extends QueryStockOpnameModel {
    ListDetail: QueryStockOpnameDetailModel[];
    ApprovalRequest: QueryApprovalRequestModel | null;
}
