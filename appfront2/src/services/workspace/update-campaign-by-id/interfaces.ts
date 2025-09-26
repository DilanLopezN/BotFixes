import type { CampaignType } from '~/constants/campaign-type';
import type { Campaign } from '~/interfaces/campaign';

export interface ContactParams {
  name: string;
  phone: string;
  sent?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface UpdateContactResponse {
  id: number;
  name: string;
  phone: string;
  [key: string]: string | number;
}

export interface UpdateCampaignByIdProps {
  id?: number;
  name: string;
  activeMessageSettingId: number;
  templateId: string;
  description?: string;
  sendAt?: number | null;
  sendInterval?: number;
  campaignType?: CampaignType;
  clonedFrom?: number;
  isTest?: boolean;
  contacts?: ContactParams[];
  immediateStart?: boolean;
  isForwarding?: boolean;
  action?: string | null;
}

export interface UpdateCampaignByIdCampaignResponse {
  campaign: Campaign;
  contacts?: UpdateContactResponse[];
}
