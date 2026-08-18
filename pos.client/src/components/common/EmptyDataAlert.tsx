import type { ReactNode } from "react";

interface EmptyDataAlertProps {
    /** Menjelaskan kenapa kosong, bukan sekadar "tidak ada data". */
    title: string;
    description: string;
    /** Tindakan yang mengisi kekosongan itu, kalau memang ada. */
    action?: ReactNode;
}

export function EmptyDataAlert({ title, description, action }: EmptyDataAlertProps) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="text-title text-on-surface">{title}</p>
            <p className="max-w-md text-body text-on-surface-variant">{description}</p>
            {action ? <div className="mt-3">{action}</div> : null}
        </div>
    );
}
