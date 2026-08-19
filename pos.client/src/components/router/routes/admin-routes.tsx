import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

// Dashboard Pages
const DashboardPage = lazy(() => import("@/pages/user-pages/common-pages/dashboard/DashboardPage"));

// Master Data Pages
const ProductPage = lazy(() => import("@/pages/user-pages/common-pages/product/ProductPage"));
const ProductCreateEditPage = lazy(() => import("@/pages/user-pages/common-pages/product/ProductCreateEditPage"));
const ProductDetailsPage = lazy(() => import("@/pages/user-pages/common-pages/product/ProductDetailsPage"));
const CategoryPage = lazy(() => import("@/pages/user-pages/common-pages/category/CategoryPage"));
const CategoryCreateEditPage = lazy(() => import("@/pages/user-pages/common-pages/category/CategoryCreateEditPage"));
const UnitPage = lazy(() => import("@/pages/user-pages/common-pages/unit/UnitPage"));
const UnitCreateEditPage = lazy(() => import("@/pages/user-pages/common-pages/unit/UnitCreateEditPage"));
const WarehousePage = lazy(() => import("@/pages/user-pages/common-pages/warehouse/WarehousePage"));
const WarehouseCreateEditPage = lazy(() => import("@/pages/user-pages/common-pages/warehouse/WarehouseCreateEditPage"));
const SupplierPage = lazy(() => import("@/pages/user-pages/common-pages/supplier/SupplierPage"));
const SupplierCreateEditPage = lazy(() => import("@/pages/user-pages/common-pages/supplier/SupplierCreateEditPage"));
const EmployeePage = lazy(() => import("@/pages/user-pages/common-pages/employee/EmployeePage"));
const EmployeeCreateEditPage = lazy(() => import("@/pages/user-pages/common-pages/employee/EmployeeCreateEditPage"));

// Inventory Pages
const InventoryPage = lazy(() => import("@/pages/user-pages/common-pages/inventory/InventoryPage"));
const StockMovementPage = lazy(() => import("@/pages/user-pages/common-pages/inventory/StockMovementPage"));

export const adminRoutes: RouteObject[] = [
    { path: "", element: <Navigate to="/admin/dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },

    // Product Routes
    { path: "product", element: <ProductPage /> },
    { path: "product/create", element: <ProductCreateEditPage /> },
    { path: "product/edit/:id", element: <ProductCreateEditPage /> },
    { path: "product/details/:id", element: <ProductDetailsPage /> },

    // Category Routes
    { path: "category", element: <CategoryPage /> },
    { path: "category/create", element: <CategoryCreateEditPage /> },
    { path: "category/edit/:id", element: <CategoryCreateEditPage /> },

    // Unit Routes
    { path: "unit", element: <UnitPage /> },
    { path: "unit/create", element: <UnitCreateEditPage /> },
    { path: "unit/edit/:id", element: <UnitCreateEditPage /> },

    // Warehouse Routes
    { path: "warehouse", element: <WarehousePage /> },
    { path: "warehouse/create", element: <WarehouseCreateEditPage /> },
    { path: "warehouse/edit/:id", element: <WarehouseCreateEditPage /> },

    // Supplier Routes
    { path: "supplier", element: <SupplierPage /> },
    { path: "supplier/create", element: <SupplierCreateEditPage /> },
    { path: "supplier/edit/:id", element: <SupplierCreateEditPage /> },

    // Employee Routes
    { path: "employee", element: <EmployeePage /> },
    { path: "employee/create", element: <EmployeeCreateEditPage /> },
    { path: "employee/edit/:id", element: <EmployeeCreateEditPage /> },

    // Inventory Routes
    { path: "inventory", element: <InventoryPage /> },
    { path: "stock-movement", element: <StockMovementPage /> },
];
