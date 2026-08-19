import { useState } from "react";
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

/** Pecahan uang yang sering diterima kasir, untuk mempercepat pengisian. */
const quickAmounts = [5000, 10000, 20000, 50000, 100000];

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
            title="Pembayaran"
            description={`Total belanja ${cart.StrTotalAmount} untuk ${cart.TotalQuantity} barang.`}
            onClose={onClose}
            actions={
                <>
                    <Button variant="text" onClick={onClose} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button onClick={saveTransaction} isLoading={isSubmitting} disabled={!isPaidEnough}>
                        {isSubmitting ? "Menyimpan" : "Selesaikan"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

                {listPaymentMethod.length > 1 ? (
                    <div role="radiogroup" aria-label="Metode pembayaran" className="flex flex-wrap gap-2">
                        {listPaymentMethod.map((method) => (
                            <button
                                key={method.PaymentMethodCode}
                                type="button"
                                role="radio"
                                aria-checked={paymentMethodCode === method.PaymentMethodCode}
                                onClick={() => setPaymentMethodCode(method.PaymentMethodCode)}
                                className={[
                                    "min-h-11 rounded-(--radius-control) border px-4 text-label",
                                    paymentMethodCode === method.PaymentMethodCode
                                        ? "border-primary bg-secondary-container text-on-secondary-container"
                                        : "border-outline text-on-surface-variant hover:bg-on-surface/8",
                                ].join(" ")}
                            >
                                {method.PaymentMethodName}
                            </button>
                        ))}
                    </div>
                ) : null}

                {requiresChange ? (
                    <>
                        <TextField
                            label="Uang diterima"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            autoFocus
                            value={paidAmount}
                            onChange={(event) => setPaidAmount(event.target.value)}
                            helperText="Isi jumlah uang yang diterima dari pembeli."
                        />

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outlined" onClick={() => setPaidAmount(String(cart.TotalAmount))}>
                                Uang pas
                            </Button>
                            {quickAmounts
                                .filter((amount) => amount >= cart.TotalAmount)
                                .slice(0, 3)
                                .map((amount) => (
                                    <Button key={amount} variant="outlined" onClick={() => setPaidAmount(String(amount))}>
                                        {formatMoney(amount)}
                                    </Button>
                                ))}
                        </div>

                        <dl className="flex items-baseline justify-between gap-4 rounded-(--radius-control) bg-surface-container px-4 py-3">
                            <dt className="text-title text-on-surface">Kembalian</dt>
                            <dd className="text-numeric text-headline text-on-surface">
                                {formatMoney(change > 0 ? change : 0)}
                            </dd>
                        </dl>
                    </>
                ) : (
                    <p className="text-body text-on-surface-variant">
                        Metode ini dibayar pas sejumlah {cart.StrTotalAmount}, jadi tidak ada kembalian.
                    </p>
                )}

                <TextField
                    label="Catatan"
                    placeholder="Opsional"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                />
            </div>
        </Dialog>
    );
}
