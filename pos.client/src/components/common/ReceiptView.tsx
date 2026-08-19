import type { DetailsTransactionModel } from "@/@dataLayer/transaction.models";

interface ReceiptViewProps {
    transaction: DetailsTransactionModel;
}

/**
 * Nota siap cetak.
 *
 * Seluruh teksnya berasal dari pengaturan toko, bukan ditulis tetap di kode, sehingga
 * admin dapat mengubah alamat, footer, dan kebijakan retur tanpa deployment ulang.
 * Lebarnya mengikuti kertas struk 58mm sampai 80mm, dan hanya bagian inilah yang
 * ikut tercetak berkat kelas cetak pada index.css.
 */
export function ReceiptView({ transaction }: ReceiptViewProps) {
    const receipt = transaction.Receipt;

    return (
        <div
            id="area-nota"
            className="mx-auto w-full max-w-[22rem] bg-surface p-5 font-mono text-on-surface"
            style={{ fontSize: "12px", lineHeight: 1.5 }}
        >
            <div className="text-center">
                {/* Logo dibatasi tingginya supaya tidak mendorong isi nota keluar dari kertas. */}
                {receipt.StoreLogoUrl ? (
                    <img src={receipt.StoreLogoUrl} alt="" className="mx-auto mb-1 max-h-12 object-contain" />
                ) : null}

                <p className="text-[14px] font-semibold uppercase">{receipt.StoreName}</p>
                {receipt.StoreAddress ? <p>{receipt.StoreAddress}</p> : null}
                {receipt.StorePhone ? <p>{receipt.StorePhone}</p> : null}
                {receipt.Header ? <p className="mt-1">{receipt.Header}</p> : null}
            </div>

            <hr className="my-2 border-dashed border-outline" />

            <dl className="grid grid-cols-[auto_1fr] gap-x-2">
                <dt>Nota</dt>
                <dd className="text-right">{transaction.InvoiceNumber}</dd>
                <dt>Tanggal</dt>
                <dd className="text-right">{transaction.StrTransactionDate}</dd>
                <dt>Kasir</dt>
                <dd className="text-right">{transaction.CashierName ?? "-"}</dd>
            </dl>

            <hr className="my-2 border-dashed border-outline" />

            <ul>
                {transaction.ListDetail.map((item) => (
                    <li key={item.IdTransactionDetail} className="mb-1">
                        <p>{item.ProductName}</p>
                        <p className="flex justify-between">
                            <span>
                                {item.Quantity} {item.UnitName} x {item.StrUnitPrice}
                            </span>
                            <span className="text-numeric">{item.StrSubtotal}</span>
                        </p>
                    </li>
                ))}
            </ul>

            <hr className="my-2 border-dashed border-outline" />

            <dl className="grid grid-cols-[1fr_auto] gap-x-2">
                <dt>Subtotal</dt>
                <dd className="text-numeric">{transaction.StrSubtotalAmount}</dd>

                {transaction.SubtotalAmount !== transaction.TotalAmount ? (
                    <>
                        <dt>Diskon</dt>
                        <dd className="text-numeric">{transaction.StrTotalDiscountAmount}</dd>
                    </>
                ) : null}

                <dt className="text-[13px] font-semibold">TOTAL</dt>
                <dd className="text-numeric text-[13px] font-semibold">{transaction.StrTotalAmount}</dd>

                <dt>Bayar ({transaction.PaymentMethodName})</dt>
                <dd className="text-numeric">{transaction.StrPaidAmount}</dd>

                <dt>Kembalian</dt>
                <dd className="text-numeric">{transaction.StrChangeAmount}</dd>
            </dl>

            <hr className="my-2 border-dashed border-outline" />

            <div className="text-center">
                {receipt.ThankYouMessage ? <p>{receipt.ThankYouMessage}</p> : null}
                {receipt.ReturnPolicy ? <p className="mt-1">{receipt.ReturnPolicy}</p> : null}
                {receipt.Footer ? <p className="mt-1">{receipt.Footer}</p> : null}
            </div>

            {transaction.Status !== 6 ? (
                <p className="mt-3 text-center text-[13px] font-semibold uppercase">
                    {transaction.StrStatus}
                </p>
            ) : null}
        </div>
    );
}
