import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { useSnackbar } from "@/components/ui/Snackbar";
import { getAxiosErrorMessage, formatMoney, formatNumber } from "@/services/global.methods";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Surface } from "@/components/ui/Surface";
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
 * Layar kasir.
 *
 * Ini jeda yang disengaja dari irama halaman lain: dua panel, padat, tanpa daftar
 * bernomor halaman, karena tugasnya satu dan berulang cepat. Seluruh angka berasal
 * dari server; keranjang di layar hanya menyimpan produk dan jumlahnya.
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

    /** Pencarian dikirim setelah pengetikan berhenti sejenak, dan barcode utuh langsung cocok. */
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

    /** Keranjang dihitung ulang di server setiap kali isinya berubah. */
    const calculateCart = useCallback(() => {
        // Keranjang kosong tidak perlu dihitung. Isi lama tidak ditampilkan karena
        // tampilan sudah bercabang pada jumlah baris keranjang.
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

    /** Mengganti member membatalkan penukaran point, karena saldonya berbeda. */
    const handleSelectMember = (nextIdMember: string | null) => {
        setIdPointRedemptionRule(null);
        setIdMember(nextIdMember);
    };

    const handlePaid = (idTransaction: string, invoiceNumber: string) => {
        setShowPaymentDialog(false);
        clearCart();
        successNotify(`Transaksi ${invoiceNumber} tersimpan.`);
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
        <>
            <div className="grid gap-4 large:grid-cols-[1fr_24rem] large:items-start">
                <Surface variant="outlined" className="overflow-hidden">
                    <div className="flex flex-wrap items-end gap-3 border-b border-outline-variant p-4">
                        <TextField
                            ref={searchInputRef}
                            label="Cari atau pindai barang"
                            placeholder="Nama, SKU, atau barcode"
                            autoFocus
                            value={searchPhrase}
                            leadingIcon={<Search size={18} />}
                            containerClassName="min-w-0 flex-1"
                            onChange={(event) => {
                                setIsSearching(true);
                                setSearchPhrase(event.target.value);
                            }}
                            trailingSlot={
                                searchPhrase.length > 0 ? (
                                    <IconButton
                                        label="Hapus kata kunci"
                                        icon={<X size={16} />}
                                        onClick={() => setSearchPhrase("")}
                                        className="-mr-2 size-10"
                                    />
                                ) : null
                            }
                        />

                        {init && init.ListWarehouse.length > 1 ? (
                            <div>
                                <label htmlFor="kasir-gudang" className="mb-1.5 block text-label-small text-on-surface-variant">
                                    Gudang
                                </label>
                                <select
                                    id="kasir-gudang"
                                    value={idWarehouse}
                                    onChange={(event) => setIdWarehouse(event.target.value)}
                                    className="min-h-11 rounded-(--radius-control) border border-outline bg-surface px-3 text-body text-on-surface outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-primary"
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

                    {isSearching ? <LoadingSpinner label="Mencari barang" /> : null}

                    {!isSearching && listProduct.length === 0 ? (
                        <p className="px-6 py-12 text-center text-body text-on-surface-variant">
                            {searchPhrase
                                ? `Tidak ada barang yang cocok dengan "${searchPhrase}". Periksa ejaan atau pindai ulang barcodenya.`
                                : "Belum ada barang aktif di gudang ini. Catat barang masuk lebih dulu."}
                        </p>
                    ) : null}

                    {!isSearching && listProduct.length > 0 ? (
                        <ul className="grid gap-px bg-outline-variant medium:grid-cols-2 expanded:grid-cols-3">
                            {listProduct.map((product) => (
                                <li key={product.IdProduct}>
                                    <button
                                        type="button"
                                        onClick={() => addToCart(product)}
                                        disabled={product.Stock <= 0}
                                        className="flex min-h-20 w-full flex-col justify-between gap-1 bg-surface p-3 text-left transition-colors hover:bg-on-surface/6 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="text-title-small text-on-surface">{product.ProductName}</span>
                                        <span className="flex w-full items-baseline justify-between gap-2">
                                            <span className="text-label-small text-on-surface-variant">
                                                {product.Stock <= 0
                                                    ? "Stok habis"
                                                    : `Sisa ${formatNumber(product.Stock)} ${product.UnitName}`}
                                            </span>
                                            <span className="text-numeric text-title-small text-on-surface">
                                                {product.StrSellingPrice}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </Surface>

                <Surface variant="outlined" className="overflow-hidden large:sticky large:top-20">
                    <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-4 py-3">
                        <h2 className="flex items-center gap-2 text-title text-on-surface">
                            <ShoppingCart size={18} aria-hidden="true" />
                            Keranjang
                        </h2>

                        {listItem.length > 0 ? (
                            <Button variant="text" onClick={clearCart} className="px-2">
                                Kosongkan
                            </Button>
                        ) : null}
                    </div>

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

                    {init?.IsVoucherEnabled ? (
                        <div className="border-b border-outline-variant px-4 py-3">
                            <div className="flex items-end gap-2">
                                <TextField
                                    label="Kode voucher"
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

                    {listItem.length === 0 ? (
                        <p className="px-6 py-10 text-center text-body text-on-surface-variant">
                            Keranjang masih kosong. Pindai barcode atau ketuk barang di sebelah untuk menambahkannya.
                        </p>
                    ) : null}

                    {cart && cart.ListItem.length > 0 ? (
                        <>
                            <ul className="divide-y divide-outline-variant">
                                {cart.ListItem.map((item) => (
                                    <li key={item.IdProduct} className="px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-title-small text-on-surface">{item.ProductName}</p>
                                                <p className="text-label-small text-on-surface-variant">
                                                    {item.StrUnitPrice} per {item.UnitName}
                                                </p>
                                            </div>
                                            <p className="text-numeric text-title-small text-on-surface">{item.StrSubtotal}</p>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1">
                                                <IconButton
                                                    label={`Kurangi ${item.ProductName}`}
                                                    icon={<Minus size={16} />}
                                                    onClick={() => changeQuantity(item.IdProduct, -1)}
                                                />
                                                <span className="text-numeric min-w-10 text-center text-title-small text-on-surface">
                                                    {item.Quantity}
                                                </span>
                                                <IconButton
                                                    label={`Tambah ${item.ProductName}`}
                                                    icon={<Plus size={16} />}
                                                    onClick={() => changeQuantity(item.IdProduct, 1)}
                                                    disabled={item.Quantity >= item.AvailableStock}
                                                />
                                            </div>

                                            <IconButton
                                                label={`Hapus ${item.ProductName} dari keranjang`}
                                                icon={<Trash2 size={16} />}
                                                onClick={() => removeFromCart(item.IdProduct)}
                                                className="hover:bg-error/12 hover:text-error"
                                            />
                                        </div>

                                        {!item.IsStockSufficient ? (
                                            <p role="alert" className="mt-1 text-label-small text-error">
                                                Stok tinggal {item.AvailableStock} {item.UnitName}.
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>

                            <dl className="flex flex-col gap-1.5 border-t border-outline-variant px-4 py-3">
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-body text-on-surface-variant">
                                        Subtotal ({formatNumber(cart.TotalQuantity)} barang)
                                    </dt>
                                    <dd className="text-numeric text-body text-on-surface">{cart.StrSubtotalAmount}</dd>
                                </div>

                                {cart.DiscountAmount > 0 ? (
                                    <div className="flex items-baseline justify-between gap-4">
                                        <dt className="text-body text-on-surface-variant">Diskon</dt>
                                        <dd className="text-numeric text-body text-on-surface">
                                            {formatMoney(-cart.DiscountAmount)}
                                        </dd>
                                    </div>
                                ) : null}

                                {cart.VoucherDiscountAmount > 0 ? (
                                    <div className="flex items-baseline justify-between gap-4">
                                        <dt className="text-body text-on-surface-variant">
                                            Voucher {cart.Voucher?.VoucherCode ?? ""}
                                        </dt>
                                        <dd className="text-numeric text-body text-on-surface">
                                            {formatMoney(-cart.VoucherDiscountAmount)}
                                        </dd>
                                    </div>
                                ) : null}

                                {cart.PointDiscountAmount > 0 ? (
                                    <div className="flex items-baseline justify-between gap-4">
                                        <dt className="text-body text-on-surface-variant">
                                            Tukar point ({cart.PointRedeemed} point)
                                        </dt>
                                        <dd className="text-numeric text-body text-on-surface">
                                            {formatMoney(-cart.PointDiscountAmount)}
                                        </dd>
                                    </div>
                                ) : null}

                                <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-outline-variant pt-2">
                                    <dt className="text-title text-on-surface">Total</dt>
                                    <dd className="text-numeric text-headline text-on-surface">{cart.StrTotalAmount}</dd>
                                </div>
                            </dl>

                            <div className="p-4 pt-0">
                                <Button
                                    fullWidth
                                    onClick={() => setShowPaymentDialog(true)}
                                    disabled={!cart.IsReadyToPay}
                                >
                                    Bayar
                                </Button>

                                {!cart.IsReadyToPay && cart.ListWarning.length > 0 ? (
                                    <p role="alert" className="mt-2 text-label-small text-error">
                                        {cart.ListWarning[0]}
                                    </p>
                                ) : null}
                            </div>
                        </>
                    ) : null}
                </Surface>
            </div>

            {cart && init ? (
                <PaymentDialog
                    // Kunci diganti setiap dialog dibuka supaya isian pembayaran
                    // selalu mulai dari kosong tanpa perlu efek pembersih.
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
        </>
    );
}
