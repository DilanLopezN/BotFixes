import { Activity } from "../../interfaces/activity.interface";

export interface ActivityErrorProps {
    ownerMessage?: boolean;
    clientMessage?: boolean;
    renderTimestamp?: boolean;
    activity: any;
      quotedActivity: Activity | undefined;
    scrollToActivity: Function;
}