import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { api } from "@/services/api";
import { getAxiosErrorMessage, getUploadedImageUrl } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import type { DetailsProductModel } from "@/@dataLayer/master-data.models";

export default function ProductDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [product, setProduct] = useState<DetailsProductModel | null>(null);

    const loadInitData = useCallback(() => {
        return api
            .post<DetailsProductModel>("/admin/product/get-details", { Id: id })
            .then((response) => {
                setProduct(response.data);
                setErrorMessage(null);
            })
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoading(false));
    }, [id]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const handleRefresh = () => {
        setIsLoading(true);
        loadInitData();
    };

    const detailRows = product
        ? [
              { label: "SKU", value: product.Sku },
              { label: "Barcode", value: product.Barcode ?? "Tidak ada" },
              { label: "Kategori", value: product.CategoryName },
              { label: "Satuan", value: product.UnitName },
              { label: "Harga modal", value: product.StrCostPrice, isNumeric: true },
              { label: "Harga jual", value: product.StrSellingPrice, isNumeric: true },
              { label: "Untung per satuan", value: product.StrProfitPerUnit, isNumeric: true },
              { label: "Margin", value: product.StrMargin, isNumeric: true },
              { label: "Minimum stok", value: String(product.MinimumStock), isNumeric: true },
              { label: "Dibuat", value: product.StrDateCreated },
              { label: "Diperbarui", value: product.StrDateModified || "Belum pernah diubah" },
          ]
        : [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={product?.ProductName ?? "Detail produk"}
                description="Rincian produk beserta riwayat perubahan harganya."
                actions={
                    <>
                        <Button
                            variant="text"
                            icon={<ArrowLeft size={18} aria-hidden="true" />}
                            onClick={() => navigate("/admin/product")}
                        >
                            Kembali
                        </Button>
                        {product ? (
                            <Button
                                variant="tonal"
                                icon={<Pencil size={18} aria-hidden="true" />}
                                onClick={() => navigate(`/admin/product/edit/${product.IdProduct}`)}
                            >
                                Ubah produk
                            </Button>
                        ) : null}
                    </>
                }
            />

            {isLoading ? <LoadingSpinner label="Memuat detail produk" /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !errorMessage && product ? (
                <div className="grid gap-6 large:grid-cols-[22rem_1fr]">
                    <Surface variant="outlined" className="p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-title text-on-surface">Rincian</h2>
                            <StatusPill tone={product.IsActive ? "success" : "neutral"} label={product.StrStatus} />
                        </div>

                        {product.PhotoFileName ? (
                            <img
                                src={getUploadedImageUrl("product", product.PhotoFileName) ?? ""}
                                alt={`Foto ${product.ProductName}`}
                                className="mb-4 aspect-square w-full rounded-(--radius-control) border border-outline-variant bg-surface-low object-contain"
                            />
                        ) : null}

                        <dl className="flex flex-col gap-2.5">
                            {detailRows.map((row) => (
                                <div key={row.label} className="flex items-baseline justify-between gap-4">
                                    <dt className="text-body text-on-surface-variant">{row.label}</dt>
                                    <dd className={`text-body text-on-surface ${row.isNumeric ? "text-numeric" : ""}`}>
                                        {row.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {product.Description ? (
                            <p className="mt-4 border-t border-outline-variant pt-4 text-body text-on-surface-variant">
                                {product.Description}
                            </p>
                        ) : null}
                    </Surface>

                    <Surface variant="outlined" className="overflow-hidden">
                        <div className="border-b border-outline-variant px-5 py-4">
                            <h2 className="text-title text-on-surface">Histori harga</h2>
                            <p className="text-label-small text-on-surface-variant">
                                Transaksi lama tetap memakai harga saat transaksi terjadi, bukan harga terbaru.
                            </p>
                        </div>
                        <PriceHistoryList product={product} />
                    </Surface>
                </div>
            ) : null}
        </div>
    );
}

/** Riwayat perubahan harga, terbaru di atas. */
function PriceHistoryList({ product }: { product: DetailsProductModel }) {
    if (product.ListPriceHistory.length === 0) {
        return (
            <EmptyDataAlert
                title="Belum ada perubahan harga"
                description="Riwayat muncul di sini setiap kali harga modal atau harga jual produk ini diubah."
            />
        );
    }

    return (
        <ul className="divide-y divide-outline-variant">
            {product.ListPriceHistory.map((history) => (
                <li key={history.IdPriceHistory} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        {/*
                          * Baris pertama bukan perubahan, melainkan harga saat produk dibuat,
                          * sehingga tidak ditampilkan seolah harga berubah dari Rp0.
                          */}
                        {history.IsInitialPrice ? (
                            <p className="text-title-small text-on-surface">
                                Harga awal <span className="text-numeric">{history.StrSellingPrice}</span>
                            </p>
                        ) : (
                            <p className="text-title-small text-on-surface">
                                <span className="text-numeric text-on-surface-variant line-through">
                                    {history.StrPreviousSellingPrice}
                                </span>{" "}
                                menjadi <span className="text-numeric">{history.StrSellingPrice}</span>
                            </p>
                        )}
                        <p className="text-label-small text-on-surface-variant">{history.StrDateCreated}</p>
                    </div>

                    <p className="text-label-small text-on-surface-variant">
                        {history.IsInitialPrice
                            ? "Harga modal " + history.StrCostPrice
                            : "Modal " + history.StrPreviousCostPrice + " menjadi " + history.StrCostPrice}
                        {history.CreatedBy ? " · oleh " + history.CreatedBy : ""}
                    </p>

                    {history.Note ? <p className="mt-1 text-body text-on-surface-variant">{history.Note}</p> : null}
                </li>
            ))}
        </ul>
    );
}
