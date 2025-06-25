export interface PayloadMessageWhatsapp {
    activity: any;
}

export enum ChannelTypeWhatsapp {
    gupshup = 'gupshup',
    dialog_360 = 'dialog_360',
}

export interface PayloadD360Message {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    text?: {
        body: string;
    };
}
