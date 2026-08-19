import type { QueryApprovalRequestModel } from "@/@dataLayer/inventory.models";

export interface CreateEditGoodsReceivingDetailModel {
    IdProduct: string;
    Quantity: number;
    CostPrice: number;
}

export interface CreateEditGoodsReceivingModel {
    IdGoodsReceiving: string;
    ReceivingNumber: string;
    IdWarehouse: string;
    IdSupplier: string;
    ReceivingDate: string;
    InvoiceNumber: string | null;
    Note: string | null;
    Status: number;
    ListDetail: CreateEditGoodsReceivingDetailModel[];
    IsSubmitted: boolean;
}

export interface QueryGoodsReceivingModel {
    IdGoodsReceiving: string;
    ReceivingNumber: string;
    IdWarehouse: string;
    IdSupplier: string;
    InvoiceNumber: string | null;
    Note: string | null;
    Status: number;
    TotalItem: number;
    TotalCost: number;
    CreatedById: string | null;
    WarehouseName: string;
    SupplierName: string;
    CreatedBy: string | null;
    StrReceivingDate: string;
    StrDateCreated: string;
    StrTotalCost: string;
    StrStatus: string;
}

export interface QueryGoodsReceivingDetailModel {
    IdGoodsReceivingDetail: string;
    IdProduct: string;
    Sku: string;
    ProductName: string;
    UnitName: string;
    Quantity: number;
    CostPrice: number;
    Subtotal: number;
    StrCostPrice: string;
    StrSubtotal: string;
}

export interface DetailsGoodsReceivingModel extends QueryGoodsReceivingModel {
    ListDetail: QueryGoodsReceivingDetailModel[];
    ApprovalRequest: QueryApprovalRequestModel | null;
}
