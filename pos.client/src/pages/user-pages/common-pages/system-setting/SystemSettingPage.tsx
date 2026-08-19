import { useCallback, useEffect, useState } from "react";
import { Boxes, Receipt, ShieldCheck, Store, TicketPercent, Users } from "lucide-react";
import type { ComponentType } from "react";
import { api } from "@/services/api";
import { getAxiosErrorMessage } from "@/services/global.methods";
import { useSnackbar } from "@/components/ui/Snackbar";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyDataAlert } from "@/components/common/EmptyDataAlert";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { Textarea } from "@/components/ui/Textarea";
import type { QuerySystemSettingModel, UpdateSystemSettingModel } from "@/@dataLayer/system-setting.models";

interface GroupMeta {
    title: string;
    description: string;
    icon: ComponentType<{ size?: number; className?: string }>;
}

const groupMetadata: Record<string, GroupMeta> = {
    store: {
        title: "Identitas Toko",
        description: "Tampil pada header aplikasi, struk belanja kasir, dan kartu login sistem.",
        icon: Store,
    },
    receipt: {
        title: "Format Struk & Nota",
        description: "Teks header dan footer tambahan yang dicetak pada setiap transaksi kasir.",
        icon: Receipt,
    },
    member: {
        title: "Member & Program Poin",
        description: "Konfigurasi sistem loyalitas pelanggan, batas transaksi perolehan poin, dan rasio diskon.",
        icon: Users,
    },
    voucher: {
        title: "Kupon & Voucher Diskon",
        description: "Aktivasi fitur voucher promosi potongan belanja pada keranjang kasir.",
        icon: TicketPercent,
    },
    inventory: {
        title: "Persetujuan Stok & Inventaris",
        description: "Menentukan apakah penerimaan barang dan penyesuaian stok memerlukan persetujuan supervisor.",
        icon: Boxes,
    },
    transaction: {
        title: "Kebijakan Transaksi Kasir",
        description: "Aturan pembatalan nota (void) dan toleransi transaksi kasir.",
        icon: ShieldCheck,
    },
};

const longTextKeys = ["store.address", "receipt.header", "receipt.footer", "receipt.return_policy", "receipt.thank_you"];

export default function SystemSettingPage() {
    const { successNotify, errorNotify } = useSnackbar();

    const [isLoading, setIsLoading] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [listSetting, setListSetting] = useState<QuerySystemSettingModel[]>([]);
    const [valueByKey, setValueByKey] = useState<Record<string, string>>({});
    const [activeGroup, setActiveGroup] = useState<string>("store");
    const [isSaving, setIsSaving] = useState(false);

    const loadInitData = useCallback(() => {
        return api
            .post<QuerySystemSettingModel[]>("/admin/system-setting/get-list-system-setting")
            .then((response) => {
                setListSetting(response.data);
                setValueByKey(Object.fromEntries(response.data.map((x) => [x.SettingKey, x.SettingValue ?? ""])));
                setInitErrorMessage(null);
            })
            .catch((error) => setInitErrorMessage(getAxiosErrorMessage(error)))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const handleRefresh = () => {
        setIsLoading(true);
        loadInitData();
    };

    const setValue = (settingKey: string, value: string) => {
        setValueByKey((current) => ({ ...current, [settingKey]: value }));
    };

    const onSubmit = (groupName: string) => {
        const model: UpdateSystemSettingModel = {
            GroupName: groupName,
            ListSetting: listSetting
                .filter((x) => x.GroupName === groupName)
                .map((x) => ({ SettingKey: x.SettingKey, SettingValue: valueByKey[x.SettingKey] ?? "" })),
        };

        setIsSaving(true);

        api.post<string>("/admin/system-setting/update-system-setting", model)
            .then((response) => {
                successNotify(response.data);
                loadInitData();
            })
            .catch((error) => errorNotify(getAxiosErrorMessage(error)))
            .finally(() => setIsSaving(false));
    };

    const groupOrder = Object.keys(groupMetadata);
    const groupNames = [...new Set(listSetting.map((x) => x.GroupName))].sort(
        (left, right) =>
            (groupOrder.indexOf(left) + 1 || groupOrder.length + 1) -
            (groupOrder.indexOf(right) + 1 || groupOrder.length + 1),
    );

    const currentGroupKey = groupNames.includes(activeGroup) ? activeGroup : groupNames[0] ?? "store";
    const currentMeta = groupMetadata[currentGroupKey] ?? {
        title: currentGroupKey,
        description: "",
        icon: Store,
    };
    const currentSettings = listSetting.filter((x) => x.GroupName === currentGroupKey);
    const ActiveIcon = currentMeta.icon;

    return (
        <div className="flex flex-col gap-6 w-full">
            <PageHeader
                title="Konfigurasi Sistem"
                description="Pengaturan kebijakan operasional toko yang langsung aktif seketika setelah disimpan."
            />

            {isLoading ? <LoadingSpinner label="Memuat konfigurasi sistem..." /> : null}

            {!isLoading && initErrorMessage ? <ErrorAlert message={initErrorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !initErrorMessage && groupNames.length === 0 ? (
                <Surface variant="outlined" className="w-full">
                    <EmptyDataAlert
                        title="Belum ada pengaturan yang dapat diubah"
                        description="Daftar ini diisi oleh seeder saat server pertama kali dijalankan."
                        action={<Button variant="outlined" onClick={handleRefresh}>Muat ulang</Button>}
                    />
                </Surface>
            ) : null}

            {!isLoading && !initErrorMessage && groupNames.length > 0 ? (
                <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                    {/* Panel Tab Navigasi Kategori (Kiri) */}
                    <Surface variant="outlined" className="w-full md:w-72 shrink-0 p-2 overflow-hidden shadow-xs">
                        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0" aria-label="Kategori Pengaturan">
                            {groupNames.map((groupName) => {
                                const meta = groupMetadata[groupName] ?? {
                                    title: groupName,
                                    description: "",
                                    icon: Store,
                                };
                                const Icon = meta.icon;
                                const isActive = groupName === currentGroupKey;

                                return (
                                    <button
                                        key={groupName}
                                        type="button"
                                        onClick={() => setActiveGroup(groupName)}
                                        className={[
                                            "flex items-center gap-3 rounded-lg px-3.5 py-3 text-left transition-all duration-150 cursor-pointer shrink-0 md:shrink w-auto md:w-full",
                                            isActive
                                                ? "bg-slate-900 text-white font-bold shadow-xs dark:bg-slate-800"
                                                : "text-on-surface-variant hover:bg-surface-muted hover:text-on-surface font-medium",
                                        ].join(" ")}
                                    >
                                        <Icon size={18} className={isActive ? "text-white" : "text-on-surface-variant/80"} />
                                        <span className="text-sm whitespace-nowrap md:whitespace-normal">{meta.title}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </Surface>

                    {/* Panel Kartu Form Pengaturan Aktif (Kanan) */}
                    <Surface variant="outlined" className="flex-1 w-full overflow-hidden shadow-xs">
                        <form
                            noValidate
                            onSubmit={(event) => {
                                event.preventDefault();
                                onSubmit(currentGroupKey);
                            }}
                        >
                            <div className="flex items-start gap-4 border-b border-outline-variant bg-surface-muted/60 p-5 sm:p-6">
                                <div className="size-10 rounded-lg bg-surface-lowest border border-outline-variant flex items-center justify-center text-on-surface shrink-0 shadow-xs">
                                    <ActiveIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="font-heading font-bold text-title text-on-surface">{currentMeta.title}</h2>
                                    {currentMeta.description ? (
                                        <p className="mt-0.5 text-xs text-on-surface-variant">{currentMeta.description}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                {currentSettings.map((setting) => (
                                    <div
                                        key={setting.SettingKey}
                                        className={
                                            longTextKeys.includes(setting.SettingKey) ||
                                            setting.ValueType === "image" ||
                                            setting.ValueType === "boolean"
                                                ? "md:col-span-2"
                                                : "col-span-1"
                                        }
                                    >
                                        <SettingField
                                            setting={setting}
                                            value={valueByKey[setting.SettingKey] ?? ""}
                                            onChange={(value) => setValue(setting.SettingKey, value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end border-t border-outline-variant bg-surface-muted/30 p-4 sm:p-5">
                                <Button type="submit" isLoading={isSaving} className="shadow-xs">
                                    {isSaving ? "Menyimpan..." : `Simpan ${currentMeta.title}`}
                                </Button>
                            </div>
                        </form>
                    </Surface>
                </div>
            ) : null}
        </div>
    );
}

interface SettingFieldProps {
    setting: QuerySystemSettingModel;
    value: string;
    onChange: (value: string) => void;
}

function SettingField({ setting, value, onChange }: SettingFieldProps) {
    const helperText = setting.Description ?? undefined;

    if (setting.ValueType === "boolean") {
        return (
            <Switch
                label={setting.DisplayName}
                description={helperText}
                checked={value === "True" || value === "true"}
                onChange={(event) => onChange(event.target.checked ? "True" : "False")}
            />
        );
    }

    if (setting.ValueType === "image") {
        return (
            <ImageUploadField
                label={setting.DisplayName}
                helperText={helperText}
                uploadUrl="/admin/system-setting/upload-logo"
                folder="store"
                value={value || null}
                onChange={(fileName) => onChange(fileName ?? "")}
            />
        );
    }

    if (setting.ValueType === "integer" || setting.ValueType === "decimal") {
        return (
            <TextField
                label={setting.DisplayName}
                helperText={helperText}
                type="number"
                inputMode={setting.ValueType === "integer" ? "numeric" : "decimal"}
                step={setting.ValueType === "integer" ? 1 : "any"}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    if (longTextKeys.includes(setting.SettingKey)) {
        return (
            <Textarea
                label={setting.DisplayName}
                helperText={helperText}
                rows={3}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    return (
        <TextField
            label={setting.DisplayName}
            helperText={helperText}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}
