import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

export interface ConversationCardProps extends I18nProps {
    conversation: any;
    onViewClick: (args: any) => any;
    selectedConversation?: any;
}