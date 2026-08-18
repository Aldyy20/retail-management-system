export interface BaseUserModel {
    Id: string;
    UserName: string;
    FullName: string;
    Email: string | null;
    PhoneNumber: string | null;
    RoleName: string;
    IsActive: boolean;
}

export interface QueryUserModel extends BaseUserModel {
    DateCreated: string;
    DateModified: string | null;
    CreatedBy: string | null;
    ModifiedBy: string | null;
    StrDateCreated: string;
    StrDateModified: string;
    StrStatus: string;
}

export interface CreateEditUserModel extends BaseUserModel {
    Password: string | null;
    ConfirmPassword: string | null;
}
