import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { initializeTheme } from "@/hooks/useTheme";
import "@/styles/index.css";

// Tema dipasang sebelum React memasang, supaya halaman tidak berkedip terang lalu gelap.
initializeTheme();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
