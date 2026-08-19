import { useCallback, useEffect, useState } from "react";
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

/**
 * Judul kelompok dalam Bahasa Indonesia beserta satu kalimat akibat perubahannya.
 * Kunci yang tidak terdaftar tetap tampil memakai nama kelompoknya sendiri, sehingga
 * kelompok baru dari seeder tidak pernah menghilang dari halaman.
 */
const groupTitle: Record<string, { title: string; description: string }> = {
    store: {
        title: "Identitas toko",
        description: "Tampil pada header aplikasi, halaman masuk, dan kepala nota.",
    },
    receipt: {
        title: "Isi nota",
        description: "Baris tambahan yang ikut tercetak pada setiap nota penjualan.",
    },
    member: {
        title: "Member dan loyalty point",
        description: "Menentukan apakah kasir dapat memilih member dan berapa point yang diberikan.",
    },
    voucher: {
        title: "Voucher",
        description: "Bila dimatikan, kode voucher ditolak di layar kasir meskipun masih berlaku.",
    },
    inventory: {
        title: "Persediaan",
        description: "Menentukan apakah perubahan stok menunggu persetujuan supervisor lebih dulu.",
    },
    transaction: {
        title: "Transaksi",
        description: "Kebijakan pembatalan transaksi yang sudah selesai.",
    },
};

/** Kelompok teks panjang memakai area teks, bukan satu baris. */
const longTextKeys = ["store.address", "receipt.header", "receipt.footer", "receipt.return_policy", "receipt.thank_you"];

/**
 * Kebijakan toko yang boleh diubah admin tanpa menyentuh kode (PRD bagian 37 dan 38).
 *
 * Disimpan per kelompok, bukan sekaligus satu halaman, supaya admin tahu persis bagian
 * mana yang baru saja berubah dan pesan kesalahan menunjuk ke kelompok yang benar.
 */
export default function SystemSettingPage() {
    const { successNotify, errorNotify } = useSnackbar();

    const [isLoading, setIsLoading] = useState(true);
    const [initErrorMessage, setInitErrorMessage] = useState<string | null>(null);
    const [listSetting, setListSetting] = useState<QuerySystemSettingModel[]>([]);
    const [valueByKey, setValueByKey] = useState<Record<string, string>>({});
    const [savingGroup, setSavingGroup] = useState<string | null>(null);

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

        setSavingGroup(groupName);

        api.post<string>("/admin/system-setting/update-system-setting", model)
            .then((response) => {
                successNotify(response.data);
                loadInitData();
            })
            .catch((error) => errorNotify(getAxiosErrorMessage(error)))
            .finally(() => setSavingGroup(null));
    };

    // Urutan kelompok mengikuti daftar judul di atas, bukan abjad nama kunci, supaya
    // pengaturan yang paling sering diubah berada paling atas. Kelompok yang belum punya
    // judul tetap tampil, di urutan paling akhir.
    const groupOrder = Object.keys(groupTitle);
    const groupNames = [...new Set(listSetting.map((x) => x.GroupName))].sort(
        (left, right) =>
            (groupOrder.indexOf(left) + 1 || groupOrder.length + 1) -
            (groupOrder.indexOf(right) + 1 || groupOrder.length + 1),
    );

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Pengaturan sistem"
                description="Kebijakan toko yang berlaku seketika setelah disimpan, tanpa perlu menjalankan ulang server."
            />

            {isLoading ? <LoadingSpinner label="Memuat pengaturan" /> : null}

            {!isLoading && initErrorMessage ? <ErrorAlert message={initErrorMessage} onRetry={handleRefresh} /> : null}

            {!isLoading && !initErrorMessage && groupNames.length === 0 ? (
                <Surface variant="outlined">
                    <EmptyDataAlert
                        title="Belum ada pengaturan yang dapat diubah"
                        description="Daftar ini diisi seeder saat server dijalankan. Jalankan ulang server, lalu muat ulang halaman."
                        action={<Button variant="outlined" onClick={handleRefresh}>Muat ulang</Button>}
                    />
                </Surface>
            ) : null}

            {!isLoading && !initErrorMessage
                ? groupNames.map((groupName) => {
                      const group = groupTitle[groupName] ?? { title: groupName, description: "" };
                      const listGroupSetting = listSetting.filter((x) => x.GroupName === groupName);
                      const isSaving = savingGroup === groupName;

                      return (
                          <Surface key={groupName} variant="outlined" className="max-w-3xl overflow-hidden">
                              <form
                                  noValidate
                                  onSubmit={(event) => {
                                      event.preventDefault();
                                      onSubmit(groupName);
                                  }}
                              >
                                  <div className="border-b border-outline-variant p-5">
                                      <h2 className="text-title text-on-surface">{group.title}</h2>
                                      {group.description ? (
                                          <p className="mt-1 text-body text-on-surface-variant">{group.description}</p>
                                      ) : null}
                                  </div>

                                  <div className="flex flex-col gap-5 p-5">
                                      {listGroupSetting.map((setting) => (
                                          <SettingField
                                              key={setting.SettingKey}
                                              setting={setting}
                                              value={valueByKey[setting.SettingKey] ?? ""}
                                              onChange={(value) => setValue(setting.SettingKey, value)}
                                          />
                                      ))}
                                  </div>

                                  <div className="flex justify-end border-t border-outline-variant p-4">
                                      <Button type="submit" isLoading={isSaving}>
                                          {isSaving ? "Menyimpan" : `Simpan ${group.title.toLowerCase()}`}
                                      </Button>
                                  </div>
                              </form>
                          </Surface>
                      );
                  })
                : null}
        </div>
    );
}

interface SettingFieldProps {
    setting: QuerySystemSettingModel;
    value: string;
    onChange: (value: string) => void;
}

/** Kontrol input dipilih dari kolom ValueType, bukan ditebak dari nama kuncinya. */
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
