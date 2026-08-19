import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { DISCOUNT_VALUE_TYPE } from "@/@dataLayer/member.models";
import type { ProductLookupModel } from "@/@dataLayer/inventory.models";
import type { CreateEditDiscountModel } from "@/@dataLayer/promo.models";

interface DiscountFormModel {
    ListProduct: ProductLookupModel[];
    Data: CreateEditDiscountModel;
}

const discountTypeOptions = [
    { Value: String(DISCOUNT_VALUE_TYPE.Percentage), Text: "Persentase dari harga", Description: null },
    { Value: String(DISCOUNT_VALUE_TYPE.FixedAmount), Text: "Potongan rupiah per satuan", Description: null },
];

export default function DiscountCreateEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { successNotify } = useSnackbar();
    const isEditMode = Boolean(id);

    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [listProduct, setListProduct] = useState<ProductLookupModel[]>([]);
    const [discountName, setDiscountName] = useState("");
    const [discountValueType, setDiscountValueType] = useState(String(DISCOUNT_VALUE_TYPE.Percentage));
    const [discountValue, setDiscountValue] = useState("10");
    const [maximumDiscount, setMaximumDiscount] = useState("0");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState("");

    const loadInitData = useCallback(() => {
        const url = isEditMode ? "/admin/discount/get-edit" : "/admin/discount/get-create";

        return api
            .post<DiscountFormModel>(url, isEditMode ? { Id: id } : {})
            .then((response) => {
                const data = response.data.Data;
                setListProduct(response.data.ListProduct);
                setDiscountName(data.DiscountName);
                setDiscountValueType(String(data.DiscountValueType));
                setDiscountValue(String(data.DiscountValue));
                setMaximumDiscount(String(data.MaximumDiscount));
                setStartDate(data.StartDate.slice(0, 10));
                setEndDate(data.EndDate.slice(0, 10));
                setIsActive(data.IsActive);
                setSelectedProductIds(data.ListIdProduct ?? []);
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [id, isEditMode]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const toggleProduct = (idProduct: string) => {
        setSelectedProductIds((current) =>
            current.includes(idProduct) ? current.filter((x) => x !== idProduct) : [...current, idProduct],
        );
    };

    const visibleProducts = useMemo(() => {
        const keyword = productSearch.trim().toLowerCase();

        if (keyword.length === 0) {
            return listProduct;
        }

        return listProduct.filter(
            (product) =>
                product.ProductName.toLowerCase().includes(keyword) || product.Sku.toLowerCase().includes(keyword),
        );
    }, [listProduct, productSearch]);

    const saveDiscount = async () => {
        setErrorMessage(null);

        if (discountName.trim().length < 2) {
            setErrorMessage("Nama diskon wajib diisi, minimal 2 karakter.");
            return;
        }

        if (selectedProductIds.length === 0) {
            setErrorMessage("Pilih minimal satu produk yang terkena diskon ini.");
            return;
        }

        setIsSubmitting(true);

        try {
            const url = isEditMode ? "/admin/discount/update-discount" : "/admin/discount/insert-discount";
            const response = await api.post<string>(url, {
                IdDiscount: id ?? "",
                DiscountName: discountName,
                DiscountValueType: Number(discountValueType),
                DiscountValue: Number(discountValue),
                MaximumDiscount: Number(maximumDiscount),
                StartDate: `${startDate}T00:00:00`,
                EndDate: `${endDate}T00:00:00`,
                IsActive: isActive,
                ListIdProduct: selectedProductIds,
            });
            successNotify(response.data);
            navigate("/admin/discount");
        } catch (error) {
            setErrorMessage(getAxiosErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPercentage = Number(discountValueType) === DISCOUNT_VALUE_TYPE.Percentage;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={isEditMode ? "Ubah diskon produk" : "Tambah diskon produk"}
                description="Potongan berlaku otomatis di kasir selama periodenya berjalan. Kasir tidak perlu memasukkan apa pun."
            />

            {isLoadingInit ? <LoadingSpinner label="Memuat formulir diskon" /> : null}

            {!isLoadingInit && initErrorMessage ? (
                <ErrorAlert
                    message={initErrorMessage}
                    onRetry={() => {
                        setIsLoadingInit(true);
                        loadInitData();
                    }}
                />
            ) : null}

            {!isLoadingInit && !initErrorMessage ? (
                <div className="flex flex-col gap-6">
                    {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                    <Surface variant="outlined" className="p-5 medium:p-6">
                        <h2 className="mb-4 text-title text-on-surface">Ketentuan diskon</h2>

                        <div className="flex flex-col gap-5">
                            <TextField
                                label="Nama diskon"
                                required
                                autoFocus
                                placeholder="Promo Teh Agustus"
                                value={discountName}
                                onChange={(event) => setDiscountName(event.target.value)}
                            />

                            <div className="grid gap-5 medium:grid-cols-2">
                                <Select
                                    label="Jenis potongan"
                                    required
                                    options={discountTypeOptions}
                                    placeholder="Pilih jenis potongan"
                                    value={discountValueType}
                                    onChange={(event) => setDiscountValueType(event.target.value)}
                                />

                                <TextField
                                    label={isPercentage ? "Besar potongan (persen)" : "Besar potongan per satuan (rupiah)"}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step="any"
                                    required
                                    value={discountValue}
                                    onChange={(event) => setDiscountValue(event.target.value)}
                                />
                            </div>

                            <div className="grid gap-5 medium:grid-cols-3">
                                <TextField
                                    label="Maksimum per satuan"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    helperText={isPercentage ? "Isi 0 bila tanpa batas." : "Tidak dipakai untuk potongan tetap."}
                                    value={maximumDiscount}
                                    onChange={(event) => setMaximumDiscount(event.target.value)}
                                />

                                <TextField
                                    label="Mulai berlaku"
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(event) => setStartDate(event.target.value)}
                                />

                                <TextField
                                    label="Berakhir"
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={(event) => setEndDate(event.target.value)}
                                />
                            </div>

                            <Switch
                                label="Diskon aktif"
                                description="Diskon nonaktif tidak dipakai kasir meski periodenya masih berjalan."
                                checked={isActive}
                                onChange={(event) => setIsActive(event.target.checked)}
                            />
                        </div>
                    </Surface>

                    <Surface variant="outlined" className="overflow-hidden">
                        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant p-4">
                            <div>
                                <h2 className="text-title text-on-surface">Produk yang terkena diskon</h2>
                                <p className="text-label-small text-on-surface-variant">
                                    {selectedProductIds.length} produk dipilih
                                </p>
                            </div>

                            <TextField
                                label="Cari produk"
                                placeholder="Nama atau SKU"
                                value={productSearch}
                                leadingIcon={<Search size={18} />}
                                containerClassName="w-full medium:max-w-xs"
                                onChange={(event) => setProductSearch(event.target.value)}
                            />
                        </div>

                        {visibleProducts.length === 0 ? (
                            <p className="px-6 py-10 text-center text-body text-on-surface-variant">
                                Tidak ada produk yang cocok dengan pencarian itu.
                            </p>
                        ) : (
                            <ul className="max-h-96 divide-y divide-outline-variant overflow-y-auto">
                                {visibleProducts.map((product) => (
                                    <li key={product.IdProduct}>
                                        <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 hover:bg-on-surface/6">
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product.IdProduct)}
                                                onChange={() => toggleProduct(product.IdProduct)}
                                                className="size-5 accent-[var(--md-primary)]"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-body text-on-surface">{product.ProductName}</span>
                                                <span className="block text-label-small text-on-surface-variant">
                                                    {product.Sku}
                                                </span>
                                            </span>
                                            <span className="text-numeric text-body text-on-surface-variant">
                                                {product.StrSellingPrice}
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Surface>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="text" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button onClick={saveDiscount} isLoading={isSubmitting}>
                            {isSubmitting ? "Menyimpan" : isEditMode ? "Simpan perubahan" : "Simpan diskon"}
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
