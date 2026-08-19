export type StatusTone = "pending" | "success" | "error" | "neutral" | "info";

interface StatusPillProps {
    tone: StatusTone;
    label: string;
}

/**
 * Status Pill Zenith Retail Pro.
 * Menggunakan pill dengan latar 10% opacity, border halus, dan teks berwarna jelas.
 */
const toneClass: Record<StatusTone, string> = {
    pending: "bg-pending/10 text-pending border-pending/20",
    success: "bg-success/10 text-success border-success/20",
    error: "bg-error/10 text-error border-error/20",
    info: "bg-primary/10 text-primary border-primary/20",
    neutral: "bg-on-surface-variant/10 text-on-surface-variant border-outline-variant",
};

const dotClass: Record<StatusTone, string> = {
    pending: "bg-pending",
    success: "bg-success",
    error: "bg-error",
    info: "bg-primary",
    neutral: "bg-on-surface-variant",
};

export function StatusPill({ tone, label }: StatusPillProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-label-small font-medium ${toneClass[tone]}`}
        >
            <span className={`size-1.5 rounded-full ${dotClass[tone]}`} aria-hidden="true" />
            {label}
        </span>
    );
}
