import { Document } from 'mongoose';

export interface Attribute {
    name: string;
    value: any;
    label: any;
    type: any;
}

export interface IConversationAttribute {
    id: string;
    _id: string;
    conversationId: string;
    workspaceId: string;
    data: Attribute[];
}

export class ConversationAttribute extends Document {
    conversationId: string;
    data: Attribute[];
}
