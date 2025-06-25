import { MetaWhatsappIncomingTemplateEvent, MetaWhatsappWebhookEvent } from 'kissbot-core';
import { ChannelConfigWhatsappProvider } from '../../../channel-config/schemas/channel-config.schema';

export interface WhatsappIncomingEvent {
    message: MetaWhatsappWebhookEvent | MetaWhatsappIncomingTemplateEvent;
    channelConfigToken: string;
    workspaceId: string;
    provider: ChannelConfigWhatsappProvider;
}
