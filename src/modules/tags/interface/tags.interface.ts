import { Document } from 'mongoose';

export interface ITags {
    workspaceId: string;
    color: string;
    name: string;
    inactive: boolean;
}

export interface Tags extends ITags, Document {}
