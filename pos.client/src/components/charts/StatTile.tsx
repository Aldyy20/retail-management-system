import type { ReactNode } from "react";

interface StatTileProps {
    label: string;
    /** Nilai yang sudah diformat server atau frontend. Tidak pernah angka contoh. */
    value: string;
    /** Keterangan singkat yang menjelaskan asal angkanya. */
    caption?: string;
    icon?: ReactNode;
    /** Menjadikan angka sebagai tokoh utama halaman. Dipakai maksimal sekali per layar. */
    isHero?: boolean;
}

/**
 * Satu angka beserta artinya.
 *
 * Dipakai menggantikan grafik satu batang: kalau datanya cuma satu nilai, angkanya
 * sendiri sudah menjadi grafiknya. Tidak ada indikator tren di sini, karena tren
 * hanya boleh muncul bila periode pembandingnya benar-benar ada dan disebutkan.
 */
export function StatTile({ label, value, caption, icon, isHero = false }: StatTileProps) {
    return (
        <div className="rounded-(--radius-card) border border-outline-variant bg-surface p-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
                {icon}
                <p className="text-label-small">{label}</p>
            </div>

            <p className={`text-numeric mt-1 text-on-surface ${isHero ? "text-[2rem] leading-tight font-semibold" : "text-headline"}`}>
                {value}
            </p>

            {caption ? <p className="mt-1 text-label-small text-on-surface-variant">{caption}</p> : null}
        </div>
    );
}
