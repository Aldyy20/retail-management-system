import { useId } from "react";
import { rowsPerPageOptions } from "@/services/global.types";

interface SelectPagingSizeProps {
    rowsPerPage: number;
    onChange: (rowsPerPage: number) => void;
}

export function SelectPagingSize({ rowsPerPage, onChange }: SelectPagingSizeProps) {
    const selectId = useId();

    return (
        <div className="flex items-center gap-2">
            <label htmlFor={selectId} className="text-label-small text-on-surface-variant">
                Baris
            </label>
            <select
                id={selectId}
                value={rowsPerPage}
                onChange={(event) => onChange(Number(event.target.value))}
                className="min-h-11 rounded-(--radius-control) border border-outline bg-surface px-2 text-body text-on-surface outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-primary"
            >
                {rowsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}
