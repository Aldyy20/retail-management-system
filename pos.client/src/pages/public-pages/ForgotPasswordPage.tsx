import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Send, Store, User } from "lucide-react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import type { StoreInfoModel } from "@/@models/store.models";
import type { CreatePasswordResetRequestModel } from "@/@dataLayer/password-reset.models";

export default function ForgotPasswordPage() {
    const [storeInfo, setStoreInfo] = useState<StoreInfoModel | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sentMessage, setSentMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePasswordResetRequestModel>({ defaultValues: { UserName: "", Note: null } });

    useEffect(() => {
        api.post<StoreInfoModel>("/auth/get-store-info")
            .then((response) => setStoreInfo(response.data))
            .catch(() => setStoreInfo(null));
    }, []);

    const onSubmit = (model: CreatePasswordResetRequestModel) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        api.post<string>("/auth/request-password-reset", model)
            .then((response) => setSentMessage(response.data))
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsSubmitting(false));
    };

    const backLink = (
        <Link
            to="/login"
            className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-(--radius-control) text-label text-primary hover:underline font-semibold"
        >
            <ArrowLeft size={18} aria-hidden="true" />
            Kembali ke halaman masuk
        </Link>
    );

    return (
        <div className="min-h-dvh bg-surface text-on-surface flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10">
            <main className="w-full max-w-md bg-surface-lowest border border-outline-variant rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        {storeInfo?.StoreLogoUrl ? (
                            <img
                                src={storeInfo.StoreLogoUrl}
                                alt=""
                                className="size-10 rounded-(--radius-control) bg-primary-container object-contain"
                            />
                        ) : (
                            <div className="size-10 rounded-(--radius-control) bg-primary-container text-white flex items-center justify-center">
                                <Store size={20} aria-hidden="true" />
                            </div>
                        )}
                        <div>
                            <p className="text-title font-bold text-on-surface leading-tight">
                                {storeInfo?.StoreName ?? "Zenith POS"}
                            </p>
                            <span className="text-[11px] text-on-surface-variant">Layanan Bantuan Akun</span>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                <h1 className="font-heading text-2xl font-bold text-on-surface">Lupa Kata Sandi</h1>

                {sentMessage ? (
                    <div className="mt-4 space-y-4">
                        <p className="text-body text-on-surface-variant">{sentMessage}</p>

                        <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-4">
                            <p className="text-label font-bold text-secondary">Langkah Berikutnya</p>
                            <p className="mt-1 text-body text-on-surface-variant text-sm">
                                Temui admin toko secara langsung. Admin akan memverifikasi identitas Anda lalu menyerahkan kata sandi baru.
                            </p>
                        </div>

                        {backLink}
                    </div>
                ) : (
                    <div className="mt-2">
                        <p className="text-body text-on-surface-variant text-sm">
                            Masukkan nama pengguna akun Anda. Permintaan akan dikirimkan ke antrean admin toko untuk diproses.
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
                            {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                            <TextField
                                label="Nama Pengguna"
                                required
                                autoFocus
                                autoComplete="username"
                                placeholder="budi"
                                leadingIcon={<User size={18} />}
                                errorText={errors.UserName?.message}
                                {...register("UserName", { required: "Nama pengguna wajib diisi." })}
                            />

                            <Textarea
                                label="Catatan Tambahan (Opsional)"
                                rows={2}
                                placeholder="Nomor telepon atau lokasi kasir Anda."
                                helperText="Membantu admin memastikan bahwa yang meminta memang Anda."
                                errorText={errors.Note?.message}
                                {...register("Note", {
                                    maxLength: { value: 256, message: "Catatan maksimal 256 karakter." },
                                })}
                            />

                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                fullWidth
                                icon={<Send size={18} />}
                                className="mt-2"
                            >
                                {isSubmitting ? "Mengirim Permintaan..." : "Kirim Permintaan Reset"}
                            </Button>
                        </form>

                        {backLink}
                    </div>
                )}
            </main>
        </div>
    );
}
