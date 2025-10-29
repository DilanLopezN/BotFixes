import { AckType, ActivityType } from 'kissbot-core';
import { Identity } from './conversation.interface';

export interface AttachmentFile {
    id: string;
    name: string;
    contentType: string;
    contentUrl: string;
    key: string;
    content?: any;
}

export interface ImageContent {
    url: string;
    alt?: string;
}

export interface Button {
    type: string;
    index: number;
    title: string;
    value: any;
    displayText?: string;
}

export interface AttachmentContent {
    text?: string;
    title?: string;
    subtitle?: string;
    buttons?: Button[];
    images?: ImageContent[];
    buildAsFlow?: boolean;
    buildAsList?: boolean;
    buildAsQuickReply?: boolean;
    footer?: string;
}

export interface Attachments {
    content: AttachmentContent;
    contentType: string;
}

export interface Activity {
    _id: string;
    type: ActivityType;
    ack?: AckType;
    isHsm?: boolean;
    text: string;
    attachments?: Attachments[];
    attachmentFile?: AttachmentFile;
    recognizerResult?: any;
    name: string;
    conversationId: string;
    workspaceId: string;
    botId: string;
    timestamp: number;
    channelId: string;
    hash: string;
    quoted?: string;
    from: Identity;
    to?: Identity;
    language: string;
    id: string;
    data?: {
        reactionHash?: string;
        until?: any;
        name?: string;
        teamId?: string;
        replyTitle?: string;
        omitSocket?: boolean;
        smtReSettingId?: string;
        memberName?: string;
        memberId?: string;
    };
    pending?: boolean; // only socket
    uuid?: string | null; // only socket
    localTimestamp?: string;
    attachment?: any;
    templateId?: string;
    templateVariableValues?: any;
}
