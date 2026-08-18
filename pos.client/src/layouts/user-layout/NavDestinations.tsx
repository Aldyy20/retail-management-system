import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import type { MenuItem } from "@/components/router/menu-items";

type NavShape = "rail" | "drawer";

interface NavDestinationsProps {
    items: MenuItem[];
    rolePath: string;
    shape: NavShape;
    onNavigate?: () => void;
}

/**
 * Satu sumber tujuan navigasi yang ditampilkan dalam dua bentuk mengikuti lebar jendela.
 * Urutan dan identitas tujuan sengaja tidak berubah antar bentuk: yang berganti hanya
 * penyajiannya, bukan arsitektur aplikasinya.
 */
export function NavDestinations({ items, rolePath, shape, onNavigate }: NavDestinationsProps) {
    return (
        <ul className={shape === "rail" ? "flex flex-col items-center gap-1 py-2" : "flex flex-col gap-1 p-3"}>
            {items.map((item) => (
                <Fragment key={item.path}>
                    {/* Judul kelompok hanya muat pada bentuk drawer; rail memakai garis pemisah. */}
                    {item.groupLabel ? (
                        shape === "drawer" ? (
                            <li className="mt-4 px-4 pb-1 text-label-small text-on-surface-variant" aria-hidden="true">
                                {item.groupLabel}
                            </li>
                        ) : (
                            <li className="my-2 h-px w-8 bg-outline-variant" aria-hidden="true" />
                        )
                    ) : null}

                    <li>
                        <NavLink
                            to={`/${rolePath}/${item.path}`}
                            onClick={onNavigate}
                            className={({ isActive }) => {
                                const state = isActive
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "text-on-surface-variant hover:bg-on-surface/8";

                                return shape === "rail"
                                    ? `flex min-h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-(--radius-control) ${state}`
                                    : `flex min-h-12 items-center gap-3 rounded-(--radius-control) px-4 ${state}`;
                            }}
                        >
                            <item.icon size={20} aria-hidden="true" />
                            <span className={shape === "drawer" ? "text-label" : "text-label-small"}>{item.label}</span>
                        </NavLink>
                    </li>
                </Fragment>
            ))}
        </ul>
    );
}
