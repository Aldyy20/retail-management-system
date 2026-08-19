import { useId, useState } from "react";
import { formatMoney } from "@/services/global.methods";

export interface TrendPoint {
    label: string;
    fullLabel: string;
    primaryValue: number;
    secondaryValue: number;
}

interface TrendLineChartProps {
    /** Pertanyaan yang dijawab grafik ini, dipakai sebagai judul dan nama aksesibilitas. */
    question: string;
    points: TrendPoint[];
    primaryLabel: string;
    secondaryLabel: string;
}

const WIDTH = 720;
const HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 28, left: 16 };

/**
 * Tren dua deret bersatuan sama pada satu sumbu.
 *
 * Keduanya rupiah, jadi satu sumbu sudah benar; grafik dua sumbu tidak pernah dipakai
 * karena penjajaran skalanya sewenang-wenang dan mengarang korelasi. Identitas deret
 * tidak pernah hanya lewat warna: ada legenda dan nilai terbaru tertulis di sebelahnya.
 */
export function TrendLineChart({ question, points, primaryLabel, secondaryLabel }: TrendLineChartProps) {
    const titleId = useId();
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    if (points.length < 2) {
        return (
            <p className="px-5 py-10 text-center text-body text-on-surface-variant">
                Grafik tren muncul setelah ada penjualan pada minimal dua hari berbeda.
            </p>
        );
    }

    const maxValue = Math.max(1, ...points.map((point) => Math.max(point.primaryValue, point.secondaryValue)));
    const plotWidth = WIDTH - PADDING.left - PADDING.right;
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

    const xOf = (index: number) => PADDING.left + (plotWidth * index) / (points.length - 1);
    const yOf = (value: number) => PADDING.top + plotHeight - (plotHeight * value) / maxValue;

    const buildPath = (selector: (point: TrendPoint) => number) =>
        points.map((point, index) => `${index === 0 ? "M" : "L"} ${xOf(index)} ${yOf(selector(point))}`).join(" ");

    const lastPoint = points[points.length - 1];
    const active = hoverIndex === null ? null : points[hoverIndex];

    return (
        <figure className="m-0">
            <figcaption className="px-5 pt-4 text-title text-on-surface" id={titleId}>
                {question}
            </figcaption>

            {/* Legenda selalu ada untuk dua deret, jadi identitas tidak bergantung warna saja. */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 pt-1 pb-2">
                <span className="flex items-center gap-2 text-label-small text-on-surface-variant">
                    <span aria-hidden="true" className="inline-block h-0.5 w-4 bg-chart-1" />
                    {primaryLabel} {formatMoney(lastPoint.primaryValue)}
                </span>
                <span className="flex items-center gap-2 text-label-small text-on-surface-variant">
                    <span aria-hidden="true" className="inline-block h-0.5 w-4 bg-chart-2" />
                    {secondaryLabel} {formatMoney(lastPoint.secondaryValue)}
                </span>
            </div>

            <div className="overflow-x-auto px-5 pb-4">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="h-60 w-full min-w-[36rem]"
                    role="img"
                    aria-labelledby={titleId}
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    {/* Garis bantu dibuat samar supaya tidak bersaing dengan datanya. */}
                    {[0, 0.5, 1].map((ratio) => (
                        <line
                            key={ratio}
                            x1={PADDING.left}
                            x2={WIDTH - PADDING.right}
                            y1={PADDING.top + plotHeight * ratio}
                            y2={PADDING.top + plotHeight * ratio}
                            stroke="var(--md-outline-variant)"
                            strokeWidth={1}
                        />
                    ))}

                    <path d={buildPath((point) => point.primaryValue)} fill="none" stroke="var(--md-chart-1)" strokeWidth={2} />
                    <path d={buildPath((point) => point.secondaryValue)} fill="none" stroke="var(--md-chart-2)" strokeWidth={2} />

                    {hoverIndex !== null ? (
                        <line
                            x1={xOf(hoverIndex)}
                            x2={xOf(hoverIndex)}
                            y1={PADDING.top}
                            y2={PADDING.top + plotHeight}
                            stroke="var(--md-outline)"
                            strokeWidth={1}
                        />
                    ) : null}

                    {points.map((point, index) => (
                        <g key={point.fullLabel}>
                            {hoverIndex === index ? (
                                <>
                                    <circle cx={xOf(index)} cy={yOf(point.primaryValue)} r={5} fill="var(--md-chart-1)" stroke="var(--md-surface)" strokeWidth={2} />
                                    <circle cx={xOf(index)} cy={yOf(point.secondaryValue)} r={5} fill="var(--md-chart-2)" stroke="var(--md-surface)" strokeWidth={2} />
                                </>
                            ) : null}

                            {/* Area sentuh dibuat jauh lebih lebar dari titiknya. */}
                            <rect
                                x={xOf(index) - plotWidth / (points.length * 2)}
                                y={PADDING.top}
                                width={plotWidth / points.length}
                                height={plotHeight}
                                fill="transparent"
                                onMouseEnter={() => setHoverIndex(index)}
                            />
                        </g>
                    ))}

                    {points.map((point, index) =>
                        index % Math.ceil(points.length / 7) === 0 ? (
                            <text
                                key={`label-${point.fullLabel}`}
                                x={xOf(index)}
                                y={HEIGHT - 8}
                                textAnchor="middle"
                                fill="var(--md-on-surface-variant)"
                                fontSize={11}
                            >
                                {point.label}
                            </text>
                        ) : null,
                    )}
                </svg>
            </div>

            {/* Nilai titik yang sedang disorot ditulis sebagai teks, bukan hanya sebagai posisi. */}
            <p role="status" className="min-h-6 px-5 pb-4 text-label-small text-on-surface-variant">
                {active
                    ? `${active.fullLabel}: ${primaryLabel} ${formatMoney(active.primaryValue)}, ${secondaryLabel} ${formatMoney(active.secondaryValue)}`
                    : "Arahkan kursor ke grafik untuk melihat angka per hari."}
            </p>
        </figure>
    );
}
