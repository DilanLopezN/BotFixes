export interface IContact {
    id: string;
    _id: string;
    phone?: string;
    ddi?: string;
    whatsapp?: string;
    telegram?: string;
    email?: string;
    name: string;
    conversations?: string[];
    webchatId?: string;
    createdByChannel: string;
    workspaceId?: string;
    blockedBy?: string;
    blockedAt?: number;
}

export interface IContactCreate {
    id?: string;
    phone?: string;
    ddi?: string;
    whatsapp?: string;
    telegram?: string;
    email?: string;
    name: string;
    conversations?: string[];
    webchatId?: string;
    createdByChannel: string;
    workspaceId?: string;
    blockedBy?: string;
    blockedAt?: number;
}

export interface IContactUpdate {
    email?: string;
    avatar?: string;
    name: string;
    ddi?: string;
    phone?: string;
    whatsapp?: string;
}

export interface Contact extends IContactCreate {
    createdAt: Date;
    updatedAt: Date;
}

export interface IPaginatedQuery {
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    filter?: Record<string, any>;
}
