import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    /** Satu kalimat yang menjelaskan apa yang bisa dikerjakan di halaman ini. */
    description?: string;
    /** Aksi utama halaman. Maksimal satu tombol filled di sini. */
    actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-headline text-on-surface">{title}</h1>
                {description ? <p className="mt-1 text-body text-on-surface-variant">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </header>
    );
}
