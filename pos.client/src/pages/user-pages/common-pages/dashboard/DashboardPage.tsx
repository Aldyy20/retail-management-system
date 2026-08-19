import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Coins, Package, Receipt, TriangleAlert, Wallet } from "lucide-react";
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
 * Beranda seluruh role.
 *
 * Isinya disusun dari keputusan yang diambil tiap role, bukan dari kerangka dashboard
 * yang sama untuk semua orang: owner melihat uang dan tren, supervisor melihat antrean
 * keputusannya, admin melihat kesehatan data dan stok, karyawan melihat pekerjaannya.
 * Seluruh angka berasal dari database; tidak ada satu pun nilai contoh.
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
                        ? "Ringkasan keuangan dan penjualan toko."
                        : isSupervisor
                          ? "Antrean keputusan Anda dan aktivitas operasional hari ini."
                          : isAdmin
                            ? "Kesehatan data, stok, dan aktivitas sistem."
                            : "Ringkasan pekerjaan hari ini."
                }
            />

            {isLoading ? <LoadingSpinner label="Memuat ringkasan" /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !errorMessage && data ? (
                <>
                    {/*
                      * Supervisor memulai dari antrean persetujuan, karena itulah keputusan
                      * yang hanya bisa diambil olehnya. Sisanya menyusul sebagai konteks.
                      */}
                    {isSupervisor ? (
                        <Surface variant="outlined" className="p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-title text-on-surface">Menunggu keputusan Anda</h2>
                                    <p className="text-numeric text-[2rem] leading-tight font-semibold text-on-surface">
                                        {data.Approval.PendingTotal}
                                    </p>
                                    <p className="text-label-small text-on-surface-variant">
                                        {data.Approval.PendingGoodsReceiving} barang masuk ·{" "}
                                        {data.Approval.PendingStockAdjustment} penyesuaian stok ·{" "}
                                        {data.Approval.PendingVoidTransaction} pembatalan
                                    </p>
                                </div>

                                {data.Approval.PendingTotal > 0 ? (
                                    <Button onClick={() => navigate("/supervisor/approval")}>Buka daftar persetujuan</Button>
                                ) : null}
                            </div>
                        </Surface>
                    ) : null}

                    <div className="grid gap-4 medium:grid-cols-2 expanded:grid-cols-4">
                        <StatTile
                            label={isOwner ? "Penjualan hari ini" : "Omzet hari ini"}
                            value={data.Today.StrRevenue}
                            caption={`${data.Today.TransactionCount} transaksi, ${formatNumber(data.Today.ItemSold)} barang`}
                            icon={<Wallet size={16} aria-hidden="true" />}
                            isHero={isOwner}
                        />

                        {isOwner ? (
                            <>
                                <StatTile
                                    label="Laba kotor hari ini"
                                    value={data.Today.StrGrossProfit}
                                    caption={`Margin ${data.Today.StrMargin}`}
                                    icon={<Coins size={16} aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Penjualan bulan ini"
                                    value={data.ThisMonth.StrRevenue}
                                    caption={`Rata-rata ${data.ThisMonth.StrAverageTransactionValue} per transaksi`}
                                    icon={<Receipt size={16} aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Laba kotor bulan ini"
                                    value={data.ThisMonth.StrGrossProfit}
                                    caption={`Potongan diberikan ${data.ThisMonth.StrTotalDiscount}`}
                                    icon={<Coins size={16} aria-hidden="true" />}
                                />
                            </>
                        ) : null}

                        {isAdmin || isSupervisor || isKaryawan ? (
                            <>
                                <StatTile
                                    label="Produk aktif"
                                    value={formatNumber(data.Inventory.TotalProduct)}
                                    caption={`Nilai persediaan ${data.Inventory.StrTotalStockValue}`}
                                    icon={<Package size={16} aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Stok menipis"
                                    value={formatNumber(data.Inventory.LowStockCount)}
                                    caption="Sudah menyentuh batas minimum"
                                    icon={<TriangleAlert size={16} aria-hidden="true" />}
                                />
                                <StatTile
                                    label="Stok habis"
                                    value={formatNumber(data.Inventory.OutOfStockCount)}
                                    caption="Tidak dapat dijual sampai barang masuk"
                                    icon={<TriangleAlert size={16} aria-hidden="true" />}
                                />
                            </>
                        ) : null}

                        {isAdmin ? (
                            <StatTile
                                label="Menunggu persetujuan"
                                value={formatNumber(data.Approval.PendingTotal)}
                                caption="Ditangani supervisor"
                                icon={<ClipboardCheck size={16} aria-hidden="true" />}
                            />
                        ) : null}
                    </div>

                    {isOwner ? (
                        <>
                            <Surface variant="outlined" className="overflow-hidden">
                                <TrendLineChart
                                    question="Penjualan dan laba kotor 14 hari terakhir"
                                    primaryLabel="Penjualan"
                                    secondaryLabel="Laba kotor"
                                    points={data.ListDailySales.map((day) => ({
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
                                        question="Kategori mana yang paling banyak menghasilkan bulan ini"
                                        emptyMessage="Belum ada penjualan bulan ini."
                                        bars={data.ListCategorySales.map((category) => ({
                                            label: category.CategoryName,
                                            value: category.Revenue,
                                            caption: `${formatNumber(category.ItemSold)} barang terjual`,
                                        }))}
                                    />
                                </Surface>

                                <Surface variant="outlined">
                                    <RankedBarChart
                                        question="Kasir mana yang paling banyak melayani bulan ini"
                                        emptyMessage="Belum ada transaksi bulan ini."
                                        bars={data.ListCashierSales.map((cashier) => ({
                                            label: cashier.CashierName,
                                            value: cashier.Revenue,
                                            caption: `${cashier.TransactionCount} transaksi`,
                                        }))}
                                    />
                                </Surface>
                            </div>

                            <Surface variant="outlined" className="overflow-hidden">
                                <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">
                                    Produk paling laku bulan ini
                                </h2>

                                {data.ListTopProduct.length === 0 ? (
                                    <EmptyDataAlert
                                        title="Belum ada penjualan bulan ini"
                                        description="Peringkat produk muncul setelah ada transaksi yang tersimpan pada bulan berjalan."
                                    />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[36rem] border-collapse text-left">
                                            <thead className="border-b border-outline-variant bg-surface-low">
                                                <tr>
                                                    <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">
                                                        Produk
                                                    </th>
                                                    <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                                        Terjual
                                                    </th>
                                                    <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                                        Penjualan
                                                    </th>
                                                    <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                                        Laba kotor
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant">
                                                {data.ListTopProduct.map((product) => (
                                                    <tr key={product.Sku}>
                                                        <td className="px-5 py-3">
                                                            <p className="text-body text-on-surface">{product.ProductName}</p>
                                                            <p className="text-label-small text-on-surface-variant">{product.Sku}</p>
                                                        </td>
                                                        <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">
                                                            {formatNumber(product.ItemSold)}
                                                        </td>
                                                        <td className="px-5 py-3 text-numeric text-body text-on-surface">
                                                            {product.StrRevenue}
                                                        </td>
                                                        <td className="px-5 py-3 text-numeric text-body text-on-surface">
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

                    <div className="grid gap-6 large:grid-cols-2">
                        <Surface variant="outlined" className="overflow-hidden">
                            <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">
                                Barang yang perlu segera dipesan
                            </h2>

                            {data.ListLowStock.length === 0 ? (
                                <EmptyDataAlert
                                    title="Tidak ada stok kritis"
                                    description="Seluruh produk aktif masih di atas batas minimumnya. Daftar ini terisi begitu ada yang menyentuh batas."
                                />
                            ) : (
                                <ul className="divide-y divide-outline-variant">
                                    {data.ListLowStock.map((row) => (
                                        <li key={row.Sku} className="flex items-center justify-between gap-3 px-5 py-3">
                                            <div className="min-w-0">
                                                <p className="text-body text-on-surface">{row.ProductName}</p>
                                                <p className="text-label-small text-on-surface-variant">
                                                    Sisa {formatNumber(row.Quantity)} {row.UnitName}, batas minimum{" "}
                                                    {formatNumber(row.MinimumStock)}
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
                            <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">
                                Aktivitas terakhir
                            </h2>

                            {data.ListActivity.length === 0 ? (
                                <EmptyDataAlert
                                    title="Belum ada aktivitas tercatat"
                                    description="Setiap tindakan penting muncul di sini lengkap dengan pelakunya dan waktunya."
                                />
                            ) : (
                                <ul className="divide-y divide-outline-variant">
                                    {data.ListActivity.map((activity, index) => (
                                        <li
                                            key={activity.StrDateCreated + index}
                                            className="flex flex-col gap-1 px-5 py-3 medium:flex-row medium:items-center medium:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-title-small text-on-surface">
                                                    {activity.Description ?? activity.ActionName}
                                                </p>
                                                <p className="text-label-small text-on-surface-variant">
                                                    {activity.ModuleName} · {activity.CreatedBy}
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-label-small text-on-surface-variant">
                                                {activity.StrDateCreated}
                                            </p>
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
