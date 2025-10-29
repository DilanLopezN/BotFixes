import { AckType } from "kissbot-core";

export interface ChatMessageViewedProps {
    activityTimestamp: any;
    clientMessage: any;
    ack: AckType | undefined;
    showAck?: boolean;
}
