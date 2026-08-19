import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// Dashboard Pages
const DashboardPage = lazy(() => import("@/pages/user-pages/common-pages/dashboard/DashboardPage"));

// Approval Pages
const ApprovalPage = lazy(() => import("@/pages/user-pages/supervisor-pages/approval/ApprovalPage"));

// Inventory Pages
const InventoryPage = lazy(() => import("@/pages/user-pages/common-pages/inventory/InventoryPage"));
const StockMovementPage = lazy(() => import("@/pages/user-pages/common-pages/inventory/StockMovementPage"));
const GoodsReceivingPage = lazy(() => import("@/pages/user-pages/common-pages/goods-receiving/GoodsReceivingPage"));
const GoodsReceivingCreateEditPage = lazy(
    () => import("@/pages/user-pages/common-pages/goods-receiving/GoodsReceivingCreateEditPage"),
);
const GoodsReceivingDetailsPage = lazy(
    () => import("@/pages/user-pages/common-pages/goods-receiving/GoodsReceivingDetailsPage"),
);
const StockOpnamePage = lazy(() => import("@/pages/user-pages/common-pages/stock-opname/StockOpnamePage"));
const StockOpnameCreateEditPage = lazy(
    () => import("@/pages/user-pages/common-pages/stock-opname/StockOpnameCreateEditPage"),
);
const StockOpnameDetailsPage = lazy(
    () => import("@/pages/user-pages/common-pages/stock-opname/StockOpnameDetailsPage"),
);

export const supervisorRoutes: RouteObject[] = [
    { path: "", element: <Navigate to="/supervisor/dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },

    // Approval Routes
    { path: "approval", element: <ApprovalPage /> },

    // Inventory Routes
    { path: "inventory", element: <InventoryPage /> },
    { path: "stock-movement", element: <StockMovementPage /> },

    // Goods Receiving Routes
    { path: "goods-receiving", element: <GoodsReceivingPage /> },
    { path: "goods-receiving/create", element: <GoodsReceivingCreateEditPage /> },
    { path: "goods-receiving/edit/:id", element: <GoodsReceivingCreateEditPage /> },
    { path: "goods-receiving/details/:id", element: <GoodsReceivingDetailsPage /> },

    // Stock Opname Routes
    { path: "stock-opname", element: <StockOpnamePage /> },
    { path: "stock-opname/create", element: <StockOpnameCreateEditPage /> },
    { path: "stock-opname/details/:id", element: <StockOpnameDetailsPage /> },
];
