import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// Dashboard Pages
const DashboardPage = lazy(() => import("@/pages/user-pages/common-pages/dashboard/DashboardPage"));

// Report Pages
const ReportPage = lazy(() => import("@/pages/user-pages/common-pages/report/ReportPage"));

// Inventory Pages
const InventoryPage = lazy(() => import("@/pages/user-pages/common-pages/inventory/InventoryPage"));
const StockMovementPage = lazy(() => import("@/pages/user-pages/common-pages/inventory/StockMovementPage"));

export const ownerRoutes: RouteObject[] = [
    { path: "", element: <Navigate to="/owner/dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },

    // Report Routes
    { path: "report", element: <ReportPage /> },

    // Inventory Routes
    { path: "inventory", element: <InventoryPage /> },
    { path: "stock-movement", element: <StockMovementPage /> },
];
