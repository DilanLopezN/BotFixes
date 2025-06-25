import { ResendNotProcessedActiveMessagesData } from "../interfaces/resend-not-processed-active-messages-data.interface";

export class ResendNotProcessedActiveMessagesDto implements ResendNotProcessedActiveMessagesData {
    timestamp?: number;
    ResendNotProcessedActiveMessagesData?: number;
    limit?: string;
}