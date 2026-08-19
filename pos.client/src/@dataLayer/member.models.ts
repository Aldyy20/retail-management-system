export interface CreateEditMemberModel {
    IdMember: string;
    PhoneNumber: string;
    MemberName: string;
    Email: string | null;
    Address: string | null;
    IsActive: boolean;
}

export interface QueryMemberModel extends CreateEditMemberModel {
    PointBalance: number;
    TotalSpending: number;
    TotalTransaction: number;
    DateCreated: string;
    DateModified: string | null;
    StrStatus: string;
    StrTotalSpending: string;
    StrDateCreated: string;
}

export interface QueryMemberPointModel {
    IdMemberPointTransaction: string;
    IdMember: string;
    MovementType: number;
    Point: number;
    PointBefore: number;
    PointAfter: number;
    ReferenceType: string;
    ReferenceNumber: string | null;
    Note: string | null;
    CreatedBy: string | null;
    IsIncoming: boolean;
    StrPointChange: string;
    StrDateCreated: string;
    StrMovementType: string;
}

export interface DetailsMemberModel extends QueryMemberModel {
    ListPointHistory: QueryMemberPointModel[];
}

/** Nilai enum DiscountValueType pada POS.DataLayer. */
export const DISCOUNT_VALUE_TYPE = {
    Percentage: 1,
    FixedAmount: 2,
} as const;

export interface CreateEditPointRedemptionRuleModel {
    IdPointRedemptionRule: string;
    RuleName: string;
    PointRequired: number;
    DiscountValueType: number;
    DiscountValue: number;
    MaximumDiscount: number;
    MinimumPurchase: number;
    IsActive: boolean;
}

export interface QueryPointRedemptionRuleModel extends CreateEditPointRedemptionRuleModel {
    DateCreated: string;
    DateModified: string | null;
    StrStatus: string;
    StrMinimumPurchase: string;
    StrMaximumDiscount: string;
    StrDiscountValue: string;
    StrRuleSummary: string;
}

export interface PointRedemptionOptionModel {
    IdPointRedemptionRule: string;
    RuleName: string;
    PointRequired: number;
    DiscountAmount: number;
    IsAvailable: boolean;
    UnavailableReason: string | null;
    StrDiscountAmount: string;
}
