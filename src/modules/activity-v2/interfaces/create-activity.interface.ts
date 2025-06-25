import { ActivityType } from "kissbot-core";

export interface CreateActivityData {
    _id: string;
    conversationId: string;
    workspaceId: string;
    isHsm: boolean;
    templateId?: string;
    name: string;
    type: ActivityType;
    hash: string;
    fromId: string;
    fromType: string;
    fromChannel: string;
    fromName: string;
    text?: string;
    ack: number;
    timestamp: number;
    createdAt: Date;
    attachments?: any;
    attachmentFile?: any;
    recognizerResult?: any;
    data?: any;
    quoted?: string;
    referralSourceId?: string;
}