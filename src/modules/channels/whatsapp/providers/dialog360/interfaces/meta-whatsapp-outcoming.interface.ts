/**
 * Meta WhatsApp Cloud API Interfaces
 * Based on: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */

/*********************
 * COMMON INTERFACES *
 *********************/

export enum MetaWhatsappOutcomingMessageType {
    TEXT = 'text',
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video',
    DOCUMENT = 'document',
    STICKER = 'sticker',
    CONTACTS = 'contacts',
    LOCATION = 'location',
    INTERACTIVE = 'interactive',
    TEMPLATE = 'template',
    REACTION = 'reaction',
    ADDRESS_REQUEST = 'address_request',
}

export interface MetaWhatsappOutcomingBaseMessage {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: MetaWhatsappOutcomingMessageType;
    text?: MetaWhatsappOutcomingTextContent;
    interactive?: MetaWhatsappOutcomingInteractiveContent;

    image?: MetaWhatsappOutcomingImageMessage;
    audio?: MetaWhatsappOutcomingAudioMessage;
    video?: MetaWhatsappOutcomingVideoMessage;
    document?: MetaWhatsappOutcomingDocumentMessage;
    reaction?: MetaWhatsappOutcomingReactionMessage;
    template?: MetaWhatsappOutcomingTemplateContent;
}

/******************
 * TEXT MESSAGES *
 ******************/

export interface MetaWhatsappOutcomingTextContent {
    preview_url?: boolean;
    body: string;
}

export interface MetaWhatsappOutcomingTextMessage extends MetaWhatsappOutcomingBaseMessage {
    type: MetaWhatsappOutcomingMessageType.TEXT;
    text: MetaWhatsappOutcomingTextContent;
}

/*******************
 * MEDIA MESSAGES *
 *******************/

// Common interface for media messages
export interface MetaWhatsappOutcomingAudioMessage {
    id?: string;
    link?: string;
    voice?: boolean;
}

export interface MetaWhatsappOutcomingImageMessage {
    id?: string;
    link?: string;
    caption?: string;
}

export interface MetaWhatsappOutcomingVideoMessage {
    id?: string;
    link?: string;
    caption?: string;
}

export interface MetaWhatsappOutcomingDocumentMessage {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
}

export interface MetaWhatsappOutcomingStickerMessage {
    id?: string;
    link?: string;
}

/**********************
 * CONTACTS MESSAGES *
 **********************/

export interface PhoneNumber {
    phone?: string;
    type?: string;
    wa_id?: string;
}

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type?: string;
}

export interface Email {
    email?: string;
    type?: string;
}

export interface Url {
    url?: string;
    type?: string;
}

export interface Organization {
    company?: string;
    department?: string;
    title?: string;
}

export interface ContactName {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    prefix?: string;
}

export interface Contact {
    addresses?: Address[];
    birthday?: string;
    emails?: Email[];
    name: ContactName;
    org?: Organization;
    phones?: PhoneNumber[];
    urls?: Url[];
}

export interface MetaWhatsappOutcomingContactsMessage extends MetaWhatsappOutcomingBaseMessage {
    type: MetaWhatsappOutcomingMessageType.CONTACTS;
    contacts: Contact[];
}

/**********************
 * LOCATION MESSAGES *
 **********************/

export interface LocationContent {
    longitude: number;
    latitude: number;
    name?: string;
    address?: string;
}

export interface MetaWhatsappOutcomingLocationMessage extends MetaWhatsappOutcomingBaseMessage {
    type: MetaWhatsappOutcomingMessageType.LOCATION;
    location: LocationContent;
}

/************************
 * INTERACTIVE MESSAGES *
 ************************/

export interface ReplyButton {
    type: 'reply';
    reply: {
        id: string;
        title: string;
    };
}

export interface InteractiveListItem {
    id: string;
    title: string;
    description?: string;
}

export interface InteractiveListSection {
    title: string;
    rows: InteractiveListItem[];
}

export interface InteractiveAction {
    button?: string;
    buttons?: ReplyButton[];
    sections?: InteractiveListSection[];
    catalog_id?: string;
    product_retailer_id?: string;
    name?: string;
    parameters?: any;
}

export interface MetaWhatsappOutcomingInteractiveHeader {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    image?: { id?: string; link?: string };
    video?: { id?: string; link?: string };
    document?: { id?: string; link?: string; filename?: string };
}

export interface InteractiveBody {
    text: string;
}

export interface InteractiveFooter {
    text: string;
}

export interface MetaWhatsappOutcomingInteractiveContent {
    type: 'button' | 'list' | 'product' | 'product_list' | 'cta_url' | 'flow';
    header?: MetaWhatsappOutcomingInteractiveHeader;
    body: InteractiveBody;
    footer?: InteractiveFooter;
    action: InteractiveAction;
}

export interface MetaWhatsappOutcomingInteractiveMessage extends MetaWhatsappOutcomingBaseMessage {
    type: MetaWhatsappOutcomingMessageType.INTERACTIVE;
    interactive: MetaWhatsappOutcomingInteractiveContent;
}

export interface CTAURLInteractiveContent extends MetaWhatsappOutcomingInteractiveContent {
    type: 'cta_url';
    action: {
        name: 'cta_url';
        parameters: {
            display_text: string;
            url: string;
        };
    };
}

export interface FlowInteractiveContent extends MetaWhatsappOutcomingInteractiveContent {
    type: 'flow';
    action: {
        name: 'flow';
        parameters: {
            flow_token: string;
            flow_id?: string;
            flow_cta?: string;
            flow_action?: 'navigate' | 'data_exchange';
            flow_data?: Record<string, any>;
        };
    };
}

/**********************
 * TEMPLATE MESSAGES *
 **********************/

export interface TemplateComponent {
    type: 'header' | 'body' | 'button' | 'footer';
    parameters: TemplateParameter[];
    sub_type?: 'quick_reply' | 'url';
    index?: number;
}

export interface TemplateParameter {
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
    };
    date_time?: {
        fallback_value: string;
    };
    image?: {
        id?: string;
        link?: string;
    };
    document?: {
        id?: string;
        link?: string;
        filename?: string;
    };
    video?: {
        id?: string;
        link?: string;
    };
}

export interface MetaWhatsappOutcomingTemplateContent {
    name: string;
    language: {
        code: string;
        policy?: 'deterministic';
    };
    components?: TemplateComponent[];
}

export interface MetaWhatsappOutcomingTemplateMessage extends MetaWhatsappOutcomingBaseMessage {
    type: MetaWhatsappOutcomingMessageType.TEMPLATE;
    template: MetaWhatsappOutcomingTemplateContent;
}

/**********************
 * REACTION MESSAGES *
 **********************/

export interface ReactionContent {
    message_id: string;
    emoji: string;
}

export interface MetaWhatsappOutcomingReactionMessage {
    message_id: string;
    emoji: string;
}

/*************************
 * ADDRESS REQUEST MESSAGES *
 *************************/

export interface AddressRequestContent {
    requested_address_types: Array<'HOME' | 'WORK'>;
    order_details?: {
        catalog_id?: string;
        item_count?: number;
        price?: string;
    };
}
export interface MetaWhatsappOutcomingAddressRequestMessage extends MetaWhatsappOutcomingBaseMessage {
    type: MetaWhatsappOutcomingMessageType.ADDRESS_REQUEST;
    address_request: AddressRequestContent;
}
