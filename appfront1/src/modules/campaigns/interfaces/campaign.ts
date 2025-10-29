import { ActiveMessageSetting } from "./active-message-setting-dto";


export enum CampaignStatus {
    'draft' = 'draft',
    'awaiting_send' = 'awaiting_send',
    'running' = 'running',
    'finished_complete' = 'finished_complete',
    'paused' = 'paused',
}

export enum CampaignType {
    // Apenas informativo, apenas envia mensagem
    'simple' = 'simple',
    // Exige uma configuração de respostas possiveis e status de respostas
    'research' = 'research'
}

export interface ContactResume {
    processedContactCount: number;
    contactCount:number;
}

export interface InvalidContact {
    total: number;
    contactTotal: number;
    contactId: number;
}

export interface CampaignResume {
    contactResume: ContactResume;
    invalidContacts: InvalidContact[];
}

export interface Campaign{
    id?: number;
    workspaceId: string;
    activeMessageSettingId?: number;
    name: string;
    description?: string;
    templateId?: string;
    sendAt?: number;
    sendInterval?: number;
    campaignType?: CampaignType;
    status?: CampaignStatus;
    createdAt?: number;
    campaignAttributes?: CampaignAttribute[];
    activeMessageSetting?: ActiveMessageSetting;
    startedAt?: number;
    endedAt?: number;
    processingTotal?: number;
    processedTotal?: number;
    processingFinished?: boolean;
    clonedFrom?: number;
    action?: string;
    isTest?: boolean;

    resume?: CampaignResume;
}

export interface CreateCampaignData {
    name: string;
    description?: string;
    templateId?: string;
    sendAt?: number;
    sendInterval?: number;
    campaignType?: CampaignType;
    workspaceId: string;
    activeMessageSettingId?: number;
    clonedFrom?: number;
    action?: string;
    isTest?: boolean;
}

export interface UpdateCampaignData extends CreateCampaignData {
    id: number;
}

export interface CampaignAttribute {
    id?: number;
    campaignId: number;
    label: string;
    name: string;
    templateId?: string;
    campaign?: Campaign;
}

export interface CreateCampaignAttributeData {
    campaignId: number;
    label: string;
    name: string;
    templateId?: string;
}



export interface CampaignContact {
    id: number;
    contactId: number;
    campaignId: number;
    activeMessageId?: number;

    contact?: Contact;
    campaign?: Campaign;
}

export interface Contact {
    id: number;
    name: string;
    whatsapp: string;
    phone: string;
    isValid: boolean;
    workspaceId: string;

    contactAttributes?: ContactAttribute[];
    campaignContact?: CampaignContact;
}

export interface ContactAttribute {
    id: number;
    name: string;
    value: string;
    contactId: number;
    workspaceId: string;

    contact?: Contact;
}

export interface CampaignAction {
    id: number;
    action: string;
    name: string;
    workspaceId: string;
}
