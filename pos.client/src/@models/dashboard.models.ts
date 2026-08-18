export interface StoreInfoModel {
    StoreName: string;
    StoreAddress: string;
}

export interface DashboardActivityModel {
    ActionName: string;
    ModuleName: string;
    Description: string | null;
    CreatedBy: string;
    StrDateCreated: string;
}

export interface DashboardSummaryModel {
    StoreName: string;
    TotalUserActive: number;
    IsMemberEnabled: boolean;
    IsLoyaltyEnabled: boolean;
    IsVoucherEnabled: boolean;
    RecentActivities: DashboardActivityModel[];
}
