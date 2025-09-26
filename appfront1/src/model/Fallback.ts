import { BaseModel } from "./BaseModel";

export interface Fallback extends BaseModel {
    assinedTo: string;
    status: string;
    message: string;
    botId: string;
    workspaceId: string;
    textSolved: string;
    tags: string[];
    data: any;
    conversationId?: string;
    recognizedTimestamp: string,
}