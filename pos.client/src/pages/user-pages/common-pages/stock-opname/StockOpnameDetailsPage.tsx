import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { getAxiosErrorMessage, getDocumentStatusTone } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { StatusPill } from "@/components/common/StatusPill";
import { ApprovalSummary } from "@/components/common/ApprovalSummary";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import type { DetailsStockOpnameModel } from "@/@dataLayer/stock-opname.models";

export default function StockOpnameDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const rolePath = useRolePath();

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [detail, setDetail] = useState<DetailsStockOpnameModel | null>(null);
    const [showOnlyDifference, setShowOnlyDifference] = useState(false);

    const loadInitData = useCallback(() => {
        return api
            .post<DetailsStockOpnameModel>(`/${rolePath}/stock-opname/get-details`, { Id: id })
            .then((response) => {
                setDetail(response.data);
                setErrorMessage(null);
            })
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoading(false));
    }, [id, rolePath]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const handleRefresh = () => {
        setIsLoading(true);
        loadInitData();
    };

    const visibleRows = detail
        ? detail.ListDetail.filter((row) => !showOnlyDifference || row.Difference !== 0)
        : [];

    const infoRows = detail
        ? [
              { label: "Gudang", value: detail.WarehouseName },
              { label: "Tanggal opname", value: detail.StrOpnameDate },
              { label: "Barang dihitung", value: String(detail.TotalItem), isNumeric: true },
              { label: "Barang berselisih", value: String(detail.TotalDifference), isNumeric: true },
              { label: "Dicatat oleh", value: detail.CreatedBy ?? "Tidak diketahui" },
              { label: "Dicatat pada", value: detail.StrDateCreated },
          ]
        : [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={detail?.OpnameNumber ?? "Detail stock opname"}
                description="Perbandingan stok sistem dengan hasil hitung fisik beserta keputusan persetujuannya."
                actions={
                    <Button
                        variant="text"
                        icon={<ArrowLeft size={18} aria-hidden="true" />}
                        onClick={() => navigate(`/${rolePath}/stock-opname`)}
                    >
                        Kembali
                    </Button>
                }
            />

            {isLoading ? <LoadingSpinner label="Memuat detail dokumen" /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !errorMessage && detail ? (
                <div className="grid gap-6 large:grid-cols-[22rem_1fr]">
                    <div className="flex flex-col gap-6">
                        <Surface variant="outlined" className="p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="text-title text-on-surface">Informasi dokumen</h2>
                                <StatusPill tone={getDocumentStatusTone(detail.Status)} label={detail.StrStatus} />
                            </div>

                            <dl className="flex flex-col gap-2.5">
                                {infoRows.map((row) => (
                                    <div key={row.label} className="flex items-baseline justify-between gap-4">
                                        <dt className="text-body text-on-surface-variant">{row.label}</dt>
                                        <dd className={`text-body text-on-surface ${row.isNumeric ? "text-numeric" : ""}`}>
                                            {row.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            {detail.Note ? (
                                <p className="mt-4 border-t border-outline-variant pt-4 text-body text-on-surface-variant">
                                    {detail.Note}
                                </p>
                            ) : null}
                        </Surface>

                        <ApprovalSummary approvalRequest={detail.ApprovalRequest} />
                    </div>

                    <Surface variant="outlined" className="overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
                            <h2 className="text-title text-on-surface">Hasil hitung</h2>

                            <label className="flex items-center gap-2 text-label-small text-on-surface-variant">
                                <input
                                    type="checkbox"
                                    checked={showOnlyDifference}
                                    onChange={(event) => setShowOnlyDifference(event.target.checked)}
                                    className="size-5 accent-[var(--md-primary)]"
                                />
                                Tampilkan yang berselisih saja
                            </label>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[36rem] border-collapse text-left">
                                <thead className="border-b border-outline-variant bg-surface-low">
                                    <tr>
                                        <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">
                                            Produk
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                            Stok sistem
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                            Stok fisik
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                            Selisih
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-outline-variant">
                                    {visibleRows.map((row) => (
                                        <tr key={row.IdStockOpnameDetail}>
                                            <td className="px-5 py-3">
                                                <p className="text-body text-on-surface">{row.ProductName}</p>
                                                <p className="text-label-small text-on-surface-variant">{row.Sku}</p>
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">
                                                {row.SystemStock} {row.UnitName}
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body text-on-surface">
                                                {row.PhysicalStock} {row.UnitName}
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body font-semibold text-on-surface">
                                                {row.StrDifference}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {visibleRows.length === 0 ? (
                            <p className="px-5 py-8 text-center text-body text-on-surface-variant">
                                Tidak ada barang yang berselisih pada dokumen ini.
                            </p>
                        ) : null}
                    </Surface>
                </div>
            ) : null}
        </div>
    );
}
