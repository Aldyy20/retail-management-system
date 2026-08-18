import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { useListPage } from "@/hooks/useListPage";
import { useSnackbar } from "@/components/ui/Snackbar";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/TextField";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { useAuth } from "@/components/router/AuthContext";
import type { QueryUserModel } from "@/@dataLayer/employee.models";

export default function EmployeePage() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { successNotify, errorNotify } = useSnackbar();

    const list = useListPage<QueryUserModel>({
        listUrl: "/admin/employee/get-list-employee",
        deleteUrl: "/admin/employee/delete-employee",
        defaultSortBy: "FullName",
    });

    const [resetTarget, setResetTarget] = useState<QueryUserModel | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);

    const deleteEmployee = async () => {
        if (!list.selectedRow) {
            return;
        }

        try {
            successNotify(await list.deleteSelectedRow(list.selectedRow.Id));
        } catch (error) {
            errorNotify(error instanceof Error ? error.message : "Pengguna gagal dihapus.");
        }
    };

    const openResetPasswordModal = (row: QueryUserModel) => {
        setResetTarget(row);
        setNewPassword("");
        setResetErrorMessage(null);
    };

    const closeResetPasswordModal = () => setResetTarget(null);

    const resetPassword = async () => {
        if (!resetTarget) {
            return;
        }

        setIsResetting(true);
        setResetErrorMessage(null);

        try {
            const response = await api.post<string>("/admin/employee/reset-password", {
                Id: resetTarget.Id,
                NewPassword: newPassword,
            });
            successNotify(response.data);
            closeResetPasswordModal();
        } catch (error) {
            setResetErrorMessage(getAxiosErrorMessage(error));
        } finally {
            setIsResetting(false);
        }
    };

    const addButton = (
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => navigate("create")}>
            Tambah pengguna
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
                title="Pengguna"
                description="Akun karyawan, supervisor, owner, dan admin. Role menentukan menu dan wewenang yang dapat diakses."
                searchPlaceholder="Cari nama, nama pengguna, atau role"
                emptyTitle="Belum ada pengguna lain"
                emptyDescription="Tambahkan akun kasir dan supervisor supaya operasional toko tidak bergantung pada satu akun admin."
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
                            <ColumnSorting label="Nama lengkap" sortKey="FullName" {...sortProps} />
                            <ColumnSorting label="Nama pengguna" sortKey="UserName" {...sortProps} />
                            <ColumnSorting label="Role" sortKey="RoleName" {...sortProps} />
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
                            <tr key={row.Id} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3">
                                    <p className="text-body text-on-surface">{row.FullName}</p>
                                    {row.Id === currentUser?.Id ? (
                                        <p className="text-label-small text-primary">Akun Anda</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.UserName}</td>
                                <td className="px-4 py-3 text-body text-on-surface-variant">{row.RoleName}</td>
                                <td className="px-4 py-3">
                                    <StatusPill tone={row.IsActive ? "success" : "neutral"} label={row.StrStatus} />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                        <IconButton
                                            label={`Atur ulang kata sandi ${row.FullName}`}
                                            icon={<KeyRound size={16} />}
                                            onClick={() => openResetPasswordModal(row)}
                                        />
                                        <IconButton
                                            label={`Ubah pengguna ${row.FullName}`}
                                            icon={<Pencil size={16} />}
                                            onClick={() => navigate(`edit/${row.Id}`)}
                                        />
                                        <IconButton
                                            label={`Hapus pengguna ${row.FullName}`}
                                            icon={<Trash2 size={16} />}
                                            onClick={() => list.openDeleteConfirmation(row)}
                                            disabled={row.Id === currentUser?.Id}
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
                entityName="Pengguna"
                itemName={list.selectedRow?.FullName ?? ""}
                isDeleting={list.isDeleting}
                onConfirm={deleteEmployee}
                onClose={list.closeDeleteConfirmation}
            />

            <Dialog
                isOpen={Boolean(resetTarget)}
                title="Atur ulang kata sandi"
                description={`Kata sandi baru untuk ${resetTarget?.FullName ?? ""} berlaku segera. Sampaikan langsung kepada yang bersangkutan.`}
                onClose={closeResetPasswordModal}
                actions={
                    <>
                        <Button variant="text" onClick={closeResetPasswordModal} disabled={isResetting}>
                            Batal
                        </Button>
                        <Button onClick={resetPassword} isLoading={isResetting}>
                            Simpan kata sandi
                        </Button>
                    </>
                }
            >
                <TextField
                    label="Kata sandi baru"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    helperText="Minimal 8 karakter."
                    errorText={resetErrorMessage ?? undefined}
                />
            </Dialog>
        </>
    );
}
