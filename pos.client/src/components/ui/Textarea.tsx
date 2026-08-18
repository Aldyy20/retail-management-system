import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
    label: string;
    helperText?: string;
    errorText?: string;
    containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { label, helperText, errorText, containerClassName = "", id, required, rows = 3, ...rest },
    ref,
) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const messageId = `${textareaId}-message`;
    const hasError = Boolean(errorText);
    const message = errorText ?? helperText;

    return (
        <div className={containerClassName}>
            <label htmlFor={textareaId} className="mb-1.5 block text-label-small text-on-surface-variant">
                {label}
                {required ? <span className="text-error"> *</span> : null}
            </label>

            <textarea
                {...rest}
                id={textareaId}
                ref={ref}
                rows={rows}
                required={required}
                aria-invalid={hasError || undefined}
                aria-describedby={message ? messageId : undefined}
                className={[
                    "w-full rounded-(--radius-control) border bg-surface px-3 py-2.5 text-body text-on-surface",
                    "outline-none placeholder:text-on-surface-variant/70 disabled:cursor-not-allowed disabled:opacity-50",
                    hasError
                        ? "border-error focus:outline focus:outline-2 focus:outline-error"
                        : "border-outline focus:border-primary focus:outline focus:outline-2 focus:outline-primary",
                ].join(" ")}
            />

            {message ? (
                <p id={messageId} className={`mt-1 text-label-small ${hasError ? "text-error" : "text-on-surface-variant"}`}>
                    {message}
                </p>
            ) : null}
        </div>
    );
});
