import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import type { ChangePasswordRequestModel } from "@/@models/auth.models";

const FORM_ID = "form-ganti-kata-sandi";

interface ChangePasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Mengubah kata sandi sendiri, tanpa perantara admin.
 *
 * Kata sandi lama tetap diminta meskipun pengguna sudah masuk, sehingga perangkat yang
 * ditinggal terbuka sebentar tidak dapat dipakai mengunci pemiliknya sendiri.
 */
export function ChangePasswordDialog({ isOpen, onClose }: ChangePasswordDialogProps) {
    const { successNotify } = useSnackbar();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<ChangePasswordRequestModel>({
        defaultValues: { CurrentPassword: "", NewPassword: "", ConfirmPassword: "" },
    });

    const onSubmit = (model: ChangePasswordRequestModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        api.post<string>("/auth/change-password", model)
            .then((response) => {
                successNotify(response.data);
                onClose();
            })
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsSubmitting(false));
    };

    const visibilityToggle = (
        <IconButton
            label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            onClick={() => setShowPassword((current) => !current)}
            className="-mr-2 size-10"
        />
    );

    const inputType = showPassword ? "text" : "password";

    return (
        <Dialog
            isOpen={isOpen}
            title="Ganti kata sandi"
            description="Setelah diganti, kata sandi lama tidak berlaku lagi untuk masuk berikutnya."
            onClose={onClose}
            actions={
                <>
                    <Button variant="text" onClick={onClose} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
                        {isSubmitting ? "Menyimpan" : "Simpan kata sandi"}
                    </Button>
                </>
            }
        >
            {/* Dibungkus form supaya Enter di kolom terakhir ikut menyimpan, bukan hanya kliknya. */}
            <form id={FORM_ID} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                <TextField
                    label="Kata sandi lama"
                    required
                    type={inputType}
                    autoComplete="current-password"
                    trailingSlot={visibilityToggle}
                    errorText={errors.CurrentPassword?.message}
                    {...register("CurrentPassword", { required: "Kata sandi lama wajib diisi." })}
                />

                <TextField
                    label="Kata sandi baru"
                    required
                    type={inputType}
                    autoComplete="new-password"
                    helperText="Minimal 8 karakter."
                    errorText={errors.NewPassword?.message}
                    {...register("NewPassword", {
                        required: "Kata sandi baru wajib diisi.",
                        minLength: { value: 8, message: "Kata sandi baru minimal 8 karakter." },
                        validate: (value) =>
                            value !== getValues("CurrentPassword") ||
                            "Kata sandi baru harus berbeda dari yang lama.",
                    })}
                />

                <TextField
                    label="Ulangi kata sandi baru"
                    required
                    type={inputType}
                    autoComplete="new-password"
                    errorText={errors.ConfirmPassword?.message}
                    {...register("ConfirmPassword", {
                        required: "Ulangi kata sandi baru untuk memastikan tidak salah ketik.",
                        validate: (value) =>
                            value === getValues("NewPassword") || "Ulangan kata sandi belum sama.",
                    })}
                />
            </form>
        </Dialog>
    );
}
