import { Document } from 'mongoose';
export interface EntityAttribute extends Document {
    name: String,
    type: String,
    id: string;
}

export interface EntryAttribute extends Document {
    value: String, 
    entityAttributeId: String       
}

export interface Entry extends Document{
    name: string;
    synonyms: string[];
    entryAttributes: EntryAttribute[]
}

export interface Entity extends Document {
    workspaceId: string;
    name: string;
    entityAttributes: EntityAttribute[],
    entries: Entry[];
    params?: any;
}
