import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/components/router/AuthContext";
import { SnackbarProvider } from "@/components/ui/Snackbar";
import { AppRouter } from "@/components/router/AppRouter";

export default function App() {
    return (
        <BrowserRouter>
            <SnackbarProvider>
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
            </SnackbarProvider>
        </BrowserRouter>
    );
}
