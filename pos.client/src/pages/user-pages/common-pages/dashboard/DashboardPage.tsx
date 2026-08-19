import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Coins, Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/components/router/AuthContext";
import { api } from "@/services/api";
import { getAxiosErrorMessage, formatNumber } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { StatusPill } from "@/components/common/StatusPill";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/charts/StatTile";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { RankedBarChart } from "@/components/charts/RankedBarChart";
import { ROLE_ADMIN, ROLE_KARYAWAN, ROLE_OWNER, ROLE_SUPERVISOR } from "@/services/global.types";
import type { DashboardModel } from "@/@dataLayer/dashboard.models";

/**
 * Dashboard Utama Zenith Retail Pro.
 * Menyesuaikan data metrik & grafik secara kontekstual menurut peran pengguna (Role).
 */
export default function DashboardPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [data, setData] = useState<DashboardModel | null>(null);

    const loadInitData = useCallback(() => {
        return api
            .post<DashboardModel>("/dashboard/get-summary", {})
            .then((response) => {
                setData(response.data);
                setErrorMessage(null);
            })
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const handleRefresh = () => {
        setIsLoading(true);
        loadInitData();
    };

    const role = currentUser?.Role ?? "";
    const isOwner = role === ROLE_OWNER;
    const isAdmin = role === ROLE_ADMIN;
    const isSupervisor = role === ROLE_SUPERVISOR;
    const isKaryawan = role === ROLE_KARYAWAN;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={`Selamat datang, ${currentUser?.FullName ?? ""}`}
                description={
                    isOwner
                        ? "Ikhtisar eksekutif keuangan, penjualan harian, dan performa produk toko."
                        : isSupervisor
                          ? "Pusat persetujuan dan monitoring aktivitas operasional kasir."
                          : isAdmin
                            ? "Status kesehatan data, stok gudang, dan konfigurasi sistem."
                            : "Ringkasan transaksi dan tugas operasional hari ini."
                }
            />

            {isLoading ? <LoadingSpinner label="Memuat ringkasan dashboard..." /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !errorMessage && data ? (
                <>
                    {/* Banner Khusus Supervisor: Antrean Keputusan Menunggu */}
                    {isSupervisor ? (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
                                        <AlertTriangle size={16} />
                                        <span>Menunggu Keputusan Anda</span>
                                    </div>
                                    <p className="font-heading font-extrabold text-3xl sm:text-4xl text-on-surface">
                                        {data.Approval.PendingTotal} <span className="text-lg font-medium text-on-surface-variant">Dokumen</span>
                                    </p>
                                    <p className="text-xs text-on-surface-variant">
                                        {data.Approval.PendingGoodsReceiving} barang masuk ·{" "}
                                        {data.Approval.PendingStockAdjustment} penyesuaian stok ·{" "}
                                        {data.Approval.PendingVoidTransaction} pembatalan transaksi
                                    </p>
                                </div>

                                {data.Approval.PendingTotal > 0 ? (
                                    <Button
                                        onClick={() => navigate("/supervisor/approval")}
                                        icon={<ClipboardCheck size={18} />}
                                        className="shadow-sm"
                                    >
                                        Buka Pusat Persetujuan
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary bg-surface-lowest px-3 py-2 rounded-xl border border-secondary/20">
                                        <CheckCircle2 size={16} />
                                        <span>Semua Permintaan Sudah Diputuskan</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* 4 Kartu Metrik KPI Utama */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <StatTile
                            label={isOwner ? "Penjualan Hari Ini" : "Omzet Hari Ini"}
                            value={data.Today.StrRevenue}
                            caption={`${data.Today.TransactionCount} Transaksi · ${formatNumber(data.Today.ItemSold)} Item Terjual`}
                            icon={<Wallet size={16} aria-hidden="true" />}
                            isHero={isOwner}
                        />

                        {isOwner ? (
                            <>
                                <StatTile
                                    label="Laba Kotor Hari Ini"
                                    value={data.Today.StrGrossProfit}
                                    caption={`Margin ${data.Today.StrMargin}`}
                                    icon={<Coins size={16} aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Penjualan Bulan Ini"
                                    value={data.ThisMonth.StrRevenue}
                                    caption={`Rata-rata ${data.ThisMonth.StrAverageTransactionValue} / transaksi`}
                                    icon={<Receipt size={16} aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Laba Kotor Bulan Ini"
                                    value={data.ThisMonth.StrGrossProfit}
                                    caption={`Total Diskon Diberikan ${data.ThisMonth.StrTotalDiscount}`}
                                    icon={<TrendingUp size={16} aria-hidden="true" />}
                                />
                            </>
                        ) : null}

                        {isAdmin || isSupervisor || isKaryawan ? (
                            <>
                                <StatTile
                                    label="Total Produk Aktif"
                                    value={formatNumber(data.Inventory.TotalProduct)}
                                    caption={`Nilai Persediaan ${data.Inventory.StrTotalStockValue}`}
                                    icon={<Package size={16} aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Stok Menipis"
                                    value={formatNumber(data.Inventory.LowStockCount)}
                                    caption="Menyentuh batas minimum"
                                    icon={<AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Stok Habis"
                                    value={formatNumber(data.Inventory.OutOfStockCount)}
                                    caption="Segera buat barang masuk"
                                    icon={<AlertTriangle size={16} className="text-error" aria-hidden="true" />}
                                />
                            </>
                        ) : null}

                        {isAdmin ? (
                            <StatTile
                                label="Menunggu Persetujuan"
                                value={formatNumber(data.Approval.PendingTotal)}
                                caption="Ditangani oleh supervisor"
                                icon={<ClipboardCheck size={16} aria-hidden="true" />}
                            />
                        ) : null}
                    </div>

                    {/* Grafik dan Laporan Khusus Owner */}
                    {isOwner ? (
                        <>
                            <Surface variant="outlined" className="overflow-hidden p-1">
                                <TrendLineChart
                                    question="Tren Penjualan & Laba Kotor (14 Hari Terakhir)"
                                    primaryLabel="Penjualan"
                                    secondaryLabel="Laba Kotor"
                                    points={data.ListDailySales.map((day) => ({
                                        label: day.StrShortDate,
                                        fullLabel: day.StrDate,
                                        primaryValue: day.Revenue,
                                        secondaryValue: day.GrossProfit,
                                    }))}
                                />
                            </Surface>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <Surface variant="outlined">
                                    <RankedBarChart
                                        question="Pendapatan per Kategori Produk Bulan Ini"
                                        emptyMessage="Belum ada data transaksi bulan ini."
                                        bars={data.ListCategorySales.map((category) => ({
                                            label: category.CategoryName,
                                            value: category.Revenue,
                                            caption: `${formatNumber(category.ItemSold)} item terjual`,
                                        }))}
                                    />
                                </Surface>

                                <Surface variant="outlined">
                                    <RankedBarChart
                                        question="Performa Transaksi Kasir Bulan Ini"
                                        emptyMessage="Belum ada transaksi bulan ini."
                                        bars={data.ListCashierSales.map((cashier) => ({
                                            label: cashier.CashierName,
                                            value: cashier.Revenue,
                                            caption: `${cashier.TransactionCount} transaksi selesai`,
                                        }))}
                                    />
                                </Surface>
                            </div>

                            <Surface variant="outlined" className="overflow-hidden">
                                <div className="border-b border-outline-variant px-5 py-4 bg-surface-muted/60">
                                    <h2 className="font-heading font-bold text-title text-on-surface">
                                        Produk Terlaris Bulan Ini
                                    </h2>
                                </div>

                                {data.ListTopProduct.length === 0 ? (
                                    <EmptyDataAlert
                                        title="Belum ada penjualan bulan ini"
                                        description="Peringkat produk terlaris akan muncul otomatis setelah transaksi tersimpan."
                                    />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[36rem] border-collapse text-left">
                                            <thead className="border-b border-outline-variant bg-surface-muted/70">
                                                <tr>
                                                    <th scope="col" className="px-5 py-3 text-label-small font-semibold text-on-surface-variant">
                                                        Produk
                                                    </th>
                                                    <th scope="col" className="px-5 py-3 text-right text-label-small font-semibold text-on-surface-variant">
                                                        Terjual
                                                    </th>
                                                    <th scope="col" className="px-5 py-3 text-right text-label-small font-semibold text-on-surface-variant">
                                                        Penjualan
                                                    </th>
                                                    <th scope="col" className="px-5 py-3 text-right text-label-small font-semibold text-on-surface-variant">
                                                        Laba Kotor
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant">
                                                {data.ListTopProduct.map((product) => (
                                                    <tr key={product.Sku} className="hover:bg-surface-muted/40 transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <p className="font-heading font-semibold text-sm text-on-surface">{product.ProductName}</p>
                                                            <p className="text-xs font-mono-receipt text-on-surface-variant">{product.Sku}</p>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-numeric font-mono-receipt text-sm text-on-surface-variant">
                                                            {formatNumber(product.ItemSold)}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-numeric font-semibold text-sm text-on-surface">
                                                            {product.StrRevenue}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-numeric font-bold text-sm text-secondary">
                                                            {product.StrGrossProfit}
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

                    {/* Bento Grid: Stok Kritis & Aktivitas Terakhir */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Surface variant="outlined" className="overflow-hidden">
                            <div className="border-b border-outline-variant px-5 py-4 bg-surface-muted/60">
                                <h2 className="font-heading font-bold text-title text-on-surface">
                                    Peringatan Stok Kritis
                                </h2>
                            </div>

                            {data.ListLowStock.length === 0 ? (
                                <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center">
                                    <CheckCircle2 size={32} className="text-secondary mb-2 opacity-80" />
                                    <p className="font-heading font-semibold text-sm text-on-surface">Seluruh Stok Aman</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5">
                                        Semua produk aktif berada di atas batas minimum persediaan.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-outline-variant">
                                    {data.ListLowStock.map((row) => (
                                        <li key={row.Sku} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-muted/30 transition-colors">
                                            <div className="min-w-0">
                                                <p className="font-heading font-semibold text-sm text-on-surface">{row.ProductName}</p>
                                                <p className="text-xs text-on-surface-variant font-mono-receipt">
                                                    Sisa {formatNumber(row.Quantity)} {row.UnitName} (Min: {formatNumber(row.MinimumStock)})
                                                </p>
                                            </div>
                                            <StatusPill
                                                tone={row.StockStatus === "habis" ? "error" : "pending"}
                                                label={row.StrStockStatus}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Surface>

                        <Surface variant="outlined" className="overflow-hidden">
                            <div className="border-b border-outline-variant px-5 py-4 bg-surface-muted/60">
                                <h2 className="font-heading font-bold text-title text-on-surface">
                                    Aktivitas Terakhir Sistem
                                </h2>
                            </div>

                            {data.ListActivity.length === 0 ? (
                                <EmptyDataAlert
                                    title="Belum ada aktivitas tercatat"
                                    description="Tindakan transaksi dan perubahan data penting akan muncul di sini."
                                />
                            ) : (
                                <ul className="divide-y divide-outline-variant">
                                    {data.ListActivity.map((activity, index) => (
                                        <li
                                            key={activity.StrDateCreated + index}
                                            className="flex flex-col gap-1 px-5 py-3.5 hover:bg-surface-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-heading font-semibold text-sm text-on-surface">
                                                    {activity.Description ?? activity.ActionName}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">
                                                    <span className="font-medium text-primary">{activity.ModuleName}</span> · {activity.CreatedBy}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[11px] font-mono-receipt text-on-surface-variant">
                                                {activity.StrDateCreated}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Surface>
                    </div>
                </>
            ) : null}
        </div>
    );
}
