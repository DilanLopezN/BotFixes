export interface CreateActiveMessage{
    conversationId?: string;
    workspaceId: string;
    channelConfigId: string;
    isCreatedConversation: boolean;
    activeMessageSettingId: number;

    contactId?: string;
    externalId?: string;
    messageError?: string;
    memberName?: string;
    memberPhone?: string;
    memberEmail?: string;
    memberBornDate?: string;
    campaignId?: number;
    confirmationId?: number;
    statusId?: number;
    timestamp?: number;
}