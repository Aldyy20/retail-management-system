export interface CreateEditDiscountModel {
    IdDiscount: string;
    DiscountName: string;
    DiscountValueType: number;
    DiscountValue: number;
    MaximumDiscount: number;
    StartDate: string;
    EndDate: string;
    IsActive: boolean;
    ListIdProduct: string[];
}

export interface QueryDiscountModel extends Omit<CreateEditDiscountModel, "ListIdProduct"> {
    TotalProduct: number;
    StrStatus: string;
    StrStartDate: string;
    StrEndDate: string;
    StrPeriod: string;
    StrDiscountValue: string;
    StrPeriodStatus: string;
}

export interface CreateEditVoucherModel {
    IdVoucher: string;
    VoucherCode: string;
    VoucherName: string;
    DiscountValueType: number;
    DiscountValue: number;
    MinimumPurchase: number;
    MaximumDiscount: number;
    StartDate: string;
    EndDate: string;
    UsageLimit: number;
    IsMemberOnly: boolean;
    IsActive: boolean;
}

export interface QueryVoucherModel extends CreateEditVoucherModel {
    UsageCount: number;
    StrStatus: string;
    StrStartDate: string;
    StrEndDate: string;
    StrPeriod: string;
    StrMinimumPurchase: string;
    StrMaximumDiscount: string;
    StrUsage: string;
    StrTarget: string;
    StrDiscountValue: string;
    StrPeriodStatus: string;
}

export interface VoucherValidationModel {
    IsValid: boolean;
    ErrorMessage: string | null;
    IdVoucher: string | null;
    VoucherCode: string | null;
    VoucherName: string | null;
    DiscountAmount: number;
    StrDiscountAmount: string;
}
