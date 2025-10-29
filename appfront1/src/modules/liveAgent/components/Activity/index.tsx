import { FC } from 'react';
import { ActivityProps } from './props';
import { ActivityType, IdentityType } from 'kissbot-core';
import { ChatEvent, ChatCard, ChatMessage } from '..';
import { activityIsCard } from '../../../../utils/Activity';
import moment from 'moment';
import { Activity as IActivity } from '../../interfaces/activity.interface';

const ActivityEventTypes = [
    ActivityType.member_added,
    ActivityType.member_removed,
    ActivityType.member_exit,
    ActivityType.member_reconnected,
    ActivityType.bot_took_on,
    ActivityType.member_disconnected,
    ActivityType.bot_disconnected,
    ActivityType.member_connected,
    ActivityType.end_conversation,
    ActivityType.assigned_to_team,
    ActivityType.suspend_conversation,
    ActivityType.member_removed_by_admin,
    ActivityType.member_add_by_admin,
    ActivityType.suspend_conversation,
    ActivityType.smt_re_activated,
    ActivityType.smt_re_stopped,
    ActivityType.smt_re_monitoring,
    ActivityType.smt_re_deactivated,
    ActivityType.smt_re_assumed,
    ActivityType.automatic_distribution,
];

const isOwnerMessage = (activity: IActivity, loggedUser) => activity.from && activity.from.id === loggedUser._id;

const isBalloonActivity = (activity: IActivity) =>
    activity.type === ActivityType.message ||
    activity.type === ActivityType.error ||
    activity.type === ActivityType.comment ||
    activity.type === ActivityType.member_upload_attachment ||
    ((activity.text || activity.attachmentFile || activity.attachments) &&
        activity.type === ActivityType.event &&
        activity.name === 'start');

const isEventMessage = (activity: IActivity) => ActivityEventTypes.includes(activity.type);

const renderActivity = (props: ActivityProps) => {
    const {
        activity,
        conversation,
        loggedUser,
        openImage,
        nextActivity,
        failedMessages,
        activityRetry,
        quotedActivity,
        reactionText,
        scrollToActivity,
        teams,
        onReply,
        sendReplayActivity,
    } = props;

    if (isEventMessage(activity) && activity.from?.name) {
        return <ChatEvent activity={activity} teams={teams} key={`chatEvent${activity._id}`} />;
    } else if (isBalloonActivity(activity)) {
        const renderTimestamp =
            !nextActivity ||
            !isBalloonActivity(nextActivity) ||
            (activity.from && activity.from.id !== nextActivity.from.id) ||
            moment.duration(moment(nextActivity.timestamp).diff(activity.timestamp)).asMinutes() > 1;

        if (activityIsCard(activity)) {
            return (
                <ChatCard
                    sendReplayActivity={sendReplayActivity}
                    onReply={onReply}
                    activity={activity}
                    ownerMessage={isOwnerMessage(activity, loggedUser)}
                    clientMessage={activity.from && activity.from.type === 'user'}
                    botMessage={activity.from && activity.from.type === 'bot'}
                    key={`chatCard${activity._id}`}
                    renderTimestamp={renderTimestamp}
                    conversationId={conversation._id}
                    quotedActivity={quotedActivity}
                    reactionText={reactionText}
                    conversation={conversation}
                    openImage={() => openImage(activity)}
                    withError={!!failedMessages[activity.uuid || activity._id]}
                />
            );
        } else if (!!activity.attachments && activity.attachments?.length) {
            return activity.attachments.map((attachment: any) => (
                <ChatMessage
                    sendReplayActivity={sendReplayActivity}
                    onReply={onReply}
                    loggedUser={loggedUser}
                    activity={activity}
                    conversation={conversation}
                    ownerMessage={isOwnerMessage(activity, loggedUser)}
                    clientMessage={activity.from && activity.from.type === IdentityType.user}
                    botMessage={activity.from && activity.from.type === IdentityType.bot}
                    attachment={attachment}
                    key={`chatMessage:${activity.uuid || activity._id}`}
                    openImage={() => openImage(activity)}
                    renderTimestamp={renderTimestamp}
                    withError={!!failedMessages[activity.uuid || activity._id]}
                    retry={() => activityRetry(activity.uuid)}
                    quotedActivity={quotedActivity}
                    reactionText={reactionText}
                    scrollToActivity={scrollToActivity}
                />
            ));
        } else if (!!activity.attachmentFile && activity.type === 'event' && activity.name === 'start') {
            return (
                <ChatMessage
                    sendReplayActivity={sendReplayActivity}
                    onReply={onReply}
                    loggedUser={loggedUser}
                    activity={activity}
                    conversation={conversation}
                    ownerMessage={isOwnerMessage(activity, loggedUser)}
                    clientMessage={activity.from && activity.from.type === IdentityType.user}
                    botMessage={activity.from && activity.from.type === IdentityType.bot}
                    key={`chatMessage:${activity.uuid || activity._id}`}
                    openImage={() => openImage(activity)}
                    renderTimestamp={renderTimestamp}
                    withError={!!failedMessages[(activity._id || activity.uuid) as string]}
                    retry={() => activityRetry(activity.uuid)}
                    quotedActivity={quotedActivity}
                    reactionText={reactionText}
                    scrollToActivity={scrollToActivity}
                />
            );
        }

        return (
            <ChatMessage
                sendReplayActivity={sendReplayActivity}
                onReply={onReply}
                loggedUser={loggedUser}
                activity={activity}
                conversation={conversation}
                ownerMessage={isOwnerMessage(activity, loggedUser)}
                clientMessage={activity.from && activity.from.type === IdentityType.user}
                botMessage={activity.from && activity.from.type === IdentityType.bot}
                key={`chatMessage:${activity.uuid || activity._id}`}
                openImage={() => openImage(activity)}
                renderTimestamp={renderTimestamp}
                withError={!!failedMessages[activity.uuid || activity._id]}
                retry={() => activityRetry(activity.uuid)}
                quotedActivity={quotedActivity}
                reactionText={reactionText}
                scrollToActivity={scrollToActivity}
            />
        );
    }

    return null;
};

const Activity: FC<ActivityProps> = (props) => {
    return <>{renderActivity({ ...props })}</>;
};

export default Activity;
