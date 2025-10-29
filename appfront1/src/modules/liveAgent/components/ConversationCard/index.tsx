import {
    ActivityType,
    ConversationStatus,
    IActivityAckAndHash,
    IdentityType,
    KissbotSocket,
    KissbotSocketType,
} from 'kissbot-core';
import merge from 'lodash/merge';
import moment from 'moment';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { validateCanViewConversation } from '../../../../model/Team';
import { Card, UserAvatar, Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from '../../../../ui-kissbot-v2/theme';
import { dispatchSentryError } from '../../../../utils/Sentry';
import { isAnySystemAdmin } from '../../../../utils/UserPermission';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Activity } from '../../interfaces/activity.interface';
import AvatarIconAgrouped from '../AvatarIconAgrouped';
import { getDataFromCreatedChannel } from '../created-by-channel';
import LastActivityPreview from '../LastActivityPreview';
import { ConversationContextMenu } from './Components/ConversationContextMenu';
import { ConversationCardData, ConversationCardProps } from './props';
import { Body, Header, Wrapped } from './styled';
import './styles.scss';

const validTypesActivity = [
    ActivityType.message,
    ActivityType.member_upload_attachment,
    ActivityType.member_added,
    ActivityType.member_disconnected,
    ActivityType.bot_took_on,
    ActivityType.bot_disconnected,
    ActivityType.member_exit,
    ActivityType.member_removed,
    ActivityType.end_conversation,
    ActivityType.suspend_conversation,
    ActivityType.member_removed_by_admin,
];

const activityTypeToIncrement: string[] = [
    ActivityType.message,
    ActivityType.member_upload_attachment,
    ActivityType.member_added,
];

const ConversationCardComponent: React.FC<ConversationCardProps & I18nProps> = ({
    onClick,
    className,
    getTranslation,
    conversation,
    loggedUser,
    socketConnection,
    workspaceId,
    teams,
    channels,
    onUpdatedConversationSelected,
}) => {
    const [conversationState, setConversationState] = useState<ConversationCardData>(conversation);
    const [lastActivityStatePreview, setLastActivityStatePreview] = useState<Activity>(conversation.lastActivity);
    const [canViewConversation, setCanViewConversation] = useState<boolean | undefined>(undefined);
    const canViewConversationRef: any = useRef(null);

    canViewConversationRef.current = {
        canViewConversation,
        setCanViewConversation,
    };

    const shouldDisplayAction = (conversation) => {
        return !!conversation.assumed && conversation.state === ConversationStatus.open;
    };

    const { _id, user, selected, state, tags, members } = conversationState;

    useLayoutEffect(() => {
        return setConversationState((prev) => ({ ...prev, selected: conversation.selected }));
    }, [conversation.selected]);

    useEffect(() => {
        return setConversationState((prev) => ({ ...prev, members: conversation.members }));
    }, [conversation.members]);

    useEffect(() => {
        return setConversationState((prev) => ({ ...prev, user: conversation.user }));
    }, [conversation.user]);

    useEffect(() => {
        return setConversationState((prev) => ({ ...prev, state: conversation.state }));
    }, [conversation.state]);

    useEffect(() => {
        return setConversationState((prev) => ({ ...prev, assumed: conversation.assumed }));
    }, [conversation.assumed]);

    useEffect(() => {
        return setConversationState((prev) => ({ ...prev, waitingSince: conversation.waitingSince }));
    }, [conversation.waitingSince]);

    useEffect(() => {
        return setConversationState((prev) => ({ ...prev, assignedToTeamId: conversation.assignedToTeamId }));
    }, [conversation.assignedToTeamId]);

    useEffect(() => {
        return setConversationState((prev) => ({ ...prev, activities: conversation.activities }));
    }, [conversation.activities]);

    const conversationStateRef: any = useRef(null);
    conversationStateRef.current = {
        conversationState,
        setConversationState,
    };

    const lastActivityStatePreviewRef: any = useRef(null);
    lastActivityStatePreviewRef.current = {
        lastActivityStatePreview,
        setLastActivityStatePreview,
    };

    useEffect(() => {
        initSocket();

        return () => {
            socketConnection?.removeListener('events', conversationCardListener);
        };
    }, [socketConnection]);

    const initSocket = () => {
        if (socketConnection) {
            socketConnection.on('events', conversationCardListener);
        }
    };

    const ackAndHashActivity = async (message: IActivityAckAndHash) => {
        const { lastActivityStatePreview, setLastActivityStatePreview } = lastActivityStatePreviewRef.current;

        if (
            lastActivityStatePreview?._id === message.activityId ||
            lastActivityStatePreview?.id === message.activityId
        ) {
            setLastActivityStatePreview({
                ...lastActivityStatePreview,
                ack: message.ack,
                hash: message.hash,
            });
        }
    };

    const updateConversation = (conversation: any) => {
        const { conversationState, setConversationState } = conversationStateRef.current;

        try {
            if (!conversation?.fileAttachments?.length) {
                delete conversation.fileAttachments;
            }

            if (!conversation?.attributes?.length) {
                delete conversation.attributes;
            }

            if (conversationState && conversationState._id === conversation._id) {
                return setConversationState((prevState) => ({ ...merge(prevState, conversation) }));
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const validateTeamPermissionViewActivities = () => {
        const canAcessConversation = validateCanViewConversation({
            conversation,
            loggedUser,
            workspaceId,
            teams,
        });

        setCanViewConversation(canAcessConversation);
    };

    useEffect(() => {
        validateTeamPermissionViewActivities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        conversationState.assumed,
        conversationState.state,
        conversationState.assignedToTeamId,
        conversationState._id,
        conversation.members,
    ]);

    const ackActivity = ({ ack, hash }: any) => {
        const { lastActivityStatePreview, setLastActivityStatePreview } = lastActivityStatePreviewRef.current;

        try {
            if (hash.includes(lastActivityStatePreview?.hash) && ack > (lastActivityStatePreview?.ack ?? 0)) {
                setLastActivityStatePreview({
                    ...lastActivityStatePreview,
                    ack,
                });
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const updateConversationTags = ({ tags, conversationId }: any) => {
        const { conversationState, setConversationState } = conversationStateRef.current;
        if (conversationState?._id === conversationId) {
            return setConversationState((prev) => ({ ...prev, tags }));
        }
    };

    const addActivity = async (data: any) => {
        const { activity, conversation: receivedConversation } = data;
        if (conversation._id !== activity.conversationId) {
            return;
        }

        const { lastActivityStatePreview, setLastActivityStatePreview } = lastActivityStatePreviewRef.current;

        try {
            if (
                !validTypesActivity.includes(activity.type) ||
                (activity.type === ActivityType.event && (activity.name !== 'start' || activity.text === ''))
            )
                return;

            if (
                (lastActivityStatePreview?.timestamp === undefined ||
                    lastActivityStatePreview?.timestamp <= activity?.timestamp) &&
                (activity.type === ActivityType.message || activity.type === ActivityType.member_upload_attachment)
            ) {
                setLastActivityStatePreview({
                    ...activity,
                    pending: false,
                });
            }

            setConversationState((prevState) => {
                if (!prevState.activities) {
                    prevState.activities = [];
                }
                prevState.activities.push(activity);
                let suspendedUntil;

                if (activity.type === ActivityType.suspend_conversation) {
                    suspendedUntil = activity.data?.until;
                }
                return { ...prevState, ...receivedConversation, suspendedUntil };
            });
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const getAgentMembers = () => (members ? members.filter((m) => m.type === IdentityType.agent && m) : []);

    const channelCreated = getDataFromCreatedChannel(conversation.createdByChannel);

    const agents = getAgentMembers();

    const getBorderLeft = (): string => {
        if (state === ConversationStatus.closed) {
            return '4px solid #f12727 !important';
        }
        if (
            state === ConversationStatus.open &&
            conversationState.suspendedUntil &&
            conversationState.suspendedUntil > moment().valueOf()
        ) {
            return '4px solid #faad14 !important';
        }
        return '';
    };

    const isAnyAdmin = isAnySystemAdmin(loggedUser);

    const newListTags = (tags) => {
        const listTags = tags.filter((tag) => {
            return isAnyAdmin ? tag : !tag.name.includes('@sys') && tag;
        });

        return listTags;
    };

    const events = {
        [KissbotSocketType.ACTIVITY]: addActivity,
        [KissbotSocketType.CONVERSATION_TAGS_UPDATED]: updateConversationTags,
        [KissbotSocketType.ACTIVITY_ACK]: ackActivity,
        [KissbotSocketType.CONVERSATION_UPDATED]: updateConversation,
        [KissbotSocketType.UPDATE_ACTIVITY_ACK_AND_HASH]: ackAndHashActivity,
    };

    const conversationCardListener = async (event: KissbotSocket) => {
        if (!event) {
            return;
        }

        const action = events?.[event.type];

        if (action) {
            await action(event.message);
        }
    };

    const getCustomDateLabel = () => {
        const str = moment(lastActivityStatePreview.timestamp).fromNow(true);

        if (str === 'poucos segundos') {
            return 'agora';
        }

        if (str === 'a few seconds') {
            return 'now';
        }

        return str;
    };

    const conversationCard = (
        <Card
            borderRadius='none'
            selected={selected}
            onClick={onClick}
            className={`conversationCard ${!!selected ? 'active' : ''} ${className}`}
            colorType={ColorType.laSelected}
            flexDirection='row'
            cursor='pointer'
            padding='1px 0 1px 1px'
        >
            <Wrapper
                position='relative'
                padding={`16px 6px 8px ${state === 'closed' ? '3px' : '7px'}`}
                borderLeft={getBorderLeft()}
            >
                {user && (
                    <UserAvatar
                        user={user}
                        hashColor={`${user.id as string}${_id}`}
                        size={43}
                        key={`${user.id as string}${_id}`}
                    />
                )}
                <Wrapper
                    borderRadius='50%'
                    bgcolor='#fff'
                    title={getTranslation(channelCreated.title)}
                    left='6px'
                    top='52px'
                    flexBox
                    padding='2px'
                    width='17px'
                    height='17px'
                    boxShadow='rgba(71, 88, 114, 0.08) 0px 2px 2px'
                    justifyContent='center'
                    position='absolute'
                >
                    <img src={`assets/img/${channelCreated.icon}.svg`} alt='' />
                </Wrapper>
            </Wrapper>
            <Wrapper
                flex
                minWidth='80px'
                padding='8px 8px 8px 2px'
                borderBottom={selected ? 'none' : '1px solid #F0F0F0'}
            >
                <Header>
                    <Wrapper flex>
                        <Wrapper flex flexBox>
                            <Wrapper
                                truncate
                                width='150px'
                                fontSize='16px'
                                fontWeight='500'
                                color={getColor(ColorType.text, ColorVariation.dark)}
                            >
                                {user && user.name}
                            </Wrapper>
                        </Wrapper>
                    </Wrapper>
                    <Wrapper
                        margin='0 0 0 5px'
                        flexBox
                        alignItems='center'
                        color='#555 !important'
                        fontSize='10px'
                        truncate
                    >
                        {lastActivityStatePreview && getCustomDateLabel()}
                    </Wrapper>
                </Header>
                <Body>
                    {canViewConversation && (
                        <Wrapped
                            style={{
                                overflow: 'hidden',
                                whiteSpace: 'pre',
                                textOverflow: 'ellipsis',
                                fontSize: '12px',
                                flex: 1,
                                height: '18px',
                            }}
                        >
                            <LastActivityPreview
                                lastActivity={lastActivityStatePreviewRef.current.lastActivityStatePreview}
                            />
                        </Wrapped>
                    )}
                    {<AvatarIconAgrouped agents={agents} disabled={false} maxAvatarVisible={2} />}
                    {state !== ConversationStatus.closed && conversation?.waitingSince > 0 && (
                        <Wrapper
                            bgcolor={'#06d755'}
                            title={getTranslation('Unread messages')}
                            width='14px'
                            height='14px'
                            borderRadius='1.1em'
                            flexBox
                            alignItems='center'
                            margin='0 3px 0 4px'
                            color='#FFF !important'
                            fontSize='12px'
                            fontWeight='bold'
                            padding='0.4em'
                            textAlign='center'
                        />
                    )}
                    {conversationState.suspendedUntil && conversationState?.suspendedUntil > moment().valueOf() ? (
                        <Wrapper
                            bgcolor={'#faad14'}
                            title={getTranslation('Service suspended')}
                            width='14px'
                            height='14px'
                            borderRadius='1.1em'
                            flexBox
                            alignItems='center'
                            margin='0 1px 0 2px'
                            color='#FFF !important'
                            fontSize='12px'
                            fontWeight='bold'
                            padding='0.4em'
                            textAlign='center'
                        />
                    ) : (
                        ''
                    )}
                </Body>
                {canViewConversation && tags && tags.length > 0 ? (
                    <Wrapper flexBox>
                        {newListTags(tags).map((tag) => (
                            <Wrapper
                                bgcolor={tag.color}
                                width='25px'
                                height='6px'
                                margin='0 6px 0 0'
                                borderRadius='4px'
                                title={tag.name}
                                key={`${tag.name}${_id}`}
                            />
                        ))}
                    </Wrapper>
                ) : null}
            </Wrapper>
        </Card>
    );

    return (
        <div id={_id} key={_id}>
            <Wrapper id={_id} key={_id}>
                {shouldDisplayAction(conversation) ? (
                    <ConversationContextMenu
                        key={_id}
                        teams={teams}
                        channels={channels}
                        onUpdatedConversationSelected={onUpdatedConversationSelected}
                        workspaceId={workspaceId}
                        loggedUser={loggedUser}
                        conversation={conversation}
                        disabled={!canViewConversationRef.current.canViewConversation}
                    >
                        {conversationCard}
                    </ConversationContextMenu>
                ) : (
                    <>{conversationCard}</>
                )}
            </Wrapper>
        </div>
    );
};

export const ConversationCard = I18n(ConversationCardComponent) as React.FC<ConversationCardProps>;
