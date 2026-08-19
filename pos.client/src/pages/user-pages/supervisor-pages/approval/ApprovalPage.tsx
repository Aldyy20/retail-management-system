import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Eye, X } from "lucide-react";
import { useListPage } from "@/hooks/useListPage";
import { useSnackbar } from "@/components/ui/Snackbar";
import { api } from "@/services/api";
import { getAxiosErrorMessage, getDocumentStatusTone } from "@/services/global.methods";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { DATA_STATUS } from "@/@dataLayer/inventory.models";
import type { QueryApprovalRequestModel } from "@/@dataLayer/inventory.models";

const statusFilters = [
    { value: "pending", label: "Menunggu" },
    { value: "approved", label: "Disetujui" },
    { value: "rejected", label: "Ditolak" },
    { value: "", label: "Semua" },
];

/** Alamat halaman detail dokumen menurut jenis persetujuannya. */
const detailPathByType: Record<string, string> = {
    GOODS_RECEIVING: "/supervisor/goods-receiving/details",
    STOCK_ADJUSTMENT: "/supervisor/stock-opname/details",
};

export default function ApprovalPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const [statusFilter, setStatusFilter] = useState("pending");
    const [decision, setDecision] = useState<{ row: QueryApprovalRequestModel; isApprove: boolean } | null>(null);
    const [decisionNote, setDecisionNote] = useState("");
    const [decisionError, setDecisionError] = useState<string | null>(null);
    const [isDeciding, setIsDeciding] = useState(false);

    const extraRequest = useMemo(() => ({ Status: statusFilter || null }), [statusFilter]);

    const list = useListPage<QueryApprovalRequestModel>({
        listUrl: "/supervisor/approval/get-list-approval",
        defaultSortBy: "DateCreated",
        extraRequest,
    });

    const openDecisionModal = (row: QueryApprovalRequestModel, isApprove: boolean) => {
        setDecision({ row, isApprove });
        setDecisionNote("");
        setDecisionError(null);
    };

    const closeDecisionModal = () => setDecision(null);

    const saveDecision = async () => {
        if (!decision) {
            return;
        }

        if (!decision.isApprove && decisionNote.trim().length === 0) {
            setDecisionError("Alasan penolakan wajib diisi supaya pengaju tahu apa yang harus diperbaiki.");
            return;
        }

        setIsDeciding(true);
        setDecisionError(null);

        try {
            const response = await api.post<string>(
                decision.isApprove ? "/supervisor/approval/approve" : "/supervisor/approval/reject",
                { IdApprovalRequest: decision.row.IdApprovalRequest, DecisionNote: decisionNote || null },
            );
            successNotify(response.data);
            closeDecisionModal();
            list.handleRefresh();
        } catch (error) {
            setDecisionError(getAxiosErrorMessage(error));
        } finally {
            setIsDeciding(false);
        }
    };

    const openReferenceDetails = (row: QueryApprovalRequestModel) => {
        const basePath = detailPathByType[row.ApprovalTypeCode];

        if (!basePath) {
            errorNotify("Halaman detail untuk jenis permintaan ini belum tersedia.");
            return;
        }

        navigate(`${basePath}/${row.ReferenceId}`);
    };

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    const filterButtons = (
        <div role="group" aria-label="Saring status permintaan" className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
                <button
                    key={filter.value}
                    type="button"
                    aria-pressed={statusFilter === filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={[
                        "min-h-11 rounded-(--radius-control) border px-4 text-label transition-colors",
                        statusFilter === filter.value
                            ? "border-primary bg-secondary-container text-on-secondary-container"
                            : "border-outline text-on-surface-variant hover:bg-on-surface/8",
                    ].join(" ")}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );

    return (
        <>
            <ListPageShell
                title="Persetujuan"
                description="Tindakan yang menunggu keputusan Anda. Perubahan stok baru berlaku setelah permintaannya disetujui."
                primaryAction={filterButtons}
                searchPlaceholder="Cari judul atau nomor dokumen"
                emptyTitle={statusFilter === "pending" ? "Tidak ada yang menunggu" : "Belum ada permintaan"}
                emptyDescription={
                    statusFilter === "pending"
                        ? "Semua permintaan sudah diputuskan. Permintaan baru muncul begitu karyawan mengajukan barang masuk atau penyesuaian stok."
                        : "Permintaan tercatat di sini setiap kali ada tindakan yang membutuhkan persetujuan."
                }
                isLoading={list.isLoading}
                errorMessage={list.errorMessage}
                rowCount={list.listData.length}
                paging={list.paging}
                onSearch={list.handleSearch}
                onRefresh={list.handleRefresh}
                onPageChange={list.handlePageChange}
                onPageSizeChange={list.setPageSizeOption}
            >
                <table className="w-full min-w-[52rem] border-collapse text-left">
                    <thead className="border-b border-outline-variant bg-surface-low">
                        <tr>
                            <ColumnSorting label="Permintaan" sortKey="Title" {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Jenis
                            </th>
                            <ColumnSorting label="Diajukan" sortKey="DateCreated" {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Aksi
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-outline-variant">
                        {list.listData.map((row) => (
                            <tr key={row.IdApprovalRequest} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.Title}</p>
                                    {row.Description ? (
                                        <p className="text-label-small text-on-surface-variant">{row.Description}</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrApprovalType}</td>
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface-variant">{row.StrDateCreated}</p>
                                    <p className="text-label-small text-on-surface-variant">
                                        oleh {row.RequestedBy ?? "tidak diketahui"}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={getDocumentStatusTone(row.Status)} label={row.StrStatus} />
                                    {row.DecidedBy ? (
                                        <p className="mt-1 text-label-small text-on-surface-variant">oleh {row.DecidedBy}</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Lihat dokumen ${row.ReferenceNumber ?? row.Title}`}
                                            icon={<Eye size={16} />}
                                            onClick={() => openReferenceDetails(row)}
                                        />
                                        {row.Status === DATA_STATUS.Pending ? (
                                            <>
                                                <IconButton
                                                    label={`Setujui ${row.Title}`}
                                                    icon={<Check size={16} />}
                                                    onClick={() => openDecisionModal(row, true)}
                                                    className="hover:bg-success/12 hover:text-success"
                                                />
                                                <IconButton
                                                    label={`Tolak ${row.Title}`}
                                                    icon={<X size={16} />}
                                                    onClick={() => openDecisionModal(row, false)}
                                                    className="hover:bg-error/12 hover:text-error"
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ListPageShell>

            <Dialog
                isOpen={Boolean(decision)}
                title={decision?.isApprove ? "Setujui permintaan ini?" : "Tolak permintaan ini?"}
                description={
                    decision?.isApprove
                        ? `${decision.row.Title} akan diterapkan ke stok segera setelah Anda menyetujuinya.`
                        : `${decision?.row.Title ?? ""} dikembalikan ke pengaju untuk diperbaiki. Stok tidak berubah.`
                }
                onClose={closeDecisionModal}
                actions={
                    <>
                        <Button variant="text" onClick={closeDecisionModal} disabled={isDeciding}>
                            Batal
                        </Button>
                        <Button
                            variant={decision?.isApprove ? "filled" : "danger"}
                            onClick={saveDecision}
                            isLoading={isDeciding}
                        >
                            {decision?.isApprove ? "Setujui" : "Tolak"}
                        </Button>
                    </>
                }
            >
                <Textarea
                    label={decision?.isApprove ? "Catatan persetujuan" : "Alasan penolakan"}
                    required={!decision?.isApprove}
                    placeholder={decision?.isApprove ? "Fisik barang sudah dicek" : "Jumlah tidak cocok dengan surat jalan"}
                    helperText={
                        decision?.isApprove
                            ? "Opsional. Tersimpan pada riwayat dokumen."
                            : "Wajib diisi. Pengaju membacanya untuk memperbaiki dokumen."
                    }
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    errorText={decisionError ?? undefined}
                />
            </Dialog>
        </>
    );
}
