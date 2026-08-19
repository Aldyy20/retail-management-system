import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useListPage } from "@/hooks/useListPage";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import type { AuditLogFilterModel, QueryAuditLogModel } from "@/@dataLayer/audit-log.models";

const emptyFilter: AuditLogFilterModel = { ListModule: [], ListAction: [], ListUser: [] };

/**
 * Jejak aktivitas sistem: siapa melakukan apa, kapan, dan terhadap data apa.
 *
 * Halaman ini hanya membaca. Tidak ada tombol ubah maupun hapus, karena catatan yang
 * dapat disunting berhenti menjadi bukti.
 */
export default function AuditLogPage() {
    const [filterOption, setFilterOption] = useState<AuditLogFilterModel>(emptyFilter);
    const [moduleName, setModuleName] = useState("");
    const [actionName, setActionName] = useState("");
    const [createdById, setCreatedById] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const extraRequest = useMemo(
        () => ({
            ModuleName: moduleName || null,
            ActionName: actionName || null,
            CreatedById: createdById || null,
            DateFrom: dateFrom || null,
            DateTo: dateTo || null,
        }),
        [moduleName, actionName, createdById, dateFrom, dateTo],
    );

    const list = useListPage<QueryAuditLogModel>({
        listUrl: "/admin/audit-log/get-list-audit-log",
        defaultSortBy: "DateCreated",
        extraRequest,
    });

    useEffect(() => {
        api.post<AuditLogFilterModel>("/admin/audit-log/get-index")
            .then((response) => setFilterOption(response.data))
            .catch(() => setFilterOption(emptyFilter));
    }, []);

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    const filters = (
        <>
            <Select
                label="Modul"
                options={filterOption.ListModule}
                placeholder="Semua modul"
                value={moduleName}
                onChange={(event) => setModuleName(event.target.value)}
            />
            <Select
                label="Aksi"
                options={filterOption.ListAction}
                placeholder="Semua aksi"
                value={actionName}
                onChange={(event) => setActionName(event.target.value)}
            />
            <Select
                label="Pengguna"
                options={filterOption.ListUser}
                placeholder="Semua pengguna"
                value={createdById}
                onChange={(event) => setCreatedById(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
                <TextField
                    label="Dari tanggal"
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => setDateFrom(event.target.value)}
                />
                <TextField
                    label="Sampai tanggal"
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                />
            </div>
        </>
    );

    return (
        <ListPageShell
            title="Audit log"
            description="Rekaman tindakan penting di seluruh modul, termasuk nilai sebelum dan sesudah perubahan."
            searchPlaceholder="Cari aksi, keterangan, nomor dokumen, atau nama pengguna"
            filters={filters}
            emptyTitle="Belum ada aktivitas tercatat"
            emptyDescription="Catatan terisi begitu ada yang menyimpan data, menyetujui dokumen, atau menyelesaikan transaksi."
            isLoading={list.isLoading}
            errorMessage={list.errorMessage}
            rowCount={list.listData.length}
            paging={list.paging}
            onSearch={list.handleSearch}
            onRefresh={list.handleRefresh}
            onPageChange={list.handlePageChange}
            onPageSizeChange={list.setPageSizeOption}
        >
            <table className="w-full min-w-[64rem] border-collapse text-left">
                <thead className="border-b border-outline-variant bg-surface-low">
                    <tr>
                        <ColumnSorting label="Waktu" sortKey="DateCreated" {...sortProps} />
                        <ColumnSorting label="Pengguna" sortKey="CreatedBy" {...sortProps} />
                        <ColumnSorting label="Aksi" sortKey="ActionName" {...sortProps} />
                        <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                            Yang berubah
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant">
                    {list.listData.map((row) => (
                        <tr key={row.IdAuditLog} className="hover:bg-on-surface/4">
                            <td className="px-4 py-3 align-top text-body text-on-surface-variant">{row.StrDateCreated}</td>
                            <td className="px-4 py-3 align-top">
                                <p className="text-body text-on-surface">{row.CreatedBy ?? "Sistem"}</p>
                                {row.CreatedByRole ? (
                                    <p className="text-label-small text-on-surface-variant">{row.CreatedByRole}</p>
                                ) : null}
                                {row.IpAddress ? (
                                    <p className="text-numeric text-label-small text-on-surface-variant">{row.IpAddress}</p>
                                ) : null}
                            </td>
                            <td className="px-4 py-3 align-top">
                                <p className="text-body text-on-surface">{row.ActionName}</p>
                                <p className="text-label-small text-on-surface-variant">
                                    {row.ModuleName}
                                    {row.ReferenceId ? ` · ${row.ReferenceId}` : ""}
                                </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <p className="text-body text-on-surface-variant">{row.Description ?? "-"}</p>
                                {/*
                                  * Nilai lama dan baru ditampilkan berdampingan karena pertanyaan yang
                                  * dibawa ke halaman ini hampir selalu "berubah dari apa menjadi apa".
                                  */}
                                {row.OldValue || row.NewValue ? (
                                    <dl className="mt-1 grid gap-x-2 text-label-small sm:grid-cols-[auto_1fr]">
                                        {row.OldValue ? (
                                            <>
                                                <dt className="text-on-surface-variant">Sebelum</dt>
                                                <dd className="text-on-surface">{row.OldValue}</dd>
                                            </>
                                        ) : null}
                                        {row.NewValue ? (
                                            <>
                                                <dt className="text-on-surface-variant">Sesudah</dt>
                                                <dd className="text-on-surface">{row.NewValue}</dd>
                                            </>
                                        ) : null}
                                    </dl>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ListPageShell>
    );
}
