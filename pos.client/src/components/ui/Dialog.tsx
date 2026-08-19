import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

interface DialogProps {
    isOpen: boolean;
    title: string;
    /** Satu kalimat yang menjelaskan konsekuensi keputusan ini. */
    description?: string;
    children?: ReactNode;
    /** Tombol aksi. Aksi merusak memakai varian danger agar tidak sama dengan aksi rutin. */
    actions: ReactNode;
    onClose: () => void;
}

/**
 * Dialog Zenith Retail Pro.
 * Panel modal putih solid dengan border halus dan elevasi tinggi.
 */
export function Dialog({ isOpen, title, description, children, actions, onClose }: DialogProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

        const panel = panelRef.current;
        const focusables = () =>
            Array.from(
                panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
            ).filter((element) => element.checkVisibility());

        focusables()[0]?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const items = focusables();

            if (items.length === 0) {
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocusedRef.current?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/60 backdrop-blur-[2px] p-4 medium:items-center"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                aria-describedby={description ? "dialog-description" : undefined}
                className="w-full max-w-lg rounded-(--radius-card) border border-outline-variant bg-surface-lowest p-6 shadow-2xl"
            >
                <div className="mb-3 flex items-start justify-between gap-4">
                    <h2 id="dialog-title" className="text-title text-on-surface">
                        {title}
                    </h2>
                    <IconButton label="Tutup dialog" icon={<X size={18} />} onClick={onClose} className="-mt-2 -mr-2" />
                </div>

                {description ? (
                    <p id="dialog-description" className="text-body text-on-surface-variant mb-4">
                        {description}
                    </p>
                ) : null}

                {children ? <div className="mt-2">{children}</div> : null}

                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-4">{actions}</div>
            </div>
        </div>
    );
}
