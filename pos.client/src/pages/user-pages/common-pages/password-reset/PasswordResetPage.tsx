import { useMemo, useState } from "react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { useListPage } from "@/hooks/useListPage";
import { useSnackbar } from "@/components/ui/Snackbar";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { PASSWORD_RESET_STATUS } from "@/@dataLayer/password-reset.models";
import type { QueryPasswordResetRequestModel } from "@/@dataLayer/password-reset.models";

const statusOptions = [
    { value: "pending", label: "Menunggu ditangani" },
    { value: "completed", label: "Sudah diatur ulang" },
    { value: "rejected", label: "Ditolak" },
    { value: "", label: "Semua status" },
];

function statusTone(status: number) {
    if (status === PASSWORD_RESET_STATUS.Pending) return "pending" as const;
    if (status === PASSWORD_RESET_STATUS.Completed) return "success" as const;
    return "error" as const;
}

/**
 * Antrean permintaan pengaturan ulang kata sandi.
 *
 * Sistem tidak dapat memastikan siapa yang menekan tombol di halaman masuk, jadi
 * pemastian itu dilakukan admin secara langsung. Yang dijamin halaman ini adalah
 * jejaknya: siapa meminta, kapan, dan siapa yang menanganinya.
 */
export default function PasswordResetPage() {
    const { successNotify, errorNotify } = useSnackbar();

    const [status, setStatus] = useState("pending");
    const [selectedRow, setSelectedRow] = useState<QueryPasswordResetRequestModel | null>(null);
    const [dialogMode, setDialogMode] = useState<"complete" | "reject" | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [rejectNote, setRejectNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const extraRequest = useMemo(() => ({ Status: status || null }), [status]);

    const list = useListPage<QueryPasswordResetRequestModel>({
        listUrl: "/admin/password-reset/get-list-password-reset",
        defaultSortBy: "DateCreated",
        extraRequest,
    });

    const openDialog = (row: QueryPasswordResetRequestModel, mode: "complete" | "reject") => {
        setSelectedRow(row);
        setDialogMode(mode);
        setNewPassword("");
        setRejectNote("");
    };

    const closeDialog = () => {
        setDialogMode(null);
        setSelectedRow(null);
    };

    const handleDecision = () => {
        if (!selectedRow || !dialogMode) {
            return;
        }

        const isComplete = dialogMode === "complete";
        const url = isComplete
            ? "/admin/password-reset/complete-password-reset"
            : "/admin/password-reset/reject-password-reset";
        const body = isComplete
            ? { IdPasswordResetRequest: selectedRow.IdPasswordResetRequest, NewPassword: newPassword }
            : { IdPasswordResetRequest: selectedRow.IdPasswordResetRequest, HandledNote: rejectNote };

        setIsSaving(true);

        api.post<string>(url, body)
            .then((response) => {
                successNotify(response.data);
                closeDialog();
                list.handleRefresh();
            })
            .catch((error) => errorNotify(getAxiosErrorMessage(error)))
            .finally(() => setIsSaving(false));
    };

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    const statusFilter = (
        <>
            <label className="sr-only" htmlFor="filter-status-reset">
                Saring status permintaan
            </label>
            <select
                id="filter-status-reset"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="min-h-11 rounded-(--radius-control) border border-outline bg-surface px-3 text-body text-on-surface outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-primary"
            >
                {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </>
    );

    return (
        <>
            <ListPageShell
                title="Reset kata sandi"
                description="Permintaan dari pengguna yang tidak dapat masuk. Pastikan dulu siapa yang meminta sebelum menetapkan kata sandi barunya."
                primaryAction={statusFilter}
                searchPlaceholder="Cari nama pengguna atau nama lengkap"
                emptyTitle={status === "pending" ? "Tidak ada permintaan menunggu" : "Belum ada permintaan"}
                emptyDescription={
                    status === "pending"
                        ? "Semua permintaan sudah ditangani. Baris baru muncul begitu ada yang mengirim permintaan dari halaman masuk."
                        : "Permintaan terisi begitu ada pengguna yang mengirimkannya dari halaman masuk."
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
                <table className="w-full min-w-[56rem] border-collapse text-left">
                    <thead className="border-b border-outline-variant bg-surface-low">
                        <tr>
                            <ColumnSorting label="Waktu" sortKey="DateCreated" {...sortProps} />
                            <ColumnSorting label="Pemohon" sortKey="UserName" {...sortProps} />
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Catatan
                            </th>
                            <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                Tindakan
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-outline-variant">
                        {list.listData.map((row) => (
                            <tr key={row.IdPasswordResetRequest} className="hover:bg-on-surface/4">
                                <td className="px-4 py-3 align-top text-body text-on-surface-variant">
                                    {row.StrDateCreated}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <p className="text-body text-on-surface">{row.FullName ?? row.UserName}</p>
                                    <p className="text-label-small text-on-surface-variant">
                                        {row.UserName}
                                        {row.RoleName ? ` · ${row.RoleName}` : ""}
                                    </p>
                                    {!row.IsUserActive ? (
                                        <p className="text-label-small text-error">Akun sedang dinonaktifkan.</p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <p className="text-body text-on-surface-variant">{row.Note ?? "Tidak ada catatan"}</p>
                                    {row.HandledNote ? (
                                        <p className="text-label-small text-on-surface-variant">
                                            Alasan penolakan: {row.HandledNote}
                                        </p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <StatusPill tone={statusTone(row.Status)} label={row.StrStatus} />
                                    {row.HandledBy ? (
                                        <p className="mt-1 text-label-small text-on-surface-variant">
                                            oleh {row.HandledBy} · {row.StrHandledDate}
                                        </p>
                                    ) : null}
                                </td>
                                <td className="px-4 py-2 align-top">
                                    {row.Status === PASSWORD_RESET_STATUS.Pending ? (
                                        <div className="flex justify-end gap-2">
                                            <Button variant="text" onClick={() => openDialog(row, "reject")}>
                                                Tolak
                                            </Button>
                                            <Button variant="tonal" onClick={() => openDialog(row, "complete")}>
                                                Atur ulang
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-right text-label-small text-on-surface-variant">Sudah ditangani</p>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ListPageShell>

            {/* key membuat isian dialog kembali kosong setiap kali dibuka, tanpa efek pembersih. */}
            <Dialog
                key={`${selectedRow?.IdPasswordResetRequest ?? "none"}-${dialogMode ?? "closed"}`}
                isOpen={dialogMode !== null}
                title={dialogMode === "reject" ? "Tolak permintaan" : "Atur ulang kata sandi"}
                description={
                    dialogMode === "reject"
                        ? `Kata sandi ${selectedRow?.UserName ?? ""} tidak akan berubah. Alasannya tersimpan pada riwayat permintaan.`
                        : `Kata sandi ${selectedRow?.UserName ?? ""} akan diganti dengan yang Anda isi. Sampaikan langsung kepada yang bersangkutan, jangan lewat pesan.`
                }
                onClose={closeDialog}
                actions={
                    <>
                        <Button variant="text" onClick={closeDialog} disabled={isSaving}>
                            Batal
                        </Button>
                        <Button
                            variant={dialogMode === "reject" ? "danger" : "filled"}
                            isLoading={isSaving}
                            disabled={dialogMode === "reject" ? rejectNote.trim().length === 0 : newPassword.length < 8}
                            onClick={handleDecision}
                        >
                            {dialogMode === "reject" ? "Tolak permintaan" : "Simpan kata sandi baru"}
                        </Button>
                    </>
                }
            >
                {dialogMode === "reject" ? (
                    <Textarea
                        label="Alasan penolakan"
                        required
                        rows={3}
                        placeholder="Pemohon tidak dapat dipastikan orangnya."
                        value={rejectNote}
                        onChange={(event) => setRejectNote(event.target.value)}
                    />
                ) : (
                    <TextField
                        label="Kata sandi baru"
                        required
                        type="text"
                        autoComplete="off"
                        placeholder="Minimal 8 karakter"
                        helperText="Sengaja ditampilkan terbaca supaya Anda dapat menyebutkannya dengan benar."
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                    />
                )}
            </Dialog>
        </>
    );
}
