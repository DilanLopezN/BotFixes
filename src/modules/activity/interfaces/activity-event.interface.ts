import { Conversation } from "./../../conversation/interfaces/conversation.interface";
import { Activity } from "./activity";

export enum ActivityReceivedType {
    'activityReceived' = 'activityReceived',
}
export interface ActivityReceivedEvent {
    type: ActivityReceivedType;
    activity?: Activity;
    conversation?: Partial<Conversation>;
    data?: any;
}
