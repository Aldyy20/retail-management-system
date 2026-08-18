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
import type { CreateEditCategoryModel } from "@/@dataLayer/master-data.models";

const emptyCategory: CreateEditCategoryModel = {
    IdCategory: "",
    CategoryName: "",
    Description: null,
    IsActive: true,
};

export default function CategoryCreateEditPage() {
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
    } = useForm<CreateEditCategoryModel>({ defaultValues: emptyCategory });

    const loadInitData = useCallback(() => {
        if (!id) {
            return Promise.resolve();
        }

        return api
            .post<CreateEditCategoryModel>("/admin/category/get-edit", { Id: id })
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

    const onSubmit = async (model: CreateEditCategoryModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/category/update-category" : "/admin/category/insert-category";
            const response = await api.post<string>(url, model);
            successNotify(response.data);
            navigate("/admin/category");
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
            title={isEditMode ? "Ubah kategori" : "Tambah kategori"}
            description="Kategori dipakai untuk mengelompokkan produk pada pencarian kasir dan laporan penjualan."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan kategori"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={handleRetryInit}
        >
            <TextField
                label="Nama kategori"
                required
                autoFocus
                placeholder="Minuman"
                errorText={errors.CategoryName?.message}
                {...register("CategoryName", {
                    required: "Nama kategori wajib diisi.",
                    minLength: { value: 2, message: "Nama kategori minimal 2 karakter." },
                })}
            />

            <Textarea
                label="Keterangan"
                placeholder="Air, teh, dan kopi kemasan"
                helperText="Opsional. Membantu karyawan lain memahami isi kategori ini."
                errorText={errors.Description?.message}
                {...register("Description")}
            />

            <Switch
                label="Kategori aktif"
                description="Kategori nonaktif tidak muncul saat menambah produk baru, tetapi produk lama tetap utuh."
                checked={watch("IsActive")}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
