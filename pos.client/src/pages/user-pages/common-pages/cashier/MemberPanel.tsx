import { useState } from "react";
import { Star, User, UserPlus, UserRound, X } from "lucide-react";
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
    member: QueryMemberModel | null;
    listRedemptionOption: PointRedemptionOptionModel[];
    idPointRedemptionRule: string | null;
    pointEarned: number;
    isLoyaltyEnabled: boolean;
    onSelectMember: (idMember: string | null) => void;
    onSelectRedemption: (idRule: string | null) => void;
}

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
            <div className="border-b border-outline-variant px-4 py-3 bg-surface-muted/20">
                {member ? (
                    <div className="bg-surface-lowest border border-outline-variant rounded-xl p-3 shadow-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    {member.MemberName ? member.MemberName.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-heading text-title-small text-on-surface truncate leading-tight">
                                        {member.MemberName}
                                    </p>
                                    <p className="text-xs text-on-surface-variant font-mono-receipt">
                                        {member.PhoneNumber}
                                    </p>
                                </div>
                            </div>
                            <IconButton
                                label="Lepas member dari transaksi"
                                icon={<X size={16} />}
                                onClick={() => {
                                    onSelectRedemption(null);
                                    onSelectMember(null);
                                }}
                            />
                        </div>

                        {isLoyaltyEnabled ? (
                            <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 text-amber-700 dark:text-amber-300">
                                <span className="flex items-center gap-1 font-semibold">
                                    <Star size={13} className="fill-current" />
                                    Saldo Poin
                                </span>
                                <span className="font-mono-receipt font-bold">
                                    {member.PointBalance} Poin
                                </span>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outlined"
                            icon={<UserRound size={16} aria-hidden="true" />}
                            onClick={() => {
                                setSearchPhrase("");
                                setListResult([]);
                                setSearchError(null);
                                setShowSearchDialog(true);
                            }}
                            className="flex-1 text-xs"
                        >
                            Pilih Member
                        </Button>
                        <Button
                            variant="text"
                            icon={<UserPlus size={16} aria-hidden="true" />}
                            onClick={() => {
                                setNewPhone("");
                                setNewName("");
                                setRegisterError(null);
                                setShowRegisterDialog(true);
                            }}
                            className="text-xs"
                        >
                            Daftar Baru
                        </Button>
                    </div>
                )}

                {member && isLoyaltyEnabled ? (
                    <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between items-center text-xs text-on-surface-variant">
                            <span className="font-medium">Tukar Poin Belanja</span>
                            {pointEarned > 0 ? (
                                <span className="text-[11px] text-secondary font-semibold">
                                    +{pointEarned} Poin Baru
                                </span>
                            ) : null}
                        </div>

                        {listRedemptionOption.length === 0 ? (
                            <p className="text-[11px] text-on-surface-variant italic">
                                Belum ada promo penukaran poin aktif.
                            </p>
                        ) : (
                            <div role="radiogroup" aria-label="Pilihan penukaran point" className="flex flex-col gap-1.5">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={!idPointRedemptionRule}
                                    onClick={() => onSelectRedemption(null)}
                                    className={[
                                        "min-h-9 rounded-lg border px-3 text-left text-xs font-medium transition-colors cursor-pointer",
                                        !idPointRedemptionRule
                                            ? "border-primary bg-primary text-white font-bold"
                                            : "border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-muted",
                                    ].join(" ")}
                                >
                                    Tanpa Penukaran Poin
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
                                            "min-h-10 rounded-lg border px-3 py-1.5 text-left transition-colors",
                                            "disabled:cursor-not-allowed disabled:opacity-50",
                                            idPointRedemptionRule === option.IdPointRedemptionRule
                                                ? "border-secondary bg-secondary text-white font-bold"
                                                : "border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-muted cursor-pointer",
                                        ].join(" ")}
                                    >
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold">{option.RuleName}</span>
                                            <span>-{option.StrDiscountAmount}</span>
                                        </div>
                                        <span className="block text-[11px] opacity-80">
                                            {option.IsAvailable
                                                ? `Gunakan ${option.PointRequired} poin`
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
                title="Pilih Member"
                description="Cari pelanggan berdasarkan nama atau nomor HP."
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
                            label="Nomor HP atau Nama"
                            autoFocus
                            placeholder="Ketik minimal 3 huruf..."
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
                        <p className="text-body text-sm text-on-surface-variant py-2">
                            Tidak ada member yang cocok. Anda dapat mendaftarkan member baru melalui tombol Daftar Baru.
                        </p>
                    ) : null}

                    <ul className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                        {listResult.map((result) => (
                            <li key={result.IdMember}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelectMember(result.IdMember);
                                        setShowSearchDialog(false);
                                    }}
                                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-lowest p-3 text-left hover:bg-surface-muted transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                                            {result.MemberName ? result.MemberName.charAt(0).toUpperCase() : "M"}
                                        </div>
                                        <div>
                                            <span className="block text-sm font-semibold text-on-surface">{result.MemberName}</span>
                                            <span className="block text-xs text-on-surface-variant font-mono-receipt">
                                                {result.PhoneNumber}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-numeric font-semibold text-xs text-amber-600 dark:text-amber-400">
                                        {result.PointBalance} Poin
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Dialog>

            <Dialog
                isOpen={showRegisterDialog}
                title="Daftar Member Baru"
                description="Masukkan nomor HP dan nama pelanggan."
                onClose={() => setShowRegisterDialog(false)}
                actions={
                    <>
                        <Button variant="text" onClick={() => setShowRegisterDialog(false)} disabled={isRegistering}>
                            Batal
                        </Button>
                        <Button onClick={registerMember} isLoading={isRegistering}>
                            Daftarkan Member
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    {registerError ? <ErrorAlert message={registerError} /> : null}

                    <TextField
                        label="Nomor Telepon (HP)"
                        type="tel"
                        inputMode="tel"
                        required
                        autoFocus
                        placeholder="081234567890"
                        value={newPhone}
                        onChange={(event) => setNewPhone(event.target.value)}
                    />

                    <TextField
                        label="Nama Lengkap"
                        required
                        placeholder="Andi Pratama"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                    />
                </div>
            </Dialog>
        </>
    );
}
