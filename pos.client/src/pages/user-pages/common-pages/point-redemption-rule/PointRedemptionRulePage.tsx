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
import type { QueryPointRedemptionRuleModel } from "@/@dataLayer/member.models";

export default function PointRedemptionRulePage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryPointRedemptionRuleModel>({
        listUrl: "/admin/point-redemption-rule/get-list-point-redemption-rule",
        deleteUrl: "/admin/point-redemption-rule/delete-point-redemption-rule",
        defaultSortBy: "PointRequired",
    });

    const deleteRule = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdPointRedemptionRule));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Aturan gagal dihapus.");
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Tambah aturan
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
                title="Penukaran point"
                description="Aturan yang menentukan berapa point ditukar menjadi potongan berapa. Kasir memilih salah satunya saat melayani member."
                searchPlaceholder="Cari nama aturan"
                emptyTitle="Belum ada aturan penukaran"
                emptyDescription="Tanpa aturan, member hanya mengumpulkan point tanpa bisa menukarkannya. Buat minimal satu aturan, misalnya 100 point menjadi potongan 5 persen."
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
                            <ColumnSorting label="Nama aturan" sortKey="RuleName" {...sortProps} />
                            <ColumnSorting label="Point" sortKey="PointRequired" alignRight {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Potongan
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Maksimum
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Minimum belanja
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
                            <tr key={row.IdPointRedemptionRule} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3 text-body text-on-surface">{row.RuleName}</td>
                                <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                    {row.PointRequired}
                                </td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface">{row.StrDiscountValue}</td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                    {row.StrMaximumDiscount}
                                </td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                    {row.StrMinimumPurchase}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={row.IsActive ? "success" : "neutral"} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Ubah aturan ${row.RuleName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdPointRedemptionRule}`)}
                                        />
                                        <IconButton
                                            label={`Hapus aturan ${row.RuleName}`}
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
                entityName="Aturan penukaran point"
                itemName={list.selectedRow?.RuleName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteRule}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
