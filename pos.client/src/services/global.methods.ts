import axios from "axios";

/**
 * Backend selalu mengembalikan pesan siap tampil dalam bahasa Indonesia pada body respons.
 * Fungsi ini menariknya keluar, dan hanya jatuh ke pesan umum kalau benar-benar tidak ada.
 */
export function getAxiosErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            const data = error.response.data;

            if (typeof data === "string" && data.trim().length > 0) {
                return data;
            }

            if (data && typeof data === "object" && "title" in data && typeof data.title === "string") {
                return data.title;
            }

            return `Permintaan gagal dengan status ${error.response.status}.`;
        }

        if (error.code === "ERR_NETWORK") {
            return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "Terjadi kesalahan yang tidak diketahui.";
}

const currencyFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatMoney(value: number | null | undefined): string {
    return "Rp" + currencyFormatter.format(value ?? 0);
}

export function formatNumber(value: number | null | undefined): string {
    return currencyFormatter.format(value ?? 0);
}

/**
 * Warna penanda untuk status siklus hidup dokumen. Selalu dipasangkan dengan label teks,
 * jadi warna hanya memperkuat, bukan menjadi satu-satunya penanda.
 */
export function getDocumentStatusTone(status: number): "pending" | "success" | "error" | "neutral" | "info" {
    switch (status) {
        case 2:
            return "pending";
        case 3:
        case 6:
            return "success";
        case 4:
            return "error";
        case 5:
        case 7:
            return "neutral";
        default:
            return "info";
    }
}

/** Segmen alamat berkas statis di backend. Sepadan dengan AppSettings.UploadFolder. */
const UPLOAD_URL_PREFIX = "/uploads";

/**
 * Alamat gambar unggahan dari nama berkasnya. Mengembalikan null bila belum ada berkas,
 * sehingga pemanggil memutuskan sendiri apa yang tampil sebagai gantinya.
 */
export function getUploadedImageUrl(folder: string, fileName: string | null | undefined): string | null {
    return fileName ? `${UPLOAD_URL_PREFIX}/${folder}/${fileName}` : null;
}
