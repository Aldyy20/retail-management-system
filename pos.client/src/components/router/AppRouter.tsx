import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { useAuth } from "@/components/router/AuthContext";
import { RequireAuth } from "@/components/router/RequireAuth";
import { getRolePath } from "@/components/router/menu-items";
import { UserLayout } from "@/layouts/user-layout/UserLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROLE_ADMIN, ROLE_KARYAWAN, ROLE_OWNER, ROLE_SUPERVISOR } from "@/services/global.types";
import { adminRoutes } from "@/components/router/routes/admin-routes";
import { ownerRoutes } from "@/components/router/routes/owner-routes";
import { supervisorRoutes } from "@/components/router/routes/supervisor-routes";
import { karyawanRoutes } from "@/components/router/routes/karyawan-routes";

const LoginPage = lazy(() => import("@/pages/public-pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/public-pages/ForgotPasswordPage"));
const NotFoundPage = lazy(() => import("@/pages/public-pages/NotFoundPage"));

const routesByRole: { role: string; path: string; routes: RouteObject[] }[] = [
    { role: ROLE_ADMIN, path: "admin", routes: adminRoutes },
    { role: ROLE_OWNER, path: "owner", routes: ownerRoutes },
    { role: ROLE_SUPERVISOR, path: "supervisor", routes: supervisorRoutes },
    { role: ROLE_KARYAWAN, path: "karyawan", routes: karyawanRoutes },
];

/** Mengarahkan pengguna yang sudah masuk ke beranda role-nya, dan sisanya ke halaman masuk. */
function HomeRedirect() {
    const { currentUser, isRestoringSession } = useAuth();

    if (isRestoringSession) {
        return <LoadingSpinner label="Memeriksa sesi Anda" className="min-h-dvh" />;
    }

    const rolePath = getRolePath(currentUser?.Role);
    return <Navigate to={rolePath ? `/${rolePath}` : "/login"} replace />;
}

export function AppRouter() {
    return (
        <Suspense fallback={<LoadingSpinner label="Menyiapkan halaman" className="min-h-dvh" />}>
            <Routes>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/lupa-kata-sandi" element={<ForgotPasswordPage />} />

                {routesByRole.map(({ role, path, routes }) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            <RequireAuth role={role}>
                                <UserLayout />
                            </RequireAuth>
                        }
                    >
                        {routes.map((route) => (
                            <Route key={`${path}/${route.path}`} path={route.path} element={route.element} />
                        ))}
                    </Route>
                ))}

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}
