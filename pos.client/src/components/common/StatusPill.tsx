export type StatusTone = "pending" | "success" | "error" | "neutral" | "info";

interface StatusPillProps {
    tone: StatusTone;
    label: string;
}

/**
 * Motif identitas aplikasi: garis status di tepi awal.
 * Warna selalu ditemani label teks, sehingga status tetap terbaca oleh pengguna
 * yang tidak dapat membedakan warna.
 */
const toneClass: Record<StatusTone, string> = {
    pending: "border-l-pending bg-pending-container text-on-pending-container",
    success: "border-l-success bg-success-container text-on-success-container",
    error: "border-l-error bg-error-container text-on-error-container",
    info: "border-l-tertiary bg-tertiary-container text-on-tertiary-container",
    neutral: "border-l-outline bg-surface-highest text-on-surface-variant",
};

export function StatusPill({ tone, label }: StatusPillProps) {
    return (
        <span
            className={`inline-flex items-center rounded-r-(--radius-chip) border-l-[3px] py-0.5 pr-2 pl-2 text-label-small ${toneClass[tone]}`}
        >
            {label}
        </span>
    );
}
