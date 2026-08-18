import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Wajib. Tombol berisi ikon saja tidak punya teks, jadi nama ini yang dibaca pembaca layar. */
    label: string;
    icon: ReactNode;
    isActive?: boolean;
}

/**
 * Tombol ikon dengan area sentuh 44px meski ikonnya kecil,
 * dan nama aksesibilitas yang wajib diisi.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { label, icon, isActive = false, className = "", type = "button", ...rest },
    ref,
) {
    return (
        <button
            {...rest}
            ref={ref}
            type={type}
            title={label}
            aria-label={label}
            aria-pressed={rest["aria-pressed"] ?? (isActive || undefined)}
            className={[
                "inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control)",
                "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
                isActive ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-on-surface/8",
                className,
            ].join(" ")}
        >
            {icon}
        </button>
    );
});
