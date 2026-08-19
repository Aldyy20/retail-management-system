import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import type { SelectListItemModel } from "@/@dataLayer/base.models";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> {
    label: string;
    options: SelectListItemModel[];
    /** Teks pilihan kosong. Tanpa ini pengguna tidak punya cara menyatakan belum memilih. */
    placeholder?: string;
    helperText?: string;
    errorText?: string;
    containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { label, options, placeholder = "Pilih salah satu", helperText, errorText, containerClassName = "", id, required, ...rest },
    ref,
) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const messageId = `${selectId}-message`;
    const hasError = Boolean(errorText);
    const message = errorText ?? helperText;

    return (
        <div className={containerClassName}>
            <label htmlFor={selectId} className="mb-1.5 block text-label-small font-medium text-on-surface">
                {label}
                {required ? <span className="text-error"> *</span> : null}
            </label>

            <div
                className={[
                    "relative flex items-center rounded-(--radius-control) border bg-surface-lowest transition-shadow",
                    hasError
                        ? "border-error focus-within:ring-2 focus-within:ring-error/20 focus-within:border-error"
                        : "border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                ].join(" ")}
            >
                <select
                    {...rest}
                    id={selectId}
                    ref={ref}
                    required={required}
                    aria-invalid={hasError || undefined}
                    aria-describedby={message ? messageId : undefined}
                    className="min-h-11 w-full appearance-none bg-transparent px-3 pr-10 text-body text-on-surface outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.Value} value={option.Value}>
                            {option.Description ? `${option.Text} (${option.Description})` : option.Text}
                        </option>
                    ))}
                </select>

                <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-3 text-on-surface-variant" />
            </div>

            {message ? (
                <p id={messageId} className={`mt-1 text-label-small ${hasError ? "text-error" : "text-on-surface-variant"}`}>
                    {message}
                </p>
            ) : null}
        </div>
    );
});
