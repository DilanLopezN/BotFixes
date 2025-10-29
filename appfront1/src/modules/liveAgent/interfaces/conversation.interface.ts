import { ChannelIdConfig, IdentityType, User } from 'kissbot-core';
import { Bot } from '../../../model/Bot';
import { Workspace } from '../../../model/Workspace';
import { AudioTranscription } from '../../../ui-kissbot-v2/interfaces/audio-transcription';

export interface FileAttachment {
    _id?: string;
    name: string;
    memberId: string;
    mimeType: string;
    timestamp?: number;
    contentUrl?: string;
}

export interface Identity {
    _id: string | undefined;
    id: string;
    name?: string;
    data?: any;
    avatar?: any;
    channelId: string;
    type: IdentityType;
    phone?: string;
    email?: string;
    disabled?: boolean;
    contactId: string;
}

export interface Conversation {
    workspace: Workspace;
    _id: string;
    expiresAt: number;
    beforeExpirationTime: number;
    beforeExpiresAt: number;
    expirationTime: number;
    token: string;
    createdAt: string;
    iid: number;
    members: Identity[];
    tags: IdentityType[];
    data: any;
    state: string;
    fileAttachments: FileAttachment[];
    bot: Bot;
    shouldRequestRating: boolean;
    whatsappExpiration: number;
    createdByChannel: ChannelIdConfig;
    attributes: any[];
    waitingSince: number;
    priority: number;
    order: number;
    whatsappSessionCount: number;
    suspendedUntil: number;
    seenBy: any;
    closedBy: string;
    assignedToTeamId: string;
    assignedToUserId: string;
    metrics: any;
    pinnedBy: any;
    activities: any[];
    lastActivity: any;
    user: User;
    assumed: boolean;
    lastNotification: number;
    selected: boolean;
    audioTranscriptions: AudioTranscription;
    clientMessage: boolean | undefined;
    smtReId?: string;
    isWithSmtRe?: boolean;
    stoppedSmtReId?: string;
}

export interface ConversationSearchResult {
    id: string;
    conversationId: string;
    workspaceId: string;
    timestamp: number;
    contactName?: string;
    contactPhone?: string;
    attrValue?: string;
    attrLabel?: string;
    attrName?: string;
    dataType: number;
    refId: string;
    conversation: Conversation;
}
