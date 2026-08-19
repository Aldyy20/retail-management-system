import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useListPage } from "@/hooks/useListPage";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { StatusPill } from "@/components/common/StatusPill";
import { formatNumber } from "@/services/global.methods";
import type { SelectListItemModel } from "@/@dataLayer/base.models";
import type { QueryInventoryModel } from "@/@dataLayer/inventory.models";

const stockStatusOptions = [
    { value: "", label: "Semua Kondisi Stok" },
    { value: "habis", label: "Stok Habis" },
    { value: "menipis", label: "Stok Menipis" },
    { value: "perlu-dipesan", label: "Perlu Dipesan Ulang" },
    { value: "aman", label: "Stok Aman" },
];

export default function InventoryPage() {
    const [listWarehouse, setListWarehouse] = useState<SelectListItemModel[]>([]);
    const [idWarehouse, setIdWarehouse] = useState("");
    const [stockStatus, setStockStatus] = useState("");

    const extraRequest = useMemo(
        () => ({ IdWarehouse: idWarehouse || null, StockStatus: stockStatus || null }),
        [idWarehouse, stockStatus],
    );

    const list = useListPage<QueryInventoryModel>({
        listUrl: "/inventory/get-list-inventory",
        defaultSortBy: "ProductName",
        extraRequest,
    });

    useEffect(() => {
        api.post<SelectListItemModel[]>("/inventory/get-list-select-warehouse")
            .then((response) => setListWarehouse(response.data))
            .catch(() => setListWarehouse([]));
    }, []);

    const sortProps = {
        currentSortBy: list.paging.sortBy,
        reverseSort: list.paging.reverseSort,
        onSort: list.handleSort,
    };

    const filters = (
        <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="filter-gudang">
                Saring gudang
            </label>
            <select
                id="filter-gudang"
                value={idWarehouse}
                onChange={(event) => setIdWarehouse(event.target.value)}
                className="min-h-10 rounded-lg border border-outline-variant bg-surface-lowest px-3 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
                <option value="">Semua Lokasi Gudang</option>
                {listWarehouse.map((warehouse) => (
                    <option key={warehouse.Value} value={warehouse.Value}>
                        {warehouse.Text}
                    </option>
                ))}
            </select>

            <label className="sr-only" htmlFor="filter-kondisi">
                Saring kondisi stok
            </label>
            <select
                id="filter-kondisi"
                value={stockStatus}
                onChange={(event) => setStockStatus(event.target.value)}
                className="min-h-10 rounded-lg border border-outline-variant bg-surface-lowest px-3 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
                {stockStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <ListPageShell
            title="Manajemen Inventaris"
            description="Informasi stok barang real-time per gudang. Stok diperbarui otomatis melalui transaksi kasir, barang masuk, dan opname."
            primaryAction={filters}
            searchPlaceholder="Cari nama produk, SKU, barcode, atau kategori..."
            emptyTitle="Belum ada produk aktif"
            emptyDescription="Data stok akan tampil setelah produk dan gudang aktif terdaftar di sistem."
            isLoading={list.isLoading}
            errorMessage={list.errorMessage}
            rowCount={list.listData.length}
            paging={list.paging}
            onSearch={list.handleSearch}
            onRefresh={list.handleRefresh}
            onPageChange={list.handlePageChange}
            onPageSizeChange={list.setPageSizeOption}
        >
            <table className="w-full min-w-[52rem] border-collapse text-left">
                <thead className="border-b border-outline-variant bg-surface-muted/70">
                    <tr>
                        <ColumnSorting label="Produk" sortKey="ProductName" {...sortProps} />
                        <ColumnSorting label="Gudang" sortKey="WarehouseName" {...sortProps} />
                        <ColumnSorting label="Sisa Stok" sortKey="Quantity" alignRight {...sortProps} />
                        <ColumnSorting label="Batas Min" sortKey="MinimumStock" alignRight {...sortProps} />
                        <th scope="col" className="px-4 py-3.5 text-label-small font-semibold text-on-surface-variant">
                            Kondisi
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-right text-label-small font-semibold text-on-surface-variant">
                            Nilai Persediaan
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant">
                    {list.listData.map((row) => (
                        <tr key={row.IdProduct + row.IdWarehouse} className="hover:bg-surface-muted/40 transition-colors">
                            <td className="px-4 py-3.5">
                                <p className="font-heading font-semibold text-sm text-on-surface">{row.ProductName}</p>
                                <p className="text-xs text-on-surface-variant font-mono-receipt mt-0.5">
                                    {row.Sku} · <span className="font-sans font-medium text-primary">{row.CategoryName}</span>
                                </p>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-on-surface-variant font-medium">{row.WarehouseName}</td>
                            <td className="px-4 py-3.5 text-numeric text-sm font-bold text-on-surface">
                                {formatNumber(row.Quantity)} <span className="font-normal text-xs text-on-surface-variant">{row.UnitName}</span>
                            </td>
                            <td className="px-4 py-3.5 text-numeric text-xs font-mono-receipt text-on-surface-variant">
                                {formatNumber(row.MinimumStock)}
                            </td>
                            <td className="px-4 py-3.5">
                                <StatusPill
                                    tone={row.StockStatus === "habis" ? "error" : row.StockStatus === "menipis" ? "pending" : "success"}
                                    label={row.StrStockStatus}
                                />
                            </td>
                            <td className="px-4 py-3.5 text-numeric font-semibold text-xs text-on-surface">{row.StrStockValue}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ListPageShell>
    );
}
