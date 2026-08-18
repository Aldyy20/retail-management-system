import { Boxes, LayoutDashboard, Package, Ruler, Tags, Truck, Users, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLE_ADMIN, ROLE_KARYAWAN, ROLE_OWNER, ROLE_SUPERVISOR } from "@/services/global.types";

export interface MenuItem {
    /** Path relatif terhadap prefix role, contoh: "dashboard" menjadi /admin/dashboard. */
    path: string;
    label: string;
    icon: LucideIcon;
    /** Judul kelompok. Tujuan pertama dalam kelompok yang membawanya. */
    groupLabel?: string;
}

/**
 * Daftar tujuan navigasi per role.
 *
 * Aturan yang dipegang: menu hanya berisi halaman yang benar-benar sudah ada.
 * Daftar ini bertambah bersamaan dengan modulnya, bukan disiapkan lebih dulu,
 * supaya tidak ada menu yang mengarah ke halaman kosong.
 */
const dashboardItem: MenuItem = { path: "dashboard", label: "Dashboard", icon: LayoutDashboard };

const adminMasterDataItems: MenuItem[] = [
    { path: "product", label: "Produk", icon: Package, groupLabel: "Master data" },
    { path: "category", label: "Kategori", icon: Tags },
    { path: "unit", label: "Satuan", icon: Ruler },
    { path: "warehouse", label: "Gudang", icon: Warehouse },
    { path: "supplier", label: "Supplier", icon: Truck },
    { path: "employee", label: "Pengguna", icon: Users },
];

export const menuItemsByRole: Record<string, MenuItem[]> = {
    [ROLE_ADMIN]: [dashboardItem, ...adminMasterDataItems],
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

/** Ikon yang dipakai bila kelompok butuh lambang sendiri pada rail sempit. */
export const groupIcon = Boxes;
