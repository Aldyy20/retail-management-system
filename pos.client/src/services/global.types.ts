export interface IPaging {
    currentPage: number;
    rowsPerPage: number;
    sortBy: string | null;
    reverseSort: boolean;
    searchPhrase: string | null;
    totalRecords: number;
}

export const defaultPaging: IPaging = {
    currentPage: 1,
    rowsPerPage: 10,
    sortBy: null,
    reverseSort: false,
    searchPhrase: null,
    totalRecords: 0,
};

export const rowsPerPageOptions = [10, 25, 50, 100];

/** Empat role sistem. Dipakai untuk memilih berkas rute dan menu navigasi. */
export const ROLE_ADMIN = "Admin";
export const ROLE_OWNER = "Owner";
export const ROLE_SUPERVISOR = "Supervisor";
export const ROLE_KARYAWAN = "Karyawan";
