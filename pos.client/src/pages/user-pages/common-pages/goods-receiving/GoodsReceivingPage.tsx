import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useListPage } from "@/hooks/useListPage";
import { useRolePath } from "@/hooks/useRolePath";
import { useSnackbar } from "@/components/ui/Snackbar";
import { api } from "@/services/api";
import { getAxiosErrorMessage, getDocumentStatusTone } from "@/services/global.methods";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { DATA_STATUS } from "@/@dataLayer/inventory.models";
import type { QueryGoodsReceivingModel } from "@/@dataLayer/goods-receiving.models";

export default function GoodsReceivingPage() {
    const navigate = useNavigate();
    const rolePath = useRolePath();
    const { successNotify, errorNotify } = useSnackbar();

    const urls = useMemo(
        () => ({
            list: `/${rolePath}/goods-receiving/get-list-goods-receiving`,
            remove: `/${rolePath}/goods-receiving/delete-goods-receiving`,
            submit: `/${rolePath}/goods-receiving/submit-goods-receiving`,
        }),
        [rolePath],
    );

    const list = useListPage<QueryGoodsReceivingModel>({
        listUrl: urls.list,
        deleteUrl: urls.remove,
        defaultSortBy: "DateCreated",
    });

    const deleteGoodsReceiving = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdGoodsReceiving));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Dokumen gagal dihapus.");
        }
    };

    const submitGoodsReceiving = async (row: QueryGoodsReceivingModel) => {
        try {
            const response = await api.post<string>(urls.submit, { Id: row.IdGoodsReceiving });
            successNotify(response.data);
            list.handleRefresh();
        } catch (error) {
            errorNotify(getAxiosErrorMessage(error));
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Catat barang masuk
        </Button>
    );

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    /** Dokumen draft dan ditolak masih boleh diperbaiki; sisanya sudah terkunci. */
    const isEditable = (status: number) => status === DATA_STATUS.Draft || status === DATA_STATUS.Rejected;

    return (
        <>
            <ListPageShell
                title="Barang masuk"
                description="Pencatatan barang yang diterima dari supplier. Stok bertambah setelah dokumen disetujui supervisor."
                searchPlaceholder="Cari nomor dokumen, supplier, atau nomor faktur"
                emptyTitle="Belum ada dokumen barang masuk"
                emptyDescription="Catat barang yang datang dari supplier di sini. Dokumen dapat disimpan sebagai draft dulu sebelum diajukan."
                emptyAction={addButton}
                primaryAction={addButton}
                isLoading={list.isLoading}
                errorMessage={list.errorMessage}
                rowCount={list.listData.length}
                paging={list.paging}
                onSearch={list.handleSearch}
                onRefresh={list.handleRefresh}
                onPageChange={list.handlePageChange}
                onPageSizeChange={list.setPageSizeOption}
            >
                <table className="w-full min-w-[56rem] border-collapse text-left">
                    <thead className="border-b border-outline-variant bg-surface-low">
                        <tr>
                            <ColumnSorting label="Nomor" sortKey="ReceivingNumber" {...sortProps} />
                            <ColumnSorting label="Tanggal" sortKey="ReceivingDate" {...sortProps} />
                            <ColumnSorting label="Supplier" sortKey="SupplierName" {...sortProps} />
                            <ColumnSorting label="Barang" sortKey="TotalItem" alignRight {...sortProps} />
                            <ColumnSorting label="Total" sortKey="TotalCost" alignRight {...sortProps} />
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
                            <tr key={row.IdGoodsReceiving} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.ReceivingNumber}</p>
                                    <p className="text-label-small text-on-surface-variant">{row.WarehouseName}</p>
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrReceivingDate}</td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.SupplierName}</td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">{row.TotalItem}</td>
                                <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                    {row.StrTotalCost}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={getDocumentStatusTone(row.Status)} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Lihat detail ${row.ReceivingNumber}`}
                                            icon={<Eye size={16} />}
                                            onClick={() => navigate(`details/${row.IdGoodsReceiving}`)}
                                        />
                                        {isEditable(row.Status) ? (
                                            <>
                                                <IconButton
                                                    label={`Ajukan ${row.ReceivingNumber}`}
                                                    icon={<Send size={16} />}
                                                    onClick={() => submitGoodsReceiving(row)}
                                                />
                                                <IconButton
                                                    label={`Ubah ${row.ReceivingNumber}`}
                                                    icon={<Pencil size={16} />}
                                                    onClick={() => navigate(`edit/${row.IdGoodsReceiving}`)}
                                                />
                                                <IconButton
                                                    label={`Hapus ${row.ReceivingNumber}`}
                                                    icon={<Trash2 size={16} />}
                                                    onClick={() => list.openDeleteConfirmation(row)}
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

            <DeleteConfirmationModal
                isOpen={list.showDeleteConfirmationModal}
                entityName="Dokumen barang masuk"
                itemName={list.selectedRow?.ReceivingNumber ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteGoodsReceiving}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
