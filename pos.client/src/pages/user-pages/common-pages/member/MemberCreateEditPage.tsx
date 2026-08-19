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
import type { CreateEditMemberModel } from "@/@dataLayer/member.models";

const emptyMember: CreateEditMemberModel = {
    IdMember: "",
    PhoneNumber: "",
    MemberName: "",
    Email: null,
    Address: null,
    IsActive: true,
};

export default function MemberCreateEditPage() {
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
    } = useForm<CreateEditMemberModel>({ defaultValues: emptyMember });

    const loadInitData = useCallback(() => {
        if (!id) {
            return Promise.resolve();
        }

        return api
            .post<CreateEditMemberModel>("/admin/member/get-edit", { Id: id })
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

    const onSubmit = async (model: CreateEditMemberModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/member/update-member" : "/admin/member/insert-member";
            const response = await api.post<string>(url, model);
            successNotify(response.data);
            navigate("/admin/member");
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
            title={isEditMode ? "Ubah member" : "Tambah member"}
            description="Nomor HP menjadi identitas member dan harus unik. Saldo point diubah lewat halaman detail, bukan dari sini."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan member"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={handleRetryInit}
        >
            <TextField
                label="Nomor HP"
                type="tel"
                inputMode="tel"
                required
                autoFocus
                placeholder="081234567890"
                helperText="Disimpan dalam format 08xxxxxxxxxx dan tidak boleh sama dengan member lain."
                errorText={errors.PhoneNumber?.message}
                {...register("PhoneNumber", {
                    required: "Nomor HP wajib diisi.",
                    minLength: { value: 8, message: "Nomor HP minimal 8 digit." },
                })}
            />

            <TextField
                label="Nama member"
                required
                placeholder="Andi Wijaya"
                errorText={errors.MemberName?.message}
                {...register("MemberName", {
                    required: "Nama member wajib diisi.",
                    minLength: { value: 2, message: "Nama member minimal 2 karakter." },
                })}
            />

            <TextField
                label="Email"
                type="email"
                placeholder="andi@mail.local"
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
                label="Member aktif"
                description="Member nonaktif tidak dapat dipilih kasir, tetapi riwayat belanja dan saldo pointnya tetap tersimpan."
                checked={watch("IsActive")}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
