export interface BasePayloadMessageGupshupV2 {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: MessageType;
}

export type PayloadMessageGupshupV2WithType =
    | { type: MessageType.text; text: PayloadTextMessage }
    | { type: MessageType.audio; audio: PayloadAudioMessage }
    | { type: MessageType.image; image: PayloadImageMessage }
    | { type: MessageType.video; video: PayloadVideoMessage }
    | {
          type: MessageType.interactive;
          interactive?: PayloadInteractiveMessage | PayloadInteractiveFlowMessage;
          reaction?: PayloadInteractiveReactionMessage;
      }
    | { type: MessageType.document; document: PayloadDocumentMessage }
    | { type: MessageType.template; template: PayloadTemplateMessage };

export type PayloadMessageGupshupV2 = BasePayloadMessageGupshupV2 & PayloadMessageGupshupV2WithType;

export interface PayloadTextMessage {
    body: string;
}

export interface PayloadAudioMessage {
    id: string; // Media ID
}

export interface PayloadImageMessage {
    id?: string; // Media ID
    link?: string; // media URL
    caption?: string;
}

export interface PayloadVideoMessage {
    id?: string; // Media ID
    link?: string; // media URL
    caption?: string;
}

export interface PayloadDocumentMessage {
    id?: string; // Media ID
    link?: string; // media URL
    caption?: string;
}

export interface PayloadInteractiveMessage {
    type: InteractiveType.button;
    header: {
        type: string;
    };
    body: {
        text: string;
    };
    footer: {
        text: string;
    };
    action: {
        buttons: {
            type: ButtonType;
            reply?: {
                id: string; // ID do botão
                title: string; // Label do botão
            };
        }[];
    };
}

export interface PayloadInteractiveReactionMessage {
    message_id: string;
    emoji: string;
}

export interface PayloadInteractiveFlowMessage {
    type: InteractiveType.flow;
    header?: {
        type: 'text';
        text: string;
    };
    body: {
        text: string;
    };
    footer?: {
        text: string;
    };
    action: {
        name: 'flow';
        parameters: {
            flow_id: string;
            flow_message_version: '3';
            flow_token?: string;
            flow_cta: string;
            flow_action: 'navigate' | 'data_exchange';
            flow_action_payload?: {
                screen: 'FIRST_ENTRY_SCREEN' | string;
                data?: any;
            };
        };
    };
}

export interface PayloadTemplateMessage {
    language: {
        policy: 'deterministic';
        code: 'en' | 'pt';
        namespace: string; // wabaId do template
        name: string; // elementName do template
    };
    components: {
        type: 'body' | 'button';
        sub_type?: 'copy_code';
        index?: string;
        parameters: any[];
    }[];
}

export enum PayloadGupshupTypes {
    PayloadTextMessage = 'PayloadTextMessage',
    PayloadAudioMessage = 'PayloadAudioMessage',
    PayloadImageMessage = 'PayloadImageMessage',
    PayloadVideoMessage = 'PayloadVideoMessage',
    PayloadInteractiveMessage = 'PayloadInteractiveMessage',
    PayloadInteractiveFlowMessage = 'PayloadInteractiveFlowMessage',
    PayloadInteractiveReactionMessage = 'PayloadInteractiveReactionMessage',
    PayloadDocumentMessage = 'PayloadDocumentMessage',
    PayloadTemplateMessage = 'PayloadTemplateMessage',
}

export enum MessageType {
    text = 'text',
    audio = 'audio',
    image = 'image',
    video = 'video',
    document = 'document',
    interactive = 'interactive',
    template = 'template',
}

export enum InteractiveType {
    button = 'button',
    reaction = 'reaction',
    flow = 'flow',
}

export enum ButtonType {
    reply = 'reply',
}
