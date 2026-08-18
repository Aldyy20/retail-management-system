/**
 * Cerminan TypeScript dari POS.DataLayer. Nama properti sengaja PascalCase supaya sama
 * persis dengan kontrak JSON backend dan tidak perlu lapisan penerjemah.
 */

export interface BaseGetListRequestModel {
    CurrentPage: number;
    RowsPerPage: number;
    SortBy: string | null;
    ReverseSort: boolean;
    SearchPhrase: string | null;
}

export interface BaseGetListResponseModel<TRow> {
    CurrentPage: number;
    RowsCount: number;
    TotalRecords: number;
    Rows: TRow[];
}

export interface BaseIdRequestModel {
    Id: string;
}

export interface SelectListItemModel {
    Value: string;
    Text: string;
    Description: string | null;
}
