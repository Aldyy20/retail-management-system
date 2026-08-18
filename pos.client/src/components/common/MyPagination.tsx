import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { formatNumber } from "@/services/global.methods";

interface MyPaginationProps {
    currentPage: number;
    rowsPerPage: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
}

/**
 * Navigasi halaman. Nomor halaman ditampilkan bersama jangkauan barisnya, supaya
 * pengguna tahu posisinya di dalam keseluruhan data, bukan sekadar nomor halaman.
 */
export function MyPagination({ currentPage, rowsPerPage, totalRecords, onPageChange }: MyPaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
    const firstRow = totalRecords === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const lastRow = Math.min(currentPage * rowsPerPage, totalRecords);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-label-small text-on-surface-variant">
                Menampilkan {formatNumber(firstRow)} sampai {formatNumber(lastRow)} dari {formatNumber(totalRecords)} data
            </p>

            <div className="flex items-center gap-1">
                <IconButton
                    label="Halaman sebelumnya"
                    icon={<ChevronLeft size={18} />}
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                />
                <span className="px-2 text-label text-on-surface">
                    {currentPage} / {totalPages}
                </span>
                <IconButton
                    label="Halaman berikutnya"
                    icon={<ChevronRight size={18} />}
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                />
            </div>
        </div>
    );
}
