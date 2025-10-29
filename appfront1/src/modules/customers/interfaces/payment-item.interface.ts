export enum PaymentItemTypes {
    plan = 'plan',
    exceeded_message = 'exceeded_message',
    hsm_message = 'hsm_message',
    discount = 'discount',
    setup = 'setup',
    session = 'session',
    conversation = 'conversation',
    conversation_api = 'conversation_api',
    conversation_campaign = 'conversation_campaign',
    conversation_gupshup = 'conversation_gupshup',
    conversation_liveagent = 'conversation_liveagent',
    conversation_webchat = 'conversation_webchat',
    user = 'user',
    extra = 'extra',
}

export interface CreatePaymentItemDto {
    paymentId: number;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    type: PaymentItemTypes;
}

export interface UpdatePaymentItemDto {
    itemDescription: string;
    quantity: number;
    unitPrice: number;
}

export interface PaymentItem {
    id?: number;
    paymentId: number;
    workspaceId: string;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    type: PaymentItemTypes;
}