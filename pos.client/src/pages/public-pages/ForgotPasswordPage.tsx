import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, KeyRound, Store } from "lucide-react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import type { StoreInfoModel } from "@/@models/store.models";
import type { CreatePasswordResetRequestModel } from "@/@dataLayer/password-reset.models";

/**
 * Permintaan pengaturan ulang kata sandi bagi pengguna yang tidak dapat masuk.
 *
 * Toko ini tidak mengirim email, jadi permintaan masuk ke antrean admin dan admin yang
 * menyerahkan kata sandi barunya langsung. Halaman ini sengaja tidak pernah memberi tahu
 * apakah nama pengguna yang diketik terdaftar atau tidak.
 */
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
            className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-(--radius-control) px-2 text-label text-primary hover:bg-primary/8"
        >
            <ArrowLeft size={18} aria-hidden="true" />
            Kembali ke halaman masuk
        </Link>
    );

    return (
        <div className="min-h-dvh bg-surface text-on-surface">
            <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        {storeInfo?.StoreLogoUrl ? (
                            <img
                                src={storeInfo.StoreLogoUrl}
                                alt=""
                                className="mb-3 size-11 rounded-(--radius-card) bg-primary-container object-contain"
                            />
                        ) : (
                            <span className="mb-3 flex size-11 items-center justify-center rounded-(--radius-card) bg-primary-container text-on-primary-container">
                                <Store size={20} aria-hidden="true" />
                            </span>
                        )}
                        <p className="text-title">{storeInfo?.StoreName ?? "Sistem Kasir dan Gudang"}</p>
                    </div>
                    <ThemeToggle />
                </div>

                <h1 className="text-headline">Lupa kata sandi</h1>

                {/*
                  * Keadaan setelah terkirim menggantikan formulirnya, bukan menumpuk di atasnya,
                  * supaya tidak ada yang mengirim permintaan sama dua kali hanya karena
                  * formulirnya masih terlihat.
                  */}
                {sentMessage ? (
                    <>
                        <p className="mt-2 text-body text-on-surface-variant">{sentMessage}</p>

                        <div className="mt-6 rounded-(--radius-card) bg-surface-container p-4">
                            <p className="text-label text-on-surface">Langkah berikutnya</p>
                            <p className="mt-1 text-body text-on-surface-variant">
                                Temui admin toko. Admin akan memastikan Anda orangnya, lalu menyerahkan
                                kata sandi baru secara langsung. Kata sandi tidak dikirim lewat pesan
                                maupun email.
                            </p>
                        </div>

                        {backLink}
                    </>
                ) : (
                    <>
                        <p className="mt-2 text-body text-on-surface-variant">
                            Isi nama pengguna Anda. Permintaannya masuk ke antrean admin toko, dan admin
                            yang akan menyerahkan kata sandi baru secara langsung.
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-5">
                            {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                            <TextField
                                label="Nama pengguna"
                                required
                                autoFocus
                                autoComplete="username"
                                placeholder="budi"
                                leadingIcon={<KeyRound size={18} />}
                                errorText={errors.UserName?.message}
                                {...register("UserName", { required: "Nama pengguna wajib diisi." })}
                            />

                            <Textarea
                                label="Catatan untuk admin"
                                rows={2}
                                placeholder="Nomor yang bisa dihubungi, atau di mana Anda berada."
                                helperText="Opsional. Membantu admin memastikan bahwa yang meminta memang Anda."
                                errorText={errors.Note?.message}
                                {...register("Note", {
                                    maxLength: { value: 256, message: "Catatan maksimal 256 karakter." },
                                })}
                            />

                            <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-2">
                                {isSubmitting ? "Mengirim permintaan" : "Kirim permintaan"}
                            </Button>
                        </form>

                        {backLink}
                    </>
                )}
            </main>
        </div>
    );
}
