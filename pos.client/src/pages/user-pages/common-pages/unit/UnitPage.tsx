import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useListPage } from "@/hooks/useListPage";
import { useSnackbar } from "@/components/ui/Snackbar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { formatNumber } from "@/services/global.methods";
import type { QueryUnitModel } from "@/@dataLayer/master-data.models";

export default function UnitPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryUnitModel>({
        listUrl: "/admin/unit/get-list-unit",
        deleteUrl: "/admin/unit/delete-unit",
        defaultSortBy: "UnitName",
    });

    const deleteUnit = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdUnit));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Satuan gagal dihapus.");
        }
    };

    return (
        <>
            <ListPageShell
                title="Satuan"
                description="Satuan penjualan barang. Satuan yang sudah dipakai produk dinonaktifkan, bukan dihapus."
                searchPlaceholder="Cari nama atau keterangan satuan"
                emptyTitle="Belum ada satuan"
                emptyDescription="Satuan dibutuhkan sebelum produk dapat dibuat. Tambahkan satuan pertama, misalnya PCS, BOTOL, atau DUS."
                emptyAction={
                    <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
                        Tambah satuan
                    </Button>
                }
                primaryAction={
                    <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
                        Tambah satuan
                    </Button>
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
                <table className="w-full min-w-[44rem] border-collapse text-left">
                    <thead className="border-b border-outline-variant bg-surface-low">
                        <tr>
                            <ColumnSorting
                                label="Nama satuan"
                                sortKey="UnitName"
                                currentSortBy={list.paging.sortBy}
                                reverseSort={list.paging.reverseSort}
                                onSort={list.handleSort}
                            />
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Keterangan
                            </th>
                            <ColumnSorting
                                label="Produk"
                                sortKey="TotalProduct"
                                currentSortBy={list.paging.sortBy}
                                reverseSort={list.paging.reverseSort}
                                onSort={list.handleSort}
                                alignRight
                            />
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
                            <tr key={row.IdUnit} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3 text-body text-on-surface">{row.UnitName}</td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.Description ?? "-"}</td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface">
                                    {formatNumber(row.TotalProduct)}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={row.IsActive ? "success" : "neutral"} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Ubah satuan ${row.UnitName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdUnit}`)}
                                        />
                                        <IconButton
                                            label={`Hapus satuan ${row.UnitName}`}
                                            icon={<Trash2 size={16} />}
                                            onClick={() => list.openDeleteConfirmation(row)}
                                            className="hover:bg-error/12 hover:text-error"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ListPageShell>

            <DeleteConfirmationModal
                isOpen={list.showDeleteConfirmationModal}
                entityName="Satuan"
                itemName={list.selectedRow?.UnitName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteUnit}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
