import { TemplateButtonType } from '~/constants/template-button-type';
import { TemplateCategory } from '~/constants/template-category';
import { TemplateLanguage } from '~/constants/template-language';
import { TemplateStatus } from '~/constants/template-status.';
import { TemplateType } from '~/constants/template-type';

export interface TemplateVariable {
  label: string;
  value: string;
  type: string;
  required: boolean;
  sampleValue?: string;
}

interface TemplateMessageChannel {
  channelConfigId: string;
  appName: string;
  wabaTemplateId?: string;
  elementName: string;
  status: TemplateStatus;
  rejectedReason?: string;
  category?: TemplateCategory;
  exampleMedia?: string;
}

export type WabaResultType = {
  [channelConfigId: string]: TemplateMessageChannel;
};

interface TemplateButton {
  type: TemplateButtonType;
  text: string;
  url?: string;
  example?: string[];
}

export interface TemplateMessage {
  _id: string;
  message: string;
  name: string;
  isHsm: boolean;
  active?: boolean;
  userId: string;
  workspaceId: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  teams?: string[];
  channels?: string[];
  channelsBackup?: string[];
  variables: TemplateVariable[];
  type?: TemplateType;
  wabaResult?: WabaResultType;
  whatsappTemplateId?: string;
  status?: TemplateStatus;
  buttons?: TemplateButton[];
  rejectedReason?: string;
  languageCode?: TemplateLanguage;
  fileUrl?: string;
  fileContentType?: string;
  fileOriginalName?: string;
  fileKey?: string;
  fileSize?: number;
  action?: string;
}
