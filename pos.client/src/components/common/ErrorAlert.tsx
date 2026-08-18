import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorAlertProps {
    /** Pesan dari server. Sudah berbahasa Indonesia dan siap ditampilkan. */
    message: string;
    /** Tindakan pemulihan. Tanpa ini pengguna hanya tahu ada masalah, tidak tahu harus apa. */
    onRetry?: () => void;
    retryLabel?: string;
}

export function ErrorAlert({ message, onRetry, retryLabel = "Muat ulang" }: ErrorAlertProps) {
    return (
        <div
            role="alert"
            className="flex flex-col gap-3 rounded-(--radius-card) bg-error-container p-4 text-on-error-container sm:flex-row sm:items-center"
        >
            <TriangleAlert size={20} aria-hidden="true" className="shrink-0" />
            <p className="flex-1 text-body">
                <span className="font-semibold">Gagal. </span>
                {message}
            </p>
            {onRetry ? (
                <Button variant="outlined" onClick={onRetry} className="border-current text-current shrink-0">
                    {retryLabel}
                </Button>
            ) : null}
        </div>
    );
}
