import { I18nProps } from './../../../i18n/interface/i18n.interface';

export interface ContactInfoProps extends I18nProps {
  contactSelectedId: string;
  workspaceId: string;
  onSelectConversation: (conversationId: string) => void;
  conversation: any;
  createNewConversation: Function;
}
