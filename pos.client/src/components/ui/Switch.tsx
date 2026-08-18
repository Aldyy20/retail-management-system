import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
    label: string;
    /** Menjelaskan akibat menyalakan atau mematikannya. */
    description?: string;
}

/**
 * Saklar untuk pengaturan biner yang berdiri sendiri.
 *
 * Dibangun di atas checkbox asli, sehingga keyboard dan pembaca layar bekerja apa adanya.
 * Status tetap terbaca tanpa warna karena tuas ikut bergeser posisi.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
    { label, description, id, checked, ...rest },
    ref,
) {
    const generatedId = useId();
    const switchId = id ?? generatedId;

    return (
        <div className="flex items-start gap-3">
            <label htmlFor={switchId} className="relative inline-flex shrink-0 cursor-pointer items-center py-2">
                <input
                    {...rest}
                    ref={ref}
                    id={switchId}
                    type="checkbox"
                    checked={checked}
                    role="switch"
                    className="peer sr-only"
                />
                <span
                    aria-hidden="true"
                    className="block h-8 w-13 rounded-full border-2 border-outline bg-surface-highest transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2"
                />
                <span
                    aria-hidden="true"
                    className="absolute left-1.5 size-4 rounded-full bg-outline transition-all peer-checked:left-7 peer-checked:size-5 peer-checked:bg-on-primary"
                />
            </label>

            <label htmlFor={switchId} className="cursor-pointer py-2">
                <span className="block text-label text-on-surface">{label}</span>
                {description ? <span className="block text-label-small text-on-surface-variant">{description}</span> : null}
            </label>
        </div>
    );
});
