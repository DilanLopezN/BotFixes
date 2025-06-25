export interface IBlockedContact {
    id?: string;
    workspaceId: string;
    contactId: string;
    phone: string;
    whatsapp: string;
    blockedBy: string;
    blockedAt: number;
}

export interface BlockedContact extends IBlockedContact {
    createdAt: Date;
    updatedAt: Date;
}
