export class Dialog360WebhookDataDto {
    phone_number_id: string;
    waba_id: string;
    business_id: string;
}

export interface Dialog360WebhookDto {
    data: Dialog360WebhookDataDto;
    type: string;
    event: string;
    version: string;
}