import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { useSnackbar } from "@/components/ui/Snackbar";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import type { SelectListItemModel } from "@/@dataLayer/base.models";
import type { ProductLookupModel } from "@/@dataLayer/inventory.models";

interface StockOpnameFormModel {
    ListWarehouse: SelectListItemModel[];
    Data: { OpnameDate: string };
}

/** Satu baris hitungan: stok sistem dibekukan, stok fisik diisi petugas. */
interface CountRow extends ProductLookupModel {
    PhysicalStock: string;
}

export default function StockOpnameCreateEditPage() {
    const navigate = useNavigate();
    const rolePath = useRolePath();
    const { successNotify } = useSnackbar();

    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    const [listWarehouse, setListWarehouse] = useState<SelectListItemModel[]>([]);
    const [idWarehouse, setIdWarehouse] = useState("");
    const [opnameDate, setOpnameDate] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState("");
    const [listCount, setListCount] = useState<CountRow[]>([]);

    const loadInitData = useCallback(() => {
        return api
            .post<StockOpnameFormModel>(`/${rolePath}/stock-opname/get-create`, {})
            .then((response) => {
                setListWarehouse(response.data.ListWarehouse);
                setIdWarehouse(response.data.ListWarehouse[0]?.Value ?? "");
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [rolePath]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    /**
     * Stok sistem selalu diambil ulang dari server saat gudang berganti. Nilai ini tidak
     * pernah dikirim balik saat menyimpan; server membekukannya sendiri.
     */
    const loadProductStock = useCallback(() => {
        if (!idWarehouse) {
            return Promise.resolve();
        }

        return api
            .post<ProductLookupModel[]>(`/${rolePath}/stock-opname/get-list-product-stock`, { IdWarehouse: idWarehouse })
            .then((response) => {
                setListCount(response.data.map((product) => ({ ...product, PhysicalStock: String(product.Stock) })));
                setErrorMessage(null);
            })
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingProduct(false));
    }, [idWarehouse, rolePath]);

    useEffect(() => {
        loadProductStock();
    }, [loadProductStock]);

    /** Daftar lama dikosongkan di sini, bukan di dalam efek, supaya tidak ada pembaruan
     * state yang berjalan bersamaan dengan render. */
    const handleChangeWarehouse = (value: string) => {
        setListCount([]);
        setIsLoadingProduct(Boolean(value));
        setIdWarehouse(value);
    };

    const setPhysicalStock = (idProduct: string, value: string) => {
        setListCount((current) =>
            current.map((row) => (row.IdProduct === idProduct ? { ...row, PhysicalStock: value } : row)),
        );
    };

    const getDifference = (row: CountRow) => {
        const physical = Number(row.PhysicalStock);
        return Number.isFinite(physical) ? physical - row.Stock : 0;
    };

    const totalDifference = listCount.filter((row) => getDifference(row) !== 0).length;

    const saveDocument = async (isSubmitted: boolean) => {
        setErrorMessage(null);

        if (!idWarehouse) {
            setErrorMessage("Pilih gudang yang akan diaudit lebih dulu.");
            return;
        }

        const invalidRow = listCount.find((row) => {
            const physical = Number(row.PhysicalStock);
            return !Number.isFinite(physical) || physical < 0 || row.PhysicalStock.trim() === "";
        });

        if (invalidRow) {
            setErrorMessage(`Stok fisik ${invalidRow.ProductName} belum diisi dengan angka yang benar.`);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post<string>(`/${rolePath}/stock-opname/insert-stock-opname`, {
                IdWarehouse: idWarehouse,
                OpnameDate: `${opnameDate}T00:00:00`,
                Note: note || null,
                IsSubmitted: isSubmitted,
                ListDetail: listCount.map((row) => ({
                    IdProduct: row.IdProduct,
                    PhysicalStock: Number(row.PhysicalStock),
                })),
            });
            successNotify(response.data);
            navigate(`/${rolePath}/stock-opname`);
        } catch (error) {
            setErrorMessage(getAxiosErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetryInit = () => {
        setIsLoadingInit(true);
        loadInitData();
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Stock opname"
                description="Hitung barang di rak lalu isikan jumlahnya. Selisih terhadap catatan sistem akan diajukan untuk disetujui supervisor."
            />

            {isLoadingInit ? <LoadingSpinner label="Memuat formulir stock opname" /> : null}

            {!isLoadingInit && initErrorMessage ? (
                <ErrorAlert message={initErrorMessage} onRetry={handleRetryInit} />
            ) : null}

            {!isLoadingInit && !initErrorMessage ? (
                <div className="flex flex-col gap-6">
                    {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                    <Surface variant="outlined" className="p-5 medium:p-6">
                        <div className="grid gap-5 medium:grid-cols-2">
                            <Select
                                label="Gudang yang diaudit"
                                required
                                options={listWarehouse}
                                placeholder="Pilih gudang"
                                value={idWarehouse}
                                onChange={(event) => handleChangeWarehouse(event.target.value)}
                                helperText="Mengganti gudang akan memuat ulang daftar barang beserta stok sistemnya."
                            />

                            <TextField
                                label="Tanggal opname"
                                type="date"
                                value={opnameDate}
                                onChange={(event) => setOpnameDate(event.target.value)}
                            />
                        </div>

                        <Textarea
                            label="Catatan"
                            containerClassName="mt-5"
                            placeholder="Audit rutin akhir bulan"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                        />
                    </Surface>

                    <Surface variant="outlined" className="overflow-hidden">
                        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-outline-variant px-5 py-4">
                            <h2 className="text-title text-on-surface">Hasil hitung fisik</h2>
                            <p className="text-label-small text-on-surface-variant">
                                {totalDifference === 0
                                    ? "Belum ada selisih terhadap catatan sistem"
                                    : `${totalDifference} barang berselisih`}
                            </p>
                        </div>

                        {isLoadingProduct ? <LoadingSpinner label="Memuat stok gudang" /> : null}

                        {!isLoadingProduct && listCount.length === 0 ? (
                            <EmptyDataAlert
                                title="Tidak ada produk aktif untuk dihitung"
                                description="Tambahkan produk aktif lebih dulu, atau pilih gudang lain yang memiliki barang."
                            />
                        ) : null}

                        {!isLoadingProduct && listCount.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[44rem] border-collapse text-left">
                                    <thead className="border-b border-outline-variant bg-surface-low">
                                        <tr>
                                            <th scope="col" className="px-5 py-3 text-label-small text-on-surface-variant">
                                                Produk
                                            </th>
                                            <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                                Stok sistem
                                            </th>
                                            <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                                Stok fisik
                                            </th>
                                            <th scope="col" className="px-5 py-3 text-right text-label-small text-on-surface-variant">
                                                Selisih
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-outline-variant">
                                        {listCount.map((row) => {
                                            const difference = getDifference(row);

                                            return (
                                                <tr key={row.IdProduct}>
                                                    <td className="px-5 py-3">
                                                        <p className="text-body text-on-surface">{row.ProductName}</p>
                                                        <p className="text-label-small text-on-surface-variant">{row.Sku}</p>
                                                    </td>
                                                    <td className="px-5 py-3 text-numeric text-body text-on-surface-variant">
                                                        {row.Stock} {row.UnitName}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <TextField
                                                            label={`Stok fisik ${row.ProductName}`}
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={0}
                                                            value={row.PhysicalStock}
                                                            onChange={(event) => setPhysicalStock(row.IdProduct, event.target.value)}
                                                            containerClassName="[&>label]:sr-only ml-auto w-28"
                                                        />
                                                    </td>
                                                    {/*
                                                      * Selisih ditulis dengan tanda plus atau minus, bukan hanya diwarnai,
                                                      * supaya arahnya terbaca tanpa membedakan warna.
                                                      */}
                                                    <td className="px-5 py-3 text-numeric text-body font-semibold text-on-surface">
                                                        {difference === 0 ? "0" : difference > 0 ? `+${difference}` : String(difference)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </Surface>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="text" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => saveDocument(false)}
                            disabled={isSubmitting || listCount.length === 0}
                        >
                            Simpan sebagai draft
                        </Button>
                        <Button
                            onClick={() => saveDocument(true)}
                            isLoading={isSubmitting}
                            disabled={listCount.length === 0}
                        >
                            {isSubmitting ? "Menyimpan" : "Simpan dan ajukan"}
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
