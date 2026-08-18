import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Store } from "lucide-react";
import { useAuth } from "@/components/router/AuthContext";
import { getRolePath, menuItemsByRole } from "@/components/router/menu-items";
import { NavDestinations } from "@/layouts/user-layout/NavDestinations";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useSnackbar } from "@/components/ui/Snackbar";

/**
 * Kerangka aplikasi untuk pengguna yang sudah masuk.
 *
 * Bentuk navigasi mengikuti lebar jendela sesuai panduan adaptif Material 3:
 * navigation bar di bawah pada layar sempit, navigation rail pada layar sedang,
 * dan navigation drawer permanen pada layar lebar.
 */
export function UserLayout() {
    const { currentUser, logout } = useAuth();
    const { infoNotify } = useSnackbar();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const rolePath = getRolePath(currentUser?.Role);
    const menuItems = menuItemsByRole[currentUser?.Role ?? ""] ?? [];

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
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-(--radius-control) focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
            >
                Lompat ke konten utama
            </a>

            <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-outline-variant bg-surface-low px-4">
                <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-(--radius-control) bg-primary-container text-on-primary-container">
                    <Store size={18} />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-title text-on-surface">{currentUser?.StoreName}</p>
                    <p className="hidden truncate text-label-small text-on-surface-variant medium:block">
                        {currentUser?.FullName} · {currentUser?.Role}
                    </p>
                </div>

                <ThemeToggle />

                <Button
                    variant="text"
                    icon={<LogOut size={18} aria-hidden="true" />}
                    onClick={handleLogout}
                    isLoading={isLoggingOut}
                    className="px-2 medium:px-4"
                >
                    {/* Satu label saja: tersembunyi secara visual di layar sempit, tetap terbaca pembaca layar. */}
                    <span className="sr-only medium:not-sr-only">Keluar</span>
                </Button>
            </header>

            <div className="flex">
                {/* Navigation rail: lebar sedang. */}
                <nav
                    aria-label="Navigasi utama"
                    className="hidden medium:block large:hidden sticky top-16 h-[calc(100dvh-4rem)] w-20 shrink-0 border-r border-outline-variant bg-surface-low"
                >
                    <NavDestinations items={menuItems} rolePath={rolePath} shape="rail" />
                </nav>

                {/* Navigation drawer permanen: lebar besar. */}
                <nav
                    aria-label="Navigasi utama"
                    className="hidden large:block sticky top-16 h-[calc(100dvh-4rem)] w-64 shrink-0 border-r border-outline-variant bg-surface-low"
                >
                    <NavDestinations items={menuItems} rolePath={rolePath} shape="drawer" />
                </nav>

                <main id="konten-utama" className="min-w-0 flex-1 px-4 pt-6 pb-24 medium:px-6 medium:pb-8">
                    <div className="mx-auto max-w-[1400px]">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Navigation bar: lebar sempit. */}
            <nav
                aria-label="Navigasi utama"
                className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface-low px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] medium:hidden"
            >
                <NavDestinations items={menuItems} rolePath={rolePath} shape="bar" />
            </nav>
        </div>
    );
}
