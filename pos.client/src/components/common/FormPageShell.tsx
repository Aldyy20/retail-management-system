import type { FormEventHandler, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";

interface FormPageShellProps {
    title: string;
    description: string;
    /** Kesalahan saat memuat data awal. Form tidak ditampilkan sampai ini beres. */
    initErrorMessage: string | null;
    isLoadingInit: boolean;
    /** Kesalahan saat menyimpan. Ditampilkan di atas form tanpa menghapus isian. */
    errorMessage: string | null;
    isSubmitting: boolean;
    submitLabel: string;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onRetryInit: () => void;
    children: ReactNode;
}

/**
 * Rangka halaman formulir tambah dan ubah.
 *
 * Isian tidak pernah dihapus ketika penyimpanan gagal, sehingga pengguna tidak
 * perlu mengetik ulang untuk memperbaiki satu kolom.
 */
export function FormPageShell({
    title,
    description,
    initErrorMessage,
    isLoadingInit,
    errorMessage,
    isSubmitting,
    submitLabel,
    onSubmit,
    onRetryInit,
    children,
}: FormPageShellProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title={title} description={description} />

            {isLoadingInit ? <LoadingSpinner label="Memuat formulir" /> : null}

            {!isLoadingInit && initErrorMessage ? <ErrorAlert message={initErrorMessage} onRetry={onRetryInit} /> : null}

            {!isLoadingInit && !initErrorMessage ? (
                <Surface variant="outlined" className="max-w-2xl p-5 medium:p-6">
                    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
                        {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                        {children}

                        <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-5">
                            <Button variant="text" onClick={() => navigate(-1)} disabled={isSubmitting}>
                                Batal
                            </Button>
                            <Button type="submit" isLoading={isSubmitting}>
                                {isSubmitting ? "Menyimpan" : submitLabel}
                            </Button>
                        </div>
                    </form>
                </Surface>
            ) : null}
        </div>
    );
}
