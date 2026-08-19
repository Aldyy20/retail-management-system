export interface QuerySystemSettingModel {
    SettingKey: string;
    SettingValue: string | null;
    /** text, boolean, integer, atau decimal. Menentukan kontrol input yang dipakai. */
    ValueType: string;
    GroupName: string;
    DisplayName: string;
    Description: string | null;
    SortOrder: number;
    IsEditable: boolean;
    DateModified: string | null;
    StrDateModified: string;
}

export interface CreateEditSystemSettingModel {
    SettingKey: string;
    SettingValue: string | null;
}

export interface UpdateSystemSettingModel {
    GroupName: string;
    ListSetting: CreateEditSystemSettingModel[];
}
