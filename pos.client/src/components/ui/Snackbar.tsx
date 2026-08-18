import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

type SnackbarTone = "success" | "error" | "info";

interface SnackbarItem {
    id: number;
    tone: SnackbarTone;
    message: string;
}

interface SnackbarContextValue {
    successNotify: (message: string) => void;
    errorNotify: (message: string) => void;
    infoNotify: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const toneClass: Record<SnackbarTone, string> = {
    success: "bg-success-container text-on-success-container",
    error: "bg-error-container text-on-error-container",
    info: "bg-inverse-surface text-inverse-on-surface",
};

const toneIcon: Record<SnackbarTone, ReactNode> = {
    success: <CircleCheck size={18} aria-hidden="true" />,
    error: <CircleAlert size={18} aria-hidden="true" />,
    info: <Info size={18} aria-hidden="true" />,
};

/** Awalan teks agar pesan tetap dapat dibedakan tanpa mengandalkan warna. */
const tonePrefix: Record<SnackbarTone, string> = {
    success: "Berhasil",
    error: "Gagal",
    info: "Informasi",
};

let nextId = 1;

export function SnackbarProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<SnackbarItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setItems((current) => current.filter((item) => item.id !== id));
    }, []);

    const push = useCallback(
        (tone: SnackbarTone, message: string) => {
            const id = nextId++;
            setItems((current) => [...current, { id, tone, message }]);
            window.setTimeout(() => dismiss(id), tone === "error" ? 8000 : 4000);
        },
        [dismiss],
    );

    const value = useMemo<SnackbarContextValue>(
        () => ({
            successNotify: (message: string) => push("success", message),
            errorNotify: (message: string) => push("error", message),
            infoNotify: (message: string) => push("info", message),
        }),
        [push],
    );

    return (
        <SnackbarContext.Provider value={value}>
            {children}

            <div
                role="status"
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
            >
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-(--radius-control) px-4 py-3 shadow-lg shadow-black/20 ${toneClass[item.tone]}`}
                    >
                        <span className="mt-0.5 shrink-0">{toneIcon[item.tone]}</span>
                        <p className="flex-1 text-body">
                            <span className="font-semibold">{tonePrefix[item.tone]}. </span>
                            {item.message}
                        </p>
                        <button
                            type="button"
                            onClick={() => dismiss(item.id)}
                            aria-label="Tutup pesan"
                            className="-m-1 shrink-0 rounded p-1 hover:bg-current/10"
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    </div>
                ))}
            </div>
        </SnackbarContext.Provider>
    );
}

export function useSnackbar(): SnackbarContextValue {
    const context = useContext(SnackbarContext);

    if (!context) {
        throw new Error("useSnackbar harus dipakai di dalam SnackbarProvider.");
    }

    return context;
}
