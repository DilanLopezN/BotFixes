export interface WorkspaceBilling  {
    id: string;
    accountId: number;
    name: string;
    invoiceDescription?: string;
    paymentDescription?: string;
    plan?: string;
    dueDate: number;
    startAt?: number;
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
    billingType?: BillingType;
}

export enum BillingType {
    global = 'global',
    channel = 'channel',
}

export interface WorkspaceChannelSpecification {
    id?: number;
    workspaceId: string;
    channelId: WorkspaceChannels;
    conversationLimit: number;
    conversationExcededPrice: number;
    messageLimit: number;
    messageExcededPrice: number;
}

export enum WorkspaceChannels {
    api = 'api',
    campaign = 'campaign',
    gupshup = 'whatsapp-gupshup',
    liveagent = 'live-agent',
    webchat = 'webchat',
}