/** Status permintaan, memakai angka DataStatus yang sama dengan backend. */
export const PASSWORD_RESET_STATUS = {
    Pending: 2,
    Rejected: 4,
    Completed: 6,
} as const;

export interface QueryPasswordResetRequestModel {
    IdPasswordResetRequest: string;
    IdUser: string;
    UserName: string;
    Note: string | null;
    IpAddress: string | null;
    Status: number;
    HandledById: string | null;
    HandledDate: string | null;
    HandledNote: string | null;
    DateCreated: string;
    FullName: string | null;
    RoleName: string | null;
    HandledBy: string | null;
    IsUserActive: boolean;
    StrDateCreated: string;
    StrHandledDate: string;
    StrStatus: string;
}

export interface CreatePasswordResetRequestModel {
    UserName: string;
    Note: string | null;
}

export interface CompletePasswordResetModel {
    IdPasswordResetRequest: string;
    NewPassword: string;
}

export interface RejectPasswordResetModel {
    IdPasswordResetRequest: string;
    HandledNote: string;
}
