import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { SelectPagingSize } from "@/components/common/SelectPagingSize";
import { MyPagination } from "@/components/common/MyPagination";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { IconButton } from "@/components/ui/IconButton";
import { Surface } from "@/components/ui/Surface";
import type { IPaging } from "@/services/global.types";

interface ListPageShellProps {
    title: string;
    description: string;
    /** Aksi utama halaman, biasanya satu tombol tambah data. */
    primaryAction?: ReactNode;
    searchPlaceholder: string;
    /**
     * Penyaring milik halaman. Diletakkan sebaris dengan pencarian, bukan di header,
     * karena keduanya mempersempit daftar yang sama.
     */
    filters?: ReactNode;
    /** Judul dan penjelasan saat data kosong. Dibedakan antara belum ada data dan hasil pencarian nihil. */
    emptyTitle: string;
    emptyDescription: string;
    emptyAction?: ReactNode;

    isLoading: boolean;
    errorMessage: string | null;
    rowCount: number;
    paging: IPaging;

    onSearch: (searchPhrase: string | null) => void;
    onRefresh: () => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (rowsPerPage: number) => void;

    /** Tabel halaman. Kolomnya ditulis masing-masing halaman karena memang berbeda. */
    children: ReactNode;
}

/**
 * Rangka halaman daftar: judul, pencarian, tabel, dan navigasi halaman.
 *
 * Seragam di seluruh master data supaya dipelajari sekali lalu berlaku di semua modul.
 * Ini jeda yang disengaja dari dial RHYTHM: layar kasir dan dashboard punya komposisi sendiri.
 */
export function ListPageShell({
    title,
    description,
    primaryAction,
    searchPlaceholder,
    filters,
    emptyTitle,
    emptyDescription,
    emptyAction,
    isLoading,
    errorMessage,
    rowCount,
    paging,
    onSearch,
    onRefresh,
    onPageChange,
    onPageSizeChange,
    children,
}: ListPageShellProps) {
    const isSearching = Boolean(paging.searchPhrase);
    const hasRows = rowCount > 0;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title={title} description={description} actions={primaryAction} />

            <Surface variant="outlined" className="overflow-hidden">
                <div className="border-b border-outline-variant p-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <SearchInput placeholder={searchPlaceholder} value={paging.searchPhrase} onSearch={onSearch} />

                        <div className="flex items-center gap-2">
                            <SelectPagingSize rowsPerPage={paging.rowsPerPage} onChange={onPageSizeChange} />
                            <IconButton label="Muat ulang daftar" icon={<RefreshCw size={18} />} onClick={onRefresh} />
                        </div>
                    </div>

                    {filters ? <div className="mt-3 grid gap-3 sm:grid-cols-2 large:grid-cols-4">{filters}</div> : null}
                </div>

                {isLoading ? <LoadingSpinner label="Memuat data" /> : null}

                {!isLoading && errorMessage ? (
                    <div className="p-4">
                        <ErrorAlert message={errorMessage} onRetry={onRefresh} />
                    </div>
                ) : null}

                {!isLoading && !errorMessage && !hasRows ? (
                    isSearching ? (
                        <EmptyDataAlert
                            title="Tidak ada yang cocok"
                            description={`Tidak ada data yang cocok dengan kata kunci "${paging.searchPhrase}". Coba kata kunci lain atau kosongkan pencarian.`}
                        />
                    ) : (
                        <EmptyDataAlert title={emptyTitle} description={emptyDescription} action={emptyAction} />
                    )
                ) : null}

                {!isLoading && !errorMessage && hasRows ? (
                    <>
                        <div className="overflow-x-auto">{children}</div>

                        <div className="border-t border-outline-variant p-4">
                            <MyPagination
                                currentPage={paging.currentPage}
                                rowsPerPage={paging.rowsPerPage}
                                totalRecords={paging.totalRecords}
                                onPageChange={onPageChange}
                            />
                        </div>
                    </>
                ) : null}
            </Surface>
        </div>
    );
}
