import { ActivityType, AckType } from 'kissbot-core';
import { IdentityType } from './../../../modules/conversation/interfaces/conversation.interface';
import { Document } from 'mongoose';

export interface Identity {
    id: string;
    name: string;
    data?: any;
    avatar?: string;
    channelId: string;
    hash: string;
    type: IdentityType;
    createdAt?: Date;
    removedAt?: Date;
    disabled?: boolean;
    phone?: string;
    email?: string;
    contactId?: string;
    track?: any;
}

export interface AttachmentFile {
    contentType?: string;
    contentUrl?: string;
    name?: string;
    key?: string;
    id?: string;
}

export interface Attachment {
    contentType?: string;
    contentUrl?: string;
    content?: any;
    name?: string;
    thumbnailUrl?: string;
    id?: string;
}

export interface Activity extends Document {
    hash?: string;
    type?: ActivityType;
    ack?: AckType;
    quoted?: string;
    text?: string;
    isHsm: boolean;
    templateId?: string;
    attachmentLayout?: string;
    attachments?: Attachment[];
    attachmentFile?: AttachmentFile;
    name?: string;
    conversationId?: string;
    workspaceId?: string;
    botId?: string;
    timestamp?: number;
    channelId?: string;
    from?: Identity;
    // Campo to é um campo virtual, e não deve ser persistido
    to?: Identity;

    language?: string;
    id?: any;
    data?: any;
    conversationHash?: string;
    referralSourceId?: string;
}
