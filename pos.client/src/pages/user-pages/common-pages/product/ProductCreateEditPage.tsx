import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/api";
import { getAxiosErrorMessage, formatMoney } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { FormPageShell } from "@/components/common/FormPageShell";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type { SelectListItemModel } from "@/@dataLayer/base.models";
import type { CreateEditProductModel } from "@/@dataLayer/master-data.models";

interface ProductFormModel {
    ListCategory: SelectListItemModel[];
    ListUnit: SelectListItemModel[];
    Data: CreateEditProductModel;
}

export default function ProductCreateEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { successNotify } = useSnackbar();
    const isEditMode = Boolean(id);

    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [listCategory, setListCategory] = useState<SelectListItemModel[]>([]);
    const [listUnit, setListUnit] = useState<SelectListItemModel[]>([]);
    const [initialSellingPrice, setInitialSellingPrice] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateEditProductModel>();

    const loadInitData = useCallback(() => {
        const url = isEditMode ? "/admin/product/get-edit" : "/admin/product/get-create";
        const body = isEditMode ? { Id: id } : {};

        return api
            .post<ProductFormModel>(url, body)
            .then((response) => {
                setListCategory(response.data.ListCategory);
                setListUnit(response.data.ListUnit);
                reset(response.data.Data);
                setInitialSellingPrice(isEditMode ? response.data.Data.SellingPrice : null);
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [id, isEditMode, reset]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const onSubmit = async (model: CreateEditProductModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/product/update-product" : "/admin/product/insert-product";
            const response = await api.post<string>(url, {
                ...model,
                CostPrice: Number(model.CostPrice),
                SellingPrice: Number(model.SellingPrice),
                MinimumStock: Number(model.MinimumStock),
            });
            successNotify(response.data);
            navigate("/admin/product");
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

    const costPrice = Number(watch("CostPrice")) || 0;
    const sellingPrice = Number(watch("SellingPrice")) || 0;
    const profit = sellingPrice - costPrice;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const isPriceChanged = initialSellingPrice !== null && sellingPrice !== initialSellingPrice;

    const photoFileName = watch("PhotoFileName") ?? null;
    const hasMasterData = listCategory.length > 0 && listUnit.length > 0;

    return (
        <FormPageShell
            title={isEditMode ? "Ubah produk" : "Tambah produk"}
            description="Harga yang disimpan di sini dipakai kasir saat transaksi. Perubahan harga tercatat pada histori."
            isLoadingInit={isLoadingInit}
            initErrorMessage={
                initErrorMessage ??
                (hasMasterData
                    ? null
                    : "Kategori atau satuan aktif belum tersedia. Tambahkan keduanya lebih dulu sebelum membuat produk.")
            }
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan produk"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={handleRetryInit}
        >
            <TextField
                label="Nama barang"
                required
                autoFocus
                placeholder="Air Mineral 600ml"
                errorText={errors.ProductName?.message}
                {...register("ProductName", {
                    required: "Nama barang wajib diisi.",
                    minLength: { value: 2, message: "Nama barang minimal 2 karakter." },
                })}
            />

            <div className="grid gap-5 medium:grid-cols-2">
                <TextField
                    label="SKU"
                    placeholder="Dibuat otomatis"
                    helperText={isEditMode ? "SKU tidak berubah setelah produk dibuat." : "Kosongkan untuk membuat SKU otomatis."}
                    readOnly={isEditMode}
                    errorText={errors.Sku?.message}
                    {...register("Sku")}
                />

                <TextField
                    label="Barcode"
                    inputMode="numeric"
                    placeholder="8991234567890"
                    helperText="Opsional, tetapi harus unik bila diisi."
                    errorText={errors.Barcode?.message}
                    {...register("Barcode")}
                />
            </div>

            <ImageUploadField
                label="Foto barang"
                helperText="Opsional. JPG, PNG, atau WEBP, maksimal 3 MB. Foto tampil pada daftar produk dan halaman rinciannya."
                uploadUrl="/admin/product/upload-photo"
                folder="product"
                value={photoFileName}
                onChange={(fileName) => setValue("PhotoFileName", fileName, { shouldDirty: true })}
            />

            <div className="grid gap-5 medium:grid-cols-2">
                <Select
                    label="Kategori"
                    required
                    options={listCategory}
                    placeholder="Pilih kategori"
                    errorText={errors.IdCategory?.message}
                    {...register("IdCategory", { required: "Kategori wajib dipilih." })}
                />

                <Select
                    label="Satuan"
                    required
                    options={listUnit}
                    placeholder="Pilih satuan"
                    errorText={errors.IdUnit?.message}
                    {...register("IdUnit", { required: "Satuan wajib dipilih." })}
                />
            </div>

            <div className="grid gap-5 medium:grid-cols-3">
                <TextField
                    label="Harga modal"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    required
                    errorText={errors.CostPrice?.message}
                    {...register("CostPrice", {
                        required: "Harga modal wajib diisi.",
                        min: { value: 0, message: "Harga modal tidak boleh negatif." },
                    })}
                />

                <TextField
                    label="Harga jual"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    required
                    errorText={errors.SellingPrice?.message}
                    {...register("SellingPrice", {
                        required: "Harga jual wajib diisi.",
                        min: { value: 0, message: "Harga jual tidak boleh negatif." },
                        validate: (value) =>
                            Number(value) >= costPrice || "Harga jual tidak boleh lebih rendah dari harga modal.",
                    })}
                />

                <TextField
                    label="Minimum stok"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    helperText="Batas peringatan stok menipis."
                    errorText={errors.MinimumStock?.message}
                    {...register("MinimumStock", {
                        min: { value: 0, message: "Minimum stok tidak boleh negatif." },
                    })}
                />
            </div>

            {/*
              * Keuntungan dihitung ulang saat mengetik supaya admin melihat akibat
              * perubahan harga sebelum menyimpan, bukan setelahnya.
              */}
            <dl className="flex flex-wrap gap-x-8 gap-y-2 rounded-(--radius-control) bg-surface-container px-4 py-3">
                <div className="flex items-baseline gap-2">
                    <dt className="text-label-small text-on-surface-variant">Untung per satuan</dt>
                    <dd className="text-numeric text-title-small text-on-surface">{formatMoney(profit)}</dd>
                </div>
                <div className="flex items-baseline gap-2">
                    <dt className="text-label-small text-on-surface-variant">Margin</dt>
                    <dd className="text-numeric text-title-small text-on-surface">
                        {sellingPrice > 0 ? margin.toFixed(2).replace(".", ",") + "%" : "-"}
                    </dd>
                </div>
            </dl>

            {isPriceChanged ? (
                <TextField
                    label="Catatan perubahan harga"
                    placeholder="Penyesuaian harga distributor"
                    helperText="Tersimpan pada histori harga sehingga alasan perubahan tetap dapat ditelusuri."
                    errorText={errors.PriceChangeNote?.message}
                    {...register("PriceChangeNote")}
                />
            ) : null}

            <Textarea
                label="Deskripsi"
                placeholder="Kemasan botol 600 ml"
                errorText={errors.Description?.message}
                {...register("Description")}
            />

            <Switch
                label="Produk aktif"
                description="Produk nonaktif tidak muncul di kasir, tetapi riwayat transaksinya tetap tersimpan."
                checked={watch("IsActive") ?? true}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
