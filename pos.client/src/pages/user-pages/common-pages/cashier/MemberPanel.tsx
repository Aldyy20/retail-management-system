import { useState } from "react";
import { UserPlus, UserRound, X } from "lucide-react";
import { api } from "@/services/api";
import { useRolePath } from "@/hooks/useRolePath";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/TextField";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import type { QueryMemberModel, PointRedemptionOptionModel } from "@/@dataLayer/member.models";

interface MemberPanelProps {
    /** Member yang sedang melekat pada keranjang, hasil perhitungan server. */
    member: QueryMemberModel | null;
    listRedemptionOption: PointRedemptionOptionModel[];
    idPointRedemptionRule: string | null;
    pointEarned: number;
    isLoyaltyEnabled: boolean;
    onSelectMember: (idMember: string | null) => void;
    onSelectRedemption: (idRule: string | null) => void;
}

/**
 * Panel member pada layar kasir.
 *
 * Hanya dirender ketika sistem member aktif. Saldo point dan pilihan penukaran
 * seluruhnya berasal dari server, sehingga layar tidak pernah menawarkan potongan
 * yang tidak akan disetujui saat disimpan.
 */
export function MemberPanel({
    member,
    listRedemptionOption,
    idPointRedemptionRule,
    pointEarned,
    isLoyaltyEnabled,
    onSelectMember,
    onSelectRedemption,
}: MemberPanelProps) {
    const rolePath = useRolePath();

    const [showSearchDialog, setShowSearchDialog] = useState(false);
    const [searchPhrase, setSearchPhrase] = useState("");
    const [listResult, setListResult] = useState<QueryMemberModel[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [newPhone, setNewPhone] = useState("");
    const [newName, setNewName] = useState("");
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);

    const searchMember = async () => {
        setIsSearching(true);
        setSearchError(null);

        try {
            const response = await api.post<QueryMemberModel[]>(`/${rolePath}/cashier/search-member`, {
                SearchPhrase: searchPhrase,
            });
            setListResult(response.data);
        } catch (error) {
            setSearchError(getAxiosErrorMessage(error));
            setListResult([]);
        } finally {
            setIsSearching(false);
        }
    };

    const registerMember = async () => {
        setIsRegistering(true);
        setRegisterError(null);

        try {
            const response = await api.post<QueryMemberModel>(`/${rolePath}/cashier/register-member`, {
                PhoneNumber: newPhone,
                MemberName: newName,
                IsActive: true,
            });
            onSelectMember(response.data.IdMember);
            setShowRegisterDialog(false);
            setNewPhone("");
            setNewName("");
        } catch (error) {
            setRegisterError(getAxiosErrorMessage(error));
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <>
            <div className="border-b border-outline-variant px-4 py-3">
                {member ? (
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-title-small text-on-surface">{member.MemberName}</p>
                            <p className="text-label-small text-on-surface-variant">
                                {member.PhoneNumber}
                                {isLoyaltyEnabled ? ` · ${member.PointBalance} point` : ""}
                            </p>
                        </div>
                        <IconButton
                            label="Lepas member dari transaksi ini"
                            icon={<X size={16} />}
                            onClick={() => {
                                onSelectRedemption(null);
                                onSelectMember(null);
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outlined"
                            icon={<UserRound size={18} aria-hidden="true" />}
                            onClick={() => {
                                setSearchPhrase("");
                                setListResult([]);
                                setSearchError(null);
                                setShowSearchDialog(true);
                            }}
                        >
                            Pilih member
                        </Button>
                        <Button
                            variant="text"
                            icon={<UserPlus size={18} aria-hidden="true" />}
                            onClick={() => {
                                setNewPhone("");
                                setNewName("");
                                setRegisterError(null);
                                setShowRegisterDialog(true);
                            }}
                        >
                            Daftar baru
                        </Button>
                    </div>
                )}

                {member && isLoyaltyEnabled ? (
                    <div className="mt-3">
                        <p className="mb-2 text-label-small text-on-surface-variant">
                            Tukar point{pointEarned > 0 ? `, transaksi ini menambah ${pointEarned} point` : ""}
                        </p>

                        {listRedemptionOption.length === 0 ? (
                            <p className="text-label-small text-on-surface-variant">
                                Belum ada aturan penukaran aktif. Admin dapat membuatnya di menu Penukaran point.
                            </p>
                        ) : (
                            <div role="radiogroup" aria-label="Pilihan penukaran point" className="flex flex-col gap-1.5">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={!idPointRedemptionRule}
                                    onClick={() => onSelectRedemption(null)}
                                    className={[
                                        "min-h-11 rounded-(--radius-control) border px-3 text-left text-label",
                                        !idPointRedemptionRule
                                            ? "border-primary bg-secondary-container text-on-secondary-container"
                                            : "border-outline text-on-surface-variant hover:bg-on-surface/8",
                                    ].join(" ")}
                                >
                                    Tanpa penukaran
                                </button>

                                {listRedemptionOption.map((option) => (
                                    <button
                                        key={option.IdPointRedemptionRule}
                                        type="button"
                                        role="radio"
                                        aria-checked={idPointRedemptionRule === option.IdPointRedemptionRule}
                                        disabled={!option.IsAvailable}
                                        onClick={() => onSelectRedemption(option.IdPointRedemptionRule)}
                                        className={[
                                            "min-h-11 rounded-(--radius-control) border px-3 py-1.5 text-left",
                                            "disabled:cursor-not-allowed disabled:opacity-60",
                                            idPointRedemptionRule === option.IdPointRedemptionRule
                                                ? "border-primary bg-secondary-container text-on-secondary-container"
                                                : "border-outline text-on-surface-variant hover:bg-on-surface/8",
                                        ].join(" ")}
                                    >
                                        <span className="block text-label">
                                            {option.RuleName} · potongan {option.StrDiscountAmount}
                                        </span>
                                        <span className="block text-label-small">
                                            {option.IsAvailable
                                                ? `${option.PointRequired} point`
                                                : option.UnavailableReason}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            <Dialog
                isOpen={showSearchDialog}
                title="Pilih member"
                description="Cari dengan nomor HP atau nama. Ketik minimal 3 karakter."
                onClose={() => setShowSearchDialog(false)}
                actions={
                    <Button variant="text" onClick={() => setShowSearchDialog(false)}>
                        Tutup
                    </Button>
                }
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-end gap-2">
                        <TextField
                            label="Nomor HP atau nama"
                            autoFocus
                            containerClassName="flex-1"
                            value={searchPhrase}
                            onChange={(event) => setSearchPhrase(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    searchMember();
                                }
                            }}
                        />
                        <Button onClick={searchMember} isLoading={isSearching}>
                            Cari
                        </Button>
                    </div>

                    {searchError ? <ErrorAlert message={searchError} /> : null}

                    {!isSearching && !searchError && listResult.length === 0 && searchPhrase.length >= 3 ? (
                        <p className="text-body text-on-surface-variant">
                            Tidak ada member yang cocok. Gunakan tombol Daftar baru bila pelanggan belum terdaftar.
                        </p>
                    ) : null}

                    <ul className="flex flex-col gap-1">
                        {listResult.map((result) => (
                            <li key={result.IdMember}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelectMember(result.IdMember);
                                        setShowSearchDialog(false);
                                    }}
                                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-(--radius-control) border border-outline px-3 text-left hover:bg-on-surface/8"
                                >
                                    <span>
                                        <span className="block text-label text-on-surface">{result.MemberName}</span>
                                        <span className="block text-label-small text-on-surface-variant">
                                            {result.PhoneNumber}
                                        </span>
                                    </span>
                                    <span className="text-numeric text-label text-on-surface">{result.PointBalance} point</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Dialog>

            <Dialog
                isOpen={showRegisterDialog}
                title="Daftar member baru"
                description="Cukup nomor HP dan nama. Data lainnya dapat dilengkapi admin kemudian."
                onClose={() => setShowRegisterDialog(false)}
                actions={
                    <>
                        <Button variant="text" onClick={() => setShowRegisterDialog(false)} disabled={isRegistering}>
                            Batal
                        </Button>
                        <Button onClick={registerMember} isLoading={isRegistering}>
                            Daftarkan
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    {registerError ? <ErrorAlert message={registerError} /> : null}

                    <TextField
                        label="Nomor HP"
                        type="tel"
                        inputMode="tel"
                        required
                        autoFocus
                        placeholder="081234567890"
                        value={newPhone}
                        onChange={(event) => setNewPhone(event.target.value)}
                    />

                    <TextField
                        label="Nama member"
                        required
                        placeholder="Andi Wijaya"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                    />
                </div>
            </Dialog>
        </>
    );
}
