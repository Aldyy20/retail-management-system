export interface QueryAuditLogModel {
    IdAuditLog: string;
    ActionName: string;
    ModuleName: string;
    ReferenceId: string | null;
    Description: string | null;
    IpAddress: string | null;
    DateCreated: string;
    CreatedBy: string | null;
    CreatedByRole: string | null;
    StrDateCreated: string;
}
