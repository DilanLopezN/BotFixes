import { MetaWhatsappIncomingTemplateEvent, MetaWhatsappWebhookEvent, TemplateRejectionReason } from 'kissbot-core';
import { CompleteChannelConfig } from '../../../channel-config/channel-config.service';
import { ChannelData } from './channel-data.interface';
import { PayloadMessageWhatsapp } from './payload-message-whatsapp.interface';
import { UploadingFile } from '../../../../common/interfaces/uploading-file.interface';
import {
    ResponseCreateFlow,
    ResponseFlow,
    ResponseFlowJSON,
    ResponseGetPreviewFlowUrl,
    ResponseMessageWhatsapp,
    ResponseDefault,
    ResponseUpdateFlowJSON,
} from './response-message-whatsapp.interface';
import { TemplateCategory } from '../../../../modules/template-message/schema/template-message.schema';

export interface WhatsappInterfaceService {
    // sendOutcoming message
    sendOutcomingTextMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingAudioMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingImageMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingVideoMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingDocumentMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingReactionMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingFlowMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingButtonMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingTemplateMessage(
        payload: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingQuickReply?(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    sendOutcomingListMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp>;
    // Manager flow
    createFlow(channelConfig: CompleteChannelConfig, flowData: any): Promise<ResponseCreateFlow>;
    updateFlowJSON(
        channelConfig: CompleteChannelConfig,
        flowId: string,
        flowJSON: string,
    ): Promise<ResponseUpdateFlowJSON>;
    deprecateFlow(channelData: ChannelData, flowId: string): Promise<ResponseDefault>;
    deleteFlow(channelData: ChannelData, flowId: string): Promise<ResponseDefault>;
    updateFlow(
        channelConfig: CompleteChannelConfig,
        flowId: string,
        flowData: {
            name: string;
            categories: string[];
        },
    ): Promise<ResponseDefault>;
    publishFlow(channelConfig: CompleteChannelConfig, flowId: string): Promise<ResponseDefault>;
    getPreviewFlowURL(channelConfig: CompleteChannelConfig, flowId: string): Promise<ResponseGetPreviewFlowUrl>;
    getFlowById(channelData: ChannelData, flowId: string): Promise<ResponseFlow>;
    getAllFlow(channelData: ChannelData): Promise<ResponseFlow[]>;
    getFlowJSON(channelData: ChannelData, flowId: string): Promise<ResponseFlowJSON>;
    subscriptionV3?(channelData: ChannelData, callbackUrl: string, modes?: string): Promise<ResponseDefault>;
    handleIncomingMessage(
        payload: MetaWhatsappWebhookEvent,
        channelConfigToken: string,
        workspaceId?: string,
    ): Promise<void>;
    handleIncomingAck(
        payload: MetaWhatsappWebhookEvent,
        channelConfigToken: string,
        workspaceId?: string,
    ): Promise<void>;
    handleIncomingTemplateEvent(
        payload: MetaWhatsappIncomingTemplateEvent,
        channelConfigToken: string,
        workspaceId?: string,
    ): Promise<void>;
    createTemplateMetaWhatsapp(
        channelConfig: CompleteChannelConfig,
        name: string,
        category: TemplateCategory,
        template: any,
        fileData?: any,
        file?: UploadingFile,
        templateType?: any,
        allowTemplateCategoryChange?: boolean,
    ): Promise<void>;
}

export type MetaTemplateComponent =
    | {
          type: 'HEADER';
          format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
          text?: string;
          example?: {
              header_text?: string[];
              header_handle?: string[];
          };
      }
    | {
          type: 'BODY';
          text: string;
          example?: {
              body_text: string[][];
          };
      }
    | {
          type: 'FOOTER';
          text: string;
      }
    | {
          type: 'BUTTONS';
          buttons: (
              | {
                    type: 'PHONE_NUMBER';
                    text: string;
                    phone_number: string;
                }
              | {
                    type: 'URL';
                    text: string;
                    url: string;
                    example?: string[];
                }
              | {
                    type: 'QUICK_REPLY';
                    text: string;
                }
              | {
                    type: 'COPY_CODE';
                    example: string;
                }
          )[];
      };
