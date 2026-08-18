import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/components/router/AuthContext";
import { getRolePath } from "@/components/router/menu-items";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface RequireAuthProps {
    /** Role yang boleh membuka cabang rute ini. */
    role: string;
    children: ReactNode;
}

/**
 * Penjaga rute di sisi tampilan. Ini hanya mengatur navigasi, bukan keamanan:
 * setiap permintaan tetap diverifikasi ulang oleh server berdasarkan token.
 */
export function RequireAuth({ role, children }: RequireAuthProps) {
    const { currentUser, isRestoringSession } = useAuth();
    const location = useLocation();

    if (isRestoringSession) {
        return <LoadingSpinner label="Memeriksa sesi Anda" className="min-h-dvh" />;
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (currentUser.Role !== role) {
        const ownPath = getRolePath(currentUser.Role);
        return <Navigate to={ownPath ? `/${ownPath}` : "/login"} replace />;
    }

    return <>{children}</>;
}
