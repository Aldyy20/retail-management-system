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
import type { CreateEditUnitModel } from "@/@dataLayer/master-data.models";

const emptyUnit: CreateEditUnitModel = {
    IdUnit: "",
    UnitName: "",
    Description: null,
    IsActive: true,
};

export default function UnitCreateEditPage() {
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
    } = useForm<CreateEditUnitModel>({ defaultValues: emptyUnit });

    const loadInitData = useCallback(() => {
        if (!id) {
            return Promise.resolve();
        }

        return api
            .post<CreateEditUnitModel>("/admin/unit/get-edit", { Id: id })
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

    const onSubmit = async (model: CreateEditUnitModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/unit/update-unit" : "/admin/unit/insert-unit";
            const response = await api.post<string>(url, model);
            successNotify(response.data);
            navigate("/admin/unit");
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
            title={isEditMode ? "Ubah satuan" : "Tambah satuan"}
            description="Satuan menentukan bagaimana barang dihitung saat dijual. Nama satuan disimpan dalam huruf kapital."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan satuan"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={handleRetryInit}
        >
            <TextField
                label="Nama satuan"
                required
                autoFocus
                placeholder="BOTOL"
                helperText="Disimpan dalam huruf kapital, misalnya PCS, BOTOL, KG, atau DUS."
                errorText={errors.UnitName?.message}
                {...register("UnitName", { required: "Nama satuan wajib diisi." })}
            />

            <Textarea
                label="Keterangan"
                placeholder="Botol plastik 600 ml"
                helperText="Opsional. Membantu karyawan lain memahami maksud satuan ini."
                errorText={errors.Description?.message}
                {...register("Description")}
            />

            <Switch
                label="Satuan aktif"
                description="Satuan nonaktif tidak muncul saat menambah produk baru, tetapi produk lama tetap utuh."
                checked={watch("IsActive")}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
