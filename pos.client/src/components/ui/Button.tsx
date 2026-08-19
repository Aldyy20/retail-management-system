import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    /** Ikon di depan label. Wajib punya label teks di sebelahnya, bukan ikon sendirian. */
    icon?: ReactNode;
    /** Menonaktifkan tombol dan menampilkan indikator, mencegah pengiriman ganda. */
    isLoading?: boolean;
    fullWidth?: boolean;
}

/**
 * Tombol Zenith Retail Pro.
 * Emphasis dipilih dari peran:
 * `filled` untuk satu aksi utama per area (Navy gelap / Slate 950),
 * `success` / `tonal` untuk aksi positif atau persetujuan (Emerald),
 * `outlined` untuk alternatif netral,
 * `text` untuk aksi ringan,
 * `danger` khusus tindakan merusak.
 */
const variantClass: Record<ButtonVariant, string> = {
    filled: "bg-primary text-on-primary hover:bg-primary-container shadow-sm",
    success: "bg-secondary text-on-secondary hover:brightness-110 shadow-sm",
    tonal: "bg-secondary-container text-on-secondary-container hover:brightness-95",
    outlined: "border border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-muted active:bg-surface-variant",
    text: "text-on-surface hover:bg-on-surface/8 active:bg-on-surface/12",
    danger: "bg-error text-on-error hover:brightness-110 active:brightness-95 shadow-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = "filled", icon, isLoading = false, fullWidth = false, className = "", children, disabled, type = "button", ...rest },
    ref,
) {
    return (
        <button
            {...rest}
            ref={ref}
            type={type}
            disabled={disabled || isLoading}
            aria-busy={isLoading || undefined}
            className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-control) px-4 text-label font-semibold",
                "transition-[filter,background-color,border-color] duration-150 cursor-pointer",
                "disabled:cursor-not-allowed disabled:opacity-50",
                variantClass[variant],
                fullWidth ? "w-full" : "",
                className,
            ].join(" ")}
        >
            {isLoading ? (
                <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
            ) : (
                icon
            )}
            {children}
        </button>
    );
});
