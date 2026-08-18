import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// Dashboard Pages
const DashboardPage = lazy(() => import("@/pages/user-pages/common-pages/dashboard/DashboardPage"));

export const ownerRoutes: RouteObject[] = [
    { path: "", element: <Navigate to="/owner/dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },
];
