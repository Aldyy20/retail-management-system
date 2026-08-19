import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Store, X } from "lucide-react";
import { api } from "@/services/api";
import { ROLE_SUPERVISOR } from "@/services/global.types";
import { useAuth } from "@/components/router/AuthContext";
import { getRolePath, menuItemsByRole } from "@/components/router/menu-items";
import { NavDestinations } from "@/layouts/user-layout/NavDestinations";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useSnackbar } from "@/components/ui/Snackbar";

/**
 * Kerangka aplikasi untuk pengguna yang sudah masuk.
 *
 * Bentuk navigasi mengikuti lebar jendela sesuai panduan adaptif Material 3:
 * drawer sementara yang dibuka dari tombol menu pada layar sempit, navigation rail
 * pada layar sedang, dan navigation drawer permanen pada layar lebar.
 *
 * Bentuk sempit memakai drawer, bukan navigation bar bawah, karena jumlah tujuan
 * pada role admin melewati batas nyaman sebuah bar.
 */
export function UserLayout() {
    const { currentUser, logout } = useAuth();
    const { infoNotify } = useSnackbar();
    const navigate = useNavigate();
    const location = useLocation();

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    /**
     * Drawer sementara diikat pada halaman tempat ia dibuka. Begitu pengguna berpindah
     * halaman, termasuk lewat tombol kembali browser, drawer tertutup dengan sendirinya
     * tanpa perlu efek yang mengubah state.
     */
    const [drawerOpenedAtPath, setDrawerOpenedAtPath] = useState<string | null>(null);
    const showMobileDrawer = drawerOpenedAtPath === location.pathname;
    const closeMobileDrawer = () => setDrawerOpenedAtPath(null);

    const rolePath = getRolePath(currentUser?.Role);
    const menuItems = menuItemsByRole[currentUser?.Role ?? ""] ?? [];

    /**
     * Penanda approval yang menunggu (PRD bagian 35). Angkanya dimuat ulang setiap kali
     * berpindah halaman dan sekali per menit, karena persetujuan diputuskan orang lain
     * dan supervisor tidak selalu berada di halaman persetujuan saat itu terjadi.
     */
    const [pendingCount, setPendingCount] = useState(0);
    const isSupervisor = currentUser?.Role === ROLE_SUPERVISOR;

    useEffect(() => {
        if (!isSupervisor) {
            return;
        }

        const loadPendingCount = () => {
            api.post<number>("/supervisor/approval/get-pending-count")
                .then((response) => setPendingCount(response.data))
                .catch(() => setPendingCount(0));
        };

        loadPendingCount();
        const timerId = window.setInterval(loadPendingCount, 60000);

        return () => window.clearInterval(timerId);
    }, [isSupervisor, location.pathname]);

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

            <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b border-outline-variant bg-surface-low px-3 medium:gap-3 medium:px-4">
                <IconButton
                    label="Buka menu navigasi"
                    icon={<Menu size={20} />}
                    onClick={() => setDrawerOpenedAtPath(location.pathname)}
                    aria-expanded={showMobileDrawer}
                    className="medium:hidden"
                />

                <span
                    aria-hidden="true"
                    className="hidden size-9 items-center justify-center rounded-(--radius-control) bg-primary-container text-on-primary-container medium:flex"
                >
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
                    <span className="sr-only medium:not-sr-only">Keluar</span>
                </Button>
            </header>

            <div className="flex">
                <nav
                    aria-label="Navigasi utama"
                    className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-20 shrink-0 overflow-y-auto border-r border-outline-variant bg-surface-low medium:block large:hidden"
                >
                    <NavDestinations items={menuItems} rolePath={rolePath} shape="rail" pendingCount={pendingCount} />
                </nav>

                <nav
                    aria-label="Navigasi utama"
                    className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-outline-variant bg-surface-low large:block"
                >
                    <NavDestinations items={menuItems} rolePath={rolePath} shape="drawer" pendingCount={pendingCount} />
                </nav>

                <main id="konten-utama" className="min-w-0 flex-1 px-4 pt-6 pb-10 medium:px-6">
                    <div className="mx-auto max-w-[1400px]">
                        <Outlet />
                    </div>
                </main>
            </div>

            {showMobileDrawer ? (
                <div
                    className="fixed inset-0 z-40 bg-scrim/50 medium:hidden"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeMobileDrawer();
                        }
                    }}
                >
                    <nav
                        aria-label="Navigasi utama"
                        className="h-full w-72 max-w-[85vw] overflow-y-auto bg-surface-low shadow-xl shadow-black/25"
                    >
                        <div className="flex min-h-16 items-center justify-between gap-2 border-b border-outline-variant px-4">
                            <p className="truncate text-title text-on-surface">{currentUser?.FullName}</p>
                            <IconButton
                                label="Tutup menu navigasi"
                                icon={<X size={20} />}
                                onClick={closeMobileDrawer}
                                autoFocus
                            />
                        </div>

                        <NavDestinations
                            items={menuItems}
                            rolePath={rolePath}
                            shape="drawer"
                            pendingCount={pendingCount}
                            onNavigate={closeMobileDrawer}
                        />
                    </nav>
                </div>
            ) : null}
        </div>
    );
}
