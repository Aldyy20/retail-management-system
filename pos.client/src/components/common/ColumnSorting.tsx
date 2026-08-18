import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface ColumnSortingProps {
    label: string;
    /** Nama properti backend, PascalCase, karena server yang mengurutkan. */
    sortKey: string;
    currentSortBy: string | null;
    reverseSort: boolean;
    onSort: (sortKey: string) => void;
    /** Kolom angka dirata-kanan supaya sejajar dengan nilainya. */
    alignRight?: boolean;
}

/**
 * Judul kolom yang dapat diurutkan. Arah urutan disampaikan lewat aria-sort dan
 * ikon panah, jadi tidak bergantung pada warna.
 */
export function ColumnSorting({ label, sortKey, currentSortBy, reverseSort, onSort, alignRight = false }: ColumnSortingProps) {
    const isSorted = currentSortBy === sortKey;
    const ariaSort = isSorted ? (reverseSort ? "descending" : "ascending") : "none";
    const Icon = isSorted ? (reverseSort ? ArrowDown : ArrowUp) : ArrowUpDown;

    return (
        <th scope="col" aria-sort={ariaSort} className="px-4 py-0">
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={[
                    "inline-flex min-h-11 w-full items-center gap-1.5 text-label-small text-on-surface-variant",
                    "hover:text-on-surface",
                    alignRight ? "justify-end" : "justify-start",
                ].join(" ")}
            >
                {label}
                <Icon size={14} aria-hidden="true" className={isSorted ? "text-primary" : "opacity-50"} />
            </button>
        </th>
    );
}
