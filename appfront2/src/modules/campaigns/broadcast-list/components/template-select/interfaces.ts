import { ActiveMessageSetting } from '~/interfaces/active-message-setting';
import { PaginatedModel } from '~/interfaces/paginated-model';
import { TemplateMessage } from '~/interfaces/template-message';

export interface TemplateSelectProps {
  officialTemplateList: PaginatedModel<TemplateMessage> | undefined;
  selectedActiveMessage: ActiveMessageSetting | undefined;
  canEdit: boolean;
  isLoading: boolean;
  activeMessageSettingId: number | undefined;
  selectedTemplate?: TemplateMessage;
}
