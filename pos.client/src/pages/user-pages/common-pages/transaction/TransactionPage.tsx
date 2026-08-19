import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { useListPage } from "@/hooks/useListPage";
import { useRolePath } from "@/hooks/useRolePath";
import { getDocumentStatusTone } from "@/services/global.methods";
import { IconButton } from "@/components/ui/IconButton";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import type { QueryTransactionModel } from "@/@dataLayer/transaction.models";

export default function TransactionPage() {
    const navigate = useNavigate();
    const rolePath = useRolePath();

    const listUrl = useMemo(() => `/${rolePath}/cashier/get-list-transaction`, [rolePath]);

    const list = useListPage<QueryTransactionModel>({
        listUrl,
        defaultSortBy: "TransactionDate",
    });

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    return (
        <ListPageShell
            title="Transaksi"
            description="Riwayat penjualan beserta notanya. Nota lama tetap memakai harga saat transaksi terjadi."
            searchPlaceholder="Cari nomor nota"
            emptyTitle="Belum ada transaksi"
            emptyDescription="Transaksi tercatat di sini setiap kali pembayaran di kasir diselesaikan."
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
                        <ColumnSorting label="Nomor nota" sortKey="InvoiceNumber" {...sortProps} />
                        <ColumnSorting label="Waktu" sortKey="TransactionDate" {...sortProps} />
                        <ColumnSorting label="Barang" sortKey="TotalItem" alignRight {...sortProps} />
                        <ColumnSorting label="Total" sortKey="TotalAmount" alignRight {...sortProps} />
                        <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                            Pembayaran
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
                        <tr key={row.IdTransaction} className="hover:bg-on-surface/4">
                            <td className="px-4 py-3">
                                <p className="text-body text-on-surface">{row.InvoiceNumber}</p>
                                {row.CashierName ? (
                                    <p className="text-label-small text-on-surface-variant">oleh {row.CashierName}</p>
                                ) : null}
                            </td>
                            <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrTransactionDate}</td>
                            <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">{row.TotalItem}</td>
                            <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                {row.StrTotalAmount}
                            </td>
                            <td className="px-4 py-3 text-body text-on-surface-variant">{row.PaymentMethodName}</td>
                            <td className="px-4 py-3">
                                <StatusPill tone={getDocumentStatusTone(row.Status)} label={row.StrStatus} />
                            </td>
                            <td className="px-4 py-2 text-right">
                                <IconButton
                                    label={`Lihat nota ${row.InvoiceNumber}`}
                                    icon={<Eye size={16} />}
                                    onClick={() => navigate(`details/${row.IdTransaction}`)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ListPageShell>
    );
}
