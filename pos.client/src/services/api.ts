import axios from "axios";

/**
 * Satu instance untuk seluruh panggilan API. Token dipasang lewat interceptor supaya
 * tidak ada halaman yang lupa mengirim header, dan token kedaluwarsa ditangani di satu tempat.
 *
 * Seluruh endpoint aplikasi memakai POST, termasuk yang membaca data, mengikuti kontrak backend.
 */
export const api = axios.create({
    baseURL: "/api/v1",
    headers: { "Content-Type": "application/json" },
});

const TOKEN_STORAGE_KEY = "pos.token";

export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    /*
     * Unggahan berkas dikirim sebagai multipart dengan pembatas yang dibuat browser.
     * Header JSON bawaan harus dilepas untuk permintaan itu, karena kalau ikut terkirim
     * pembatasnya hilang dan server menerima permintaan tanpa berkas sama sekali.
     */
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }

    return config;
});

/** Dipanggil saat server menolak token, agar aplikasi kembali ke halaman masuk. */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
    onUnauthorized = handler;
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            setStoredToken(null);
            onUnauthorized?.();
        }

        return Promise.reject(error);
    },
);
