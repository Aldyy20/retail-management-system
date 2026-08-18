import { Link } from "react-router-dom";
import { useAuth } from "@/components/router/AuthContext";
import { getRolePath } from "@/components/router/menu-items";

export default function NotFoundPage() {
    const { currentUser } = useAuth();
    const homePath = currentUser ? `/${getRolePath(currentUser.Role)}` : "/login";

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-surface px-6 text-center text-on-surface">
            <h1 className="text-headline">Halaman tidak ditemukan</h1>
            <p className="max-w-md text-body text-on-surface-variant">
                Alamat yang Anda buka tidak ada, atau memang belum tersedia untuk role Anda.
            </p>
            <Link
                to={homePath}
                className="mt-2 inline-flex min-h-11 items-center rounded-(--radius-control) bg-primary px-4 text-label text-on-primary"
            >
                {currentUser ? "Kembali ke dashboard" : "Ke halaman masuk"}
            </Link>
        </main>
    );
}
