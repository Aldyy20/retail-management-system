import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useListPage } from "@/hooks/useListPage";
import { useSnackbar } from "@/components/ui/Snackbar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import type { QueryDiscountModel } from "@/@dataLayer/promo.models";

function getPeriodTone(status: string): "success" | "pending" | "neutral" {
    if (status === "Sedang berlaku") {
        return "success";
    }

    return status === "Belum mulai" ? "pending" : "neutral";
}

export default function DiscountPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryDiscountModel>({
        listUrl: "/admin/discount/get-list-discount",
        deleteUrl: "/admin/discount/delete-discount",
        defaultSortBy: "StartDate",
    });

    const deleteDiscount = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdDiscount));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Diskon gagal dihapus.");
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Tambah diskon
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
                title="Diskon produk"
                description="Potongan yang melekat pada produk tertentu dan berlaku pada periode tertentu. Dihitung lebih dulu sebelum voucher dan penukaran point."
                searchPlaceholder="Cari nama diskon"
                emptyTitle="Belum ada diskon produk"
                emptyDescription="Buat diskon untuk produk tertentu beserta periode berlakunya. Kasir tidak perlu melakukan apa pun, potongan berlaku otomatis."
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
                            <ColumnSorting label="Nama diskon" sortKey="DiscountName" {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Potongan
                            </th>
                            <ColumnSorting label="Periode" sortKey="StartDate" {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Produk
                            </th>
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Keadaan
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Aksi
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-outline-variant">
                        {list.listData.map((row) => (
                            <tr key={row.IdDiscount} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3 text-body text-on-surface">{row.DiscountName}</td>
                                <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                    {row.StrDiscountValue}
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrPeriod}</td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                    {row.TotalProduct}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={getPeriodTone(row.StrPeriodStatus)} label={row.StrPeriodStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Ubah diskon ${row.DiscountName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdDiscount}`)}
                                        />
                                        <IconButton
                                            label={`Hapus diskon ${row.DiscountName}`}
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
                entityName="Diskon"
                itemName={list.selectedRow?.DiscountName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteDiscount}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
