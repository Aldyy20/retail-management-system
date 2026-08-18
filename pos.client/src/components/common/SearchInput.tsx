import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { IconButton } from "@/components/ui/IconButton";

interface SearchInputProps {
    /** Menyebutkan kolom apa saja yang dicari, supaya hasil kosong tidak membingungkan. */
    placeholder: string;
    value: string | null;
    onSearch: (searchPhrase: string | null) => void;
}

/**
 * Kotak pencarian. Pencarian dikirim setelah pengguna berhenti mengetik sejenak,
 * sehingga tidak ada permintaan server untuk setiap huruf.
 */
export function SearchInput({ placeholder, value, onSearch }: SearchInputProps) {
    const [draft, setDraft] = useState(value ?? "");

    useEffect(() => {
        const trimmed = draft.trim();
        const current = value ?? "";

        if (trimmed === current) {
            return;
        }

        const timer = window.setTimeout(() => onSearch(trimmed.length === 0 ? null : trimmed), 400);
        return () => window.clearTimeout(timer);
    }, [draft, value, onSearch]);

    return (
        <TextField
            label="Cari"
            type="search"
            placeholder={placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            leadingIcon={<Search size={18} />}
            containerClassName="w-full medium:max-w-xs"
            trailingSlot={
                draft.length > 0 ? (
                    <IconButton
                        label="Hapus kata kunci"
                        icon={<X size={16} />}
                        onClick={() => setDraft("")}
                        className="-mr-2 size-10"
                    />
                ) : null
            }
        />
    );
}
