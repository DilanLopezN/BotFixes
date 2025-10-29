import { User } from 'kissbot-core';
import { Team } from '../../../../model/Team';
import { Activity } from '../../interfaces/activity.interface';

export interface ActivityProps {
    activity: Activity;
    teams: Team[];
    conversation: any;
    loggedUser: User;
    openImage: Function;
    nextActivity: Activity | undefined;
    failedMessages: { [key: string]: any };
    activityRetry: Function;
    quotedActivity: Activity | undefined;
    reactionText?: string[];
    scrollToActivity: Function;
    onReply?: () => void;
    sendReplayActivity: (activity: Activity) => void;
}
