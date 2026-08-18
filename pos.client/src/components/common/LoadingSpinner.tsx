interface LoadingSpinnerProps {
    /** Menjelaskan apa yang sedang dimuat, bukan sekadar "memuat". */
    label: string;
    className?: string;
}

/**
 * Indikator tak-tentu. Selalu disertai keterangan apa yang sedang dimuat,
 * supaya pengguna tahu penungguannya wajar atau tidak.
 */
export function LoadingSpinner({ label, className = "" }: LoadingSpinnerProps) {
    return (
        <div role="status" className={`flex items-center justify-center gap-3 py-10 text-on-surface-variant ${className}`}>
            <span
                aria-hidden="true"
                className="size-5 animate-spin rounded-full border-2 border-outline border-t-primary"
            />
            <span className="text-body">{label}</span>
        </div>
    );
}
