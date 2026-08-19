import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { FormPageShell } from "@/components/common/FormPageShell";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { DISCOUNT_VALUE_TYPE } from "@/@dataLayer/member.models";
import type { CreateEditVoucherModel } from "@/@dataLayer/promo.models";

const today = new Date().toISOString().slice(0, 10);

const emptyVoucher: CreateEditVoucherModel = {
    IdVoucher: "",
    VoucherCode: "",
    VoucherName: "",
    DiscountValueType: DISCOUNT_VALUE_TYPE.Percentage,
    DiscountValue: 10,
    MinimumPurchase: 0,
    MaximumDiscount: 0,
    StartDate: today,
    EndDate: today,
    UsageLimit: 0,
    IsMemberOnly: false,
    IsActive: true,
};

const discountTypeOptions = [
    { Value: String(DISCOUNT_VALUE_TYPE.Percentage), Text: "Persentase dari belanja", Description: null },
    { Value: String(DISCOUNT_VALUE_TYPE.FixedAmount), Text: "Potongan rupiah tetap", Description: null },
];

export default function VoucherCreateEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { successNotify } = useSnackbar();
    const isEditMode = Boolean(id);

    const [isLoadingInit, setIsLoadingInit] = useState(isEditMode);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateEditVoucherModel>({ defaultValues: emptyVoucher });

    const loadInitData = useCallback(() => {
        if (!id) {
            return Promise.resolve();
        }

        return api
            .post<CreateEditVoucherModel>("/admin/voucher/get-edit", { Id: id })
            .then((response) => {
                reset({
                    ...response.data,
                    StartDate: response.data.StartDate.slice(0, 10),
                    EndDate: response.data.EndDate.slice(0, 10),
                });
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [id, reset]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const onSubmit = async (model: CreateEditVoucherModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/voucher/update-voucher" : "/admin/voucher/insert-voucher";
            const response = await api.post<string>(url, {
                ...model,
                DiscountValueType: Number(model.DiscountValueType),
                DiscountValue: Number(model.DiscountValue),
                MinimumPurchase: Number(model.MinimumPurchase),
                MaximumDiscount: Number(model.MaximumDiscount),
                UsageLimit: Number(model.UsageLimit),
                StartDate: `${model.StartDate}T00:00:00`,
                EndDate: `${model.EndDate}T00:00:00`,
            });
            successNotify(response.data);
            navigate("/admin/voucher");
        } catch (error) {
            setErrorMessage(getAxiosErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPercentage = Number(watch("DiscountValueType")) === DISCOUNT_VALUE_TYPE.Percentage;

    return (
        <FormPageShell
            title={isEditMode ? "Ubah voucher" : "Tambah voucher"}
            description="Kode voucher disimpan kapital dan diperiksa server saat kasir menebusnya."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan voucher"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={() => {
                setIsLoadingInit(true);
                loadInitData();
            }}
        >
            <div className="grid gap-5 medium:grid-cols-2">
                <TextField
                    label="Kode voucher"
                    required
                    autoFocus
                    placeholder="HEMAT20"
                    helperText="Yang diketik kasir. Disimpan kapital dan harus unik."
                    errorText={errors.VoucherCode?.message}
                    {...register("VoucherCode", {
                        required: "Kode voucher wajib diisi.",
                        minLength: { value: 3, message: "Kode voucher minimal 3 karakter." },
                    })}
                />

                <TextField
                    label="Nama voucher"
                    required
                    placeholder="Hemat 20 Persen"
                    errorText={errors.VoucherName?.message}
                    {...register("VoucherName", {
                        required: "Nama voucher wajib diisi.",
                        minLength: { value: 2, message: "Nama voucher minimal 2 karakter." },
                    })}
                />
            </div>

            <div className="grid gap-5 medium:grid-cols-2">
                <Select
                    label="Jenis potongan"
                    required
                    options={discountTypeOptions}
                    placeholder="Pilih jenis potongan"
                    errorText={errors.DiscountValueType?.message}
                    {...register("DiscountValueType", { required: "Jenis potongan wajib dipilih." })}
                />

                <TextField
                    label={isPercentage ? "Besar potongan (persen)" : "Besar potongan (rupiah)"}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    required
                    errorText={errors.DiscountValue?.message}
                    {...register("DiscountValue", {
                        required: "Besar potongan wajib diisi.",
                        min: { value: 0.01, message: "Besar potongan harus lebih dari nol." },
                        max: isPercentage
                            ? { value: 100, message: "Potongan persentase tidak boleh lebih dari 100." }
                            : undefined,
                    })}
                />
            </div>

            <div className="grid gap-5 medium:grid-cols-2">
                <TextField
                    label="Minimum belanja"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    helperText="Isi 0 bila tanpa syarat minimum."
                    errorText={errors.MinimumPurchase?.message}
                    {...register("MinimumPurchase", { min: { value: 0, message: "Tidak boleh negatif." } })}
                />

                <TextField
                    label="Maksimum potongan"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    helperText={
                        isPercentage ? "Batas atas potongan. Isi 0 bila tanpa batas." : "Tidak dipakai untuk potongan tetap."
                    }
                    errorText={errors.MaximumDiscount?.message}
                    {...register("MaximumDiscount", { min: { value: 0, message: "Tidak boleh negatif." } })}
                />
            </div>

            <div className="grid gap-5 medium:grid-cols-3">
                <TextField
                    label="Mulai berlaku"
                    type="date"
                    required
                    errorText={errors.StartDate?.message}
                    {...register("StartDate", { required: "Tanggal mulai wajib diisi." })}
                />

                <TextField
                    label="Berakhir"
                    type="date"
                    required
                    errorText={errors.EndDate?.message}
                    {...register("EndDate", { required: "Tanggal berakhir wajib diisi." })}
                />

                <TextField
                    label="Kuota pemakaian"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    helperText="Isi 0 bila tanpa batas."
                    errorText={errors.UsageLimit?.message}
                    {...register("UsageLimit", { min: { value: 0, message: "Tidak boleh negatif." } })}
                />
            </div>

            <Switch
                label="Khusus member"
                description="Bila dinyalakan, voucher hanya dapat dipakai transaksi yang memilih member lebih dulu."
                checked={watch("IsMemberOnly")}
                onChange={(event) => setValue("IsMemberOnly", event.target.checked)}
            />

            <Switch
                label="Voucher aktif"
                description="Voucher nonaktif ditolak kasir meski periodenya masih berjalan."
                checked={watch("IsActive")}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
