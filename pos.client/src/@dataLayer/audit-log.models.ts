import type { SelectListItemModel } from "@/@dataLayer/base.models";

export interface QueryAuditLogModel {
    IdAuditLog: string;
    ActionName: string;
    ModuleName: string;
    ReferenceId: string | null;
    Description: string | null;
    OldValue: string | null;
    NewValue: string | null;
    IpAddress: string | null;
    DateCreated: string;
    CreatedById: string | null;
    CreatedBy: string | null;
    CreatedByRole: string | null;
    StrDateCreated: string;
}

/** Isi penyaring halaman audit, disusun server dari catatan yang benar-benar ada. */
export interface AuditLogFilterModel {
    ListModule: SelectListItemModel[];
    ListAction: SelectListItemModel[];
    ListUser: SelectListItemModel[];
}
