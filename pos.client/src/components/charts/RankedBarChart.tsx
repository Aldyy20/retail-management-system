import { useId } from "react";
import { formatMoney } from "@/services/global.methods";

export interface RankedBar {
    label: string;
    value: number;
    /** Keterangan tambahan di bawah label, misalnya jumlah barang terjual. */
    caption?: string;
}

interface RankedBarChartProps {
    /** Pertanyaan yang dijawab grafik ini, dipakai sebagai judul. */
    question: string;
    bars: RankedBar[];
    emptyMessage: string;
}

/**
 * Perbandingan besaran antar kategori yang tidak punya urutan alami.
 *
 * Seluruh batang memakai satu warna yang sama: panjang batang sudah menyampaikan
 * besarannya, jadi mewarnai tiap batang berbeda hanya menghabiskan kanal identitas
 * untuk informasi yang sudah terlihat. Batang mendatar dipilih supaya nama kategori
 * yang panjang tetap terbaca utuh.
 */
export function RankedBarChart({ question, bars, emptyMessage }: RankedBarChartProps) {
    const titleId = useId();

    if (bars.length === 0) {
        return (
            <div className="px-5 py-4">
                <h3 className="text-title text-on-surface">{question}</h3>
                <p className="mt-6 mb-6 text-center text-body text-on-surface-variant">{emptyMessage}</p>
            </div>
        );
    }

    const maxValue = Math.max(1, ...bars.map((bar) => bar.value));

    return (
        <figure className="m-0 px-5 py-4">
            <figcaption className="mb-3 text-title text-on-surface" id={titleId}>
                {question}
            </figcaption>

            <ul aria-labelledby={titleId} className="flex flex-col gap-3">
                {bars.map((bar) => (
                    <li key={bar.label}>
                        <div className="flex items-baseline justify-between gap-4">
                            <span className="min-w-0 truncate text-body text-on-surface">{bar.label}</span>
                            <span className="text-numeric text-body text-on-surface">{formatMoney(bar.value)}</span>
                        </div>

                        {/* Batang berujung membulat 4px dan menempel pada garis dasar kiri. */}
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-[4px] bg-surface-highest">
                            <div
                                className="h-full rounded-[4px] bg-chart-1"
                                style={{ width: `${Math.max(2, (bar.value / maxValue) * 100)}%` }}
                            />
                        </div>

                        {bar.caption ? (
                            <p className="mt-0.5 text-label-small text-on-surface-variant">{bar.caption}</p>
                        ) : null}
                    </li>
                ))}
            </ul>
        </figure>
    );
}
