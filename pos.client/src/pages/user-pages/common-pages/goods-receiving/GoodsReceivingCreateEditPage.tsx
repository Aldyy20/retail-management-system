import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { useSnackbar } from "@/components/ui/Snackbar";
import { getAxiosErrorMessage, formatMoney } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import type { SelectListItemModel } from "@/@dataLayer/base.models";
import type { ProductLookupModel } from "@/@dataLayer/inventory.models";
import type { CreateEditGoodsReceivingModel } from "@/@dataLayer/goods-receiving.models";

interface GoodsReceivingFormModel {
    ListWarehouse: SelectListItemModel[];
    ListSupplier: SelectListItemModel[];
    ListProduct: ProductLookupModel[];
    Data: CreateEditGoodsReceivingModel;
}

/** Satu baris barang di layar, lengkap dengan nama produk supaya tabel dapat langsung dibaca. */
interface DetailRow {
    IdProduct: string;
    ProductName: string;
    Sku: string;
    UnitName: string;
    Quantity: number;
    CostPrice: number;
}

export default function GoodsReceivingCreateEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const rolePath = useRolePath();
    const { successNotify } = useSnackbar();
    const isEditMode = Boolean(id);

    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [listWarehouse, setListWarehouse] = useState<SelectListItemModel[]>([]);
    const [listSupplier, setListSupplier] = useState<SelectListItemModel[]>([]);
    const [listProduct, setListProduct] = useState<ProductLookupModel[]>([]);

    const [idWarehouse, setIdWarehouse] = useState("");
    const [idSupplier, setIdSupplier] = useState("");
    const [receivingDate, setReceivingDate] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [note, setNote] = useState("");
    const [listDetail, setListDetail] = useState<DetailRow[]>([]);

    const [selectedProductId, setSelectedProductId] = useState("");
    const [draftQuantity, setDraftQuantity] = useState("1");
    const [draftCostPrice, setDraftCostPrice] = useState("0");
    const [rowErrorMessage, setRowErrorMessage] = useState<string | null>(null);

    const loadInitData = useCallback(() => {
        const url = isEditMode
            ? `/${rolePath}/goods-receiving/get-edit`
            : `/${rolePath}/goods-receiving/get-create`;

        return api
            .post<GoodsReceivingFormModel>(url, isEditMode ? { Id: id } : {})
            .then((response) => {
                const form = response.data;
                setListWarehouse(form.ListWarehouse);
                setListSupplier(form.ListSupplier);
                setListProduct(form.ListProduct);

                const data = form.Data;
                setIdWarehouse(data.IdWarehouse || form.ListWarehouse[0]?.Value || "");
                setIdSupplier(data.IdSupplier || "");
                setReceivingDate((data.ReceivingDate || new Date().toISOString()).slice(0, 10));
                setInvoiceNumber(data.InvoiceNumber ?? "");
                setNote(data.Note ?? "");
                setListDetail(
                    data.ListDetail.map((detail) => {
                        const product = form.ListProduct.find((x) => x.IdProduct === detail.IdProduct);
                        return {
                            IdProduct: detail.IdProduct,
                            ProductName: product?.ProductName ?? "Produk tidak dikenal",
                            Sku: product?.Sku ?? "",
                            UnitName: product?.UnitName ?? "",
                            Quantity: detail.Quantity,
                            CostPrice: detail.CostPrice,
                        };
                    }),
                );
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [id, isEditMode, rolePath]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    /** Harga modal terakhir produk diisikan otomatis supaya petugas tidak mengetik ulang. */
    const handleSelectProduct = (idProduct: string) => {
        setSelectedProductId(idProduct);
        setRowErrorMessage(null);
        const product = listProduct.find((x) => x.IdProduct === idProduct);
        setDraftCostPrice(product ? String(product.CostPrice) : "0");
    };

    const addDetailRow = () => {
        const product = listProduct.find((x) => x.IdProduct === selectedProductId);

        if (!product) {
            setRowErrorMessage("Pilih produk lebih dulu.");
            return;
        }

        if (listDetail.some((x) => x.IdProduct === product.IdProduct)) {
            setRowErrorMessage("Produk ini sudah ada di daftar. Ubah jumlahnya pada baris yang sudah ada.");
            return;
        }

        const quantity = Number(draftQuantity);
        const costPrice = Number(draftCostPrice);

        if (!Number.isFinite(quantity) || quantity < 1) {
            setRowErrorMessage("Jumlah barang minimal 1.");
            return;
        }

        if (!Number.isFinite(costPrice) || costPrice < 0) {
            setRowErrorMessage("Harga modal tidak boleh negatif.");
            return;
        }

        setListDetail((current) => [
            ...current,
            {
                IdProduct: product.IdProduct,
                ProductName: product.ProductName,
                Sku: product.Sku,
                UnitName: product.UnitName,
                Quantity: quantity,
                CostPrice: costPrice,
            },
        ]);

        setSelectedProductId("");
        setDraftQuantity("1");
        setDraftCostPrice("0");
        setRowErrorMessage(null);
    };

    const removeDetailRow = (idProduct: string) => {
        setListDetail((current) => current.filter((x) => x.IdProduct !== idProduct));
    };

    const totalCost = listDetail.reduce((total, row) => total + row.Quantity * row.CostPrice, 0);

    const saveDocument = async (isSubmitted: boolean) => {
        setErrorMessage(null);

        if (!idWarehouse || !idSupplier) {
            setErrorMessage("Gudang tujuan dan supplier wajib dipilih.");
            return;
        }

        if (listDetail.length === 0) {
            setErrorMessage("Tambahkan minimal satu barang sebelum menyimpan dokumen.");
            return;
        }

        setIsSubmitting(true);

        const body = {
            IdGoodsReceiving: id ?? "",
            IdWarehouse: idWarehouse,
            IdSupplier: idSupplier,
            ReceivingDate: receivingDate ? `${receivingDate}T00:00:00` : new Date().toISOString(),
            InvoiceNumber: invoiceNumber || null,
            Note: note || null,
            IsSubmitted: isSubmitted,
            ListDetail: listDetail.map((row) => ({
                IdProduct: row.IdProduct,
                Quantity: row.Quantity,
                CostPrice: row.CostPrice,
            })),
        };

        try {
            const url = isEditMode
                ? `/${rolePath}/goods-receiving/update-goods-receiving`
                : `/${rolePath}/goods-receiving/insert-goods-receiving`;
            const response = await api.post<string>(url, body);
            successNotify(response.data);
            navigate(`/${rolePath}/goods-receiving`);
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
                title={isEditMode ? "Ubah barang masuk" : "Catat barang masuk"}
                description="Simpan sebagai draft dulu bila barang belum selesai dihitung, atau langsung ajukan untuk disetujui supervisor."
            />

            {isLoadingInit ? <LoadingSpinner label="Memuat formulir barang masuk" /> : null}

            {!isLoadingInit && initErrorMessage ? (
                <ErrorAlert message={initErrorMessage} onRetry={handleRetryInit} />
            ) : null}

            {!isLoadingInit && !initErrorMessage ? (
                <div className="flex flex-col gap-6">
                    {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                    <Surface variant="outlined" className="p-5 medium:p-6">
                        <h2 className="mb-4 text-title text-on-surface">Informasi dokumen</h2>

                        <div className="grid gap-5 medium:grid-cols-2">
                            <Select
                                label="Gudang tujuan"
                                required
                                options={listWarehouse}
                                placeholder="Pilih gudang"
                                value={idWarehouse}
                                onChange={(event) => setIdWarehouse(event.target.value)}
                            />

                            <Select
                                label="Supplier"
                                required
                                options={listSupplier}
                                placeholder="Pilih supplier"
                                value={idSupplier}
                                onChange={(event) => setIdSupplier(event.target.value)}
                            />

                            <TextField
                                label="Tanggal terima"
                                type="date"
                                value={receivingDate}
                                onChange={(event) => setReceivingDate(event.target.value)}
                            />

                            <TextField
                                label="Nomor faktur supplier"
                                placeholder="FKT-2026-001"
                                helperText="Opsional. Memudahkan pencocokan dengan surat jalan."
                                value={invoiceNumber}
                                onChange={(event) => setInvoiceNumber(event.target.value)}
                            />
                        </div>

                        <Textarea
                            label="Catatan"
                            containerClassName="mt-5"
                            placeholder="Kondisi barang saat diterima"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                        />
                    </Surface>

                    <Surface variant="outlined" className="overflow-hidden">
                        <div className="border-b border-outline-variant p-5 medium:p-6">
                            <h2 className="mb-4 text-title text-on-surface">Barang yang diterima</h2>

                            <div className="grid gap-4 medium:grid-cols-[2fr_1fr_1fr_auto] medium:items-end">
                                <Select
                                    label="Produk"
                                    options={listProduct.map((product) => ({
                                        Value: product.IdProduct,
                                        Text: product.ProductName,
                                        Description: product.Sku,
                                    }))}
                                    placeholder="Pilih produk"
                                    value={selectedProductId}
                                    onChange={(event) => handleSelectProduct(event.target.value)}
                                />

                                <TextField
                                    label="Jumlah"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    value={draftQuantity}
                                    onChange={(event) => setDraftQuantity(event.target.value)}
                                />

                                <TextField
                                    label="Harga modal"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    value={draftCostPrice}
                                    onChange={(event) => setDraftCostPrice(event.target.value)}
                                />

                                <Button variant="tonal" icon={<Plus size={18} aria-hidden="true" />} onClick={addDetailRow}>
                                    Tambah
                                </Button>
                            </div>

                            {rowErrorMessage ? (
                                <p role="alert" className="mt-3 text-label-small text-error">
                                    {rowErrorMessage}
                                </p>
                            ) : null}
                        </div>

                        {listDetail.length === 0 ? (
                            <EmptyDataAlert
                                title="Belum ada barang di dokumen ini"
                                description="Pilih produk, isi jumlah dan harga modalnya, lalu tekan Tambah. Harga modal terisi otomatis dari data produk dan boleh diubah bila supplier menaikkan harga."
                            />
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[40rem] border-collapse text-left">
                                        <thead className="border-b border-outline-variant bg-surface-low">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                                                    Produk
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                                    Jumlah
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                                    Harga modal
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                                    Subtotal
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-outline-variant">
                                            {listDetail.map((row) => (
                                                <tr key={row.IdProduct}>
                                                    <td className="px-4 py-3">
                                                        <p className="text-body text-on-surface">{row.ProductName}</p>
                                                        <p className="text-label-small text-on-surface-variant">{row.Sku}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-numeric text-body text-on-surface">
                                                        {row.Quantity} {row.UnitName}
                                                    </td>
                                                    <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                                        {formatMoney(row.CostPrice)}
                                                    </td>
                                                    <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                                        {formatMoney(row.Quantity * row.CostPrice)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <IconButton
                                                            label={`Hapus ${row.ProductName} dari dokumen`}
                                                            icon={<Trash2 size={16} />}
                                                            onClick={() => removeDetailRow(row.IdProduct)}
                                                            className="hover:bg-error/12 hover:text-error"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-baseline justify-end gap-4 border-t border-outline-variant px-5 py-4">
                                    <span className="text-label text-on-surface-variant">Total nilai pembelian</span>
                                    <span className="text-numeric text-headline text-on-surface">{formatMoney(totalCost)}</span>
                                </div>
                            </>
                        )}
                    </Surface>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="text" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button variant="outlined" onClick={() => saveDocument(false)} disabled={isSubmitting}>
                            Simpan sebagai draft
                        </Button>
                        <Button onClick={() => saveDocument(true)} isLoading={isSubmitting}>
                            {isSubmitting ? "Menyimpan" : "Simpan dan ajukan"}
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
