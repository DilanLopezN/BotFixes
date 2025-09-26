import { ChannelIdConfig, User } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { ChannelConfig } from '../../../../model/Bot';
import { User as UserCard } from '../../../../ui-kissbot-v2/interfaces/user';
import { Activity } from '../../interfaces/activity.interface';
import { FileAttachment, Identity } from '../../interfaces/conversation.interface';
import { Team } from './../../../../model/Team';
import { I18nProps } from './../../../i18n/interface/i18n.interface';

export interface ConversationCardData extends I18nProps {
    lastActivity: Activity;
    activities: Array<Activity>;
    user: UserCard;
    assumed?: Boolean;
    state: string;
    text?: string;
    selected?: boolean;
    border?: string;
    _id: string;
    workspaceId?: string;
    lastNotification: string;
    seenAt?: string;
    seenBy?: any;
    members: Identity[];
    tags?: any[];
    conversation: any;
    createdAt?: string;
    iid?: string;
    createdByChannel: ChannelIdConfig;
    assignedToTeamId?: string;
    waitingSince: number;
    suspendedUntil?: number;
    fileAttachments?: FileAttachment[];
    metrics: any;
    priority: number;
    order: number;
    whatsappExpiration: number;
    attributes: any[];
    token: string;
    isWithSmtRe?: boolean;
    smtReId?: string;
}

export interface ConversationCardProps {
    onClick: (...params) => any;
    className: string;
    workspaceId: string;
    conversation: ConversationCardData;
    loggedUser: User;
    socketConnection?: Socket;
    teams: Team[];
    onUpdatedConversationSelected?: Function;
    channels: ChannelConfig[];
}
