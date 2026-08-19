import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, LogIn, ShieldCheck, Store, User } from "lucide-react";
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
        <div className="min-h-dvh bg-surface text-on-surface flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10">
            <div className="w-full max-w-4xl bg-surface-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                {/* Sisi Kiri: Branding & Visual Banner (Khusus Desktop/Tablet) */}
                <div className="hidden md:flex flex-col justify-between bg-primary p-10 lg:p-12 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            {storeInfo?.StoreLogoUrl ? (
                                <img
                                    src={storeInfo.StoreLogoUrl}
                                    alt=""
                                    className="size-10 rounded-(--radius-control) bg-white/10 object-contain"
                                />
                            ) : (
                                <div className="size-10 rounded-(--radius-control) bg-white/10 flex items-center justify-center text-white">
                                    <Store size={22} />
                                </div>
                            )}
                            <div>
                                <span className="font-heading text-title font-bold tracking-tight block">
                                    {storeInfo?.StoreName ?? "Zenith POS"}
                                </span>
                                <span className="text-[11px] text-white/70 tracking-wide">Enterprise Edition</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="font-heading text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                                Enterprise Retail<br />Management System
                            </h2>
                            <p className="text-body text-white/80 text-sm max-w-xs leading-relaxed">
                                Penjualan presisi, inventaris akurat, dan otorisasi terpusat untuk operasional toko Anda.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
                        <div className="flex items-center gap-1.5 font-medium">
                            <ShieldCheck size={16} className="text-secondary-container" />
                            <span>Koneksi Aman Terenkripsi</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-300 font-semibold">Online</span>
                        </div>
                    </div>
                </div>

                {/* Sisi Kanan: Form Login */}
                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="md:hidden flex items-center gap-2.5">
                            <Store size={22} className="text-primary" />
                            <span className="font-heading text-title font-bold text-on-surface">
                                {storeInfo?.StoreName ?? "Zenith POS"}
                            </span>
                        </div>
                        <div className="ml-auto">
                            <ThemeToggle />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="font-heading text-2xl font-bold text-on-surface">Selamat Datang</h1>
                        <p className="mt-1 text-body text-on-surface-variant text-sm">
                            Silakan masukkan kredensial untuk mengakses sistem kasir dan inventaris.
                        </p>
                    </div>

                    {errorMessage ? (
                        <div className="mb-5">
                            <ErrorAlert message={errorMessage} />
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                        <TextField
                            label="Nama Pengguna / Username"
                            autoComplete="username"
                            required
                            placeholder="admin"
                            leadingIcon={<User size={18} />}
                            errorText={errors.UserName?.message}
                            {...register("UserName", { required: "Nama pengguna wajib diisi." })}
                        />

                        <TextField
                            label="Kata Sandi"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
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

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            fullWidth
                            icon={<LogIn size={18} />}
                            className="mt-2"
                        >
                            {isLoading ? "Memeriksa Akun..." : "Masuk ke Sistem"}
                        </Button>
                    </form>

                    <div className="mt-8 pt-5 border-t border-outline-variant text-center">
                        <p className="text-label-small text-on-surface-variant">
                            Lupa kata sandi?{" "}
                            <Link
                                to="/lupa-kata-sandi"
                                className="font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                            >
                                Ajukan reset ke admin toko
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <p className="mt-6 text-center text-xs text-on-surface-variant">
                &copy; {new Date().getFullYear()} {storeInfo?.StoreName ?? "Zenith Retail Pro"}. Hak cipta dilindungi undang-undang.
            </p>
        </div>
    );
}
