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
import type { DetailsGoodsReceivingModel } from "@/@dataLayer/goods-receiving.models";

export default function GoodsReceivingDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const rolePath = useRolePath();

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [detail, setDetail] = useState<DetailsGoodsReceivingModel | null>(null);

    const loadInitData = useCallback(() => {
        return api
            .post<DetailsGoodsReceivingModel>(`/${rolePath}/goods-receiving/get-details`, { Id: id })
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

    const infoRows = detail
        ? [
              { label: "Gudang tujuan", value: detail.WarehouseName },
              { label: "Supplier", value: detail.SupplierName },
              { label: "Tanggal terima", value: detail.StrReceivingDate },
              { label: "Nomor faktur", value: detail.InvoiceNumber ?? "Tidak diisi" },
              { label: "Jenis barang", value: String(detail.TotalItem), isNumeric: true },
              { label: "Total nilai", value: detail.StrTotalCost, isNumeric: true },
              { label: "Dicatat oleh", value: detail.CreatedBy ?? "Tidak diketahui" },
              { label: "Dicatat pada", value: detail.StrDateCreated },
          ]
        : [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={detail?.ReceivingNumber ?? "Detail barang masuk"}
                description="Rincian dokumen beserta keputusan persetujuannya."
                actions={
                    <Button
                        variant="text"
                        icon={<ArrowLeft size={18} aria-hidden="true" />}
                        onClick={() => navigate(`/${rolePath}/goods-receiving`)}
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
                        <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">
                            Barang yang diterima
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[36rem] border-collapse text-left">
                                <thead className="border-b border-outline-variant bg-surface-low">
                                    <tr>
                                        <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">
                                            Produk
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                            Jumlah
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                            Harga modal
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-outline-variant">
                                    {detail.ListDetail.map((row) => (
                                        <tr key={row.IdGoodsReceivingDetail}>
                                            <td className="px-5 py-3">
                                                <p className="text-body text-on-surface">{row.ProductName}</p>
                                                <p className="text-label-small text-on-surface-variant">{row.Sku}</p>
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body text-on-surface">
                                                {row.Quantity} {row.UnitName}
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">
                                                {row.StrCostPrice}
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body font-semibold text-on-surface">
                                                {row.StrSubtotal}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Surface>
                </div>
            ) : null}
        </div>
    );
}
