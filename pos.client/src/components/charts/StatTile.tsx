import type { ReactNode } from "react";

interface StatTileProps {
    label: string;
    /** Nilai yang sudah diformat server atau frontend. Tidak pernah angka contoh. */
    value: string;
    /** Keterangan singkat yang menjelaskan asal angkanya. */
    caption?: string;
    icon?: ReactNode;
    /** Menjadikan angka sebagai tokoh utama halaman. */
    isHero?: boolean;
}

/**
 * Kartu Metrik KPI Zenith Retail Pro.
 * Kartu putih bersih dengan icon container, nilai tabular besar, dan keterangan ringkas.
 */
export function StatTile({ label, value, caption, icon, isHero = false }: StatTileProps) {
    return (
        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-shadow hover:shadow-md">
            <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-on-surface-variant line-clamp-1">{label}</span>
                    {icon ? (
                        <div className="size-8 rounded-lg bg-surface-muted border border-outline-variant/60 flex items-center justify-center text-primary shrink-0">
                            {icon}
                        </div>
                    ) : null}
                </div>

                <p
                    className={[
                        "font-heading font-extrabold text-numeric text-on-surface tracking-tight",
                        isHero ? "text-2xl lg:text-3xl text-primary" : "text-xl lg:text-2xl",
                    ].join(" ")}
                >
                    {value}
                </p>
            </div>

            {caption ? (
                <p className="mt-2 pt-2 border-t border-outline-variant/50 text-[11px] text-on-surface-variant line-clamp-1">
                    {caption}
                </p>
            ) : null}
        </div>
    );
}
