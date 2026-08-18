export interface LoginRequestModel {
    UserName: string;
    Password: string;
}

export interface CurrentUserModel {
    Id: string;
    UserName: string;
    FullName: string;
    Role: string;
    Token: string;
    ExpiresAt: string;
    StoreName: string;
}

export interface ChangePasswordRequestModel {
    CurrentPassword: string;
    NewPassword: string;
    ConfirmPassword: string;
}
