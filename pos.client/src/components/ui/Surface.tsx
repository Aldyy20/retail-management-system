import type { HTMLAttributes, ReactNode } from "react";

type SurfaceVariant = "filled" | "outlined" | "elevated";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
    variant?: SurfaceVariant;
    children: ReactNode;
}

/**
 * Kontainer semantik Zenith Retail Pro.
 * Menggunakan kartu putih solid dengan 1px subtle border dan elevasi lembut.
 */
const variantClass: Record<SurfaceVariant, string> = {
    filled: "bg-surface-container",
    outlined: "bg-surface-lowest border border-outline-variant shadow-sm",
    elevated: "bg-surface-lowest border border-outline-variant shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),0_2px_4px_-2px_rgb(0,0,0,0.1)]",
};

export function Surface({ variant = "outlined", className = "", children, ...rest }: SurfaceProps) {
    return (
        <div {...rest} className={`rounded-(--radius-card) ${variantClass[variant]} ${className}`}>
            {children}
        </div>
    );
}
