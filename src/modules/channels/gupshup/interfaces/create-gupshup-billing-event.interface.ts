import { GupshupMessageType } from "kissbot-core";

export interface CreateGupshupBillingEvent {
    conversationId: string;
    workspaceId?: string;
    channelConfigToken: string;
    deductionType: string;
    deductionModel: string;
    deductionSource: string;
    referenceId: string;
    referenceGsId: string;
    referenceConversationId: string;
    referenceDestination: string;
    gsTimestamp: number;
}