import { LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLE_ADMIN, ROLE_KARYAWAN, ROLE_OWNER, ROLE_SUPERVISOR } from "@/services/global.types";

export interface MenuItem {
    /** Path relatif terhadap prefix role, contoh: "dashboard" menjadi /admin/dashboard. */
    path: string;
    label: string;
    icon: LucideIcon;
}

/**
 * Daftar tujuan navigasi per role.
 *
 * Aturan yang dipegang: menu hanya berisi halaman yang benar-benar sudah ada.
 * Daftar ini bertambah bersamaan dengan modulnya, bukan disiapkan lebih dulu,
 * supaya tidak ada menu yang mengarah ke halaman kosong.
 */
const dashboardItem: MenuItem = { path: "dashboard", label: "Dashboard", icon: LayoutDashboard };

export const menuItemsByRole: Record<string, MenuItem[]> = {
    [ROLE_ADMIN]: [dashboardItem],
    [ROLE_OWNER]: [dashboardItem],
    [ROLE_SUPERVISOR]: [dashboardItem],
    [ROLE_KARYAWAN]: [dashboardItem],
};

/** Prefix URL per role. Dipakai router dan seluruh panggilan API yang role-scoped. */
export const rolePathByRole: Record<string, string> = {
    [ROLE_ADMIN]: "admin",
    [ROLE_OWNER]: "owner",
    [ROLE_SUPERVISOR]: "supervisor",
    [ROLE_KARYAWAN]: "karyawan",
};

export function getRolePath(roleName: string | undefined): string {
    return rolePathByRole[roleName ?? ""] ?? "";
}
