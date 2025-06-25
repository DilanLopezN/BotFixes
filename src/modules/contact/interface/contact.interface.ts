import { Document } from 'mongoose';

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

export interface Contact extends Document, IContactCreate {}
