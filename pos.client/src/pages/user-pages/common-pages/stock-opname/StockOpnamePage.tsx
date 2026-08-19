import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, Send, Trash2 } from "lucide-react";
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
import type { QueryStockOpnameModel } from "@/@dataLayer/stock-opname.models";

export default function StockOpnamePage() {
    const navigate = useNavigate();
    const rolePath = useRolePath();
    const { successNotify, errorNotify } = useSnackbar();

    const urls = useMemo(
        () => ({
            list: `/${rolePath}/stock-opname/get-list-stock-opname`,
            remove: `/${rolePath}/stock-opname/delete-stock-opname`,
            submit: `/${rolePath}/stock-opname/submit-stock-opname`,
        }),
        [rolePath],
    );

    const list = useListPage<QueryStockOpnameModel>({
        listUrl: urls.list,
        deleteUrl: urls.remove,
        defaultSortBy: "DateCreated",
    });

    const deleteStockOpname = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdStockOpname));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Dokumen gagal dihapus.");
        }
    };

    const submitStockOpname = async (row: QueryStockOpnameModel) => {
        try {
            const response = await api.post<string>(urls.submit, { Id: row.IdStockOpname });
            successNotify(response.data);
            list.handleRefresh();
        } catch (error) {
            errorNotify(getAxiosErrorMessage(error));
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Mulai stock opname
        </Button>
    );

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    const isEditable = (status: number) => status === DATA_STATUS.Draft || status === DATA_STATUS.Rejected;

    return (
        <>
            <ListPageShell
                title="Stock opname"
                description="Audit fisik gudang. Sistem membandingkan stok tercatat dengan hasil hitung di rak, dan selisihnya menunggu persetujuan supervisor."
                searchPlaceholder="Cari nomor dokumen atau nama gudang"
                emptyTitle="Belum ada stock opname"
                emptyDescription="Mulai audit untuk mencocokkan stok tercatat dengan jumlah barang yang benar-benar ada di rak."
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
                <table className="w-full min-w-[52rem] border-collapse text-left">
                    <thead className="border-b border-outline-variant bg-surface-low">
                        <tr>
                            <ColumnSorting label="Nomor" sortKey="OpnameNumber" {...sortProps} />
                            <ColumnSorting label="Tanggal" sortKey="OpnameDate" {...sortProps} />
                            <ColumnSorting label="Gudang" sortKey="WarehouseName" {...sortProps} />
                            <ColumnSorting label="Barang dihitung" sortKey="TotalItem" alignRight {...sortProps} />
                            <ColumnSorting label="Berselisih" sortKey="TotalDifference" alignRight {...sortProps} />
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
                            <tr key={row.IdStockOpname} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.OpnameNumber}</p>
                                    {row.CreatedBy ? (
                                        <p className="text-label-small text-on-surface-variant">oleh {row.CreatedBy}</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrOpnameDate}</td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.WarehouseName}</td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">{row.TotalItem}</td>
                                <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                    {row.TotalDifference}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={getDocumentStatusTone(row.Status)} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Lihat detail ${row.OpnameNumber}`}
                                            icon={<Eye size={16} />}
                                            onClick={() => navigate(`details/${row.IdStockOpname}`)}
                                        />
                                        {isEditable(row.Status) ? (
                                            <>
                                                <IconButton
                                                    label={`Ajukan ${row.OpnameNumber}`}
                                                    icon={<Send size={16} />}
                                                    onClick={() => submitStockOpname(row)}
                                                />
                                                <IconButton
                                                    label={`Hapus ${row.OpnameNumber}`}
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
                entityName="Dokumen stock opname"
                itemName={list.selectedRow?.OpnameNumber ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteStockOpname}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
