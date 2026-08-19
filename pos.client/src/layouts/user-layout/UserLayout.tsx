import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, LogOut, Menu, Store, X } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/components/router/AuthContext";
import { getRolePath, menuBadgeEndpoint, menuItemsByRole } from "@/components/router/menu-items";
import type { MenuBadgeKey } from "@/components/router/menu-items";
import { NavDestinations } from "@/layouts/user-layout/NavDestinations";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ChangePasswordDialog } from "@/components/common/ChangePasswordDialog";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useSnackbar } from "@/components/ui/Snackbar";

/**
 * Kerangka aplikasi Zenith Retail Pro untuk pengguna yang sudah masuk.
 * Sidebar terkunci permanen (fixed) di sebelah kiri, header bersih, dan kanvas data responsif.
 */
export function UserLayout() {
    const { currentUser, logout } = useAuth();
    const { infoNotify } = useSnackbar();
    const navigate = useNavigate();
    const location = useLocation();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
    const [drawerOpenedAtPath, setDrawerOpenedAtPath] = useState<string | null>(null);
    const showMobileDrawer = drawerOpenedAtPath === location.pathname;
    const closeMobileDrawer = () => setDrawerOpenedAtPath(null);

    const rolePath = getRolePath(currentUser?.Role);
    const menuItems = menuItemsByRole[currentUser?.Role ?? ""] ?? [];

    const [badgeCount, setBadgeCount] = useState<Partial<Record<MenuBadgeKey, number>>>({});

    const badgeKeys = menuItems
        .map((item) => item.badgeKey)
        .filter((key): key is MenuBadgeKey => Boolean(key))
        .join(",");

    useEffect(() => {
        if (!badgeKeys) {
            return;
        }

        const loadBadgeCount = () => {
            for (const key of badgeKeys.split(",") as MenuBadgeKey[]) {
                api.post<number>(menuBadgeEndpoint[key])
                    .then((response) => setBadgeCount((current) => ({ ...current, [key]: response.data })))
                    .catch(() => setBadgeCount((current) => ({ ...current, [key]: 0 })));
            }
        };

        loadBadgeCount();
        const timerId = window.setInterval(loadBadgeCount, 60000);

        return () => window.clearInterval(timerId);
    }, [badgeKeys, location.pathname]);

    useEffect(() => {
        if (!showMobileDrawer) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeMobileDrawer();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showMobileDrawer]);

    const handleLogout = () => {
        setIsLoggingOut(true);
        logout();
        infoNotify("Anda sudah keluar dari sistem.");
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-dvh bg-surface text-on-surface">
            <a
                href="#konten-utama"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-60 focus:rounded-(--radius-control) focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
            >
                Lompat ke konten utama
            </a>

            {/* SideNav untuk Layar Sedang (Navigation Rail Fixed) */}
            <aside
                aria-label="Navigasi rail"
                className="fixed top-0 bottom-0 left-0 hidden h-dvh w-20 flex-col border-r border-slate-800/80 bg-[#091426] text-white medium:flex large:hidden z-40"
            >
                <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-800/80">
                    {currentUser?.StoreLogoUrl ? (
                        <img
                            src={currentUser.StoreLogoUrl}
                            alt=""
                            className="size-9 rounded-(--radius-control) bg-white/10 object-contain"
                        />
                    ) : (
                        <span className="flex size-9 items-center justify-center rounded-(--radius-control) bg-white/10 text-white font-bold">
                            <Store size={18} />
                        </span>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto min-h-0 py-2">
                    <NavDestinations items={menuItems} rolePath={rolePath} shape="rail" badgeCount={badgeCount} />
                </nav>

                <div className="p-3 shrink-0 border-t border-slate-800/80 flex flex-col items-center gap-2 bg-[#091426]">
                    <IconButton
                        label="Ganti kata sandi"
                        icon={<KeyRound size={18} className="text-white/70" />}
                        onClick={() => setShowChangePasswordDialog(true)}
                        className="hover:bg-white/10 hover:text-white"
                    />
                </div>
            </aside>

            {/* SideNav untuk Layar Lebar (Navigation Drawer Fixed) */}
            <aside
                aria-label="Navigasi utama"
                className="fixed top-0 bottom-0 left-0 hidden h-dvh w-64 flex-col border-r border-slate-800/80 bg-[#091426] text-white large:flex z-40"
            >
                <div className="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-slate-800/80">
                    {currentUser?.StoreLogoUrl ? (
                        <img
                            src={currentUser.StoreLogoUrl}
                            alt=""
                            className="size-9 rounded-(--radius-control) bg-white/10 object-contain shrink-0"
                        />
                    ) : (
                        <div className="size-9 rounded-(--radius-control) bg-white/10 flex items-center justify-center text-white shrink-0">
                            <Store size={18} />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h1 className="text-title text-white truncate font-bold leading-tight">
                            {currentUser?.StoreName ?? "Zenith POS"}
                        </h1>
                        <p className="text-[11px] text-white/60 font-medium tracking-wide">Enterprise Edition</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto min-h-0 py-2">
                    <NavDestinations items={menuItems} rolePath={rolePath} shape="drawer" badgeCount={badgeCount} />
                </nav>

                <div className="p-3 shrink-0 border-t border-slate-800/80 flex flex-col gap-1 bg-[#091426]">
                    <button
                        type="button"
                        onClick={() => setShowChangePasswordDialog(true)}
                        className="flex min-h-10 items-center gap-3 rounded-(--radius-control) px-3.5 text-slate-300 hover:bg-slate-800/80 hover:text-white text-label transition-colors text-left cursor-pointer"
                    >
                        <KeyRound size={18} />
                        <span>Ganti Kata Sandi</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex min-h-10 items-center gap-3 rounded-(--radius-control) px-3.5 text-error hover:bg-error/10 text-label transition-colors text-left cursor-pointer"
                    >
                        <LogOut size={18} />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Konten Utama & TopNavBar dengan padding-left sesuai lebar sidebar */}
            <div className="min-h-dvh flex flex-col min-w-0 w-full medium:pl-20 large:pl-64">
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-lowest px-4 medium:px-6 shadow-xs">
                    <div className="flex items-center gap-3">
                        <IconButton
                            label="Buka menu navigasi"
                            icon={<Menu size={20} />}
                            onClick={() => setDrawerOpenedAtPath(location.pathname)}
                            aria-expanded={showMobileDrawer}
                            className="medium:hidden"
                        />

                        <div className="hidden medium:flex items-center gap-2">
                            <span className="text-label-small font-medium px-2.5 py-1 rounded bg-surface-variant text-on-surface-variant border border-outline-variant">
                                Toko: {currentUser?.StoreName ?? "Pusat"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 medium:gap-3">
                        <ThemeToggle />

                        <div className="h-6 w-px bg-outline-variant hidden medium:block" />

                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs border border-outline-variant">
                                {currentUser?.FullName ? currentUser.FullName.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-label-small font-semibold text-on-surface leading-tight truncate max-w-36">
                                    {currentUser?.FullName}
                                </p>
                                <p className="text-[11px] text-on-surface-variant font-medium leading-tight">
                                    {currentUser?.Role}
                                </p>
                            </div>
                        </div>

                        <div className="large:hidden">
                            <IconButton
                                label="Keluar"
                                icon={<LogOut size={18} className="text-error" />}
                                onClick={handleLogout}
                            />
                        </div>
                    </div>
                </header>

                <main id="konten-utama" className="flex-1 p-4 medium:p-6 lg:p-8 bg-surface">
                    <div className="mx-auto max-w-[1440px]">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Modal Ganti Kata Sandi */}
            <ChangePasswordDialog
                key={showChangePasswordDialog ? "terbuka" : "tertutup"}
                isOpen={showChangePasswordDialog}
                onClose={() => setShowChangePasswordDialog(false)}
            />

            {/* Mobile Drawer */}
            {showMobileDrawer ? (
                <div
                    className="fixed inset-0 z-50 bg-scrim/60 backdrop-blur-[2px] medium:hidden"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeMobileDrawer();
                        }
                    }}
                >
                    <nav
                        aria-label="Navigasi mobile"
                        className="h-full w-72 max-w-[85vw] flex flex-col justify-between bg-[#091426] text-white shadow-2xl"
                    >
                        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-800/80 px-4">
                            <div className="flex items-center gap-2.5 truncate">
                                <Store size={18} />
                                <span className="text-title text-white font-bold truncate">
                                    {currentUser?.StoreName ?? "Zenith POS"}
                                </span>
                            </div>
                            <IconButton
                                label="Tutup menu navigasi"
                                icon={<X size={20} className="text-white" />}
                                onClick={closeMobileDrawer}
                                className="hover:bg-white/10"
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 py-2">
                            <NavDestinations
                                items={menuItems}
                                rolePath={rolePath}
                                shape="drawer"
                                badgeCount={badgeCount}
                                onNavigate={closeMobileDrawer}
                            />
                        </div>

                        <div className="border-t border-slate-800/80 p-3 shrink-0 flex flex-col gap-1 bg-[#091426]">
                            <Button
                                variant="text"
                                icon={<KeyRound size={18} aria-hidden="true" />}
                                fullWidth
                                className="justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
                                onClick={() => {
                                    closeMobileDrawer();
                                    setShowChangePasswordDialog(true);
                                }}
                            >
                                Ganti Kata Sandi
                            </Button>
                            <Button
                                variant="text"
                                icon={<LogOut size={18} aria-hidden="true" />}
                                fullWidth
                                className="justify-start text-error hover:bg-error/10"
                                onClick={handleLogout}
                            >
                                Keluar
                            </Button>
                        </div>
                    </nav>
                </div>
            ) : null}
        </div>
    );
}
