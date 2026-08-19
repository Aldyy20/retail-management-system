import { useAuth } from "@/components/router/AuthContext";
import { getRolePath } from "@/components/router/menu-items";

/**
 * Prefix API dan URL untuk role yang sedang masuk, contoh "karyawan" atau "supervisor".
 *
 * Halaman yang dipakai lebih dari satu role memanggilnya untuk menyusun alamat endpoint,
 * sehingga satu berkas halaman melayani semua role tanpa percabangan di dalamnya.
 */
export function useRolePath(): string {
    const { currentUser } = useAuth();
    return getRolePath(currentUser?.Role);
}
