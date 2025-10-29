import type { Dispatch, SetStateAction } from 'react';
import { ActiveMessageSetting } from '~/interfaces/active-message-setting';
import type { TemplateMessage } from '~/interfaces/template-message';

export interface TemplateCardProps {
  canEdit?: boolean;
  setSelectedTemplate: Dispatch<SetStateAction<TemplateMessage | undefined>>;
  setSelectedActiveMessage: Dispatch<SetStateAction<ActiveMessageSetting | undefined>>;
}
