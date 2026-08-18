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
import type { QueryWarehouseModel } from "@/@dataLayer/master-data.models";

export default function WarehousePage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryWarehouseModel>({
        listUrl: "/admin/warehouse/get-list-warehouse",
        deleteUrl: "/admin/warehouse/delete-warehouse",
        defaultSortBy: "WarehouseName",
    });

    const deleteWarehouse = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdWarehouse));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Gudang gagal dihapus.");
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Tambah gudang
        </Button>
    );

    return (
        <>
            <ListPageShell
                title="Gudang"
                description="Tempat penyimpanan barang. Satu gudang ditandai sebagai gudang utama dan menjadi tujuan bawaan barang masuk."
                searchPlaceholder="Cari kode, nama, atau alamat gudang"
                emptyTitle="Belum ada gudang"
                emptyDescription="Stok dicatat per gudang. Gudang pertama yang Anda buat otomatis menjadi gudang utama."
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
                <table className="w-full min-w-[48rem] border-collapse text-left">
                    <thead className="border-b border-outline-variant bg-surface-low">
                        <tr>
                            <ColumnSorting
                                label="Kode"
                                sortKey="WarehouseCode"
                                currentSortBy={list.paging.sortBy}
                                reverseSort={list.paging.reverseSort}
                                onSort={list.handleSort}
                            />
                            <ColumnSorting
                                label="Nama gudang"
                                sortKey="WarehouseName"
                                currentSortBy={list.paging.sortBy}
                                reverseSort={list.paging.reverseSort}
                                onSort={list.handleSort}
                            />
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Alamat
                            </th>
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
                            <tr key={row.IdWarehouse} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3 text-body text-on-surface">{row.WarehouseCode}</td>
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.WarehouseName}</p>
                                    {row.IsDefault ? (
                                        <p className="text-label-small text-primary">Gudang utama</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.Address ?? "-"}</td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={row.IsActive ? "success" : "neutral"} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Ubah gudang ${row.WarehouseName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdWarehouse}`)}
                                        />
                                        <IconButton
                                            label={`Hapus gudang ${row.WarehouseName}`}
                                            icon={<Trash2 size={16} />}
                                            onClick={() => list.openDeleteConfirmation(row)}
                                            disabled={row.IsDefault}
                                            title={row.IsDefault ? "Gudang utama tidak dapat dihapus" : undefined}
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
                entityName="Gudang"
                itemName={list.selectedRow?.WarehouseName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteWarehouse}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
