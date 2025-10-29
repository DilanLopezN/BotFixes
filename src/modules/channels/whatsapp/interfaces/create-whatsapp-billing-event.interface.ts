export interface CreateWhatsappBillingEvent {
  conversationId?: string;
  workspaceId?: string;
  channelConfigToken: string;
  messageId: string;
  recipientId: string;
  conversationWhatsappId?: string;
  conversationExpirationTimestamp?: string;
  conversationOriginType?: string;
  billable: boolean;
  pricingModel: string;
  category: string;
  pricingType?: string;
  timestamp: number;
}
