import { BillingType } from "../models/workspace.entity";

export class CreateWorkspaceDto {
    id: string;
    name: string;
    invoiceDescription?: string;
    paymentDescription?: string;
    accountId: number;
    dueDate: number;
    startAt?: number;
    plan?: string;
    planPrice?: number;
    planMessageLimit?: number;
    planHsmMessageLimit?: number;
    planUserLimit?: number;
    planExceededMessagePrice?: number;
    planHsmExceedMessagePrice?: number;
    planUserExceedPrice?: number;
    planConversationExceedPrice?: number;
    planConversationLimit?: number;
    active?: boolean;
    hasIntegration?: boolean;
    segment?: string;
    observations?: string;
    customerXId?: string;
    customerXEmail?: string;
    billingType?: BillingType;
}
