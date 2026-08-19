import { useId, useState } from "react";
import { ImageOff, Upload } from "lucide-react";
import { api } from "@/services/api";
import { getAxiosErrorMessage, getUploadedImageUrl } from "@/services/global.methods";
import { Button } from "@/components/ui/Button";
import type { UploadImageResponseModel } from "@/@models/upload.models";

interface ImageUploadFieldProps {
    label: string;
    helperText?: string;
    /** Endpoint unggah, contoh /admin/product/upload-photo. */
    uploadUrl: string;
    /** Folder di dalam /uploads, dipakai menyusun alamat pratinjau. */
    folder: string;
    /** Nama berkas yang sedang dipilih, null bila belum ada. */
    value: string | null;
    onChange: (fileName: string | null) => void;
}

/**
 * Pemilih satu gambar dengan pratinjau.
 *
 * Berkas dikirim ke server saat dipilih, bukan saat formulir disimpan, sehingga pengguna
 * tahu gambarnya diterima atau ditolak sebelum mengisi kolom lain. Yang ikut tersimpan
 * bersama data hanyalah nama berkas yang dikembalikan server.
 */
export function ImageUploadField({ label, helperText, uploadUrl, folder, value, onChange }: ImageUploadFieldProps) {
    const inputId = useId();
    const messageId = `${inputId}-message`;

    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const previewUrl = getUploadedImageUrl(folder, value);

    const handleFileChange = (fileList: FileList | null) => {
        const file = fileList?.[0];

        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append("File", file);

        setIsUploading(true);
        setErrorMessage(null);

        api.post<UploadImageResponseModel>(uploadUrl, formData)
            .then((response) => onChange(response.data.FileName))
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsUploading(false));
    };

    return (
        <div>
            <p className="mb-1.5 text-label-small text-on-surface-variant">{label}</p>

            <div className="flex flex-wrap items-start gap-4">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={`Pratinjau ${label.toLowerCase()}`}
                        className="size-28 rounded-(--radius-control) border border-outline-variant bg-surface-low object-contain"
                    />
                ) : (
                    <div className="flex size-28 flex-col items-center justify-center gap-1 rounded-(--radius-control) border border-dashed border-outline bg-surface-low text-on-surface-variant">
                        <ImageOff size={20} aria-hidden="true" />
                        <span className="text-label-small">Belum ada</span>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {/*
                      * Input berkas disembunyikan secara visual, bukan dinonaktifkan, sehingga
                      * tetap dapat dicapai keyboard dan pembaca layar. Labelnya yang tampil
                      * sebagai tombol, dan cincin fokusnya ikut input di sebelahnya.
                      */}
                    <input
                        id={inputId}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isUploading}
                        aria-describedby={messageId}
                        onChange={(event) => handleFileChange(event.target.files)}
                        className="peer sr-only"
                    />

                    <label
                        htmlFor={inputId}
                        className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-(--radius-control) border border-outline px-4 text-label text-primary hover:bg-primary/8 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                    >
                        <Upload size={18} aria-hidden="true" />
                        {isUploading ? "Mengunggah" : previewUrl ? "Ganti gambar" : "Pilih gambar"}
                    </label>

                    {previewUrl && !isUploading ? (
                        <Button variant="text" className="w-fit px-2" onClick={() => onChange(null)}>
                            Hapus gambar
                        </Button>
                    ) : null}

                    <p
                        id={messageId}
                        className={`text-label-small ${errorMessage ? "text-error" : "text-on-surface-variant"}`}
                    >
                        {errorMessage ?? helperText ?? "JPG, PNG, atau WEBP. Ukuran maksimal 3 MB."}
                    </p>
                </div>
            </div>
        </div>
    );
}
