import { Team } from './../../../../../../model/Team';
import { I18nProps } from './../../../../../i18n/interface/i18n.interface';
import { ChannelConfig } from '../../../../../../model/Bot';
import { User } from 'kissbot-core';
import { Conversation } from '../../../../interfaces/conversation.interface';

export interface ConversationInfoProps extends I18nProps {
    contact?: any;
    conversation: Conversation;
    workspaceId: string;
    onTagsChanged: Function;
    workspaceTags: any[];
    openImage: Function;
    readingMode: boolean;
    channelList: ChannelConfig[];
    conversationDisabled: boolean;
    teams: Team[];
    loggedUser: User;
}