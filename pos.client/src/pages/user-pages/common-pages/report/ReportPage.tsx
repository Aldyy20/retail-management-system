import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { getAxiosErrorMessage, formatNumber } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { StatusPill } from "@/components/common/StatusPill";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { StatTile } from "@/components/charts/StatTile";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { RankedBarChart } from "@/components/charts/RankedBarChart";
import type {
    InventoryReportModel,
    ProductSalesModel,
    MemberReportRowModel,
    ProfitReportModel,
    SalesReportModel,
} from "@/@dataLayer/dashboard.models";

type ReportTab = "sales" | "profit" | "inventory" | "member";

const tabs: { value: ReportTab; label: string }[] = [
    { value: "sales", label: "Penjualan" },
    { value: "profit", label: "Keuntungan" },
    { value: "inventory", label: "Persediaan" },
    { value: "member", label: "Member" },
];

function firstDayOfMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

/**
 * Laporan penjualan, keuntungan, persediaan, dan member.
 *
 * Empat laporan disatukan dalam satu halaman bertab karena semuanya menjawab
 * pertanyaan yang sama dari sudut berbeda: bagaimana toko berjalan pada periode ini.
 * Penyaring periode berada di satu baris di atas isinya dan berlaku untuk semua tab
 * kecuali persediaan, yang selalu menggambarkan keadaan saat ini.
 */
export default function ReportPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>("sales");
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [appliedPeriod, setAppliedPeriod] = useState({ start: firstDayOfMonth(), end: new Date().toISOString().slice(0, 10) });

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sales, setSales] = useState<SalesReportModel | null>(null);
    const [profit, setProfit] = useState<ProfitReportModel | null>(null);
    const [inventory, setInventory] = useState<InventoryReportModel | null>(null);
    const [member, setMember] = useState<MemberReportRowModel[]>([]);

    const loadReport = useCallback(() => {
        const body = { StartDate: `${appliedPeriod.start}T00:00:00`, EndDate: `${appliedPeriod.end}T00:00:00` };

        const request =
            activeTab === "sales"
                ? api.post<SalesReportModel>("/report/get-sales-report", body).then((r) => setSales(r.data))
                : activeTab === "profit"
                  ? api.post<ProfitReportModel>("/report/get-profit-report", body).then((r) => setProfit(r.data))
                  : activeTab === "inventory"
                    ? api.post<InventoryReportModel>("/report/get-inventory-report", {}).then((r) => setInventory(r.data))
                    : api.post<MemberReportRowModel[]>("/report/get-member-report", body).then((r) => setMember(r.data));

        return request
            .then(() => setErrorMessage(null))
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoading(false));
    }, [activeTab, appliedPeriod]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const applyPeriod = () => {
        setIsLoading(true);
        setAppliedPeriod({ start: startDate, end: endDate });
    };

    const changeTab = (tab: ReportTab) => {
        setIsLoading(true);
        setActiveTab(tab);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Laporan"
                description="Angka dihitung dari transaksi yang berstatus selesai. Transaksi yang dibatalkan tidak pernah ikut dihitung."
            />

            <Surface variant="outlined" className="p-4">
                <div role="tablist" aria-label="Jenis laporan" className="mb-4 flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.value}
                            onClick={() => changeTab(tab.value)}
                            className={[
                                "min-h-11 rounded-(--radius-control) border px-4 text-label transition-colors",
                                activeTab === tab.value
                                    ? "border-primary bg-secondary-container text-on-secondary-container"
                                    : "border-outline text-on-surface-variant hover:bg-on-surface/8",
                            ].join(" ")}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "inventory" ? (
                    <p className="text-body text-on-surface-variant">
                        Laporan persediaan selalu menggambarkan keadaan stok saat ini, sehingga tidak memakai rentang tanggal.
                    </p>
                ) : (
                    <div className="flex flex-wrap items-end gap-3">
                        <TextField
                            label="Dari tanggal"
                            type="date"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                        />
                        <TextField
                            label="Sampai tanggal"
                            type="date"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                        />
                        <Button variant="tonal" onClick={applyPeriod}>
                            Terapkan periode
                        </Button>
                    </div>
                )}
            </Surface>

            {isLoading ? <LoadingSpinner label="Menghitung laporan" /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={loadReport} /> : null}

            {!isLoading && !errorMessage && activeTab === "sales" && sales ? (
                <>
                    <div className="grid gap-4 medium:grid-cols-2 expanded:grid-cols-4">
                        <StatTile label="Penjualan" value={sales.Summary.StrRevenue} caption={`${sales.Summary.TransactionCount} transaksi`} isHero />
                        <StatTile label="Laba kotor" value={sales.Summary.StrGrossProfit} caption={`Margin ${sales.Summary.StrMargin}`} />
                        <StatTile label="Rata-rata per transaksi" value={sales.Summary.StrAverageTransactionValue} caption={`${formatNumber(sales.Summary.ItemSold)} barang terjual`} />
                        <StatTile label="Potongan diberikan" value={sales.Summary.StrTotalDiscount} caption={`${sales.Summary.VoucherUsedCount} voucher, ${sales.Summary.MemberTransactionCount} transaksi member`} />
                    </div>

                    <Surface variant="outlined" className="overflow-hidden">
                        <TrendLineChart
                            question="Bagaimana penjualan dan laba kotor bergerak pada periode ini"
                            primaryLabel="Penjualan"
                            secondaryLabel="Laba kotor"
                            points={sales.ListDailySales.map((day) => ({
                                label: day.StrShortDate,
                                fullLabel: day.StrDate,
                                primaryValue: day.Revenue,
                                secondaryValue: day.GrossProfit,
                            }))}
                        />
                    </Surface>

                    <div className="grid gap-6 large:grid-cols-2">
                        <Surface variant="outlined">
                            <RankedBarChart
                                question="Kategori mana yang paling banyak menghasilkan"
                                emptyMessage="Belum ada penjualan pada periode ini."
                                bars={sales.ListCategorySales.map((category) => ({
                                    label: category.CategoryName,
                                    value: category.Revenue,
                                    caption: `${formatNumber(category.ItemSold)} barang terjual`,
                                }))}
                            />
                        </Surface>

                        <Surface variant="outlined">
                            <RankedBarChart
                                question="Kasir mana yang paling banyak melayani"
                                emptyMessage="Belum ada transaksi pada periode ini."
                                bars={sales.ListCashierSales.map((cashier) => ({
                                    label: cashier.CashierName,
                                    value: cashier.Revenue,
                                    caption: `${cashier.TransactionCount} transaksi`,
                                }))}
                            />
                        </Surface>
                    </div>
                </>
            ) : null}

            {!isLoading && !errorMessage && activeTab === "profit" && profit ? (
                <>
                    <div className="grid gap-4 medium:grid-cols-2 expanded:grid-cols-4">
                        <StatTile label="Pendapatan" value={profit.Summary.StrRevenue} isHero />
                        <StatTile label="Laba kotor" value={profit.Summary.StrGrossProfit} caption={`Margin ${profit.Summary.StrMargin}`} />
                        <StatTile label="Potongan diberikan" value={profit.Summary.StrTotalDiscount} />
                        <StatTile label="Barang terjual" value={formatNumber(profit.Summary.ItemSold)} />
                    </div>

                    <div className="grid gap-6 large:grid-cols-2">
                        <ProductTable question="Produk dengan laba kotor terbesar" rows={profit.ListTopProfit} />
                        <ProductTable question="Produk paling sedikit terjual" rows={profit.ListLeastSelling} />
                    </div>
                </>
            ) : null}

            {!isLoading && !errorMessage && activeTab === "inventory" && inventory ? (
                <>
                    <div className="grid gap-4 medium:grid-cols-2 expanded:grid-cols-4">
                        <StatTile
                            label="Nilai persediaan"
                            value={inventory.Summary.StrTotalStockValue}
                            caption={`${formatNumber(inventory.Summary.TotalStockQuantity)} barang di gudang`}
                            isHero
                        />
                        <StatTile label="Produk aktif" value={formatNumber(inventory.Summary.TotalProduct)} />
                        <StatTile
                            label="Stok menipis"
                            value={formatNumber(inventory.Summary.LowStockCount)}
                            caption="Sudah menyentuh batas minimum"
                        />
                        <StatTile
                            label="Stok habis"
                            value={formatNumber(inventory.Summary.OutOfStockCount)}
                            caption="Tidak dapat dijual"
                        />
                    </div>

                    <Surface variant="outlined" className="overflow-hidden">
                        <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">
                            Barang yang perlu segera dipesan
                        </h2>

                        {inventory.ListLowStock.length === 0 ? (
                            <EmptyDataAlert
                                title="Tidak ada stok kritis"
                                description="Seluruh produk aktif masih di atas batas minimumnya."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[36rem] border-collapse text-left">
                                    <thead className="border-b border-outline-variant bg-surface-low">
                                        <tr>
                                            <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">Produk</th>
                                            <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Sisa stok</th>
                                            <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Batas minimum</th>
                                            <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">Keadaan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant">
                                        {inventory.ListLowStock.map((row) => (
                                            <tr key={row.Sku}>
                                                <td className="px-5 py-3">
                                                    <p className="text-body text-on-surface">{row.ProductName}</p>
                                                    <p className="text-label-small text-on-surface-variant">{row.Sku}</p>
                                                </td>
                                                <td className="px-5 py-3 text-numeric text-body text-on-surface">
                                                    {formatNumber(row.Quantity)} {row.UnitName}
                                                </td>
                                                <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">
                                                    {formatNumber(row.MinimumStock)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <StatusPill
                                                        tone={row.StockStatus === "habis" ? "error" : "pending"}
                                                        label={row.StrStockStatus}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Surface>
                </>
            ) : null}

            {!isLoading && !errorMessage && activeTab === "member" ? (
                <Surface variant="outlined" className="overflow-hidden">
                    <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">
                        Member yang berbelanja pada periode ini
                    </h2>

                    {member.length === 0 ? (
                        <EmptyDataAlert
                            title="Belum ada member yang berbelanja"
                            description="Daftar ini terisi setelah ada transaksi yang memilih member pada rentang tanggal yang dipilih."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[36rem] border-collapse text-left">
                                <thead className="border-b border-outline-variant bg-surface-low">
                                    <tr>
                                        <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">Member</th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Transaksi</th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Total belanja</th>
                                        <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Saldo point</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {member.map((row) => (
                                        <tr key={row.PhoneNumber}>
                                            <td className="px-5 py-3">
                                                <p className="text-body text-on-surface">{row.MemberName}</p>
                                                <p className="text-label-small text-on-surface-variant">{row.PhoneNumber}</p>
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">
                                                {row.TransactionCount}
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body text-on-surface">
                                                {row.StrTotalSpending}
                                            </td>
                                            <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">
                                                {row.PointBalance}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Surface>
            ) : null}
        </div>
    );
}

/** Tabel peringkat produk. Dipakai dua kali pada laporan keuntungan dengan isi berbeda. */
function ProductTable({ question, rows }: { question: string; rows: ProductSalesModel[] }) {
    return (
        <Surface variant="outlined" className="overflow-hidden">
            <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">{question}</h2>

            {rows.length === 0 ? (
                <EmptyDataAlert
                    title="Belum ada data"
                    description="Peringkat muncul setelah ada transaksi yang tersimpan pada periode ini."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[28rem] border-collapse text-left">
                        <thead className="border-b border-outline-variant bg-surface-low">
                            <tr>
                                <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">Produk</th>
                                <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Terjual</th>
                                <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Penjualan</th>
                                <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">Laba kotor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {rows.map((row) => (
                                <tr key={row.Sku}>
                                    <td className="px-5 py-3">
                                        <p className="text-body text-on-surface">{row.ProductName}</p>
                                        <p className="text-label-small text-on-surface-variant">{row.Sku}</p>
                                    </td>
                                    <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">{row.ItemSold}</td>
                                    <td className="px-5 py-3 text-numeric text-body text-on-surface">{row.StrRevenue}</td>
                                    <td className="px-5 py-3 text-numeric text-body text-on-surface">{row.StrGrossProfit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Surface>
    );
}
