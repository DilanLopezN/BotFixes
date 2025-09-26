import { ChannelConfig } from '../../../../../../model/Bot';
import { Team } from './../../../../../../model/Team';
import { I18nProps } from './../../../../../i18n/interface/i18n.interface';

export interface NewConversationsProps extends I18nProps {
    workspaceId: string;
    loggedUser: any;
    onOpenConversation: (conversationId: string) => void;
    notification: Function;
    createNewConversation: Function;
    teams: Team[];
    channels: ChannelConfig[];
}
