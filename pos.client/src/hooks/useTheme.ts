import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "pos.theme";

function readPreference(): ThemePreference {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
}

function applyPreference(preference: ThemePreference): void {
    // Tanpa atribut, CSS jatuh ke prefers-color-scheme milik sistem.
    if (preference === "system") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", preference);
    }
}

/**
 * Tema dipilih pengguna, tidak dipaksa aplikasi. Toko bisa terang saat siang dan
 * remang saat tutup, dan kedua mode dibangun penuh.
 */
export function useTheme() {
    const [preference, setPreference] = useState<ThemePreference>(readPreference);

    useEffect(() => {
        applyPreference(preference);
    }, [preference]);

    const changeTheme = useCallback((next: ThemePreference) => {
        localStorage.setItem(STORAGE_KEY, next);
        setPreference(next);
    }, []);

    return { preference, changeTheme };
}

/** Dipanggil sebelum React memasang, supaya tidak ada kedipan tema saat halaman dibuka. */
export function initializeTheme(): void {
    applyPreference(readPreference());
}
