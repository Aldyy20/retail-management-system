import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { menuBadgeLabel } from "@/components/router/menu-items";
import type { MenuBadgeKey, MenuItem } from "@/components/router/menu-items";

type NavShape = "rail" | "drawer";

interface NavDestinationsProps {
    items: MenuItem[];
    rolePath: string;
    shape: NavShape;
    /** Jumlah pekerjaan yang menunggu per jenis, ditampilkan pada tujuan yang memintanya. */
    badgeCount?: Partial<Record<MenuBadgeKey, number>>;
    onNavigate?: () => void;
}

/**
 * Navigasi Zenith Retail Pro.
 * Sidebar bertema gelap permanen dengan penanda aktif border kiri emerald.
 */
export function NavDestinations({ items, rolePath, shape, badgeCount = {}, onNavigate }: NavDestinationsProps) {
    return (
        <ul className={shape === "rail" ? "flex flex-col items-center gap-1.5 py-3" : "flex flex-col gap-1 p-3"}>
            {items.map((item) => {
                const pendingCount = item.badgeKey ? (badgeCount[item.badgeKey] ?? 0) : 0;

                return (
                    <Fragment key={item.path}>
                        {item.groupLabel ? (
                            shape === "drawer" ? (
                                <li className="mt-4 px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400/80 uppercase" aria-hidden="true">
                                    {item.groupLabel}
                                </li>
                            ) : (
                                <li className="my-2 h-px w-8 bg-slate-800" aria-hidden="true" />
                            )
                        ) : null}

                        <li>
                            <NavLink
                                to={`/${rolePath}/${item.path}`}
                                onClick={onNavigate}
                                className={({ isActive }) => {
                                    if (shape === "rail") {
                                        return isActive
                                            ? "relative flex min-h-14 w-14 flex-col items-center justify-center gap-1 rounded-(--radius-control) bg-slate-800/90 text-white border-l-4 border-emerald-500 translate-x-0.5"
                                            : "relative flex min-h-14 w-14 flex-col items-center justify-center gap-1 rounded-(--radius-control) text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors";
                                    }

                                    return isActive
                                        ? "flex min-h-11 items-center gap-3 rounded-(--radius-control) bg-slate-800/90 px-3.5 text-white font-semibold border-l-4 border-emerald-500 translate-x-1 shadow-sm"
                                        : "flex min-h-11 items-center gap-3 rounded-(--radius-control) px-3.5 text-slate-300/80 hover:bg-slate-800/60 hover:text-white transition-all";
                                }}
                            >
                                <item.icon size={19} aria-hidden="true" className="shrink-0" />
                                <span className={shape === "drawer" ? "text-label truncate" : "text-[11px] font-medium"}>{item.label}</span>

                                {item.badgeKey && pendingCount > 0 ? (
                                    <span
                                        className={
                                            shape === "rail"
                                                ? "absolute top-1.5 right-1.5 min-w-4.5 rounded-full bg-error px-1 py-0.5 text-center text-numeric text-[10px] font-bold text-on-error"
                                                : "ml-auto min-w-5 rounded-full bg-error px-2 py-0.5 text-center text-numeric text-[11px] font-bold text-on-error"
                                        }
                                    >
                                        <span aria-hidden="true">{pendingCount}</span>
                                        <span className="sr-only">
                                            {pendingCount} {menuBadgeLabel[item.badgeKey]}
                                        </span>
                                    </span>
                                ) : null}
                            </NavLink>
                        </li>
                    </Fragment>
                );
            })}
        </ul>
    );
}
