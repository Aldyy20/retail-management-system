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
import type { QuerySupplierModel } from "@/@dataLayer/master-data.models";

export default function SupplierPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QuerySupplierModel>({
        listUrl: "/admin/supplier/get-list-supplier",
        deleteUrl: "/admin/supplier/delete-supplier",
        defaultSortBy: "SupplierName",
    });

    const deleteSupplier = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdSupplier));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Supplier gagal dihapus.");
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Tambah supplier
        </Button>
    );

    return (
        <>
            <ListPageShell
                title="Supplier"
                description="Pemasok barang. Dipilih saat mencatat barang masuk agar asal setiap barang dapat ditelusuri."
                searchPlaceholder="Cari nama, kontak, atau nomor telepon"
                emptyTitle="Belum ada supplier"
                emptyDescription="Supplier dipilih saat mencatat barang masuk. Tambahkan minimal satu supplier sebelum stok pertama masuk gudang."
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
                                label="Nama supplier"
                                sortKey="SupplierName"
                                currentSortBy={list.paging.sortBy}
                                reverseSort={list.paging.reverseSort}
                                onSort={list.handleSort}
                            />
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Kontak
                            </th>
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
                            <tr key={row.IdSupplier} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.SupplierName}</p>
                                    {row.ContactName ? (
                                        <p className="text-label-small text-on-surface-variant">{row.ContactName}</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrContact || "-"}</td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.Address ?? "-"}</td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={row.IsActive ? "success" : "neutral"} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Ubah supplier ${row.SupplierName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdSupplier}`)}
                                        />
                                        <IconButton
                                            label={`Hapus supplier ${row.SupplierName}`}
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
                entityName="Supplier"
                itemName={list.selectedRow?.SupplierName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteSupplier}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
