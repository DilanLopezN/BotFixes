import type { Dispatch, SetStateAction } from 'react';
import { CampaignStatus } from '~/constants/campaign-status';
import type { ActiveMessageSetting } from '~/interfaces/active-message-setting';
import type { TemplateMessage } from '~/interfaces/template-message';

export interface TableData {
  name: string;
  phone: string;
  sent?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface TableCardProps {
  dataSource: TableData[];
  selectedTemplate?: TemplateMessage;
  selectedActiveMessage?: ActiveMessageSetting;
  availableCount: number;
  canEdit: boolean;
  broadcastStatus?: CampaignStatus;
  duplicatedPhones: string[];
  setDataSource: Dispatch<SetStateAction<TableData[]>>;
  setIsContactModalOpened: Dispatch<SetStateAction<boolean>>;
}
