import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ConversationCardData } from '../ConversationCard/props';

export interface ClosingMessageModalProps {
    addNotification: Function;
    opened: boolean;
    setOpened: Function;
    workspaceId: string;
    loggedUser: any;
    closeConversation: Function;
    conversation: ConversationCardData;
    channels: ChannelConfig[];
    onUpdatedConversationSelected?: Function;
    teams: Team[];
}

export type DefaultClosingMessageModalComponentProps = ClosingMessageModalProps & I18nProps;
