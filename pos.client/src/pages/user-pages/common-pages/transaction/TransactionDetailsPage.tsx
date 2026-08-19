import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { useSnackbar } from "@/components/ui/Snackbar";
import { getAxiosErrorMessage, getDocumentStatusTone } from "@/services/global.methods";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { StatusPill } from "@/components/common/StatusPill";
import { ApprovalSummary } from "@/components/common/ApprovalSummary";
import { ReceiptView } from "@/components/common/ReceiptView";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { DATA_STATUS } from "@/@dataLayer/inventory.models";
import type { DetailsTransactionModel } from "@/@dataLayer/transaction.models";

export default function TransactionDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const rolePath = useRolePath();
    const { successNotify } = useSnackbar();

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [transaction, setTransaction] = useState<DetailsTransactionModel | null>(null);

    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [voidReason, setVoidReason] = useState("");
    const [voidError, setVoidError] = useState<string | null>(null);
    const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);

    const loadInitData = useCallback(() => {
        return api
            .post<DetailsTransactionModel>(`/${rolePath}/cashier/get-details`, { Id: id })
            .then((response) => {
                setTransaction(response.data);
                setErrorMessage(null);
            })
            .catch((error) => setErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoading(false));
    }, [id, rolePath]);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const handleRefresh = () => {
        setIsLoading(true);
        loadInitData();
    };

    const requestVoid = async () => {
        if (voidReason.trim().length < 5) {
            setVoidError("Alasan pembatalan minimal 5 karakter supaya supervisor paham konteksnya.");
            return;
        }

        setIsSubmittingVoid(true);
        setVoidError(null);

        try {
            const response = await api.post<string>(`/${rolePath}/cashier/request-void`, {
                IdTransaction: id,
                Reason: voidReason,
            });
            successNotify(response.data);
            setShowVoidDialog(false);
            handleRefresh();
        } catch (error) {
            setVoidError(getAxiosErrorMessage(error));
        } finally {
            setIsSubmittingVoid(false);
        }
    };

    const canRequestVoid = transaction?.Status === DATA_STATUS.Completed;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={transaction?.InvoiceNumber ?? "Detail transaksi"}
                description="Nota transaksi beserta rincian barang dan keputusan pembatalannya."
                actions={
                    <>
                        <Button
                            variant="text"
                            icon={<ArrowLeft size={18} aria-hidden="true" />}
                            onClick={() => navigate(`/${rolePath}/transaction`)}
                        >
                            Kembali
                        </Button>

                        {transaction ? (
                            <Button
                                variant="tonal"
                                icon={<Printer size={18} aria-hidden="true" />}
                                onClick={() => window.print()}
                            >
                                Cetak nota
                            </Button>
                        ) : null}

                        {canRequestVoid ? (
                            <Button
                                variant="danger"
                                icon={<Ban size={18} aria-hidden="true" />}
                                onClick={() => {
                                    setVoidReason("");
                                    setVoidError(null);
                                    setShowVoidDialog(true);
                                }}
                            >
                                Ajukan pembatalan
                            </Button>
                        ) : null}
                    </>
                }
            />

            {isLoading ? <LoadingSpinner label="Memuat nota" /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !errorMessage && transaction ? (
                <div className="grid gap-6 large:grid-cols-[24rem_1fr] large:items-start">
                    <Surface variant="outlined" className="overflow-hidden">
                        <ReceiptView transaction={transaction} />
                    </Surface>

                    <div className="flex flex-col gap-6">
                        <Surface variant="outlined" className="p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="text-title text-on-surface">Ringkasan</h2>
                                <StatusPill tone={getDocumentStatusTone(transaction.Status)} label={transaction.StrStatus} />
                            </div>

                            <dl className="flex flex-col gap-2.5">
                                {[
                                    { label: "Gudang", value: transaction.WarehouseName },
                                    { label: "Kasir", value: transaction.CashierName ?? "Tidak diketahui" },
                                    { label: "Metode pembayaran", value: transaction.PaymentMethodName },
                                    { label: "Jenis barang", value: String(transaction.TotalItem), isNumeric: true },
                                    { label: "Subtotal", value: transaction.StrSubtotalAmount, isNumeric: true },
                                    { label: "Total", value: transaction.StrTotalAmount, isNumeric: true },
                                    { label: "Dibayar", value: transaction.StrPaidAmount, isNumeric: true },
                                    { label: "Kembalian", value: transaction.StrChangeAmount, isNumeric: true },
                                    { label: "Laba kotor", value: transaction.StrGrossProfit, isNumeric: true },
                                ].map((row) => (
                                    <div key={row.label} className="flex items-baseline justify-between gap-4">
                                        <dt className="text-body text-on-surface-variant">{row.label}</dt>
                                        <dd className={`text-body text-on-surface ${row.isNumeric ? "text-numeric" : ""}`}>
                                            {row.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            {transaction.Note ? (
                                <p className="mt-4 border-t border-outline-variant pt-4 text-body text-on-surface-variant">
                                    {transaction.Note}
                                </p>
                            ) : null}
                        </Surface>

                        <ApprovalSummary approvalRequest={transaction.VoidRequest} />
                    </div>
                </div>
            ) : null}

            <Dialog
                isOpen={showVoidDialog}
                title="Ajukan pembatalan transaksi?"
                description={`Transaksi ${transaction?.InvoiceNumber ?? ""} dibatalkan dan stoknya dikembalikan setelah supervisor menyetujui. Nota lama tetap tersimpan sebagai jejak.`}
                onClose={() => setShowVoidDialog(false)}
                actions={
                    <>
                        <Button variant="text" onClick={() => setShowVoidDialog(false)} disabled={isSubmittingVoid}>
                            Batal
                        </Button>
                        <Button variant="danger" onClick={requestVoid} isLoading={isSubmittingVoid}>
                            Ajukan pembatalan
                        </Button>
                    </>
                }
            >
                <Textarea
                    label="Alasan pembatalan"
                    required
                    placeholder="Pembeli membatalkan setelah struk tercetak"
                    helperText="Wajib diisi. Supervisor membacanya sebelum memutuskan."
                    value={voidReason}
                    onChange={(event) => setVoidReason(event.target.value)}
                    errorText={voidError ?? undefined}
                />
            </Dialog>
        </div>
    );
}
