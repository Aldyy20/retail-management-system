export interface CreateEditUserModel {
    Id: string;
    UserName: string;
    FullName: string;
    Email: string | null;
    PhoneNumber: string | null;
    RoleName: string;
    IsActive: boolean;
    Password?: string | null;
    ConfirmPassword?: string | null;
}

export interface QueryUserModel extends Omit<CreateEditUserModel, "Password" | "ConfirmPassword"> {
    DateCreated: string;
    DateModified: string | null;
    StrDateCreated: string;
    StrDateModified: string;
    StrStatus: string;
}
