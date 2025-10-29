import type { Campaign } from '~/interfaces/campaign';

interface GetContactResponse {
  id: number;
  name: string;
  phone: string;
  sent?: boolean;
  descriptionError?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface GetCampaignResponse {
  campaign: Campaign;
  contacts?: GetContactResponse[];
}
