import { Document } from "mongoose";

export interface Attribute {
    name: string;
    value: any;
    label: any;
    type: any;
}

export class ConversationAttribute extends Document {
    conversationId: String;    
    data: Attribute[];
}
