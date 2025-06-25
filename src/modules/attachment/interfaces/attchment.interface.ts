import { Document } from "mongoose";

export interface Attachment extends Document {
    conversationId: string;
    memberId: string;
    attachmentLocation: string;
    name: string;
    mimeType: string;
    timestamp: number;    
    key?: string;
    size?: number;
}