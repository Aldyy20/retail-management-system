import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
    /** Label permanen. Placeholder tidak pernah menjadi satu-satunya label. */
    label: string;
    helperText?: string;
    errorText?: string;
    leadingIcon?: ReactNode;
    trailingSlot?: ReactNode;
    containerClassName?: string;
}

/**
 * Outlined text field M3. Kesalahan ditandai dengan warna sekaligus teks penjelas,
 * dan teks itu ditautkan ke input lewat aria-describedby supaya terbaca pembaca layar.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
    { label, helperText, errorText, leadingIcon, trailingSlot, containerClassName = "", id, required, ...rest },
    ref,
) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const hasError = Boolean(errorText);
    const message = errorText ?? helperText;

    return (
        <div className={containerClassName}>
            <label htmlFor={inputId} className="mb-1.5 block text-label-small text-on-surface-variant">
                {label}
                {required ? <span className="text-error"> *</span> : null}
            </label>

            <div
                className={[
                    "flex items-center gap-2 rounded-(--radius-control) border bg-surface px-3",
                    "focus-within:outline focus-within:outline-2 focus-within:outline-offset-0",
                    hasError
                        ? "border-error focus-within:outline-error"
                        : "border-outline focus-within:border-primary focus-within:outline-primary",
                ].join(" ")}
            >
                {leadingIcon ? (
                    <span aria-hidden="true" className="text-on-surface-variant">
                        {leadingIcon}
                    </span>
                ) : null}

                <input
                    {...rest}
                    id={inputId}
                    ref={ref}
                    required={required}
                    aria-invalid={hasError || undefined}
                    aria-describedby={message ? messageId : undefined}
                    className="min-h-11 w-full bg-transparent text-body text-on-surface outline-none placeholder:text-on-surface-variant/70 disabled:cursor-not-allowed disabled:opacity-50"
                />

                {trailingSlot}
            </div>

            {message ? (
                <p id={messageId} className={`mt-1 text-label-small ${hasError ? "text-error" : "text-on-surface-variant"}`}>
                    {message}
                </p>
            ) : null}
        </div>
    );
});
