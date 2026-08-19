import type { QueryApprovalRequestModel, ProductLookupModel } from "@/@dataLayer/inventory.models";
import type { SelectListItemModel } from "@/@dataLayer/base.models";
import type { PointRedemptionOptionModel, QueryMemberModel } from "@/@dataLayer/member.models";
import type { VoucherValidationModel } from "@/@dataLayer/promo.models";

export interface QueryPaymentMethodModel {
    PaymentMethodCode: string;
    PaymentMethodName: string;
    Description: string | null;
    RequiresChange: boolean;
    SortOrder: number;
    IsActive: boolean;
}

export interface CashierInitModel {
    ListWarehouse: SelectListItemModel[];
    ListPaymentMethod: QueryPaymentMethodModel[];
    DefaultWarehouseId: string;
    StoreName: string;
    IsMemberEnabled: boolean;
    IsLoyaltyEnabled: boolean;
    IsVoucherEnabled: boolean;
}

export interface CartItemModel {
    IdProduct: string;
    Quantity: number;
}

export interface CalculatedCartItemModel {
    IdProduct: string;
    Sku: string;
    ProductName: string;
    UnitName: string;
    Quantity: number;
    UnitPrice: number;
    DiscountAmount: number;
    Subtotal: number;
    AvailableStock: number;
    IsStockSufficient: boolean;
    StrUnitPrice: string;
    StrSubtotal: string;
}

export interface CalculatedCartModel {
    ListItem: CalculatedCartItemModel[];
    SubtotalAmount: number;
    DiscountAmount: number;
    VoucherDiscountAmount: number;
    PointDiscountAmount: number;
    TotalAmount: number;
    TotalQuantity: number;
    ListWarning: string[];
    Member: QueryMemberModel | null;
    ListRedemptionOption: PointRedemptionOptionModel[];
    IdPointRedemptionRule: string | null;
    PointEarned: number;
    PointRedeemed: number;
    Voucher: VoucherValidationModel | null;
    StrSubtotalAmount: string;
    StrDiscountAmount: string;
    StrTotalAmount: string;
    IsReadyToPay: boolean;
}

export interface ReceiptSettingModel {
    StoreName: string;
    StoreAddress: string;
    StorePhone: string;
    StoreLogoUrl: string;
    Header: string;
    Footer: string;
    ThankYouMessage: string;
    ReturnPolicy: string;
}

export interface QueryTransactionModel {
    IdTransaction: string;
    InvoiceNumber: string;
    IdWarehouse: string;
    SubtotalAmount: number;
    DiscountAmount: number;
    TotalAmount: number;
    PaidAmount: number;
    ChangeAmount: number;
    Status: number;
    TotalItem: number;
    TotalCost: number;
    CreatedById: string | null;
    WarehouseName: string;
    PaymentMethodName: string;
    CashierName: string | null;
    MemberName: string | null;
    MemberPhoneNumber: string | null;
    IdMember: string | null;
    PointEarned: number;
    PointRedeemed: number;
    VoucherCode: string | null;
    Note: string | null;
    GrossProfit: number;
    StrTransactionDate: string;
    StrSubtotalAmount: string;
    StrTotalAmount: string;
    StrPaidAmount: string;
    StrChangeAmount: string;
    StrGrossProfit: string;
    StrTotalDiscountAmount: string;
    StrStatus: string;
}

export interface QueryTransactionDetailModel {
    IdTransactionDetail: string;
    IdProduct: string;
    Sku: string;
    ProductName: string;
    UnitName: string;
    Quantity: number;
    UnitPrice: number;
    DiscountAmount: number;
    Subtotal: number;
    StrUnitPrice: string;
    StrSubtotal: string;
}

export interface DetailsTransactionModel extends QueryTransactionModel {
    ListDetail: QueryTransactionDetailModel[];
    VoidRequest: QueryApprovalRequestModel | null;
    Receipt: ReceiptSettingModel;
}

export type { ProductLookupModel };
