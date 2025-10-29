export interface CreateCampaignConfigData {
    name: string;
    workspaceId: string;
    startAt: Date;
    endAt: Date;
    apiToken: string;
    linkMessage: string;
    linkTtlMinutes?: number;
    emailTemplateId: string;
    isActive?: boolean;
}
