import type { CampaignStatus } from '~/constants/campaign-status';

export type FilterStatus = CampaignStatus | 'all' | 'hasFail' | 'isTest';
