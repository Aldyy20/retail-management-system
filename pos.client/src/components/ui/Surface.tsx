import type { HTMLAttributes, ReactNode } from "react";

type SurfaceVariant = "filled" | "outlined" | "elevated";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
    variant?: SurfaceVariant;
    children: ReactNode;
}

/**
 * Kontainer semantik. Hierarki rutin ditanggung peran surface, bukan bayangan.
 * Varian `elevated` hanya untuk elemen yang benar-benar melayang di atas konten lain.
 */
const variantClass: Record<SurfaceVariant, string> = {
    filled: "bg-surface-container",
    outlined: "bg-surface border border-outline-variant",
    elevated: "bg-surface-low shadow-lg shadow-black/10",
};

export function Surface({ variant = "outlined", className = "", children, ...rest }: SurfaceProps) {
    return (
        <div {...rest} className={`rounded-(--radius-card) ${variantClass[variant]} ${className}`}>
            {children}
        </div>
    );
}
