import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Coins, Pencil } from "lucide-react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import type { DetailsMemberModel } from "@/@dataLayer/member.models";

export default function MemberDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { successNotify } = useSnackbar();

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [member, setMember] = useState<DetailsMemberModel | null>(null);

    const [showAdjustDialog, setShowAdjustDialog] = useState(false);
    const [adjustPoint, setAdjustPoint] = useState("");
    const [adjustNote, setAdjustNote] = useState("");
    const [adjustError, setAdjustError] = useState<string | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);

    const loadInitData = useCallback(() => {
        return api
            .post<DetailsMemberModel>("/admin/member/get-details", { Id: id })
            .then((response) => {
                setMember(response.data);
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

    const savePointAdjustment = async () => {
        const point = Number(adjustPoint);

        if (!Number.isFinite(point) || point === 0) {
            setAdjustError("Isi jumlah point yang ingin ditambah atau dikurangi. Pakai tanda minus untuk mengurangi.");
            return;
        }

        if (adjustNote.trim().length === 0) {
            setAdjustError("Alasan penyesuaian wajib diisi supaya perubahannya dapat ditelusuri.");
            return;
        }

        setIsAdjusting(true);
        setAdjustError(null);

        try {
            const response = await api.post<string>("/admin/member/adjust-point", {
                IdMember: id,
                Point: point,
                Note: adjustNote,
            });
            successNotify(response.data);
            setShowAdjustDialog(false);
            handleRefresh();
        } catch (error) {
            setAdjustError(getAxiosErrorMessage(error));
        } finally {
            setIsAdjusting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={member?.MemberName ?? "Detail member"}
                description="Saldo point beserta seluruh riwayat perubahannya."
                actions={
                    <>
                        <Button
                            variant="text"
                            icon={<ArrowLeft size={18} aria-hidden="true" />}
                            onClick={() => navigate("/admin/member")}
                        >
                            Kembali
                        </Button>

                        {member ? (
                            <>
                                <Button
                                    variant="outlined"
                                    icon={<Pencil size={18} aria-hidden="true" />}
                                    onClick={() => navigate(`/admin/member/edit/${member.IdMember}`)}
                                >
                                    Ubah data
                                </Button>
                                <Button
                                    variant="tonal"
                                    icon={<Coins size={18} aria-hidden="true" />}
                                    onClick={() => {
                                        setAdjustPoint("");
                                        setAdjustNote("");
                                        setAdjustError(null);
                                        setShowAdjustDialog(true);
                                    }}
                                >
                                    Sesuaikan point
                                </Button>
                            </>
                        ) : null}
                    </>
                }
            />

            {isLoading ? <LoadingSpinner label="Memuat data member" /> : null}

            {!isLoading && errorMessage ? <ErrorAlert message={errorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !errorMessage && member ? (
                <div className="grid gap-6 large:grid-cols-[22rem_1fr]">
                    <Surface variant="outlined" className="p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-title text-on-surface">Data member</h2>
                            <StatusPill tone={member.IsActive ? "success" : "neutral"} label={member.StrStatus} />
                        </div>

                        <p className="mb-4 rounded-(--radius-control) bg-secondary-container px-4 py-3 text-on-secondary-container">
                            <span className="block text-label-small">Saldo point</span>
                            <span className="text-numeric block text-headline">{member.PointBalance}</span>
                        </p>

                        <dl className="flex flex-col gap-2.5">
                            {[
                                { label: "Nomor HP", value: member.PhoneNumber },
                                { label: "Email", value: member.Email ?? "Tidak diisi" },
                                { label: "Alamat", value: member.Address ?? "Tidak diisi" },
                                { label: "Jumlah transaksi", value: String(member.TotalTransaction), isNumeric: true },
                                { label: "Total belanja", value: member.StrTotalSpending, isNumeric: true },
                                { label: "Terdaftar", value: member.StrDateCreated },
                            ].map((row) => (
                                <div key={row.label} className="flex items-baseline justify-between gap-4">
                                    <dt className="text-body text-on-surface-variant">{row.label}</dt>
                                    <dd className={`text-body text-on-surface ${row.isNumeric ? "text-numeric" : ""}`}>
                                        {row.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Surface>

                    <Surface variant="outlined" className="overflow-hidden">
                        <div className="border-b border-outline-variant px-5 py-4">
                            <h2 className="text-title text-on-surface">Riwayat point</h2>
                            <p className="text-label-small text-on-surface-variant">
                                Saldo tidak pernah berubah tanpa meninggalkan baris di sini.
                            </p>
                        </div>

                        {member.ListPointHistory.length === 0 ? (
                            <EmptyDataAlert
                                title="Belum ada mutasi point"
                                description="Riwayat terisi begitu member berbelanja, menukar point, atau saldonya disesuaikan admin."
                            />
                        ) : (
                            <ul className="divide-y divide-outline-variant">
                                {member.ListPointHistory.map((history) => (
                                    <li key={history.IdMemberPointTransaction} className="px-5 py-3">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                            <p className="text-title-small text-on-surface">
                                                {history.StrMovementType}{" "}
                                                <span className="text-numeric">{history.StrPointChange}</span>
                                            </p>
                                            <p className="text-label-small text-on-surface-variant">
                                                {history.StrDateCreated}
                                            </p>
                                        </div>

                                        <p className="text-label-small text-on-surface-variant">
                                            Saldo {history.PointBefore} menjadi {history.PointAfter}
                                            {history.ReferenceNumber ? " · " + history.ReferenceNumber : ""}
                                            {history.CreatedBy ? " · oleh " + history.CreatedBy : ""}
                                        </p>

                                        {history.Note ? (
                                            <p className="mt-1 text-body text-on-surface-variant">{history.Note}</p>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Surface>
                </div>
            ) : null}

            <Dialog
                isOpen={showAdjustDialog}
                title="Sesuaikan saldo point"
                description="Penyesuaian manual tetap tercatat sebagai mutasi, sehingga saldo member selalu dapat ditelusuri."
                onClose={() => setShowAdjustDialog(false)}
                actions={
                    <>
                        <Button variant="text" onClick={() => setShowAdjustDialog(false)} disabled={isAdjusting}>
                            Batal
                        </Button>
                        <Button onClick={savePointAdjustment} isLoading={isAdjusting}>
                            Simpan penyesuaian
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <TextField
                        label="Jumlah point"
                        type="number"
                        inputMode="numeric"
                        required
                        value={adjustPoint}
                        onChange={(event) => setAdjustPoint(event.target.value)}
                        helperText="Angka positif menambah saldo, angka negatif menguranginya."
                    />

                    <Textarea
                        label="Alasan penyesuaian"
                        required
                        placeholder="Migrasi saldo point dari sistem lama"
                        value={adjustNote}
                        onChange={(event) => setAdjustNote(event.target.value)}
                        errorText={adjustError ?? undefined}
                    />
                </div>
            </Dialog>
        </div>
    );
}
