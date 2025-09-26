export interface Contact {
    phone?: string;
    whatsapp?: string;
    ddi?: string;
    email?: string;
    avatar?: string;
    name: string;
    conversations?: string[];
    webchatId?: string;
    createdByChannel: string;
    anonymous: boolean;
    workspaceId: string;
    blockedBy?: string;
    blockedAt?: number;
    _id: string;
}

export interface ContactSearchResult {
    id: number;
    workspaceId: string;
    refId: string;
    phone: number;
    ddi?: string;
    name: string;
    timestamp: number;
    blockedAt?: number;
}
