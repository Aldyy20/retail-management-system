import { StatusPill } from "@/components/common/StatusPill";
import { Surface } from "@/components/ui/Surface";
import { getDocumentStatusTone } from "@/services/global.methods";
import type { QueryApprovalRequestModel } from "@/@dataLayer/inventory.models";

interface ApprovalSummaryProps {
    approvalRequest: QueryApprovalRequestModel | null;
}

/**
 * Ringkasan persetujuan sebuah dokumen: siapa mengajukan, siapa memutuskan, dan alasannya.
 * Dipakai halaman detail barang masuk dan stock opname dengan bentuk yang sama.
 */
export function ApprovalSummary({ approvalRequest }: ApprovalSummaryProps) {
    if (!approvalRequest) {
        return null;
    }

    return (
        <Surface variant="outlined" className="p-5">
            <h2 className="mb-3 text-title text-on-surface">Persetujuan</h2>

            <div className="flex flex-col gap-2">
                <StatusPill tone={getDocumentStatusTone(approvalRequest.Status)} label={approvalRequest.StrStatus} />

                <p className="text-label-small text-on-surface-variant">
                    Diajukan {approvalRequest.StrDateCreated} oleh {approvalRequest.RequestedBy ?? "tidak diketahui"}
                </p>

                {approvalRequest.DecidedBy ? (
                    <p className="text-label-small text-on-surface-variant">
                        Diputuskan {approvalRequest.StrDecidedDate} oleh {approvalRequest.DecidedBy}
                    </p>
                ) : null}

                {approvalRequest.DecisionNote ? (
                    <p className="mt-1 text-body text-on-surface">{approvalRequest.DecisionNote}</p>
                ) : null}
            </div>
        </Surface>
    );
}
