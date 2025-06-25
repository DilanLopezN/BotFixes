import { Document } from 'mongoose';

export interface IBlockedContact {
    id: string;
    _id: string;
    workspaceId: string;
    contactId: string;
    phone: string;
    whatsapp: string;
    blockedBy: string;
    blockedAt: number;
}

export interface BlockedContact extends Document {
    workspaceId: string;
    contactId: string;
    phone: string;
    whatsapp: string;
    blockedBy: string;
    blockedAt: number;
}
