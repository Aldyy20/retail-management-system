import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Store, User } from "lucide-react";
import { useAuth } from "@/components/router/AuthContext";
import { getRolePath } from "@/components/router/menu-items";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { IconButton } from "@/components/ui/IconButton";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import type { LoginRequestModel } from "@/@models/auth.models";
import type { StoreInfoModel } from "@/@models/store.models";

export default function LoginPage() {
    const { currentUser, login } = useAuth();
    const navigate = useNavigate();

    const [storeInfo, setStoreInfo] = useState<StoreInfoModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setFocus,
        formState: { errors },
    } = useForm<LoginRequestModel>({ defaultValues: { UserName: "", Password: "" } });

    // Pengguna yang sesinya masih hidup tidak perlu melihat halaman masuk lagi.
    useEffect(() => {
        if (currentUser) {
            navigate(`/${getRolePath(currentUser.Role)}`, { replace: true });
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const loadInitData = () => {
            api.post<StoreInfoModel>("/auth/get-store-info")
                .then((response) => setStoreInfo(response.data))
                .catch(() => setStoreInfo(null));
        };

        loadInitData();
        setFocus("UserName");
    }, [setFocus]);

    const onSubmit = async (model: LoginRequestModel) => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const user = await login(model);
            navigate(`/${getRolePath(user.Role)}`, { replace: true });
        } catch (error) {
            setErrorMessage(getAxiosErrorMessage(error));
            setFocus("Password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh bg-surface text-on-surface expanded:grid expanded:grid-cols-[1fr_28rem]">
            <aside className="hidden expanded:flex flex-col justify-between bg-primary-container p-10 text-on-primary-container">
                <span className="flex size-12 items-center justify-center rounded-(--radius-card) bg-on-primary-container/12">
                    <Store size={24} aria-hidden="true" />
                </span>

                <div>
                    <p className="text-headline">{storeInfo?.StoreName ?? "Sistem Kasir dan Gudang"}</p>
                    {storeInfo?.StoreAddress ? <p className="mt-2 max-w-sm text-body">{storeInfo.StoreAddress}</p> : null}
                </div>

                <p className="max-w-sm text-body">
                    Penjualan, stok, dan persetujuan tercatat dalam satu sistem. Setiap tindakan
                    tersimpan lengkap dengan siapa yang melakukannya.
                </p>
            </aside>

            <main className="flex min-h-dvh flex-col justify-center px-6 py-10 medium:px-10">
                <div className="mx-auto w-full max-w-sm">
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div className="expanded:hidden">
                            <span className="mb-3 flex size-11 items-center justify-center rounded-(--radius-card) bg-primary-container text-on-primary-container">
                                <Store size={20} aria-hidden="true" />
                            </span>
                            <p className="text-title">{storeInfo?.StoreName ?? "Sistem Kasir dan Gudang"}</p>
                        </div>
                        <ThemeToggle />
                    </div>

                    <h1 className="text-headline">Masuk ke sistem</h1>
                    <p className="mt-1 mb-6 text-body text-on-surface-variant">
                        Gunakan akun yang diberikan admin toko.
                    </p>

                    {errorMessage ? (
                        <div className="mb-4">
                            <ErrorAlert message={errorMessage} />
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                        <TextField
                            label="Nama pengguna"
                            autoComplete="username"
                            required
                            leadingIcon={<User size={18} />}
                            errorText={errors.UserName?.message}
                            {...register("UserName", { required: "Nama pengguna wajib diisi." })}
                        />

                        <TextField
                            label="Kata sandi"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            leadingIcon={<KeyRound size={18} />}
                            errorText={errors.Password?.message}
                            trailingSlot={
                                <IconButton
                                    label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                    icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    onClick={() => setShowPassword((current) => !current)}
                                    className="-mr-2 size-10"
                                />
                            }
                            {...register("Password", { required: "Kata sandi wajib diisi." })}
                        />

                        <Button type="submit" isLoading={isLoading} fullWidth className="mt-2">
                            {isLoading ? "Memeriksa akun" : "Masuk"}
                        </Button>
                    </form>

                    <p className="mt-6 text-label-small text-on-surface-variant">
                        Lupa kata sandi? Hubungi admin toko untuk mengatur ulang.
                    </p>
                </div>
            </main>
        </div>
    );
}
