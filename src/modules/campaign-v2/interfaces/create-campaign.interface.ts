import { Campaign, CampaignType } from '../../campaign/models/campaign.entity';
import { ContactSendResult } from './contact-send-results.interface';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ContactParams {
    @IsNotEmpty({ message: 'The "name" field is required.' })
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'The "phone" field is required.' })
    @IsString()
    phone: string;
    [key: string]: string;
}
export class CreateCampaignParams {
    @IsNotEmpty({ message: 'The "name" field is required.' })
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'The "activeMessageSettingId" field is required.' })
    @IsNumber()
    activeMessageSettingId: number;

    @IsNotEmpty({ message: 'The "templateId" field is required.' })
    @IsString()
    templateId: string;

    description?: string;
    sendAt?: number;
    sendInterval?: number;
    campaignType?: CampaignType;
    clonedFrom?: number;
    isTest?: boolean;
    contacts?: ContactParams[];
    immediateStart?: boolean;
    isForwarding?: boolean;
    action?: string;
}

export interface CreateContactResponse {
    id: number;
    name: string;
    phone: string;
    sent?: boolean;
    conversationId?: string;
    [key: string]: string | number | boolean;
}

export interface CreateCampaignResponse {
    campaign: Campaign;
    contacts?: CreateContactResponse[];
}
