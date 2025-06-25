import { MetaWhatsappChange, MetaWhatsappWebhookEvent } from 'kissbot-core';
import { ChannelConfigWhatsappProvider } from '../../../../../channel-config/schemas/channel-config.schema';

export interface D360WebhookResponse {
    object: string;
    entry: Entry[];
}

export interface Entry {
    id: string;
    changes: MetaWhatsappChange[];
}

export interface Change {
    value: Value;
    field: string;
}

export interface Value {
    messaging_product: string;
    metadata: Metadata;
    contacts?: Contact[];
    errors?: Error[];
    messages?: Message[];
    statuses?: Status[];
}

export interface Metadata {
    display_phone_number: string;
    phone_number_id: string;
}

export interface Contact {
    profile: {
        name: string;
    };
    wa_id: string;
}

export interface Error {
    code: number;
    title: string;
    message: string;
    error_data?: {
        details: string;
    };
}

export interface Message {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: {
        body: string;
    };
    image?: {
        id: string;
        mime_type: string;
        sha256: string;
    };
    audio?: {
        id: string;
        mime_type: string;
        sha256: string;
    };
    sticker?: {
        mime_type: string;
        sha256: string;
        id: string;
    };
    document?: {
        id: string;
        mime_type: string;
        sha256: string;
        filename: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
}

export interface Status {
    id: string;
    status: 'sent' | 'delivered' | 'read';
    timestamp: string;
    recipient_id: string;
    conversation?: {
        id: string;
        expiration_timestamp: string;
        origin: {
            type: string;
        };
    };
    pricing?: {
        billable: boolean;
        pricing_model: string;
        category: string;
    };
}


export interface MetaWhatsappOutcomingMessage {}
