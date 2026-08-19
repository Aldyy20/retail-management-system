import { useState } from "react";
import { CheckCircle2, CreditCard, DollarSign, Wallet } from "lucide-react";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { getAxiosErrorMessage, formatMoney } from "@/services/global.methods";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import type { CalculatedCartModel, CartItemModel, QueryPaymentMethodModel } from "@/@dataLayer/transaction.models";

interface PaymentDialogProps {
    isOpen: boolean;
    cart: CalculatedCartModel;
    idWarehouse: string;
    listItem: CartItemModel[];
    idMember: string | null;
    idPointRedemptionRule: string | null;
    voucherCode: string | null;
    listPaymentMethod: QueryPaymentMethodModel[];
    onClose: () => void;
    onPaid: (idTransaction: string, invoiceNumber: string) => void;
}

const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

export function PaymentDialog({
    isOpen,
    cart,
    idWarehouse,
    listItem,
    idMember,
    idPointRedemptionRule,
    voucherCode,
    listPaymentMethod,
    onClose,
    onPaid,
}: PaymentDialogProps) {
    const rolePath = useRolePath();

    const [paymentMethodCode, setPaymentMethodCode] = useState(listPaymentMethod[0]?.PaymentMethodCode ?? "");
    const [paidAmount, setPaidAmount] = useState("");
    const [note, setNote] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentMethod = listPaymentMethod.find((x) => x.PaymentMethodCode === paymentMethodCode);
    const requiresChange = paymentMethod?.RequiresChange ?? true;
    const paid = requiresChange ? Number(paidAmount) || 0 : cart.TotalAmount;
    const change = paid - cart.TotalAmount;
    const isPaidEnough = paid >= cart.TotalAmount;

    const saveTransaction = async () => {
        setErrorMessage(null);

        if (!isPaidEnough) {
            setErrorMessage("Uang yang diterima belum menutup total belanja.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post<{ IdTransaction: string; InvoiceNumber: string }>(
                `/${rolePath}/cashier/create-transaction`,
                {
                    IdWarehouse: idWarehouse,
                    IdMember: idMember,
                    IdPointRedemptionRule: idPointRedemptionRule,
                    VoucherCode: voucherCode,
                    PaymentMethodCode: paymentMethodCode,
                    PaidAmount: paid,
                    Note: note || null,
                    ListItem: listItem,
                },
            );
            onPaid(response.data.IdTransaction, response.data.InvoiceNumber);
        } catch (error) {
            setErrorMessage(getAxiosErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            title="Penyelesaian Pembayaran"
            description={`Total tagihan belanja: ${cart.StrTotalAmount} (${cart.TotalQuantity} item)`}
            onClose={onClose}
            actions={
                <>
                    <Button variant="text" onClick={onClose} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button
                        onClick={saveTransaction}
                        isLoading={isSubmitting}
                        disabled={!isPaidEnough}
                        icon={<CheckCircle2 size={18} />}
                        className="px-6 shadow-md"
                    >
                        {isSubmitting ? "Memproses Transaksi..." : "Selesaikan Pembayaran"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                {/* Pilihan Metode Pembayaran */}
                {listPaymentMethod.length > 1 ? (
                    <div>
                        <label className="block text-label-small font-medium text-on-surface mb-2">
                            Metode Pembayaran
                        </label>
                        <div role="radiogroup" aria-label="Metode pembayaran" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {listPaymentMethod.map((method) => {
                                const isSelected = paymentMethodCode === method.PaymentMethodCode;
                                return (
                                    <button
                                        key={method.PaymentMethodCode}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => setPaymentMethodCode(method.PaymentMethodCode)}
                                        className={[
                                            "flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer",
                                            isSelected
                                                ? "border-primary bg-primary text-white shadow-xs"
                                                : "border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-muted",
                                        ].join(" ")}
                                    >
                                        {method.PaymentMethodCode.toLowerCase().includes("cash") || method.PaymentMethodCode.toLowerCase().includes("tunai") ? (
                                            <DollarSign size={16} />
                                        ) : method.PaymentMethodCode.toLowerCase().includes("qris") || method.PaymentMethodCode.toLowerCase().includes("wallet") ? (
                                            <Wallet size={16} />
                                        ) : (
                                            <CreditCard size={16} />
                                        )}
                                        <span className="truncate">{method.PaymentMethodName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {requiresChange ? (
                    <div className="space-y-3 pt-2">
                        <TextField
                            label="Jumlah Uang Diterima"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            autoFocus
                            placeholder="0"
                            value={paidAmount}
                            onChange={(event) => setPaidAmount(event.target.value)}
                        />

                        {/* Tombol Cepat Pecahan Uang */}
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPaidAmount(String(cart.TotalAmount))}
                                className="px-2.5 py-1 rounded-lg border border-outline-variant bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                            >
                                Uang Pas
                            </button>
                            {quickAmounts
                                .filter((amount) => amount >= cart.TotalAmount)
                                .slice(0, 4)
                                .map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => setPaidAmount(String(amount))}
                                        className="px-2.5 py-1 rounded-lg border border-outline-variant bg-surface-lowest text-xs font-semibold text-on-surface hover:bg-surface-muted transition-colors cursor-pointer"
                                    >
                                        {formatMoney(amount)}
                                    </button>
                                ))}
                        </div>

                        {/* Kotak Kembalian */}
                        <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-3.5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-secondary block">Kembalian</span>
                                <span className="text-[11px] text-on-surface-variant">
                                    {isPaidEnough ? "Uang kembalian ke pelanggan" : "Uang belum cukup"}
                                </span>
                            </div>
                            <span className="font-heading font-extrabold text-2xl text-secondary text-numeric">
                                {formatMoney(change > 0 ? change : 0)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-surface-muted border border-outline-variant text-xs text-on-surface-variant">
                        Metode pembayaran ini tidak memerlukan kembalian tunai (Nominal pas: {cart.StrTotalAmount}).
                    </div>
                )}

                <TextField
                    label="Catatan Transaksi (Opsional)"
                    placeholder="Contoh: Meja 4 / Take Away"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                />
            </div>
        </Dialog>
    );
}
