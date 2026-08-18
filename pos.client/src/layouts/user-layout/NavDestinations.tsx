import { NavLink } from "react-router-dom";
import type { MenuItem } from "@/components/router/menu-items";

type NavShape = "bar" | "rail" | "drawer";

interface NavDestinationsProps {
    items: MenuItem[];
    rolePath: string;
    shape: NavShape;
    onNavigate?: () => void;
}

/**
 * Satu sumber tujuan navigasi yang ditampilkan dalam tiga bentuk mengikuti lebar jendela.
 * Urutan dan identitas tujuan sengaja tidak berubah antar bentuk: yang berganti hanya
 * penyajiannya, bukan arsitektur aplikasinya.
 */
export function NavDestinations({ items, rolePath, shape, onNavigate }: NavDestinationsProps) {
    const containerClass: Record<NavShape, string> = {
        bar: "flex items-stretch justify-around",
        rail: "flex flex-col items-center gap-1 py-2",
        drawer: "flex flex-col gap-1 p-3",
    };

    return (
        <ul className={containerClass[shape]}>
            {items.map((item) => (
                <li key={item.path} className={shape === "bar" ? "flex-1" : ""}>
                    <NavLink
                        to={`/${rolePath}/${item.path}`}
                        onClick={onNavigate}
                        className={({ isActive }) => {
                            const active = isActive
                                ? "bg-secondary-container text-on-secondary-container"
                                : "text-on-surface-variant hover:bg-on-surface/8";

                            if (shape === "bar") {
                                return `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-(--radius-control) px-2 py-1 ${active}`;
                            }

                            if (shape === "rail") {
                                return `flex min-h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-(--radius-control) ${active}`;
                            }

                            return `flex min-h-12 items-center gap-3 rounded-(--radius-control) px-4 ${active}`;
                        }}
                    >
                        {/*
                          * Tujuan aktif ditandai bentuk kontainer terisi, bukan warna saja.
                          * Untuk pembaca layar, NavLink sudah memasang aria-current="page" sendiri,
                          * jadi tidak perlu teks tambahan yang membuat labelnya terbaca dua kali.
                          */}
                        <item.icon size={20} aria-hidden="true" />
                        <span className={shape === "drawer" ? "text-label" : "text-label-small"}>{item.label}</span>
                    </NavLink>
                </li>
            ))}
        </ul>
    );
}
