import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { FormPageShell } from "@/components/common/FormPageShell";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import type { CreateEditSupplierModel } from "@/@dataLayer/master-data.models";

const emptySupplier: CreateEditSupplierModel = {
    IdSupplier: "",
    SupplierName: "",
    ContactName: null,
    PhoneNumber: null,
    Email: null,
    Address: null,
    IsActive: true,
};

export default function SupplierCreateEditPage() {
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
    } = useForm<CreateEditSupplierModel>({ defaultValues: emptySupplier });

    const loadInitData = useCallback(() => {
        if (!id) {
            return Promise.resolve();
        }

        return api
            .post<CreateEditSupplierModel>("/admin/supplier/get-edit", { Id: id })
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

    const onSubmit = async (model: CreateEditSupplierModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/supplier/update-supplier" : "/admin/supplier/insert-supplier";
            const response = await api.post<string>(url, model);
            successNotify(response.data);
            navigate("/admin/supplier");
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
        <FormPageShell
            title={isEditMode ? "Ubah supplier" : "Tambah supplier"}
            description="Data pemasok yang dipilih saat mencatat barang masuk."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan supplier"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={handleRetryInit}
        >
            <TextField
                label="Nama supplier"
                required
                autoFocus
                placeholder="PT Sumber Rejeki"
                errorText={errors.SupplierName?.message}
                {...register("SupplierName", {
                    required: "Nama supplier wajib diisi.",
                    minLength: { value: 2, message: "Nama supplier minimal 2 karakter." },
                })}
            />

            <div className="grid gap-5 medium:grid-cols-2">
                <TextField
                    label="Nama kontak"
                    placeholder="Budi"
                    helperText="Orang yang biasa dihubungi."
                    errorText={errors.ContactName?.message}
                    {...register("ContactName")}
                />

                <TextField
                    label="Nomor telepon"
                    type="tel"
                    inputMode="tel"
                    placeholder="081234567890"
                    helperText="Disimpan dalam format 08xxxxxxxxxx."
                    errorText={errors.PhoneNumber?.message}
                    {...register("PhoneNumber")}
                />
            </div>

            <TextField
                label="Email"
                type="email"
                placeholder="kontak@supplier.co.id"
                errorText={errors.Email?.message}
                {...register("Email", {
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Format email tidak valid." },
                })}
            />

            <Textarea
                label="Alamat"
                placeholder="Jl. Contoh No. 123, Kupang"
                errorText={errors.Address?.message}
                {...register("Address")}
            />

            <Switch
                label="Supplier aktif"
                description="Supplier nonaktif tidak muncul saat mencatat barang masuk, tetapi riwayat lamanya tetap tersimpan."
                checked={watch("IsActive")}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
