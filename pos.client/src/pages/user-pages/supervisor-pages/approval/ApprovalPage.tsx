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
                        "min-h-10 rounded-lg border px-3.5 text-xs font-semibold transition-all cursor-pointer",
                        statusFilter === filter.value
                            ? "border-primary bg-primary text-white shadow-xs"
                            : "border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-muted",
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
                title="Pusat Persetujuan"
                description="Tindakan yang menunggu keputusan Anda. Perubahan stok baru berlaku setelah permintaannya disetujui."
                primaryAction={filterButtons}
                searchPlaceholder="Cari judul atau nomor dokumen..."
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
                    <thead className="border-b border-outline-variant bg-surface-muted/70">
                        <tr>
                            <ColumnSorting label="Permintaan" sortKey="Title" {...sortProps} />
                            <th scope="col" className="px-4 py-3.5 text-label-small font-semibold text-on-surface-variant">
                                Jenis
                            </th>
                            <ColumnSorting label="Diajukan" sortKey="DateCreated" {...sortProps} />
                            <th scope="col" className="px-4 py-3.5 text-label-small font-semibold text-on-surface-variant">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3.5 text-right text-label-small font-semibold text-on-surface-variant">
                                Aksi
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-outline-variant">
                        {list.listData.map((row) => (
                            <tr key={row.IdApprovalRequest} className="hover:bg-surface-muted/40 transition-colors">
                                <td className="px-4 py-3.5">
                                    <p className="font-heading font-semibold text-sm text-on-surface">{row.Title}</p>
                                    {row.Description ? (
                                        <p className="text-xs text-on-surface-variant mt-0.5">{row.Description}</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3.5 text-xs font-medium text-on-surface-variant">
                                    <span className="px-2 py-1 rounded bg-surface-muted border border-outline-variant">
                                        {row.StrApprovalType}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <p className="text-xs text-on-surface font-medium">{row.StrDateCreated}</p>
                                    <p className="text-[11px] text-on-surface-variant">
                                        oleh {row.RequestedBy ?? "tidak diketahui"}
                                    </p>
                                </td>
                                <td className="px-4 py-3.5">
                                    <StatusPill tone={getDocumentStatusTone(row.Status)} label={row.StrStatus} />
                                    {row.DecidedBy ? (
                                        <p className="mt-1 text-[11px] text-on-surface-variant">oleh {row.DecidedBy}</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex justify-end gap-1.5">
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
                                                    className="hover:bg-success/15 hover:text-success text-success"
                                                />
                                                <IconButton
                                                    label={`Tolak ${row.Title}`}
                                                    icon={<X size={16} />}
                                                    onClick={() => openDecisionModal(row, false)}
                                                    className="hover:bg-error/15 hover:text-error text-error"
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
                title={decision?.isApprove ? "Setujui Permintaan Dokumen" : "Tolak Permintaan Dokumen"}
                description={
                    decision?.isApprove
                        ? `${decision.row.Title} akan langsung diterapkan ke stok setelah disetujui.`
                        : `${decision?.row.Title ?? ""} akan dikembalikan ke pengaju untuk diperbaiki.`
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
                            {decision?.isApprove ? "Setujui Permintaan" : "Tolak Permintaan"}
                        </Button>
                    </>
                }
            >
                <Textarea
                    label={decision?.isApprove ? "Catatan Persetujuan (Opsional)" : "Alasan Penolakan (Wajib)"}
                    required={!decision?.isApprove}
                    placeholder={decision?.isApprove ? "Fisik barang sudah diperiksa dan cocok" : "Jumlah fisik tidak sesuai dengan surat jalan supplier"}
                    helperText={
                        decision?.isApprove
                            ? "Tersimpan pada riwayat jejak audit dokumen."
                            : "Wajib diisi agar pengaju memahami revisi yang diperlukan."
                    }
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    errorText={decisionError ?? undefined}
                />
            </Dialog>
        </>
    );
}
