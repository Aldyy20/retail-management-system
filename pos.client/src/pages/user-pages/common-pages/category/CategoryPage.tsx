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
import type { QueryCategoryModel } from "@/@dataLayer/master-data.models";

export default function CategoryPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryCategoryModel>({
        listUrl: "/admin/category/get-list-category",
        deleteUrl: "/admin/category/delete-category",
        defaultSortBy: "CategoryName",
    });

    const deleteCategory = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdCategory));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Kategori gagal dihapus.");
        }
    };

    return (
        <>
            <ListPageShell
                title="Kategori"
                description="Pengelompokan barang yang dipakai saat mencari produk di kasir dan menyusun laporan penjualan."
                searchPlaceholder="Cari nama atau keterangan kategori"
                emptyTitle="Belum ada kategori"
                emptyDescription="Kategori dibutuhkan sebelum produk dapat dibuat. Tambahkan kategori pertama, misalnya Minuman atau Sembako."
                emptyAction={
                    <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
                        Tambah kategori
                    </Button>
                }
                primaryAction={
                    <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
                        Tambah kategori
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
                                label="Nama kategori"
                                sortKey="CategoryName"
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
                            <tr key={row.IdCategory} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3 text-body text-on-surface">{row.CategoryName}</td>
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
                                            label={`Ubah kategori ${row.CategoryName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdCategory}`)}
                                        />
                                        <IconButton
                                            label={`Hapus kategori ${row.CategoryName}`}
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
                entityName="Kategori"
                itemName={list.selectedRow?.CategoryName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteCategory}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
