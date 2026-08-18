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
import { useAuth } from "@/components/router/AuthContext";
import type { SelectListItemModel } from "@/@dataLayer/base.models";
import type { CreateEditUserModel } from "@/@dataLayer/employee.models";

interface EmployeeFormModel {
    ListRole: SelectListItemModel[];
    Data: CreateEditUserModel;
}

export default function EmployeeCreateEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { successNotify } = useSnackbar();
    const isEditMode = Boolean(id);
    const isOwnAccount = isEditMode && id === currentUser?.Id;

    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [listRole, setListRole] = useState<SelectListItemModel[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateEditUserModel>();

    const loadInitData = useCallback(() => {
        const url = isEditMode ? "/admin/employee/get-edit" : "/admin/employee/get-create";
        const body = isEditMode ? { Id: id } : {};

        return api
            .post<EmployeeFormModel>(url, body)
            .then((response) => {
                setListRole(response.data.ListRole);
                reset(response.data.Data);
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [id, isEditMode, reset]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const onSubmit = async (model: CreateEditUserModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const url = isEditMode ? "/admin/employee/update-employee" : "/admin/employee/insert-employee";
            const response = await api.post<string>(url, model);
            successNotify(response.data);
            navigate("/admin/employee");
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
            title={isEditMode ? "Ubah pengguna" : "Tambah pengguna"}
            description="Role menentukan menu yang dapat dibuka dan tindakan yang boleh dilakukan pengguna ini."
            isLoadingInit={isLoadingInit}
            initErrorMessage={initErrorMessage}
            errorMessage={errorMessage}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Simpan perubahan" : "Simpan pengguna"}
            onSubmit={handleSubmit(onSubmit)}
            onRetryInit={handleRetryInit}
        >
            <TextField
                label="Nama lengkap"
                required
                autoFocus
                placeholder="Budi Santoso"
                errorText={errors.FullName?.message}
                {...register("FullName", { required: "Nama lengkap wajib diisi." })}
            />

            <TextField
                label="Nama pengguna"
                required
                autoComplete="off"
                placeholder="budi"
                helperText="Dipakai untuk masuk ke sistem. Hanya huruf, angka, titik, dan garis bawah."
                errorText={errors.UserName?.message}
                {...register("UserName", {
                    required: "Nama pengguna wajib diisi.",
                    minLength: { value: 3, message: "Nama pengguna minimal 3 karakter." },
                })}
            />

            <div className="grid gap-5 medium:grid-cols-2">
                <TextField
                    label="Email"
                    type="email"
                    placeholder="budi@toko.local"
                    errorText={errors.Email?.message}
                    {...register("Email", {
                        pattern: { value: /^\S+@\S+\.\S+$/, message: "Format email tidak valid." },
                    })}
                />

                <TextField
                    label="Nomor HP"
                    type="tel"
                    inputMode="tel"
                    placeholder="081234567890"
                    errorText={errors.PhoneNumber?.message}
                    {...register("PhoneNumber")}
                />
            </div>

            <Select
                label="Role"
                required
                options={listRole}
                placeholder="Pilih role"
                disabled={isOwnAccount}
                helperText={isOwnAccount ? "Role akun sendiri tidak dapat diubah." : undefined}
                errorText={errors.RoleName?.message}
                {...register("RoleName", { required: "Role wajib dipilih." })}
            />

            {/*
              * Kata sandi hanya diisi saat membuat akun. Untuk akun yang sudah ada,
              * penggantian dilakukan lewat tombol atur ulang di halaman daftar,
              * supaya kata sandi lama tidak pernah ikut termuat ke formulir.
              */}
            {!isEditMode ? (
                <div className="grid gap-5 medium:grid-cols-2">
                    <TextField
                        label="Kata sandi"
                        type="password"
                        required
                        autoComplete="new-password"
                        helperText="Minimal 8 karakter."
                        errorText={errors.Password?.message}
                        {...register("Password", {
                            required: "Kata sandi wajib diisi.",
                            minLength: { value: 8, message: "Kata sandi minimal 8 karakter." },
                        })}
                    />

                    <TextField
                        label="Konfirmasi kata sandi"
                        type="password"
                        required
                        autoComplete="new-password"
                        errorText={errors.ConfirmPassword?.message}
                        {...register("ConfirmPassword", {
                            validate: (value) => value === watch("Password") || "Konfirmasi tidak sama dengan kata sandi.",
                        })}
                    />
                </div>
            ) : null}

            <Switch
                label="Akun aktif"
                description={
                    isOwnAccount
                        ? "Akun sendiri tidak dapat dinonaktifkan."
                        : "Akun nonaktif tidak dapat masuk ke sistem, tetapi riwayat aktivitasnya tetap tersimpan."
                }
                checked={watch("IsActive") ?? true}
                disabled={isOwnAccount}
                onChange={(event) => setValue("IsActive", event.target.checked)}
            />
        </FormPageShell>
    );
}
