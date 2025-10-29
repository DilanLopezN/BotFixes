export interface UpdateCampaignConfigData {
    id: string;
    name?: string;
    startAt?: Date;
    endAt?: Date;
    apiToken?: string;
    linkMessage?: string;
    linkTtlMinutes?: number;
    emailTemplateId?: string;
    isActive?: boolean;
}
