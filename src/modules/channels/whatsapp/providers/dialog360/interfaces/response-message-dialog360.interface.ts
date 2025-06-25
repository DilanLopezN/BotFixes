export interface ResponseMessageDialog360 {
    messages: [
        {
            id: string; // GUPSHUP_MESSAGE_ID
        },
    ];
    messaging_product: 'whatsapp';
    contacts: [
        {
            input: string; // DESTINATION_PHONE_NO
            wa_id: string; // DESTINATION_PHONE_NO
        },
    ];
}
