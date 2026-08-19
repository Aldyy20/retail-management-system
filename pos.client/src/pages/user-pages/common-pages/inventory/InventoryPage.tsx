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
    { value: "", label: "Semua kondisi" },
    { value: "habis", label: "Habis" },
    { value: "menipis", label: "Menipis" },
    // Gabungan habis dan menipis. Angkanya sama persis dengan penanda pada menu Stok,
    // sehingga penanda itu selalu dapat ditelusuri ke barisnya.
    { value: "perlu-dipesan", label: "Perlu dipesan ulang" },
    { value: "aman", label: "Aman" },
];

/**
 * Stok per produk per gudang. Halaman ini hanya membaca; stok tidak dapat diubah dari sini
 * karena setiap perubahan harus melewati barang masuk, stock opname, atau transaksi kasir.
 */
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
                className="min-h-11 rounded-(--radius-control) border border-outline bg-surface px-3 text-body text-on-surface outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-primary"
            >
                <option value="">Semua gudang</option>
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
                className="min-h-11 rounded-(--radius-control) border border-outline bg-surface px-3 text-body text-on-surface outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-primary"
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
            title="Stok"
            description="Jumlah barang menurut catatan sistem, dirinci per gudang. Stok hanya berubah lewat barang masuk, stock opname, dan penjualan."
            primaryAction={filters}
            searchPlaceholder="Cari nama, SKU, barcode, atau kategori"
            emptyTitle="Belum ada produk aktif"
            emptyDescription="Stok muncul setelah ada produk aktif dan gudang aktif. Tambahkan produk lebih dulu di menu Produk."
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
                <thead className="border-b border-outline-variant bg-surface-low">
                    <tr>
                        <ColumnSorting label="Produk" sortKey="ProductName" {...sortProps} />
                        <ColumnSorting label="Gudang" sortKey="WarehouseName" {...sortProps} />
                        <ColumnSorting label="Stok" sortKey="Quantity" alignRight {...sortProps} />
                        <ColumnSorting label="Min stok" sortKey="MinimumStock" alignRight {...sortProps} />
                        <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                            Kondisi
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                            Nilai persediaan
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant">
                    {list.listData.map((row) => (
                        <tr key={row.IdProduct + row.IdWarehouse} className="hover:bg-on-surface/4">
                            <td className="px-4 py-3">
                                <p className="text-body text-on-surface">{row.ProductName}</p>
                                <p className="text-label-small text-on-surface-variant">
                                    {row.Sku} · {row.CategoryName}
                                </p>
                            </td>
                            <td className="px-4 py-3 text-body text-on-surface-variant">{row.WarehouseName}</td>
                            <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                {formatNumber(row.Quantity)} <span className="font-normal text-on-surface-variant">{row.UnitName}</span>
                            </td>
                            <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                {formatNumber(row.MinimumStock)}
                            </td>
                            <td className="px-4 py-3">
                                <StatusPill
                                    tone={row.StockStatus === "habis" ? "error" : row.StockStatus === "menipis" ? "pending" : "success"}
                                    label={row.StrStockStatus}
                                />
                            </td>
                            <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">{row.StrStockValue}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ListPageShell>
    );
}
