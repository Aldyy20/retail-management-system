import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useListPage } from "@/hooks/useListPage";
import { ListPageShell } from "@/components/common/ListPageShell";
import { ColumnSorting } from "@/components/common/ColumnSorting";
import { formatNumber } from "@/services/global.methods";
import type { SelectListItemModel } from "@/@dataLayer/base.models";
import type { QueryStockMovementModel } from "@/@dataLayer/inventory.models";

/**
 * Riwayat setiap perubahan stok. Baris di sini tidak pernah diubah, sehingga stok akhir
 * selalu dapat ditelusuri sampai ke dokumen asalnya.
 */
export default function StockMovementPage() {
    const [listWarehouse, setListWarehouse] = useState<SelectListItemModel[]>([]);
    const [idWarehouse, setIdWarehouse] = useState("");

    const extraRequest = useMemo(() => ({ IdWarehouse: idWarehouse || null }), [idWarehouse]);

    const list = useListPage<QueryStockMovementModel>({
        listUrl: "/inventory/get-list-stock-movement",
        defaultSortBy: "DateCreated",
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

    const warehouseFilter = (
        <>
            <label className="sr-only" htmlFor="filter-gudang-mutasi">
                Saring gudang
            </label>
            <select
                id="filter-gudang-mutasi"
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
        </>
    );

    return (
        <ListPageShell
            title="Riwayat stok"
            description="Setiap penambahan dan pengurangan stok beserta dokumen asalnya dan siapa yang melakukannya."
            primaryAction={warehouseFilter}
            searchPlaceholder="Cari nama produk, SKU, atau nomor dokumen"
            emptyTitle="Belum ada pergerakan stok"
            emptyDescription="Riwayat terisi begitu ada barang masuk yang disetujui, penyesuaian stok, atau transaksi penjualan."
            isLoading={list.isLoading}
            errorMessage={list.errorMessage}
            rowCount={list.listData.length}
            paging={list.paging}
            onSearch={list.handleSearch}
            onRefresh={list.handleRefresh}
            onPageChange={list.handlePageChange}
            onPageSizeChange={list.setPageSizeOption}
        >
            <table className="w-full min-w-[56rem] border-collapse text-left">
                <thead className="border-b border-outline-variant bg-surface-low">
                    <tr>
                        <ColumnSorting label="Waktu" sortKey="DateCreated" {...sortProps} />
                        <ColumnSorting label="Produk" sortKey="ProductName" {...sortProps} />
                        <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                            Jenis
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                            Perubahan
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-label-small text-on-surface-variant">
                            Stok akhir
                        </th>
                        <th scope="col" className="px-4 py-3 text-label-small text-on-surface-variant">
                            Dokumen
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant">
                    {list.listData.map((row) => (
                        <tr key={row.IdStockMovement} className="hover:bg-on-surface/4">
                            <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrDateCreated}</td>
                            <td className="px-4 py-3">
                                <p className="text-body text-on-surface">{row.ProductName}</p>
                                <p className="text-label-small text-on-surface-variant">
                                    {row.Sku} · {row.WarehouseName}
                                </p>
                            </td>
                            <td className="px-4 py-3 text-body text-on-surface-variant">{row.StrMovementType}</td>
                            {/*
                              * Arah pergerakan disampaikan lewat tanda plus atau minus pada angkanya,
                              * bukan lewat warna, supaya tetap terbaca tanpa membedakan warna.
                              */}
                            <td className="px-4 py-3 text-numeric text-body font-semibold text-on-surface">
                                {row.StrQuantityChange} {row.UnitName}
                            </td>
                            <td className="px-4 py-3 text-numeric text-body text-on-surface-variant">
                                {formatNumber(row.QuantityAfter)}
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-body text-on-surface-variant">{row.ReferenceNumber ?? row.ReferenceType}</p>
                                {row.CreatedBy ? (
                                    <p className="text-label-small text-on-surface-variant">oleh {row.CreatedBy}</p>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ListPageShell>
    );
}
