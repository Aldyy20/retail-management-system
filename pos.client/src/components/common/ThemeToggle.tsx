import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/hooks/useTheme";

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Terang", icon: Sun },
    { value: "dark", label: "Gelap", icon: Moon },
    { value: "system", label: "Ikuti sistem", icon: Monitor },
];

/**
 * Segmented button M3 untuk pilihan yang saling meniadakan.
 * Status terpilih ditandai warna sekaligus aria-checked, bukan warna saja.
 */
export function ThemeToggle() {
    const { preference, changeTheme } = useTheme();

    return (
        <div role="radiogroup" aria-label="Tema tampilan" className="inline-flex rounded-(--radius-control) border border-outline p-0.5">
            {options.map(({ value, label, icon: Icon }) => {
                const isSelected = preference === value;

                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        title={label}
                        aria-label={label}
                        onClick={() => changeTheme(value)}
                        className={[
                            "inline-flex size-11 items-center justify-center rounded-[6px] transition-colors",
                            isSelected
                                ? "bg-secondary-container text-on-secondary-container"
                                : "text-on-surface-variant hover:bg-on-surface/8",
                        ].join(" ")}
                    >
                        <Icon size={18} aria-hidden="true" />
                    </button>
                );
            })}
        </div>
    );
}
