import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useListPage } from "@/hooks/useListPage";
import { useSnackbar } from "@/components/ui/Snackbar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import type { QueryMemberModel } from "@/@dataLayer/member.models";

export default function MemberPage() {
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryMemberModel>({
        listUrl: "/admin/member/get-list-member",
        deleteUrl: "/admin/member/delete-member",
        defaultSortBy: "MemberName",
    });

    const deleteMember = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.IdMember));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Member gagal dihapus.");
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Tambah member
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
                title="Member"
                description="Pelanggan terdaftar beserta saldo pointnya. Nomor HP menjadi identitas yang dipakai kasir untuk mencarinya."
                searchPlaceholder="Cari nama atau nomor HP member"
                emptyTitle="Belum ada member"
                emptyDescription="Member didaftarkan admin di sini, atau langsung oleh kasir saat pelanggan berbelanja."
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
                            <ColumnSorting label="Nama member" sortKey="MemberName" {...sortProps} />
                            <ColumnSorting label="Nomor HP" sortKey="PhoneNumber" {...sortProps} />
                            <ColumnSorting label="Saldo point" sortKey="PointBalance" alignRight {...sortProps} />
                            <ColumnSorting label="Total belanja" sortKey="TotalSpending" alignRight {...sortProps} />
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
                            <tr key={row.IdMember} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.MemberName}</p>
                                    <p className="text-label-small text-on-surface-variant">
                                        {row.TotalTransaction} transaksi
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.PhoneNumber}</td>
                                <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                    {row.PointBalance}
                                </td>
                                <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                    {row.StrTotalSpending}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={row.IsActive ? "success" : "neutral"} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Lihat detail ${row.MemberName}`}
                                            icon={<Eye size={16} />}
                                            onClick={() => navigate(`details/${row.IdMember}`)}
                                        />
                                        <IconButton
                                            label={`Ubah member ${row.MemberName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.IdMember}`)}
                                        />
                                        <IconButton
                                            label={`Hapus member ${row.MemberName}`}
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
                entityName="Member"
                itemName={list.selectedRow?.MemberName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteMember}
                onClose={list.closeDeleteConfirmation}
            />
        </>
    );
}
