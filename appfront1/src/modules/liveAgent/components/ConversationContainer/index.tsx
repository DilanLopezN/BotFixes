import { useState, useEffect, useRef, FC, useCallback } from 'react';
import './styles.scss';
import LeftSideConversationMenu from '../LeftSideConversationMenu';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import FilterConversations from './components/FilterConversations';
import CreateContact from './components/CreateContact';
import I18n from '../../../i18n/components/i18n';
import { ConversationList } from '../ConversationList';
import ContactInfoSlide from '../ContactInfoSlide';
import { NewConversations } from './components/NewConversations';
import { DynamicConversationList } from '../DynamicConversationList';
import ContactList from './components/ContactList';
import WhatsappStatusAlert from './../WhatsappStatusAlert';
import Filter from '../Filter';
import InitialSearchResult from '../InitialSearchResult';
import { ConversationCardData } from '../ConversationCard/props';
import { Constants } from '../../../../utils/Constants';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { LiveAgentService } from '../../service/LiveAgent.service';
import {
    ActivityType,
    KissbotSocket,
    KissbotSocketType,
    IdentityType,
    ConversationStatus,
    ConversationTabFilter,
    OrganizationSettings,
} from 'kissbot-core';
import moment from 'moment';
import TinyQueue from 'tinyqueue';
import omit from 'lodash/omit';
import merge from 'lodash/merge';
import { ConversationContainerProps } from './props';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ChannelConfig } from '../../../../model/Bot';
import { dispatchSentryError } from '../../../../utils/Sentry';
import mingo from 'mingo';
import { sortTypes } from '../Filter/props';
import { FileAttachment, Identity } from '../../interfaces/conversation.interface';
import { sleep, timeout } from '../../../../utils/Timer';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { dispatchWindowEvent } from '../../../../hooks/event.hook';
import { useSelector } from 'react-redux';
import {
    ContersationContainerContextProvider,
    tabs,
    useContersationContainerContext,
} from './conversation-container.context';
import { onFocusChange } from '../../../../utils/focused';
import { NotificationSongs } from '../../../../model/Workspace';
import AudioPlayer from '../AudioPlayer/components/player';

const validActivitiesToUpdateLastNotificationAndUnread = [
    ActivityType.message,
    ActivityType.member_upload_attachment,
    ActivityType.member_added,
    ActivityType.member_disconnected,
    ActivityType.bot_took_on,
    ActivityType.bot_disconnected,
    ActivityType.member_exit,
    ActivityType.member_removed,
    ActivityType.end_conversation,
];

interface SideModalConfig {
    component: Function;
    title: string;
}

let queueLock = false;
let canSyncConversations = true;
let intervalCheckInactivity: any = undefined;

const LIMIT_SYNC_UNFOCUSED_MINUTES = 20;
const LIMIT_SYNC_TO_RELOAD_MINUTES = 20;

const queueEvents: TinyQueue<KissbotSocket> = new TinyQueue([], (a: any, b: any) => {
    return a.timestamp - b.timestamp;
});

const ConversationContainerComponent = (props: ConversationContainerProps & RouteComponentProps & I18nProps) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { tabFilterSelected } = useContersationContainerContext();
    const newMessageSound = new Audio(
        `/assets/media/${selectedWorkspace?.generalConfigs?.notificationSong || NotificationSongs.OPTION_1}.mp3`
    );
    newMessageSound.volume = 0.25;

    const initSocket = () => {
        if (props.socketConnection) {
            props.socketConnection.on('events', (event: KissbotSocket) => {
                receiveEvent(event);
            });
        }
    };

    useEffect(() => initSocket(), [props.socketConnection]);

    const [conversations, setConversations] = useState<{ [key: string]: ConversationCardData } | undefined>(undefined);
    const [selectedConversation, setSelectedConversation] = useState<ConversationCardData | undefined>(undefined);
    const [appliedFilters, setAppliedFilters] = useState<any | undefined>(undefined);
    const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
    const [contactSelectedId, setContactSelectedId] = useState<string | undefined>(undefined);
    const [unreadConversations, setUnreadConversations] = useState<string[]>([]);
    const [canLoadingMoreConversations, setCanLoadingMoreConversations] = useState<boolean>(true);
    const [tabQueries, setTabQueries] = useState<{ [key: string]: any } | undefined>(undefined);
    const [conversationQueryApplied, setConversationQueryApplied] = useState<any>(undefined);
    const [backupConversations, setBackupConversations] = useState<{ [key: string]: ConversationCardData }>({});
    const [appliedTextFilter, setAppliedTextFilter] = useState<string | undefined>(undefined);

    const [sideModalConfig, setSideModalConfig] = useState<SideModalConfig | undefined>(undefined);
    const SideModalComponent: Function = (sideModalConfig && sideModalConfig.component) as Function;

    const settings: OrganizationSettings & { generalFeatureFlag: { [key: string]: any } } = useSelector(
        (state: any) => state.loginReducer.settings
    );

    const [focusedAt, setFocusedAt] = useState<number | undefined>(undefined);

    const focusedAtRef: any = useRef(null);
    focusedAtRef.current = {
        focusedAt,
        setFocusedAt,
    };

    const conversationsRef: any = useRef(null);
    conversationsRef.current = {
        conversations,
        setConversations,
    };

    const selectedConversationRef: any = useRef(null);
    selectedConversationRef.current = {
        selectedConversation,
        setSelectedConversation,
    };

    const unreadConversationsRef: any = useRef(null);
    unreadConversationsRef.current = {
        unreadConversations,
        setUnreadConversations,
    };

    const appliedFiltersRef: any = useRef(null);
    appliedFiltersRef.current = {
        appliedFilters,
        setAppliedFilters,
    };

    const conversationQueryAppliedRef: any = useRef(null);
    conversationQueryAppliedRef.current = {
        conversationQueryApplied,
        setConversationQueryApplied,
    };

    const backupConversationsRef: any = useRef(null);
    backupConversationsRef.current = {
        backupConversations,
        setBackupConversations,
    };

    const appliedTextFilterRef: any = useRef(null);
    appliedTextFilterRef.current = {
        appliedTextFilter,
        setAppliedTextFilter,
    };

    useEffect(() => {
        fetchTabQueries();
        syncConversations();
    }, []);

    const syncConversations = () => {
        if (!canSyncConversations) {
            return;
        }

        timeout(() => {
            dispatchWindowEvent('reloadConversationList', {});
            syncConversations();
        }, 300_000);
    };

    useEffect(() => {
        intervalCheckInactivity = setInterval(() => {
            const { focusedAt } = focusedAtRef.current;

            if (canSyncConversations && focusedAt && focusedAt > 0) {
                if (moment.duration(moment().diff(focusedAt)).minutes() > LIMIT_SYNC_UNFOCUSED_MINUTES) {
                    canSyncConversations = false;
                    return;
                }

                return;
            }
        }, 300_000);
    }, [focusedAt]);

    useEffect(() => {
        onFocusChange((focused) => {
            if (focused) {
                const { focusedAt } = focusedAtRef.current;
                if (moment.duration(moment().diff(focusedAt)).minutes() > LIMIT_SYNC_TO_RELOAD_MINUTES) {
                    window.location.reload();
                    return;
                }

                setFocusedAt(undefined);
                clearInterval(intervalCheckInactivity);
            } else {
                setFocusedAt(+new Date());
            }
        });
    }, []);

    const fetchTabQueries = async () => {
        const queries = await LiveAgentService.getTabQueries(workspaceId);
        setTabQueries(queries);
    };

    const updateConversationFromActivity = (activity: any, receivedConversation: any) => {
        const { conversations } = conversationsRef.current;
        let currentConversation: ConversationCardData = conversations[receivedConversation._id];

        if (!currentConversation) {
            return;
        }

        switch (activity.type) {
            case ActivityType.member_upload_attachment: {
                const { attachmentFile, from, timestamp } = activity;

                const fileAttachment: FileAttachment = {
                    memberId: from.id,
                    mimeType: attachmentFile.contentType,
                    name: attachmentFile.name,
                    timestamp,
                    _id: activity.attachmentFile?.id || activity._id,
                };

                if (!currentConversation?.hasOwnProperty('fileAttachments')) {
                    currentConversation = {
                        ...currentConversation,
                        fileAttachments: [],
                    };
                }

                if (
                    currentConversation?.fileAttachments?.findIndex(
                        (attachment) => attachment._id === fileAttachment._id
                    ) === -1
                ) {
                    currentConversation.fileAttachments?.push(fileAttachment);
                }

                break;
            }

            case ActivityType.assigned_to_team: {
                currentConversation = {
                    ...currentConversation,
                    assignedToTeamId: receivedConversation.assignedToTeamId,
                };
                break;
            }

            case ActivityType.automatic_distribution: {
                currentConversation = {
                    ...currentConversation,
                    members: [...receivedConversation.members],
                    assignedToTeamId: receivedConversation.assignedToTeamId,
                    assumed: !!receivedConversation.members?.find((member: Identity) => {
                        return member.id === loggedUser._id && member.type === IdentityType.agent && !member.disabled;
                    }),
                };
                break;
            }

            case ActivityType.member_added:
            case ActivityType.member_connected:
            case ActivityType.member_disconnected:
            case ActivityType.member_exit:
            case ActivityType.member_reconnected:
            case ActivityType.member_removed: {
                const memberIndex = currentConversation.members?.findIndex((member) => member.id === activity.from.id);

                if (memberIndex > -1) {
                    currentConversation.members = currentConversation.members.map((member) => {
                        if (member.id === activity.from?.id) {
                            return activity.from;
                        }
                        return member;
                    });
                } else {
                    currentConversation.members = [...currentConversation.members, activity.from];
                }

                currentConversation = {
                    ...currentConversation,
                    assumed: !!currentConversation.members?.find((member: Identity) => {
                        return member.id === loggedUser._id && member.type === IdentityType.agent && !member.disabled;
                    }),
                };
                break;
            }
            case ActivityType.member_removed_by_admin: {
                if (conversations[receivedConversation._id]) {
                    currentConversation.members = [...receivedConversation.members];
                }
                break;
            }

            default:
                break;
        }

        if (validActivitiesToUpdateLastNotificationAndUnread.includes(activity.type)) {
            currentConversation = {
                ...currentConversation,
                lastNotification: activity.timestamp,
            };
        }

        const newConversations = {
            ...conversations,
            [currentConversation._id]: {
                ...currentConversation,
                metrics: receivedConversation.metrics,
                waitingSince: receivedConversation.waitingSince,
                priority: receivedConversation.priority,
                order: receivedConversation.order,
            },
        };

        return isSelectedConversation(
            receivedConversation._id,
            newConversations,
            newConversations[currentConversation._id]
        );
    };

    const addActivity = async (data: any) => {
        const { activity, conversation: receivedConversation } = data;
        const implement = implementTabAndFilters(receivedConversation);

        updateConversationFromActivity(activity, receivedConversation);

        switch (activity.type) {
            case ActivityType.end_conversation: {
                endConversation(activity, receivedConversation);

                if (!implement) {
                    removeConversationFromList(receivedConversation);
                    break;
                }
                break;
            }

            case ActivityType.member_added:
            case ActivityType.member_connected:
            case ActivityType.member_disconnected:
            case ActivityType.member_exit:
            case ActivityType.member_reconnected:
            case ActivityType.member_removed:
            case ActivityType.member_removed_by_admin:
                await addConversation(receivedConversation, activity, false);

                if (!implement) {
                    removeConversationFromList(receivedConversation);
                    break;
                }
                break;

            case ActivityType.suspend_conversation:
                receivedConversation.suspendedUntil = activity.data.until;
                const shouldRemove = implementTabAndFilters(receivedConversation);
                if (!shouldRemove) {
                    removeConversationFromList(receivedConversation);
                    break;
                }
                break;

            case ActivityType.message:
            case ActivityType.member_upload_attachment:
                const { conversations } = conversationsRef.current;
                const currentConversation = conversations?.[receivedConversation._id];
                const isTransitioningToSmtRe = receivedConversation?.isWithSmtRe && !currentConversation?.isWithSmtRe;

                if (isTransitioningToSmtRe) {
                    removeConversationFromList(receivedConversation);
                    return;
                }
                await addConversation(receivedConversation, activity, false);
                updateLastActivityBackup(receivedConversation, activity);
                if (!!loggedUser.liveAgentParams?.notifications?.emitSoundNotifications) {
                    canPlayMessageSound(activity);
                }

                if (!implement) {
                    removeConversationFromList(receivedConversation);
                    break;
                }
                break;

            case ActivityType.assigned_to_team: {
                updateAssignedToTeam(receivedConversation);
                break;
            }

            case ActivityType.automatic_distribution: {
                if (!implement) {
                    removeConversationFromList(receivedConversation);
                }
                await addConversation(receivedConversation, activity, false);

                timeout(() => {
                    dispatchWindowEvent('reloadConversationList', {});
                }, 100);

                break;
            }

            default:
                break;
        }

        updateUnreadConversations(activity);
    };

    const updateLastActivityBackup = (conversation: any, activity: any) => {
        const { backupConversations, setBackupConversations } = backupConversationsRef.current;

        if (!backupConversations.hasOwnProperty(conversation._id)) return;

        backupConversations[conversation._id] = {
            ...backupConversations[conversation._id],
            lastActivity: activity,
        };

        setBackupConversations({ ...backupConversations });
    };

    const removeConversationFromList = async (conversation: any) => {
        const { conversations, setConversations } = conversationsRef.current;

        if (!conversations.hasOwnProperty(conversation._id)) {
            return;
        }

        delete conversations[conversation._id];
        setConversations({
            ...conversations,
        });
    };

    const updateUnreadConversations = (activity: any) => {
        const { conversationId } = activity;
        const { selectedConversation } = selectedConversationRef.current;

        try {
            if (
                !validActivitiesToUpdateLastNotificationAndUnread.includes(activity.type) ||
                (!!selectedConversation && conversationId === selectedConversation._id)
            ) {
                return;
            }

            markedAsUnread(conversationId);
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    useEffect(() => {
        if (!props.conversation) return;
        const { conversations } = conversationsRef.current;

        const isActualSelected: any = Object.values((conversations as any) ?? {}).find((conv: any) => conv.selected);

        if (isActualSelected && isActualSelected._id !== props.conversation._id) {
            conversations[isActualSelected._id] = {
                ...conversations[isActualSelected._id],
                selected: false,
            };
        }

        setSelectedConversation(props.conversation);

        if (conversations?.[props.conversation._id]) {
            setConversations({
                ...conversations,
                [props.conversation._id]: {
                    ...props.conversation,
                    selected: true,
                },
            });
        }
    }, [props.conversation]);

    const canPlayMessageSound = (activity: any) => {
        const { conversations } = conversationsRef.current;
        const { selectedConversation } = selectedConversationRef.current;

        try {
            const conversation = conversations[activity.conversationId];
            if (!conversation) return;

            const assumed =
                conversation.assumed || conversation.members?.some((member) => member.id === loggedUser._id);

            if (
                (!!assumed && !document.hasFocus() && !selectedConversation) ||
                selectedConversation?._id !== conversation._id
            ) {
                newMessageSound.play().catch(console.log);
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const endConversation = async (activity, conversation) => {
        const { conversations } = conversationsRef.current;
        const { conversationId } = activity;

        if (!conversations[conversationId]) {
            return isSelectedConversation(conversationId, conversations, conversation);
        }

        try {
            conversations[conversationId] = {
                ...conversations[conversationId],
                ...conversation,
            };

            const selectedConversationToUpdate = conversations[conversationId];

            setConversations({
                ...conversations,
            });

            return isSelectedConversation(conversationId, conversations, selectedConversationToUpdate);
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const updateAttributes = ({ conversationId, attributes }: any) => {
        const { conversations, setConversations } = conversationsRef.current;
        if (!conversations[conversationId]) return;

        try {
            conversations[conversationId] = {
                ...conversations[conversationId],
                attributes,
            };
            setConversations({ ...conversations });
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const updateAssignedToTeam = (receivedConversation: any) => {
        const { _id, assignedToTeamId } = receivedConversation;
        const { conversations, setConversations } = conversationsRef.current;
        if (!conversations[_id]) return;

        try {
            conversations[_id] = {
                ...conversations[_id],
                assignedToTeamId,
            };
            setConversations({ ...conversations });
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const updateWhatsAppExpiration = ({ whatsappExpiration, conversationId }: any) => {
        const { conversations, setConversations } = conversationsRef.current;
        if (!conversations[conversationId]) return;

        try {
            conversations[conversationId] = {
                ...conversations[conversationId],
                whatsappExpiration,
            };

            const selectedConversationToUpdate = conversations[conversationId];

            setConversations({ ...conversations });
            return isSelectedConversation(conversationId, conversations, selectedConversationToUpdate);
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const updateTags = ({ conversationId, tags }: any) => {
        const { conversations, setConversations } = conversationsRef.current;
        if (!conversations[conversationId]) return;

        try {
            conversations[conversationId] = {
                ...conversations[conversationId],
                tags,
            };
            setConversations({ ...conversations });
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const updateMembers = ({ _id: conversationId, members }: any) => {
        const { conversations, setConversations } = conversationsRef.current;
        if (!conversations[conversationId]) return;

        try {
            conversations[conversationId] = {
                ...conversations[conversationId],
                members: [...members],
            };

            const user = members.find((member) => member.type === IdentityType.user);

            if (!!user) {
                conversations[conversationId] = {
                    ...conversations[conversationId],
                    user,
                };
            }

            const selectedConversationToUpdate = conversations[conversationId];

            setConversations({ ...conversations });
            return isSelectedConversation(conversationId, conversations, selectedConversationToUpdate);
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const updateConversation = (conversation: any) => {
        if (!conversation) {
            return;
        }

        if (!conversation?.fileAttachments?.length) {
            delete conversation.fileAttachments;
        }

        if (!conversation?.attributes?.length) {
            delete conversation.attributes;
        }

        const { appliedFilters } = appliedFiltersRef.current;

        const { conversations } = conversationsRef.current;
        const { _id: conversationId } = conversation;

        if (!conversations[conversationId]) {
            return addConversation(conversation);
        }

        try {
            conversations[conversationId] = merge(conversations[conversationId], conversation);
            const selectedConversationToUpdate = conversations[conversationId];

            if (conversation.state === ConversationStatus.closed) {
                if (appliedFilters.tab === ConversationTabFilter.all) {
                    if (appliedFilters.state && appliedFilters.state !== ConversationStatus.closed) {
                        delete conversations[conversationId];
                    }
                } else {
                    delete conversations[conversationId];
                }
            }
            return isSelectedConversation(conversationId, conversations, selectedConversationToUpdate);
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const isSelectedConversation = (conversationId: string, conversations: any, selectedConversationToUpdate: any) => {
        let { selectedConversation, setSelectedConversation } = selectedConversationRef.current;
        const { setConversations } = conversationsRef.current;

        setConversations({ ...conversations });

        try {
            if (selectedConversation?._id === conversationId) {
                const tranformedConversation = LiveAgentService.transformConversations(
                    [selectedConversationToUpdate || {}],
                    loggedUser
                );

                const newSelectedConversation = {
                    ...tranformedConversation[conversationId],
                    ...selectedConversationToUpdate,
                    members: merge(
                        tranformedConversation[conversationId]?.members || [],
                        selectedConversationToUpdate?.members || []
                    ),
                };

                props.onConversationSelected({ ...newSelectedConversation });
                setSelectedConversation({ ...newSelectedConversation });
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const implementTabAndFilters = (conversation: any) => {
        const { conversationQueryApplied } = conversationQueryAppliedRef.current;

        if (!conversationQueryApplied) {
            return false;
        }

        const query = new mingo.Query(conversationQueryApplied);
        return query.test(conversation);
    };

    const validateCanAddConversation = (conversations: any[], conversation: any, activity?: any) => {
        if (!conversation || !conversation._id) {
            return;
        }
        if (conversations && conversations.hasOwnProperty(conversation._id)) {
            return;
        }

        if (!conversation.activities) {
            conversation.activities = [];
        }

        const newConversations = {
            ...conversations,
            [conversation._id]: {
                assumed: !![...conversation.members].find((member) => {
                    return member.type === IdentityType.agent && !member.disabled && member.id === loggedUser._id;
                }),
                ...conversation,
                type: ActivityType.message,
                lastActivity:
                    activity ||
                    conversation.lastActivity ||
                    [...(conversation.activities || [])]
                        .filter(
                            (activity) =>
                                activity.type === ActivityType.message ||
                                activity.type === ActivityType.member_upload_attachment ||
                                (activity.type === ActivityType.event && activity.name === 'start')
                        )
                        .pop() ||
                    undefined,
                user: [...conversation.members].filter((member) => member.type === IdentityType.user)[0],
            },
        };

        return newConversations;
    };

    const addConversation = async (conversation: any, activity?: any, ignoreFilters?: boolean) => {
        const { conversations, setConversations } = conversationsRef.current;
        const { backupConversations, setBackupConversations } = backupConversationsRef.current;

        if (!conversation?.attributes?.length) {
            delete conversation.attributes;
        }

        if (!conversation?.fileAttachments?.length) {
            delete conversation.fileAttachments;
        }

        let implementFilters: boolean = true;
        !ignoreFilters && (implementFilters = implementTabAndFilters(conversation));

        let forceUpdate = false;

        // se a conversa não estava implementando os filtros, 'mergeia' com o backup para pegar
        // a última mensagem por exemplo
        if (
            implementFilters &&
            !conversations.hasOwnProperty(conversation._id) &&
            !!backupConversations.hasOwnProperty(conversation._id)
        ) {
            const tranformedConversation = LiveAgentService.transformConversations([conversation], loggedUser);

            conversation = {
                ...conversation,
                ...(tranformedConversation?.[conversation._id] ?? {}),
                lastActivity: backupConversations[conversation._id]?.lastActivity,
            };

            conversations[conversation._id] = {
                ...conversations[conversation._id],
                ...conversation,
                members: merge(conversations?.[conversation._id]?.members || [], conversation?.members || []),
            };

            forceUpdate = true;
        }
        try {
            const converstionList = implementFilters ? conversations : backupConversations;
            const setConversationList = implementFilters ? setConversations : setBackupConversations;
            const newConversationList = validateCanAddConversation(converstionList, conversation, activity);
            if (!!newConversationList) {
                setConversationList(newConversationList);
            }

            const { selectedConversation } = selectedConversationRef.current;

            // se a conversa selecionada não implementa os filtros, mantem atualizada mesmo assim
            if ((!implementFilters && conversation?._id === selectedConversation?._id) || forceUpdate) {
                if (selectedConversation?.fileAttachments?.length && !conversation?.fileAttachments?.length) {
                    conversation.fileAttachments = selectedConversation?.fileAttachments;
                }

                if (selectedConversation?.attributes?.length && !conversation?.attributes?.length) {
                    conversation.attributes = selectedConversation.attributes;
                }

                isSelectedConversation(conversation._id, conversations, conversation);
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const transformConversations = (loggedUser, conversations, filter?) => {
        return {
            ...(filter ? {} : conversations),
            ...(conversations.length && LiveAgentService.transformConversations(conversations || [], loggedUser)),
        };
    };

    const markedAsUnread = (conversationId: string) => {
        if (!conversationId) return;

        try {
            if (unreadConversationsRef.current.unreadConversations.findIndex((id) => id === conversationId) === -1) {
                unreadConversationsRef.current.setUnreadConversations((prev) => [...prev, conversationId]);
            }
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const markRead = (conversationId: string) => {
        if (!conversationId) return;

        unreadConversationsRef.current.setUnreadConversations((prev) => [
            ...prev.filter((id) => id !== conversationId),
        ]);
    };

    const getConversations = async (
        infinity: any,
        isNewFilter?: boolean,
        omitLoading?: boolean,
        focusedPage?: boolean,
        override?: boolean
    ) => {
        const { conversations, setConversations } = conversationsRef.current;
        const { loggedUser, workspaceId } = props;
        const { appliedFilters } = appliedFiltersRef.current;
        const { setConversationQueryApplied } = conversationQueryAppliedRef.current;
        const { appliedTextFilter } = appliedTextFilterRef.current;
        const paramWorkspaceId = workspaceParam();

        if (!infinity || !workspaceId) {
            return;
        }

        if (!omitLoading) {
            setLoadingConversations(true);
        }

        try {
            const { data: conversationsRet, query } = (await LiveAgentService.getConversations(
                paramWorkspaceId || workspaceId,
                infinity.actual || 0,
                infinity.limit || 20,
                {
                    ...appliedFilters,
                    search: !!appliedTextFilter ? appliedTextFilter : undefined,
                },
                loggedUser,
                focusedPage
            )) ?? { data: [], query: {} };

            setConversationQueryApplied(query);

            const conversationsSorted = Object.values({
                ...(transformConversations(
                    loggedUser,
                    conversationsRet || [],
                    !infinity.actual || infinity.actual === 0
                ) || {}),
            });

            if (conversationsRet?.length < infinity.limit) {
                setCanLoadingMoreConversations(false);
            }

            const newConversations = conversationsSorted.reduce((memo: any, curr: any) => {
                memo[curr._id] = { ...curr };
                return memo;
            }, {}) as any;

            if (isNewFilter || override) {
                return setConversations({ ...newConversations });
            }
            return setConversations({ ...conversations, ...newConversations });
        } catch (error) {
            dispatchSentryError(error);
        } finally {
            if (!omitLoading) {
                timeout(() => setLoadingConversations(false), 150);
            }
        }
    };

    const selectInitialConversation = async () => {
        const { workspaceId } = props;
        const paramWorkspaceId = workspaceParam();
        const paramConversationId = conversationParam();

        if (!workspaceId) {
            return;
        }

        if (paramWorkspaceId && paramWorkspaceId !== workspaceId) {
            const workspace = await WorkspaceService.getWorkspace(paramWorkspaceId);

            if (!workspace) return;

            props.setSelectedWorkspace(workspace);
        }
        if (paramConversationId && paramConversationId !== props.conversation?._id) {
            onSelectConversation(paramConversationId);
            window.history.replaceState(null, '', window.location.pathname);
        }
    };

    const getAppliedFilters = () => {
        const filters = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS);

        if (typeof filters !== 'string') {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS);
            return {};
        }

        const removeLocal = () => localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS);

        try {
            const obj = JSON.parse(filters);
            if (obj && typeof obj === 'object' && obj !== null) {
                const parsedFilters = JSON.parse(filters);
                return parsedFilters;
            }
            removeLocal();
        } catch (err) {
            removeLocal();
        }
    };

    const saveFiltersStorage = (filters: any) => {
        const { workspaceId } = props;
        if (!workspaceId) return;

        const replFilter = {
            ...getAppliedFilters(),
            [workspaceId]: {
                ...filters,
            },
        };

        localStorage.setItem(
            Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS,
            JSON.stringify({
                ...replFilter,
                [workspaceId]: {
                    ...filters,
                    search: undefined,
                },
            })
        );
    };

    const getWorkspaceAppliedFilters = (workspaceId: string) => {
        const filters = getAppliedFilters();

        if (typeof filters == 'object' && filters.hasOwnProperty(workspaceId)) {
            if (!filters[workspaceId].sort) {
                return {
                    ...filters[workspaceId],
                    sort: sortTypes[filters[workspaceId].tab || ConversationTabFilter.all],
                };
            }
            return filters[workspaceId];
        }

        return {
            tab: ConversationTabFilter.inbox,
            sort: sortTypes[ConversationTabFilter.inbox],
        };
    };

    const conversationParam = () => {
        const { location } = props;
        const params = new URLSearchParams(location.search);

        const conversationId = params.get('conversation');
        if (conversationId?.length === 24) {
            return conversationId;
        }
    };

    const workspaceParam = () => {
        const { location } = props;
        const params = new URLSearchParams(location.search);

        const workspaceId = params.get('workspace');
        if (workspaceId?.length === 24) {
            return workspaceId;
        }
    };

    const onSelectConversation = async (
        conversationId: string,
        alreadyAssumed?: boolean,
        appendInList?: boolean,
        rawConversation?: any
    ) => {
        const paramWorkspaceId = workspaceParam();
        const { conversations, setConversations } = conversationsRef.current;
        const { loggedUser } = props;
        const { selectedConversation, setSelectedConversation } = selectedConversationRef.current;

        if (!conversations || !conversationId) return;
        let conversation: ConversationCardData | undefined = conversations[conversationId];

        if (!!rawConversation && !conversation) {
            const tranformedConversation = LiveAgentService.transformConversations([rawConversation], loggedUser) || {};
            conversation = tranformedConversation?.[conversationId];
        }

        if (!conversation) {
            try {
                let error;
                const conversationToTransform = await LiveAgentService.getUniqueConversation(
                    conversationId,
                    paramWorkspaceId || workspaceId,
                    (err) => {
                        error = err;
                    }
                );
                if (error && error.statusCode === 401) {
                    return addNotification({
                        title: getTranslation('Error'),
                        message: `${getTranslation('You do not have permission to access this conversation!')}.`,
                        type: 'danger',
                        duration: 4000,
                    });
                }
                const tranformedConversation =
                    LiveAgentService.transformConversations([conversationToTransform], loggedUser) || {};
                conversation = tranformedConversation?.[conversationId];
            } catch (e) {
                dispatchSentryError(e);
            }
        }

        if (
            !!loadingConversations ||
            !conversationId ||
            !conversation ||
            (!!selectedConversation && conversationId === selectedConversation._id)
        ) {
            return;
        }

        let conversationsUpdated = {
            ...conversations,
            [conversationId]: {
                ...conversation,
                selected: true,
            },
        };

        if (alreadyAssumed) {
            conversationsUpdated[conversationId].assumed = true;
        }

        if (!!selectedConversation) {
            conversationsUpdated = {
                ...conversationsUpdated,
                [selectedConversation._id]: {
                    ...conversationsUpdated[selectedConversation._id],
                    selected: false,
                    seenBy: {
                        ...(conversationsUpdated[selectedConversation._id]?.seenBy || {}),
                        [loggedUser._id as string]: moment().toDate(),
                    },
                },
            };
        }

        if (appendInList) {
            setConversations(conversationsUpdated as { [x: string]: ConversationCardData });
        }

        setSelectedConversation(conversationsUpdated[conversationId] as ConversationCardData);
        props.onConversationSelected(conversationsUpdated[conversationId]);

        timeout(() => {
            markRead(conversationId);
        }, 200);
    };

    useEffect(() => {
        const { workspaceId } = props;
        const { location } = props;

        const params = new URLSearchParams(location.search);
        const assumedBy = params.get('filter');
        if (!workspaceId) return;

        let initFilters: any;

        if (workspaceId) {
            initFilters = getWorkspaceAppliedFilters(workspaceId);
        }

        const initialConversation = conversationParam();
        if (initialConversation && initFilters) {
            initFilters = {
                ...initFilters,
                tab: ConversationTabFilter.all,
                sort: sortTypes[ConversationTabFilter.all],
            };
        }
        if (assumedBy && initFilters) {
            initFilters = {
                formValues: { assumedBy: assumedBy, state: 'open' },
                tab: ConversationTabFilter.all,
                sort: sortTypes[ConversationTabFilter.all],
            };
            window.history.replaceState(null, '', window.location.pathname);
        }

        if (!initFilters) {
            initFilters = {
                tab: ConversationTabFilter.inbox,
                sort: sortTypes[ConversationTabFilter.inbox],
            };
        }

        if (JSON.stringify(initFilters) === JSON.stringify(appliedFiltersRef.current.appliedFilters)) {
            return;
        }

        appliedFiltersRef.current.setAppliedFilters(initFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.workspaceId]);

    useEffect(() => {
        const { setConversations } = conversationsRef.current;
        const { appliedFilters } = appliedFiltersRef.current;
        const doFilter = async () => {
            if (!appliedFilters) {
                return;
            }
            saveFiltersStorage({ ...(appliedFilters ?? {}) });
            setCanLoadingMoreConversations(true);
            setConversations({});
            await getConversations({}, true);
            if (!props.conversation) {
                selectInitialConversation();
            }
        };

        doFilter();
    }, [appliedFilters]);

    const { addNotification, workspaceId, loggedUser, getTranslation } = props;

    const sideModalData: { [key: string]: SideModalConfig } = {
        FILTERS: {
            component: FilterConversations,
            title: getTranslation('Filters'),
        },
        NEW_CONVERSATION: {
            component: NewConversations,
            title: getTranslation('New conversation'),
        },
        CREATE_CONTACT: {
            component: CreateContact,
            title: getTranslation('Create contact'),
        },
        CONTACT_INFO: {
            component: ContactInfoSlide,
            title: getTranslation('Contact info'),
        },
        CONTACT_LIST: {
            component: ContactList,
            title: getTranslation('Contact list'),
        },
    };

    useEffect(() => {
        window.addEventListener('@conversation_create_request', handler_create_conversation);
        window.addEventListener('@force_update_conversation', handler_force_update_conversation);
        window.addEventListener('@force_update_conversation_list', handler_force_update_conversation_list);

        return () => {
            window.removeEventListener('@conversation_create_request', handler_create_conversation);
            window.removeEventListener('@force_update_conversation', handler_force_update_conversation);
            window.removeEventListener('@force_update_conversation_list', handler_force_update_conversation_list);
        };
    }, []);

    const handler_create_conversation = (ev: any) => {
        const { params } = ev.detail;
        createNewConversation(params);
    };

    const handler_force_update_conversation = (ev: any) => {
        const { conversationId } = ev.detail;

        LiveAgentService.getUniqueConversation(conversationId, workspaceId).then((conversationToTransform) => {
            const tranformedConversation =
                LiveAgentService.transformConversations([conversationToTransform], loggedUser) || {};
            const conversation = tranformedConversation?.[conversationId];

            updateConversation(conversation);
        });
    };

    const handler_force_update_conversation_list = (ev: any) => {
        const { conversation } = ev.detail;

        const tranformedConversation = LiveAgentService.transformConversations([conversation], loggedUser) || {};
        const conversationTransform = tranformedConversation?.[conversation._id];

        updateConversation(conversationTransform);
    };

    const handleEvent = (event) => {
        setSideModalConfig(sideModalData[event]);
    };

    const handleCloseModal = () => {
        setSideModalConfig(undefined);
    };

    const createNewConversation = async (data: {
        channel: ChannelConfig;
        teamId: string;
        phone?: any;
        contactId?: string;
    }) => {
        const { channel, phone, contactId, teamId } = data;

        if ((!phone && !contactId) || !channel?._id) {
            return;
        }

        const payload: { channelConfigId: string; assignedToTeamId: string; contactId?: string; startMember?: any } = {
            channelConfigId: channel._id,
            assignedToTeamId: teamId,
        };

        if (contactId) {
            payload.contactId = contactId;
        } else if (phone) {
            payload.startMember = {
                id: phone.phoneId,
                name: `+${phone?.ddi ? phone.ddi : ''}${phone.phoneNumber}`,
                phone: phone.phoneNumber,
                ddi: phone.ddi,
            };
        }

        let error: any;
        const conversationCreated = await LiveAgentService.startConversation(
            payload,
            channel.workspaceId,
            channel._id,
            (err) => (error = err)
        );

        if (error) {
            if (error?.error === 'CONVERSATION_WITHOUT_DESTINATION') {
                return addNotification({
                    title: getTranslation('An error has occurred'),
                    message: `${getTranslation(
                        'There was an error starting the attendance. Check that the contact or phone number is correct'
                    )}.`,
                    type: 'danger',
                    duration: 8000,
                });
            }
            if (error?.error === 'CANNOT_START_CONVERSATION_ON_BLOCKED_CONTACT') {
                return addNotification({
                    title: getTranslation('Warning'),
                    message: `${getTranslation(
                        'Unable to start the session because the contact is blocked and has contact restrictions.'
                    )}.`,
                    type: 'warning',
                    duration: 8000,
                });
            }

            return addNotification({
                title: getTranslation('An error has occurred'),
                message: `${getTranslation('An error occurred when starting the service. Try again later')}.`,
                type: 'danger',
                duration: 8000,
            });
        }

        // retorna um array de conversas abertas caso exista
        if (conversationCreated?.exist) {
            onSelectConversation(conversationCreated.exist[0]._id);
            return addNotification({
                title: getTranslation('An error has occurred'),
                message: `${getTranslation('There is already an open service for this contact on this channel')}.`,
                type: 'danger',
                duration: 8000,
            });
        }

        // se retornou uma conversa então foi criada
        if (conversationCreated?._id) {
            onSelectConversation(conversationCreated._id, undefined, undefined, conversationCreated);
            addNotification({
                title: getTranslation('Success'),
                message: `${getTranslation('Conversation created')}.`,
                type: 'success',
                duration: 3000,
            });

            return setSideModalConfig(undefined);
        }
    };

    const onApplyConversationFilter = (filters: any, sort: any) => {
        let formValues = filters;
        if (JSON.stringify(omit(filters, ['tab'])) === '{}') {
            formValues = { ...appliedFiltersRef.current.appliedFilters.formValues };
        }
        const nextFilter = {
            ...appliedFiltersRef.current.appliedFilters,
            formValues: { ...formValues },
            ...filters,
            ...sort,
        };

        appliedFiltersRef.current.setAppliedFilters({
            ...nextFilter,
        });
    };

    const events = {
        [KissbotSocketType.CONVERSATION]: addConversation,
        [KissbotSocketType.CONVERSATION_UPDATED]: updateConversation,
        [KissbotSocketType.ACTIVITY]: addActivity,
        [KissbotSocketType.CONVERSATION_MEMBERS_UPDATED]: updateMembers,
        [KissbotSocketType.CONVERSATION_TAGS_UPDATED]: updateTags,
        [KissbotSocketType.CONVERSATION_WHATSAPP_EXPIRATION_UPDATED]: updateWhatsAppExpiration,
        [KissbotSocketType.CONVERSATION_ATTRIBUTES_UPDATED]: updateAttributes,
    };

    const processEvent = async () => {
        try {
            while (queueEvents.length) {
                const event = queueEvents.pop();
                if (!event) {
                    return;
                }

                const action = events?.[event.type];

                if (action) {
                    await action(event.message);
                    if (settings.generalFeatureFlag?.enableTimeoutQueue) {
                        await sleep(10);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            queueLock = false;
        }
    };

    const receiveEvent = useCallback(
        (event: KissbotSocket) => {
            if (events[event.type]) {
                queueEvents.push(event);
                if (!queueLock) {
                    queueLock = true;
                    processEvent();
                }
            }
        },
        [events]
    );

    const [statusVsisible, setStatusVisible] = useState(false);

    return props.workspaceId && appliedFiltersRef.current.appliedFilters ? (
        <ContersationContainerContextProvider>
            <DynamicConversationList className='ConversationContainer'>
                <DynamicConversationList height='100%' flexBox borderRight='1px #e4e4e4 solid' column>
                    {!!sideModalConfig && (
                        <LeftSideConversationMenu
                            title={sideModalConfig.title}
                            onClose={() => handleCloseModal()}
                            verifyStatus={statusVsisible}
                        >
                            <Wrapper bgcolor='#f8f8f8' height='100%'>
                                <SideModalComponent
                                    {...props}
                                    workspaceId={workspaceId}
                                    onOpenConversation={(conversationId) => {
                                        setSideModalConfig(undefined);
                                        onSelectConversation(conversationId, undefined, false);
                                    }}
                                    onFiltersApply={(_, filters, force) => {
                                        let nextFilter = {};

                                        if (!force)
                                            nextFilter = {
                                                ...filters,
                                                sort: { ...appliedFiltersRef.current.appliedFilters.sort },
                                                tab: appliedFiltersRef.current.appliedFilters.tab,
                                            };
                                        else nextFilter = filters;

                                        appliedFiltersRef.current.setAppliedFilters({
                                            ...nextFilter,
                                        });
                                    }}
                                    onClose={() => handleCloseModal()}
                                    appliedFilters={appliedFiltersRef.current.appliedFilters}
                                    notification={addNotification}
                                    contactSelectedId={contactSelectedId}
                                    onContactSelected={(contactId) => setContactSelectedId(contactId)}
                                    onSelectConversation={(conversationId) =>
                                        onSelectConversation(conversationId, undefined, false)
                                    }
                                    conversation={selectedConversation}
                                    onContactInfo={() => handleEvent('CONTACT_INFO')}
                                    onCreateContact={() => handleEvent('CREATE_CONTACT')}
                                    socketConnection={props.socketConnection}
                                    createNewConversation={createNewConversation}
                                    teams={props.teams}
                                    loggedUser={loggedUser}
                                />
                            </Wrapper>
                        </LeftSideConversationMenu>
                    )}
                    <WhatsappStatusAlert
                        loggedUser={loggedUser}
                        socketConnection={props.socketConnection}
                        workspaceId={workspaceId}
                    />
                    <Filter
                        tabQueries={tabQueries}
                        teams={props.teams}
                        socketConnection={props.socketConnection}
                        workspaceId={workspaceId}
                        appliedFilters={appliedFiltersRef.current.appliedFilters}
                        loggedUser={loggedUser}
                        onApplyConversationsFilter={(_, filters, sort) => onApplyConversationFilter(filters, sort)}
                        onCreateContact={() => handleEvent('CREATE_CONTACT')}
                        onFiltersApply={() => handleEvent('FILTERS')}
                        onNewConversation={() => handleEvent('NEW_CONVERSATION')}
                        onOpenContactList={() => handleEvent('CONTACT_LIST')}
                        onApplyTextFilter={(value) => {
                            setAppliedTextFilter(value);
                        }}
                    />
                    {!!appliedTextFilter ? (
                        <InitialSearchResult
                            onContactInfo={() => handleEvent('CONTACT_INFO')}
                            onContactSelected={(contactId) => setContactSelectedId(contactId)}
                            onOpenConversation={(conversationId: string) =>
                                onSelectConversation(conversationId, undefined, false)
                            }
                            appliedFilters={appliedFiltersRef.current.appliedFilters}
                            loggedUser={loggedUser}
                            selectConversation={(conversationId) =>
                                onSelectConversation(conversationId, undefined, false)
                            }
                            workspaceId={workspaceId as string}
                            socketConnection={props.socketConnection}
                            teams={props.teams}
                            appliedTextFilter={appliedTextFilterRef.current.appliedTextFilter}
                        />
                    ) : (
                        <>
                            <ConversationList
                                onUpdatedConversationSelected={props.onUpdatedConversationSelected}
                                teams={props.teams}
                                channels={props.channelList}
                                appliedFilters={appliedFiltersRef.current.appliedFilters}
                                loadingMore={loadingConversations}
                                loadMore={getConversations}
                                loggedUser={loggedUser}
                                selectConversation={(conversationId: string) =>
                                    onSelectConversation(conversationId, undefined, false)
                                }
                                conversations={Object.values(conversationsRef.current?.conversations || {})}
                                workspaceId={workspaceId || undefined}
                                socketConnection={props.socketConnection}
                                canLoadingMoreConversations={canLoadingMoreConversations}
                                key={'conversations-list-default'}
                                appliedTextFilter={appliedTextFilterRef.current.appliedTextFilter}
                            />
                            {selectedConversation && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        margin: 0,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                        outline: 'none',
                                        zIndex: 2,
                                        background: '#f2f6f9',
                                    }}
                                >
                                    <AudioPlayer
                                        contextId={selectedConversation?._id}
                                        type='general'
                                        onOpenClick={(data) => {
                                            if (!data) {
                                                return;
                                            }

                                            const { conversationId, hash } = data;

                                            onSelectConversation(conversationId, undefined, true);
                                            const event = new CustomEvent('scrollActivity', {
                                                detail: {
                                                    conversationId: conversationId,
                                                    activityHash: hash,
                                                },
                                            });
                                            timeout(() => window.dispatchEvent(event), 300);
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </DynamicConversationList>
            </DynamicConversationList>
        </ContersationContainerContextProvider>
    ) : null;
};

export const ConversationContainer = I18n(withRouter(ConversationContainerComponent)) as FC<ConversationContainerProps>;
