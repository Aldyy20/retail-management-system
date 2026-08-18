import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/router/AuthContext";
import { api } from "@/services/api";
import { getAxiosErrorMessage, formatNumber } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { StatusPill } from "@/components/common/StatusPill";
import { Surface } from "@/components/ui/Surface";
import type { DashboardSummaryModel } from "@/@models/dashboard.models";

/**
 * Beranda seluruh role.
 *
 * Isinya hanya nilai yang benar-benar ada di database. Tidak ada angka contoh dan tidak
 * ada tren, karena data transaksi belum ada pada tahap ini. Ringkasan penjualan menyusul
 * bersama modul kasir.
 */
export default function DashboardPage() {
    const { currentUser } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [summary, setSummary] = useState<DashboardSummaryModel | null>(null);

    /**
     * Pengambilan data sengaja tidak mengubah state secara langsung saat dipanggil,
     * hanya setelah permintaan selesai, supaya pemuatan pertama tidak memicu render berantai.
     */
    const loadInitData = useCallback(() => {
        return api
            .post<DashboardSummaryModel>("/dashboard/get-summary")
            .then((response) => {
                setSummary(response.data);
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

    const featureFlags = summary
        ? [
              { label: "Sistem member", isEnabled: summary.IsMemberEnabled },
              { label: "Loyalty point", isEnabled: summary.IsLoyaltyEnabled },
              { label: "Voucher", isEnabled: summary.IsVoucherEnabled },
          ]
        : [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={"Selamat datang, " + (currentUser?.FullName ?? "")}
                description="Ringkasan status sistem dan aktivitas terakhir yang tercatat."
            />

            {isLoading ? <LoadingSpinner label="Memuat ringkasan sistem" /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !errorMessage && summary ? (
                <div className="grid gap-6 large:grid-cols-[20rem_1fr]">
                    <Surface variant="outlined" className="p-5">
                        <h2 className="text-title text-on-surface">Status sistem</h2>

                        <dl className="mt-4 flex flex-col gap-3">
                            <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
                                <dt className="text-body text-on-surface-variant">Pengguna aktif</dt>
                                <dd className="text-numeric text-title text-on-surface">
                                    {formatNumber(summary.TotalUserActive)}
                                </dd>
                            </div>

                            {featureFlags.map((flag) => (
                                <div key={flag.label} className="flex items-center justify-between gap-4">
                                    <dt className="text-body text-on-surface-variant">{flag.label}</dt>
                                    <dd>
                                        <StatusPill
                                            tone={flag.isEnabled ? "success" : "neutral"}
                                            label={flag.isEnabled ? "Aktif" : "Nonaktif"}
                                        />
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <p className="mt-4 text-label-small text-on-surface-variant">
                            Admin mengubah status ini dari halaman pengaturan, tanpa mengubah kode program.
                        </p>
                    </Surface>

                    <Surface variant="outlined" className="overflow-hidden">
                        <h2 className="border-b border-outline-variant px-5 py-4 text-title text-on-surface">
                            Aktivitas terakhir
                        </h2>

                        {summary.RecentActivities.length === 0 ? (
                            <EmptyDataAlert
                                title="Belum ada aktivitas tercatat"
                                description="Setiap tindakan penting akan muncul di sini lengkap dengan pelakunya dan waktunya, dimulai dari proses masuk pengguna."
                            />
                        ) : (
                            <ul className="divide-y divide-outline-variant">
                                {summary.RecentActivities.map((activity, index) => (
                                    <li
                                        key={activity.StrDateCreated + "-" + index}
                                        className="flex flex-col gap-1 px-5 py-3 medium:flex-row medium:items-center medium:justify-between medium:gap-4"
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
            ) : null}

            <p className="text-label-small text-on-surface-variant">
                Modul master data, inventory, kasir, member, promo, dan laporan belum tersedia pada
                tahap ini. Menu akan bertambah begitu modulnya selesai.
            </p>
        </div>
    );
}
