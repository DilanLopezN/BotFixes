import { CampaignStatus } from '~/constants/campaign-status';
import { CampaignType } from '~/constants/campaign-type';
import type { CampaignAttribute } from './campaign-attributes';

interface ContactResume {
  processedContactCount: number;
  contactCount: number;
}

interface InvalidContact {
  total: number;
  contactTotal: number;
  contactId: number;
}

interface CampaignResume {
  contactResume: ContactResume;
  invalidContacts: InvalidContact[];
  unsentCount: number;
}

export interface Campaign {
  id: number;
  workspaceId: string;
  activeMessageSettingId?: number;
  templateId?: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  createdAt: number;
  sendAt: number;
  startedAt: number;
  endedAt: number;
  sendInterval: number;
  processingTotal?: number;
  processedTotal?: number;
  processingFinished?: boolean;
  campaignType: CampaignType;
  clonedFrom?: number;
  action?: string;
  isTest?: boolean;
  isForwarding?: boolean;
  immediateStart?: boolean;
  campaignAttributes?: CampaignAttribute[];
  resume?: CampaignResume;
}
