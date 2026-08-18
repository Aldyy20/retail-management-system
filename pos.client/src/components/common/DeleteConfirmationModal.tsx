import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    /** Nama data yang akan dihapus, supaya pengguna tahu persis apa yang dikonfirmasi. */
    itemName: string;
    entityName: string;
    isDeleting: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function DeleteConfirmationModal({
    isOpen,
    itemName,
    entityName,
    isDeleting,
    onConfirm,
    onClose,
}: DeleteConfirmationModalProps) {
    return (
        <Dialog
            isOpen={isOpen}
            title={`Hapus ${entityName.toLowerCase()} ini?`}
            description={`${itemName} akan dihapus permanen dan tidak dapat dikembalikan. Kalau data ini masih terpakai, nonaktifkan saja daripada menghapusnya.`}
            onClose={onClose}
            actions={
                <>
                    <Button variant="text" onClick={onClose} disabled={isDeleting}>
                        Batal
                    </Button>
                    <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
                        {isDeleting ? "Menghapus" : "Hapus"}
                    </Button>
                </>
            }
        />
    );
}
