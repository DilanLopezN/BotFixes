import { Document } from 'mongoose';
import { IdentityType } from 'kissbot-core';

export interface ConversationBot {
    _id?: string;
    name?: string;
    workspaceId?: string;
}

export interface ConversationWorkspace {
    _id?: string;
    name?: string;
}

/**
 * timeToAgentReply - assignmentAt = tempo que o usuario ficou esperando a primeira resposta(espera)
 * Tempo médio de atendimento timeToClose
 */
export interface ConversationMetrics extends Document {
    assignmentAt?: number;
    automaticDurationAttendance?: number;
    closeAt?: number;
    timeToAssignment?: number;
    timeToAgentReply?: number;
    timeToUserReply?: number;
    timeToClose?: number;
    lastUserReplyAt?: number;
    lastAgentReplyAt?: number;
    firstAgentReplyAt?: number;
    medianTimeToUserReply?: number;
    medianTimeToAgentReply?: number;
    awaitingWorkingTime?: number;
}

export interface ConversationFlags {
    hasUserFollowup?: boolean;
}

export interface IConversation {
    suspendedUntil?: number;
    expiresAt: number;
    beforeExpirationTime: number;
    beforeExpiresAt: number;
    expirationTime: number;
    token: string;
    hash: string;
    organizationId: string;
    members: Identity[];
    iid?: string;
    redirect?: RedirectConversation;
    tags?: ConversationTag[];
    data?: any;
    state: string;
    read: boolean;
    test: boolean;
    whatsappExpiration?: number;
    requestIp?: string;
    refererUrl?: string;
    lastNotification?: string;
    activities?: any[];
    bot?: ConversationBot;
    workspace?: ConversationWorkspace;
    shouldRequestRating?: boolean;
    fileAttachments?: any;
    createdByChannel?: string;
    seenBy?: { [userId: string]: string };
    pinnedBy?: { [userId: string]: string };
    attributes?: ConversationAttribute[];
    waitingSince?: number;
    priority?: number;
    order?: number;
    whatsappSessionCount?: number;
    metrics?: ConversationMetrics;
    assignedToUserId: string;
    assignedToTeamId: string;
    closedBy?: string;
    createdAt: string;
    invalidNumber?: boolean;
    timezone?: string;
    referralSourceId?: string;
    deliveredMessage?: boolean;
    smtReId?: string;
    stoppedSmtReId?: string;
    isWithSmtRe?: boolean;
    conversationFlags?: ConversationFlags;
}

export interface AttachmentFile {
    _id: string;
    conversationId: string;
    memberId: string;
    attachmentLocation: string;
    name: string;
    mimeType: string;
}

export interface ConversationTag extends Document{
    name: string;
    color: string;
}

export interface RedirectConversation {
    to: string;
    data: any;
}
export { IdentityType };

export enum ConversationStatus {
    open = 'open',
    closed = 'closed',
    sleep = 'sleep',
}

export interface Identity {
    id: string;
    name?: string;
    data?: any;
    avatar?: any;
    channelId: string;
    type: IdentityType;
    createdAt?: Date;
    removedAt?: Date;
    phone?: string;
    email?: string;
    disabled?: boolean;
    contactId?: string;
    track?: any;
    metrics?: {
        assumedAt?: number;
    };
    ddi?: string;
}

export interface ConversationAttribute {
    label?: string;
    name: string;
    type: string;
    value: string;
}

export interface Conversation extends Document, IConversation { }