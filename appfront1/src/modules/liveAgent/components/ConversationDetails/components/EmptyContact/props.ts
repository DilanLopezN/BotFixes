import { I18nProps } from './../../../../../i18n/interface/i18n.interface';

export interface CreateNewContactProps extends I18nProps {
  workspaceId: string;
  conversationId: string;
  readingMode: boolean;
}