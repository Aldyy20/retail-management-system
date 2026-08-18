import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, getStoredToken, setStoredToken, setUnauthorizedHandler } from "@/services/api";
import type { CurrentUserModel, LoginRequestModel } from "@/@models/auth.models";

interface AuthContextValue {
    currentUser: CurrentUserModel | null;
    /** Selama true, rute belum boleh memutuskan pengguna masuk atau tidak. */
    isRestoringSession: boolean;
    login: (model: LoginRequestModel) => Promise<CurrentUserModel>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = "pos.user";

function readStoredUser(): CurrentUserModel | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as CurrentUserModel;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<CurrentUserModel | null>(readStoredUser);
    const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => Boolean(getStoredToken()));

    const logout = useCallback(() => {
        setStoredToken(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        setCurrentUser(null);
    }, []);

    /**
     * Token di browser belum tentu masih sah: bisa kedaluwarsa, atau akunnya sudah
     * dinonaktifkan admin. Sesi dipulihkan lewat server, bukan dipercaya begitu saja.
     */
    useEffect(() => {
        setUnauthorizedHandler(logout);

        // Tanpa token, isRestoringSession sudah bernilai false sejak state dibuat,
        // sehingga tidak perlu diubah lagi di sini.
        if (!getStoredToken()) {
            return;
        }

        let isMounted = true;

        api.post<CurrentUserModel>("/auth/get-current-user")
            .then((response) => {
                if (!isMounted) {
                    return;
                }

                const verified: CurrentUserModel = { ...response.data, Token: getStoredToken() ?? "" };
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(verified));
                setCurrentUser(verified);
            })
            .catch(() => {
                if (isMounted) {
                    logout();
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsRestoringSession(false);
                }
            });

        return () => {
            isMounted = false;
            setUnauthorizedHandler(null);
        };
    }, [logout]);

    const login = useCallback(async (model: LoginRequestModel) => {
        const response = await api.post<CurrentUserModel>("/auth/login", model);
        setStoredToken(response.data.Token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
        setCurrentUser(response.data);
        return response.data;
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ currentUser, isRestoringSession, login, logout }),
        [currentUser, isRestoringSession, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth harus dipakai di dalam AuthProvider.");
    }

    return context;
}
