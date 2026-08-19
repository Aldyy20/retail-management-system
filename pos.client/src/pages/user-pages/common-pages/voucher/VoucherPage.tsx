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
import type { QueryVoucherModel } from "@/@dataLayer/promo.models";

/** Warna penanda mengikuti keadaan nyata voucher, bukan hanya kolom aktif. */
function getPeriodTone(status: string): "success" | "pending" | "neutral" {
    if (status === "Sedang berlaku") {
        return "success";
    }

    return status === "Belum mulai" ? "pending" : "neutral";
}

export default function VoucherPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryVoucherModel>({
        listUrl: "/admin/voucher/get-list-voucher",
        deleteUrl: "/admin/voucher/delete-voucher",
        defaultSortBy: "StartDate",
    });

    const deleteVoucher = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdVoucher));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Voucher gagal dihapus.");
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Tambah voucher
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
                title="Voucher"
                description="Kode potongan yang ditebus kasir saat transaksi. Seluruh syaratnya diperiksa server, bukan di layar."
                searchPlaceholder="Cari kode atau nama voucher"
                emptyTitle="Belum ada voucher"
                emptyDescription="Buat voucher dengan kode, besaran potongan, periode berlaku, dan kuota pemakaiannya."
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
                    <thead className="border-b border-outline-variant bg-surface-low">
                        <tr>
                            <ColumnSorting label="Kode" sortKey="VoucherCode" {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Potongan
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Minimum belanja
                            </th>
                            <ColumnSorting label="Periode" sortKey="StartDate" {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Sasaran
                            </th>
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Pemakaian
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
                            <tr key={row.IdVoucher} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.VoucherCode}</p>
                                    <p className="text-label-small text-on-surface-variant">{row.VoucherName}</p>
                                </td>
                                <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                    {row.StrDiscountValue}
                                    <span className="block text-label-small font-normal text-on-surface-variant">
                                        maks {row.StrMaximumDiscount}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                    {row.StrMinimumPurchase}
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrPeriod}</td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrTarget}</td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">{row.StrUsage}</td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={getPeriodTone(row.StrPeriodStatus)} label={row.StrPeriodStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Ubah voucher ${row.VoucherCode}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdVoucher}`)}
                                        />
                                        <IconButton
                                            label={`Hapus voucher ${row.VoucherCode}`}
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
                entityName="Voucher"
                itemName={list.selectedRow?.VoucherCode ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteVoucher}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
