import { ContactAttribute } from '../../campaign/models/contact-attribute.entity';

export interface CreateCampaignContactParams {
    name: string;
    phone: string;
    workspaceId: string;
    campaignId: number;
    contactAttributes?: Partial<ContactAttribute>[];
}
