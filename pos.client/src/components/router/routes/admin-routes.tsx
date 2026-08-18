import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// Dashboard Pages
const DashboardPage = lazy(() => import("@/pages/user-pages/common-pages/dashboard/DashboardPage"));

export const adminRoutes: RouteObject[] = [
    { path: "", element: <Navigate to="/admin/dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },
];
