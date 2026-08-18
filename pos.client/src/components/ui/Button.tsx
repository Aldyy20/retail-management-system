import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    /** Ikon di depan label. Wajib punya label teks di sebelahnya, bukan ikon sendirian. */
    icon?: ReactNode;
    /** Menonaktifkan tombol dan menampilkan indikator, mencegah pengiriman ganda. */
    isLoading?: boolean;
    fullWidth?: boolean;
}

/**
 * Tombol M3. Emphasis dipilih dari peran, bukan dari selera:
 * `filled` untuk satu aksi utama per area, `tonal` untuk aksi penting yang tidak boleh
 * menyaingi aksi utama, `outlined` untuk alternatif setara, `text` untuk aksi ringan,
 * `danger` khusus tindakan merusak agar tidak pernah tampak sama dengan aksi rutin.
 *
 * Sudutnya 8px, bukan kapsul penuh. Alasannya ada di DESIGN.md.
 */
const variantClass: Record<ButtonVariant, string> = {
    filled: "bg-primary text-on-primary hover:brightness-110 active:brightness-95",
    tonal: "bg-secondary-container text-on-secondary-container hover:brightness-105 active:brightness-95",
    outlined: "border border-outline text-primary hover:bg-primary/8 active:bg-primary/12",
    text: "text-primary hover:bg-primary/8 active:bg-primary/12",
    danger: "bg-error text-on-error hover:brightness-110 active:brightness-95",
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
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-control) px-4 text-label",
                "transition-[filter,background-color] duration-150",
                "disabled:cursor-not-allowed disabled:opacity-40",
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
