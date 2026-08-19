import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { defaultPaging } from "@/services/global.types";
import type { IPaging } from "@/services/global.types";
import type { BaseGetListRequestModel, BaseGetListResponseModel } from "@/@dataLayer/base.models";

interface UseListPageOptions {
    /** Alamat endpoint daftar, contoh: /admin/category/get-list-category. */
    listUrl: string;
    /** Alamat endpoint hapus. Dikosongkan bila halaman tidak menyediakan hapus. */
    deleteUrl?: string;
    /** Kolom urutan awal, memakai nama properti backend. */
    defaultSortBy?: string;

    /**
     * Penyaring tambahan milik halaman, contoh IdWarehouse atau Status.
     * Ikut dikirim pada setiap permintaan daftar dan memicu muat ulang saat berubah.
     */
    extraRequest?: Record<string, unknown>;
}

/**
 * Perilaku bersama seluruh halaman daftar: memuat, mencari, mengurutkan, berpindah
 * halaman, dan menghapus dengan konfirmasi.
 *
 * Diambil keluar dari halaman karena keenam halaman master data melakukan hal yang
 * sama persis; yang berbeda hanya kolom tabelnya, dan itu tetap ditulis di halaman.
 */
export function useListPage<TRow>({ listUrl, deleteUrl, defaultSortBy, extraRequest }: UseListPageOptions) {
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [listData, setListData] = useState<TRow[]>([]);
    const [paging, setPaging] = useState<IPaging>({ ...defaultPaging, sortBy: defaultSortBy ?? null });

    const [selectedRow, setSelectedRow] = useState<TRow | null>(null);
    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { currentPage, rowsPerPage, sortBy, reverseSort, searchPhrase } = paging;

    // Penyaring dibandingkan sebagai teks supaya objek baru dengan isi sama tidak
    // memicu permintaan ulang setiap kali halaman dirender.
    const extraRequestKey = JSON.stringify(extraRequest ?? {});

    const getListData = useCallback(() => {
        const model: BaseGetListRequestModel = {
            CurrentPage: currentPage,
            RowsPerPage: rowsPerPage,
            SortBy: sortBy,
            ReverseSort: reverseSort,
            SearchPhrase: searchPhrase,
        };

        return api
            .post<BaseGetListResponseModel<TRow>>(listUrl, { ...model, ...JSON.parse(extraRequestKey) })
            .then((response) => {
                setListData(response.data.Rows);
                setPaging((current) => ({ ...current, totalRecords: response.data.TotalRecords }));
                setErrorMessage(null);
            })
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoading(false));
    }, [listUrl, currentPage, rowsPerPage, sortBy, reverseSort, searchPhrase, extraRequestKey]);

    useEffect(() => {
        getListData();
    }, [getListData]);

    const handleRefresh = () => {
        setIsLoading(true);
        getListData();
    };

    const handleSearch = useCallback((phrase: string | null) => {
        setIsLoading(true);
        setPaging((current) => ({ ...current, searchPhrase: phrase, currentPage: 1 }));
    }, []);

    /** Klik pertama mengurutkan menaik, klik berikutnya pada kolom yang sama membalikkannya. */
    const handleSort = (nextSortBy: string) => {
        setIsLoading(true);
        setPaging((current) => ({
            ...current,
            sortBy: nextSortBy,
            reverseSort: current.sortBy === nextSortBy ? !current.reverseSort : false,
            currentPage: 1,
        }));
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setPaging((current) => ({ ...current, currentPage: page }));
    };

    const setPageSizeOption = (nextRowsPerPage: number) => {
        setIsLoading(true);
        setPaging((current) => ({ ...current, rowsPerPage: nextRowsPerPage, currentPage: 1 }));
    };

    const openDeleteConfirmation = (row: TRow) => {
        setSelectedRow(row);
        setShowDeleteConfirmationModal(true);
    };

    const closeDeleteConfirmation = () => {
        setShowDeleteConfirmationModal(false);
        setSelectedRow(null);
    };

    /**
     * Menghapus baris terpilih. Mengembalikan pesan sukses dari server bila berhasil,
     * atau melempar pesan kesalahan supaya halaman dapat menampilkannya.
     */
    const deleteSelectedRow = async (id: string): Promise<string> => {
        if (!deleteUrl) {
            throw new Error("Halaman ini tidak menyediakan penghapusan data.");
        }

        setIsDeleting(true);

        try {
            const response = await api.post<string>(deleteUrl, { Id: id });
            closeDeleteConfirmation();
            handleRefresh();
            return response.data;
        } catch (error) {
            throw new Error(getAxiosErrorMessage(error), { cause: error });
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        isLoading,
        errorMessage,
        listData,
        paging,
        selectedRow,
        showDeleteConfirmationModal,
        isDeleting,
        handleRefresh,
        handleSearch,
        handleSort,
        handlePageChange,
        setPageSizeOption,
        openDeleteConfirmation,
        closeDeleteConfirmation,
        deleteSelectedRow,
    };
}
