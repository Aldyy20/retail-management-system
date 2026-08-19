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
import type { CreateEditPointRedemptionRuleModel } from "@/@dataLayer/member.models";

const emptyRule: CreateEditPointRedemptionRuleModel = {
    IdPointRedemptionRule: "",
    RuleName: "",
    PointRequired: 100,
    DiscountValueType: DISCOUNT_VALUE_TYPE.Percentage,
    DiscountValue: 5,
    MaximumDiscount: 0,
    MinimumPurchase: 0,
    IsActive: true,
};

const discountTypeOptions = [
    { Value: String(DISCOUNT_VALUE_TYPE.Percentage), Text: "Persentase dari belanja", Description: null },
    { Value: String(DISCOUNT_VALUE_TYPE.FixedAmount), Text: "Potongan rupiah tetap", Description: null },
];

export default function PointRedemptionRuleCreateEditPage() {
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
    } = useForm<CreateEditPointRedemptionRuleModel>({ defaultValues: emptyRule });

    const loadInitData = useCallback(() => {
        if (!id) {
            return Promise.resolve();
        }

        return api
            .post<CreateEditPointRedemptionRuleModel>("/admin/point-redemption-rule/get-edit", { Id: id })
            .then((response) => {
                reset(response.data);
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [id, reset]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const onSubmit = async (model: CreateEditPointRedemptionRuleModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode
                ? "/admin/point-redemption-rule/update-point-redemption-rule"
                : "/admin/point-redemption-rule/insert-point-redemption-rule";
            const response = await api.post<string>(url, {
                ...model,
                PointRequired: Number(model.PointRequired),
                DiscountValueType: Number(model.DiscountValueType),
                DiscountValue: Number(model.DiscountValue),
                MaximumDiscount: Number(model.MaximumDiscount),
                MinimumPurchase: Number(model.MinimumPurchase),
            });
            successNotify(response.data);
            navigate("/admin/point-redemption-rule");
        } catch (error) {
            setErrorMessage(getAxiosErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPercentage = Number(watch("DiscountValueType")) === DISCOUNT_VALUE_TYPE.Percentage;

    return (
        <FormPageShell
            title={isEditMode ? "Ubah aturan penukaran" : "Tambah aturan penukaran"}
            description="Aturan ini muncul sebagai pilihan di layar kasir ketika member punya cukup point."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan aturan"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={() => {
                setIsLoadingInit(true);
                loadInitData();
            }}
        >
            <TextField
                label="Nama aturan"
                required
                autoFocus
                placeholder="Tukar 100 point"
                helperText="Nama ini yang dibaca kasir saat memilih penukaran."
                errorText={errors.RuleName?.message}
                {...register("RuleName", {
                    required: "Nama aturan wajib diisi.",
                    minLength: { value: 2, message: "Nama aturan minimal 2 karakter." },
                })}
            />

            <div className="grid gap-5 medium:grid-cols-2">
                <TextField
                    label="Point dibutuhkan"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    errorText={errors.PointRequired?.message}
                    {...register("PointRequired", {
                        required: "Point dibutuhkan wajib diisi.",
                        min: { value: 1, message: "Point dibutuhkan minimal 1." },
                    })}
                />

                <Select
                    label="Jenis potongan"
                    required
                    options={discountTypeOptions}
                    placeholder="Pilih jenis potongan"
                    errorText={errors.DiscountValueType?.message}
                    {...register("DiscountValueType", { required: "Jenis potongan wajib dipilih." })}
                />
            </div>

            <div className="grid gap-5 medium:grid-cols-2">
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
                    })}
                />

                <TextField
                    label="Maksimum potongan"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    helperText={
                        isPercentage
                            ? "Batas atas potongan dalam rupiah. Isi 0 bila tanpa batas."
                            : "Tidak dipakai untuk potongan rupiah tetap."
                    }
                    errorText={errors.MaximumDiscount?.message}
                    {...register("MaximumDiscount", { min: { value: 0, message: "Tidak boleh negatif." } })}
                />
            </div>

            <TextField
                label="Minimum belanja"
                type="number"
                inputMode="numeric"
                min={0}
                helperText="Aturan baru dapat dipakai bila belanja mencapai jumlah ini. Isi 0 bila tanpa syarat."
                errorText={errors.MinimumPurchase?.message}
                {...register("MinimumPurchase", { min: { value: 0, message: "Tidak boleh negatif." } })}
            />

            <Switch
                label="Aturan aktif"
                description="Aturan nonaktif tidak muncul sebagai pilihan di kasir, tetapi penukaran lama tetap tercatat."
                checked={watch("IsActive")}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
