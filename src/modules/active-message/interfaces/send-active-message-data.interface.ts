export interface CreateActiveMessageAttributeData {
    value: any;
    type: string;
    label: string;
    name: string;
}
export interface SendActiveMessageData {
    // workspaceId: string,
    apiToken: string,
    teamId?: string;
    phoneNumber: string;
    parsedNumber?: string;
    action?: string;
    priority?: number;
    text?: string;
    templateId?: string;
    externalId?: string;
    attributes?: CreateActiveMessageAttributeData[];
    campaignId?: number;
    confirmationId?: number;
    omitAction?: boolean;
    contactName?: string;
}