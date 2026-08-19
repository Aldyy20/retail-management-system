import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useListPage } from "@/hooks/useListPage";
import { getUploadedImageUrl } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import type { QueryProductModel } from "@/@dataLayer/master-data.models";

export default function ProductPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryProductModel>({
        listUrl: "/admin/product/get-list-product",
        deleteUrl: "/admin/product/delete-product",
        defaultSortBy: "ProductName",
    });

    const deleteProduct = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdProduct));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Produk gagal dihapus.");
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")} className="shadow-xs">
            Tambah Produk
        </Button>
    );

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    return (
        <>
            <ListPageShell
                title="Master Data Produk"
                description="Katalog barang dagangan yang dijual di kasir, lengkap dengan harga modal, harga jual, barcode, dan batas stok minimum."
                searchPlaceholder="Cari nama produk, SKU, barcode, atau kategori..."
                emptyTitle="Belum ada produk"
                emptyDescription="Pastikan kategori dan satuan sudah tersedia, lalu tambahkan produk pertama Anda."
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
                <table className="w-full min-w-[60rem] border-collapse text-left">
                    <thead className="border-b border-outline-variant bg-surface-muted/70">
                        <tr>
                            <ColumnSorting label="Produk" sortKey="ProductName" {...sortProps} />
                            <ColumnSorting label="Kategori & Satuan" sortKey="CategoryName" {...sortProps} />
                            <ColumnSorting label="Harga Modal" sortKey="CostPrice" alignRight {...sortProps} />
                            <ColumnSorting label="Harga Jual" sortKey="SellingPrice" alignRight {...sortProps} />
                            <th scope="col" className="px-4 py-3.5 text-right text-label-small font-semibold text-on-surface-variant">
                                Margin
                            </th>
                            <ColumnSorting label="Min Stok" sortKey="MinimumStock" alignRight {...sortProps} />
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
                            <tr key={row.IdProduct} className="hover:bg-surface-muted/40 transition-colors">
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        {row.PhotoFileName ? (
                                            <img
                                                src={getUploadedImageUrl("product", row.PhotoFileName) ?? ""}
                                                alt=""
                                                className="size-11 shrink-0 rounded-lg border border-outline-variant bg-surface-muted object-cover"
                                            />
                                        ) : (
                                            <div className="size-11 shrink-0 rounded-lg border border-outline-variant/60 bg-surface-muted flex items-center justify-center text-xs font-bold text-on-surface-variant/60">
                                                {row.ProductName.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <p className="font-heading font-semibold text-sm text-on-surface">{row.ProductName}</p>
                                            <p className="text-xs font-mono-receipt text-on-surface-variant mt-0.5">
                                                {row.Barcode ? `${row.Sku} · ${row.Barcode}` : row.Sku}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-on-surface">
                                    <span className="font-semibold text-primary">{row.CategoryName}</span>
                                    <span className="block text-[11px] text-on-surface-variant">Satuan: {row.UnitName}</span>
                                </td>
                                <td className="px-4 py-3.5 text-numeric font-mono-receipt text-xs text-on-surface-variant">
                                    {row.StrCostPrice}
                                </td>
                                <td className="px-4 py-3.5 text-numeric font-heading font-bold text-sm text-on-surface">
                                    {row.StrSellingPrice}
                                </td>
                                <td className="px-4 py-3.5 text-numeric text-xs font-semibold text-secondary">
                                    {row.StrMargin}
                                </td>
                                <td className="px-4 py-3.5 text-numeric font-mono-receipt text-xs text-on-surface-variant">
                                    {row.MinimumStock}
                                </td>
                                <td className="px-4 py-3.5">
                                    <StatusPill tone={row.IsActive ? "success" : "neutral"} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Lihat detail ${row.ProductName}`}
                                            icon={<Eye size={16} />}
                                            onClick={() => navigate(`details/${row.IdProduct}`)}
                                        />
                                        <IconButton
                                            label={`Ubah produk ${row.ProductName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdProduct}`)}
                                        />
                                        <IconButton
                                            label={`Hapus produk ${row.ProductName}`}
                                            icon={<Trash2 size={16} />}
                                            onClick={() => list.openDeleteConfirmation(row)}
                                            className="hover:bg-error/15 hover:text-error text-error"
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
                entityName="Produk"
                itemName={list.selectedRow?.ProductName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteProduct}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
