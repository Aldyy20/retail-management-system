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
            <label htmlFor={textareaId} className="mb-1.5 block text-label-small font-medium text-on-surface">
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
                    "w-full rounded-(--radius-control) border bg-surface-lowest px-3 py-2.5 text-body text-on-surface transition-shadow",
                    "outline-none placeholder:text-on-surface-variant/60 disabled:cursor-not-allowed disabled:opacity-50",
                    hasError
                        ? "border-error focus:ring-2 focus:ring-error/20 focus:border-error"
                        : "border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20",
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
