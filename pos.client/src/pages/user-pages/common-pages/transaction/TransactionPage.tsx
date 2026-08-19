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
            title="Riwayat Transaksi"
            description="Daftar seluruh riwayat penjualan beserta detail notanya. Data lama mengunci harga saat transaksi terjadi."
            searchPlaceholder="Cari nomor nota transaksi..."
            emptyTitle="Belum ada transaksi"
            emptyDescription="Data transaksi akan tercatat di sini setiap kali kasir menyelesaikan pembayaran."
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
                <thead className="border-b border-outline-variant bg-surface-muted/70">
                    <tr>
                        <ColumnSorting label="Nomor Nota" sortKey="InvoiceNumber" {...sortProps} />
                        <ColumnSorting label="Waktu Transaksi" sortKey="TransactionDate" {...sortProps} />
                        <ColumnSorting label="Jumlah Item" sortKey="TotalItem" alignRight {...sortProps} />
                        <ColumnSorting label="Total Bayar" sortKey="TotalAmount" alignRight {...sortProps} />
                        <th scope="col" className="px-4 py-3.5 text-label-small font-semibold text-on-surface-variant">
                            Metode Bayar
                        </th>
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
                        <tr key={row.IdTransaction} className="hover:bg-surface-muted/40 transition-colors">
                            <td className="px-4 py-3.5">
                                <p className="font-mono-receipt font-bold text-sm text-on-surface">{row.InvoiceNumber}</p>
                                {row.CashierName ? (
                                    <p className="text-xs text-on-surface-variant mt-0.5">Kasir: {row.CashierName}</p>
                                ) : null}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-on-surface-variant font-mono-receipt">{row.StrTransactionDate}</td>
                            <td className="px-4 py-3.5 text-numeric font-mono-receipt text-xs text-on-surface-variant">{row.TotalItem} item</td>
                            <td className="px-4 py-3.5 text-numeric font-heading font-bold text-sm text-primary">
                                {row.StrTotalAmount}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-on-surface-variant font-medium">
                                <span className="px-2 py-0.5 rounded bg-surface-muted border border-outline-variant">
                                    {row.PaymentMethodName}
                                </span>
                            </td>
                            <td className="px-4 py-3.5">
                                <StatusPill tone={getDocumentStatusTone(row.Status)} label={row.StrStatus} />
                            </td>
                            <td className="px-4 py-3.5 text-right">
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
