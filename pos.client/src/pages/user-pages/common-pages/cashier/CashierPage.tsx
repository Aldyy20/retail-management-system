import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Package, Plus, ScanBarcode, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { useSnackbar } from "@/components/ui/Snackbar";
import { getAxiosErrorMessage, formatMoney, formatNumber, getUploadedImageUrl } from "@/services/global.methods";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import { PaymentDialog } from "@/pages/user-pages/common-pages/cashier/PaymentDialog";
import { MemberPanel } from "@/pages/user-pages/common-pages/cashier/MemberPanel";
import type {
    CalculatedCartModel,
    CartItemModel,
    CashierInitModel,
    ProductLookupModel,
} from "@/@dataLayer/transaction.models";

/**
 * Layar Kasir Zenith Retail Pro (POS).
 * Dua panel split-view: Katalog produk interaktif di kiri, Keranjang belanja presisi di kanan.
 */
export default function CashierPage() {
    const rolePath = useRolePath();
    const navigate = useNavigate();
    const { successNotify, errorNotify } = useSnackbar();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [init, setInit] = useState<CashierInitModel | null>(null);
    const [idWarehouse, setIdWarehouse] = useState("");

    const [searchPhrase, setSearchPhrase] = useState("");
    const [listProduct, setListProduct] = useState<ProductLookupModel[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [listItem, setListItem] = useState<CartItemModel[]>([]);
    const [cart, setCart] = useState<CalculatedCartModel | null>(null);
    const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [idMember, setIdMember] = useState<string | null>(null);
    const [idPointRedemptionRule, setIdPointRedemptionRule] = useState<string | null>(null);
    const [voucherCodeDraft, setVoucherCodeDraft] = useState("");
    const [voucherCode, setVoucherCode] = useState<string | null>(null);

    const loadInitData = useCallback(() => {
        return api
            .post<CashierInitModel>(`/${rolePath}/cashier/get-init`, {})
            .then((response) => {
                setInit(response.data);
                setIdWarehouse(response.data.DefaultWarehouseId);
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoadingInit(false));
    }, [rolePath]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const searchProduct = useCallback(() => {
        if (!idWarehouse) {
            return Promise.resolve();
        }

        return api
            .post<ProductLookupModel[]>(`/${rolePath}/cashier/search-product`, {
                IdWarehouse: idWarehouse,
                SearchPhrase: searchPhrase.trim() || null,
            })
            .then((response) => setListProduct(response.data))
            .catch((error) => errorNotify(getAxiosErrorMessage(error)))
            .finally(() => setIsSearching(false));
    }, [idWarehouse, rolePath, searchPhrase, errorNotify]);

    useEffect(() => {
        const timer = window.setTimeout(() => searchProduct(), 250);
        return () => window.clearTimeout(timer);
    }, [searchProduct]);

    const calculateCart = useCallback(() => {
        if (!idWarehouse || listItem.length === 0) {
            return Promise.resolve();
        }

        return api
            .post<CalculatedCartModel>(`/${rolePath}/cashier/calculate`, {
                IdWarehouse: idWarehouse,
                IdMember: idMember,
                IdPointRedemptionRule: idPointRedemptionRule,
                VoucherCode: voucherCode,
                ListItem: listItem,
            })
            .then((response) => {
                setCart(response.data);
                setCartErrorMessage(null);
            })
            .catch((error) => setCartErrorMessage(getAxiosErrorMessage(error)));
    }, [idWarehouse, listItem, rolePath, idMember, idPointRedemptionRule, voucherCode]);

    useEffect(() => {
        calculateCart();
    }, [calculateCart]);

    const addToCart = (product: ProductLookupModel) => {
        setListItem((current) => {
            const existing = current.find((x) => x.IdProduct === product.IdProduct);

            if (existing) {
                return current.map((x) =>
                    x.IdProduct === product.IdProduct ? { ...x, Quantity: x.Quantity + 1 } : x,
                );
            }

            return [...current, { IdProduct: product.IdProduct, Quantity: 1 }];
        });

        setSearchPhrase("");
        searchInputRef.current?.focus();
    };

    const changeQuantity = (idProduct: string, delta: number) => {
        setListItem((current) =>
            current
                .map((x) => (x.IdProduct === idProduct ? { ...x, Quantity: x.Quantity + delta } : x))
                .filter((x) => x.Quantity > 0),
        );
    };

    const removeFromCart = (idProduct: string) => {
        setListItem((current) => current.filter((x) => x.IdProduct !== idProduct));
    };

    const clearCart = () => {
        setListItem([]);
        setCart(null);
        setCartErrorMessage(null);
        setIdMember(null);
        setIdPointRedemptionRule(null);
        setVoucherCode(null);
        setVoucherCodeDraft("");
        searchInputRef.current?.focus();
    };

    const handleSelectMember = (nextIdMember: string | null) => {
        setIdPointRedemptionRule(null);
        setIdMember(nextIdMember);
    };

    const handlePaid = (idTransaction: string, invoiceNumber: string) => {
        setShowPaymentDialog(false);
        clearCart();
        successNotify(`Transaksi ${invoiceNumber} berhasil disimpan.`);
        navigate(`/${rolePath}/transaction/details/${idTransaction}`);
    };

    if (isLoadingInit) {
        return <LoadingSpinner label="Menyiapkan layar kasir" className="min-h-[60vh]" />;
    }

    if (initErrorMessage) {
        return (
            <ErrorAlert
                message={initErrorMessage}
                onRetry={() => {
                    setIsLoadingInit(true);
                    loadInitData();
                }}
            />
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="sr-only">Kasir Zenith POS</h1>

            <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-start">
                {/* Sisi Kiri: Pencarian & Katalog Produk */}
                <div className="bg-surface-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col min-w-0">
                    <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-muted/60 space-y-3">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="relative flex-1 min-w-[240px]">
                                <TextField
                                    ref={searchInputRef}
                                    label="Cari Produk atau Scan Barcode"
                                    placeholder="Ketik nama, SKU, atau pindai barcode..."
                                    autoFocus
                                    value={searchPhrase}
                                    leadingIcon={<Search size={18} />}
                                    trailingSlot={
                                        searchPhrase.length > 0 ? (
                                            <IconButton
                                                label="Hapus pencarian"
                                                icon={<X size={16} />}
                                                onClick={() => setSearchPhrase("")}
                                                className="-mr-2 size-10"
                                            />
                                        ) : (
                                            <span className="text-on-surface-variant/60 -mr-1" title="Scan barcode siap">
                                                <ScanBarcode size={20} />
                                            </span>
                                        )
                                    }
                                    onChange={(event) => {
                                        setIsSearching(true);
                                        setSearchPhrase(event.target.value);
                                    }}
                                />
                            </div>

                            {init && init.ListWarehouse.length > 1 ? (
                                <div className="shrink-0">
                                    <label htmlFor="kasir-gudang" className="mb-1.5 block text-label-small font-medium text-on-surface">
                                        Lokasi Gudang
                                    </label>
                                    <select
                                        id="kasir-gudang"
                                        value={idWarehouse}
                                        onChange={(event) => setIdWarehouse(event.target.value)}
                                        className="min-h-11 rounded-(--radius-control) border border-outline-variant bg-surface-lowest px-3.5 text-body text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                                    >
                                        {init.ListWarehouse.map((warehouse) => (
                                            <option key={warehouse.Value} value={warehouse.Value}>
                                                {warehouse.Text}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 flex-1 min-h-[480px]">
                        {isSearching ? <LoadingSpinner label="Mencari produk..." /> : null}

                        {!isSearching && listProduct.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
                                <Search size={40} className="stroke-[1.5] text-outline mb-3 opacity-60" />
                                <p className="text-title font-semibold text-on-surface">
                                    {searchPhrase ? "Produk Tidak Ditemukan" : "Belum Ada Produk"}
                                </p>
                                <p className="text-body text-sm mt-1 max-w-sm">
                                    {searchPhrase
                                        ? `Tidak ada produk dengan kata kunci "${searchPhrase}". Coba periksa ejaan atau scan ulang barcode.`
                                        : "Belum ada produk aktif di gudang ini. Silakan tambahkan barang masuk terlebih dahulu."}
                                </p>
                            </div>
                        ) : null}

                        {!isSearching && listProduct.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                                {listProduct.map((product) => {
                                    const isOutOfStock = product.Stock <= 0;

                                    return (
                                        <button
                                            key={product.IdProduct}
                                            type="button"
                                            onClick={() => addToCart(product)}
                                            disabled={isOutOfStock}
                                            className={[
                                                "group flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-lowest p-3 text-left transition-all duration-150",
                                                "hover:shadow-md hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
                                                isOutOfStock ? "opacity-50 cursor-not-allowed bg-surface-muted/40" : "cursor-pointer",
                                            ].join(" ")}
                                        >
                                            {/* Foto Produk dengan Status Stok Badge */}
                                            <div className="relative mb-2.5 h-28 w-full overflow-hidden rounded-lg bg-surface-muted/60 border border-outline-variant/60 flex items-center justify-center">
                                                {product.PhotoFileName ? (
                                                    <img
                                                        src={getUploadedImageUrl("product", product.PhotoFileName) ?? ""}
                                                        alt={product.ProductName}
                                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-on-surface-variant/40">
                                                        <Package size={28} className="stroke-[1.5]" />
                                                    </div>
                                                )}
                                                <span
                                                    className={[
                                                        "absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs",
                                                        isOutOfStock
                                                            ? "bg-error text-on-error"
                                                            : product.Stock <= 5
                                                              ? "bg-pending text-on-pending"
                                                              : "bg-success text-on-success",
                                                    ].join(" ")}
                                                >
                                                    {isOutOfStock ? "Habis" : `Sisa ${formatNumber(product.Stock)}`}
                                                </span>
                                            </div>

                                            <div className="space-y-1 mb-2.5">
                                                <span className="text-[11px] font-mono-receipt text-on-surface-variant/70 block truncate">
                                                    {product.Barcode ? product.Barcode : product.Sku}
                                                </span>
                                                <h3 className="font-heading text-title-small text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                                    {product.ProductName}
                                                </h3>
                                            </div>

                                            <div className="pt-2 border-t border-outline-variant/60 flex items-baseline justify-between mt-auto">
                                                <span className="text-[11px] text-on-surface-variant">
                                                    /{product.UnitName}
                                                </span>
                                                <span className="text-numeric font-heading font-bold text-sm text-secondary">
                                                    {product.StrSellingPrice}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Sisi Kanan: Panel Keranjang Kasir (Fixed Split) */}
                <div className="bg-surface-lowest border border-outline-variant rounded-2xl shadow-lg overflow-hidden flex flex-col sticky top-20">
                    <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-4 bg-slate-900 text-white">
                        <h2 className="flex items-center gap-2.5 font-heading text-title font-bold">
                            <ShoppingCart size={20} />
                            <span>Keranjang Belanja</span>
                        </h2>

                        {listItem.length > 0 ? (
                            <button
                                type="button"
                                onClick={clearCart}
                                className="text-xs text-white/80 hover:text-white hover:underline transition-colors cursor-pointer"
                            >
                                Kosongkan
                            </button>
                        ) : null}
                    </div>

                    {/* Seksi Member */}
                    {init?.IsMemberEnabled ? (
                        <MemberPanel
                            member={cart?.Member ?? null}
                            listRedemptionOption={cart?.ListRedemptionOption ?? []}
                            idPointRedemptionRule={idPointRedemptionRule}
                            pointEarned={cart?.PointEarned ?? 0}
                            isLoyaltyEnabled={init.IsLoyaltyEnabled}
                            onSelectMember={handleSelectMember}
                            onSelectRedemption={setIdPointRedemptionRule}
                        />
                    ) : null}

                    {/* Seksi Voucher */}
                    {init?.IsVoucherEnabled ? (
                        <div className="border-b border-outline-variant px-4 py-3 bg-surface-muted/30">
                            <div className="flex items-end gap-2">
                                <TextField
                                    label="Kode Voucher"
                                    placeholder="HEMAT20"
                                    containerClassName="flex-1"
                                    value={voucherCodeDraft}
                                    onChange={(event) => setVoucherCodeDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            setVoucherCode(voucherCodeDraft.trim() || null);
                                        }
                                    }}
                                    errorText={cart?.Voucher && !cart.Voucher.IsValid ? cart.Voucher.ErrorMessage ?? undefined : undefined}
                                    helperText={
                                        cart?.Voucher?.IsValid
                                            ? `${cart.Voucher.VoucherName} memotong ${cart.Voucher.StrDiscountAmount}.`
                                            : undefined
                                    }
                                />

                                {voucherCode ? (
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setVoucherCode(null);
                                            setVoucherCodeDraft("");
                                        }}
                                    >
                                        Lepas
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        onClick={() => setVoucherCode(voucherCodeDraft.trim() || null)}
                                        disabled={voucherCodeDraft.trim().length === 0}
                                    >
                                        Terapkan
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {cartErrorMessage ? (
                        <div className="p-4">
                            <ErrorAlert message={cartErrorMessage} onRetry={calculateCart} />
                        </div>
                    ) : null}

                    {/* Daftar Item Keranjang (Scrollable jika lebih dari 2 barang) */}
                    <div className="max-h-[175px] overflow-y-auto divide-y divide-outline-variant">
                        {listItem.length === 0 ? (
                            <div className="p-10 text-center text-on-surface-variant flex flex-col items-center justify-center">
                                <ShoppingCart size={32} className="stroke-[1.5] text-outline mb-2 opacity-50" />
                                <p className="text-sm font-medium text-on-surface">Keranjang Kosong</p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                    Pilih produk di katalog sebelah untuk mulai transaksi.
                                </p>
                            </div>
                        ) : (
                            cart?.ListItem.map((item) => (
                                <div key={item.IdProduct} className="p-3.5 hover:bg-surface-muted/30 transition-colors space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-heading text-title-small text-on-surface line-clamp-1 leading-snug">
                                                {item.ProductName}
                                            </p>
                                            <p className="text-xs text-on-surface-variant">
                                                {item.StrUnitPrice} /{item.UnitName}
                                            </p>
                                        </div>
                                        <p className="text-numeric font-heading font-bold text-sm text-on-surface">
                                            {item.StrSubtotal}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center border border-outline-variant rounded-md overflow-hidden bg-surface-lowest h-8">
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(item.IdProduct, -1)}
                                                className="px-2.5 hover:bg-surface-muted text-on-surface-variant h-full flex items-center justify-center transition-colors cursor-pointer"
                                                aria-label={`Kurangi ${item.ProductName}`}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-10 text-center font-mono-receipt text-sm font-bold text-on-surface">
                                                {item.Quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(item.IdProduct, 1)}
                                                disabled={item.Quantity >= item.AvailableStock}
                                                className="px-2.5 hover:bg-surface-muted text-on-surface-variant h-full flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                                                aria-label={`Tambah ${item.ProductName}`}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <IconButton
                                            label={`Hapus ${item.ProductName}`}
                                            icon={<Trash2 size={16} />}
                                            onClick={() => removeFromCart(item.IdProduct)}
                                            className="text-on-surface-variant hover:text-error hover:bg-error/10"
                                        />
                                    </div>

                                    {!item.IsStockSufficient ? (
                                        <p role="alert" className="text-xs font-semibold text-error">
                                            Stok hanya tersisa {item.AvailableStock} {item.UnitName}.
                                        </p>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Ringkasan Biaya & Tombol Bayar */}
                    {cart && cart.ListItem.length > 0 ? (
                        <div className="border-t border-outline-variant p-4 bg-surface-muted/60 space-y-3">
                            <dl className="space-y-1.5 font-mono-receipt text-xs text-on-surface-variant">
                                <div className="flex justify-between">
                                    <span>Subtotal ({formatNumber(cart.TotalQuantity)} item)</span>
                                    <span className="font-semibold text-on-surface">{cart.StrSubtotalAmount}</span>
                                </div>

                                {cart.DiscountAmount > 0 ? (
                                    <div className="flex justify-between text-secondary font-medium">
                                        <span>Diskon Produk</span>
                                        <span>{formatMoney(-cart.DiscountAmount)}</span>
                                    </div>
                                ) : null}

                                {cart.VoucherDiscountAmount > 0 ? (
                                    <div className="flex justify-between text-secondary font-medium">
                                        <span>Voucher ({cart.Voucher?.VoucherCode})</span>
                                        <span>{formatMoney(-cart.VoucherDiscountAmount)}</span>
                                    </div>
                                ) : null}

                                {cart.PointDiscountAmount > 0 ? (
                                    <div className="flex justify-between text-amber-600 font-medium">
                                        <span>Potongan Poin ({cart.PointRedeemed} Poin)</span>
                                        <span>{formatMoney(-cart.PointDiscountAmount)}</span>
                                    </div>
                                ) : null}

                                <div className="pt-2 border-t border-dashed border-outline-variant flex justify-between items-baseline font-heading">
                                    <dt className="text-base font-bold text-on-surface">Total Akhir</dt>
                                    <dd className="text-numeric text-2xl font-extrabold text-on-surface">
                                        {cart.StrTotalAmount}
                                    </dd>
                                </div>
                            </dl>

                            <Button
                                fullWidth
                                onClick={() => setShowPaymentDialog(true)}
                                disabled={!cart.IsReadyToPay}
                                className="py-3.5 font-heading text-base font-bold shadow-md tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                                Bayar Transaksi
                            </Button>

                            {!cart.IsReadyToPay && cart.ListWarning.length > 0 ? (
                                <p role="alert" className="text-xs font-semibold text-center text-error">
                                    {cart.ListWarning[0]}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Dialog Pembayaran */}
            {cart && init ? (
                <PaymentDialog
                    key={showPaymentDialog ? "bayar-terbuka" : "bayar-tertutup"}
                    isOpen={showPaymentDialog}
                    cart={cart}
                    idWarehouse={idWarehouse}
                    listItem={listItem}
                    idMember={idMember}
                    idPointRedemptionRule={idPointRedemptionRule}
                    voucherCode={voucherCode}
                    listPaymentMethod={init.ListPaymentMethod}
                    onClose={() => setShowPaymentDialog(false)}
                    onPaid={handlePaid}
                />
            ) : null}
        </div>
    );
}
