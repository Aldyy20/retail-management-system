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
import type { CreateEditWarehouseModel } from "@/@dataLayer/master-data.models";

const emptyWarehouse: CreateEditWarehouseModel = {
    IdWarehouse: "",
    WarehouseCode: "",
    WarehouseName: "",
    Address: null,
    Description: null,
    IsDefault: false,
    IsActive: true,
};

export default function WarehouseCreateEditPage() {
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
    } = useForm<CreateEditWarehouseModel>({ defaultValues: emptyWarehouse });

    const loadInitData = useCallback(() => {
        if (!id) {
            return Promise.resolve();
        }

        return api
            .post<CreateEditWarehouseModel>("/admin/warehouse/get-edit", { Id: id })
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

    const onSubmit = async (model: CreateEditWarehouseModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/warehouse/update-warehouse" : "/admin/warehouse/insert-warehouse";
            const response = await api.post<string>(url, model);
            successNotify(response.data);
            navigate("/admin/warehouse");
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

    const isCurrentlyDefault = isEditMode && watch("IsDefault");

    return (
        <FormPageShell
            title={isEditMode ? "Ubah gudang" : "Tambah gudang"}
            description="Stok dicatat per gudang, sehingga setiap barang selalu diketahui berada di mana."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan gudang"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={handleRetryInit}
        >
            <div className="grid gap-5 medium:grid-cols-[10rem_1fr]">
                <TextField
                    label="Kode gudang"
                    required
                    autoFocus
                    placeholder="GD01"
                    helperText="Disimpan kapital."
                    errorText={errors.WarehouseCode?.message}
                    {...register("WarehouseCode", {
                        required: "Kode gudang wajib diisi.",
                        minLength: { value: 2, message: "Kode gudang minimal 2 karakter." },
                    })}
                />

                <TextField
                    label="Nama gudang"
                    required
                    placeholder="Gudang Utama"
                    errorText={errors.WarehouseName?.message}
                    {...register("WarehouseName", {
                        required: "Nama gudang wajib diisi.",
                        minLength: { value: 2, message: "Nama gudang minimal 2 karakter." },
                    })}
                />
            </div>

            <Textarea
                label="Alamat"
                placeholder="Jl. Contoh No. 123, Kupang"
                errorText={errors.Address?.message}
                {...register("Address")}
            />

            <Textarea
                label="Keterangan"
                placeholder="Gudang belakang untuk stok cadangan"
                errorText={errors.Description?.message}
                {...register("Description")}
            />

            <Switch
                label="Jadikan gudang utama"
                description={
                    isCurrentlyDefault
                        ? "Gudang ini sedang menjadi gudang utama. Untuk memindahkannya, tetapkan gudang lain sebagai gudang utama."
                        : "Gudang utama menjadi tujuan bawaan barang masuk dan sumber stok transaksi kasir. Hanya satu gudang yang dapat menyandangnya."
                }
                checked={watch("IsDefault")}
                disabled={isCurrentlyDefault}
                onChange={(event) => setValue("IsDefault", event.target.checked)}
            />

            <Switch
                label="Gudang aktif"
                description="Gudang nonaktif tidak muncul saat mencatat barang masuk atau stock opname."
                checked={watch("IsActive")}
                disabled={isCurrentlyDefault}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
