import { Row } from 'antd';
import { IActivityAck, IActivityAckAndHash, IdentityType, KissbotSocket, KissbotSocketType } from 'kissbot-core';
import groupBy from 'lodash/groupBy';
import omit from 'lodash/omit';
import orderBy from 'lodash/orderBy';
import moment from 'moment';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TinyQueue from 'tinyqueue';
import { UseWindowEvent } from '../../../../hooks/event.hook';
import { validateCanViewConversation } from '../../../../model/Team';
import HelpCenterLink from '../../../../shared/HelpCenterLink';
import { Icon, PlainWrapper, Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from '../../../../ui-kissbot-v2/theme';
import { Constants } from '../../../../utils/Constants';
import { dispatchSentryError } from '../../../../utils/Sentry';
import { timeout } from '../../../../utils/Timer';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Activity as IActivity } from '../../interfaces/activity.interface';
import { Conversation, FileAttachment } from '../../interfaces/conversation.interface';
import { AttachmentService, uploadFileTypes, validateWhatsappFile } from '../../service/Atttachment.service';
import { LiveAgentService } from '../../service/LiveAgent.service';
import Activity from '../Activity';
import { ChatContainerHeader } from '../ChatContainerHeader';
import { ChatContainerMessage } from '../ChatContainerMessage';
import FilePreview from '../FilePreview';
import PreviewImage from '../PreviewImage';
import { TemplateMessage, TemplateType } from '../TemplateMessageList/interface';
import { ActivityReaction, ChatContainerProps } from './props';
import { Background, Body } from './styled';
import './styles.scss';
import { generateId } from '../../../../helpers/hex';
import { FilePreviewItem } from '../FilePreview/props';
import { DragDropZone } from './components/DragDropZone';
import { ScrollToBottomButton } from './components/ScrollToBottom';

let queueLock = false;

const queueEvents: TinyQueue<KissbotSocket> = new TinyQueue([], (a: any, b: any) => {
    return a.timestamp - b.timestamp;
});

const ChatContainerComponent = ({
    loggedUser,
    conversation = {},
    workspaceId,
    notification,
    getTranslation,
    readingMode,
    socketConnection,
    teams,
    channelList,
    onUpdatedConversationSelected,
}: ChatContainerProps & I18nProps) => {
    const endBlock = useRef<any>(null);
    const [activitiesLengthStart, setActivitiesLengthStart] = useState(-1);
    const [activities, setActivities] = useState<{ [key: string]: IActivity }>({});
    const [conversationSelected, setConversationSelected] = useState(conversation);
    const [scrollActivity, setScrollActivity] = useState<any>(undefined);
    const [loadingActivities, setLoadingActivities] = useState<boolean>(false);
    const [canViewConversation, setCanViewConversation] = useState<boolean | undefined>(readingMode);
    const [fetchedConversation, setFetchedConversation] = useState(false);
    const [isFocusOnReply, setIsFocusOnReply] = useState(false);
    const [replayActivity, setReplayActivity] = useState<IActivity>();
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [lastSeenActivityId, setLastSeenActivityId] = useState<string | null>(null);

    const HandleReplayActivity = (activity: IActivity) => {
        setReplayActivity(activity);
    };
    const handleReply = () => {
        setIsFocusOnReply(true);
    };

    const checkScrollPosition = useCallback(() => {
        const container = containerChat.current;
        if (!container) return;

        const isAtBottom = Math.abs(container.scrollTop) < 100;

        // Se scrollou para o bottom, zera o contador e esconde o botão
        if (isAtBottom) {
            setShowScrollButton(false);
            setUnreadMessagesCount(0);
            const activitiesArray = Object.values(activities);
            if (activitiesArray.length > 0) {
                const lastActivity = activitiesArray[activitiesArray.length - 1];
                setLastSeenActivityId(lastActivity._id ?? lastActivity.uuid ?? null);
            }
        }
    }, [activities]);

    useEffect(() => {
        const container = containerChat.current;
        if (!container) return;
        container.addEventListener('scroll', checkScrollPosition);
        return () => container.removeEventListener('scroll', checkScrollPosition);
    }, [checkScrollPosition]);

    const scrollToBottomNewMessages = useCallback(() => {
        const container = containerChat.current;
        if (!container) return;
        container.scrollTo({ top: 0, behavior: 'smooth' });
        setUnreadMessagesCount(0);

        const activitiesArray = Object.values(activities);
        if (activitiesArray.length > 0) {
            const lastActivity = activitiesArray[activitiesArray.length - 1];
            setLastSeenActivityId(lastActivity._id ?? lastActivity.uuid ?? null);
        }
    }, [activities]);

    useEffect(() => {
        const activitiesArray = Object.values(activities);
        if (activitiesArray.length === 0) return;

        const lastActivity = activitiesArray[activitiesArray.length - 1];
        const lastActivityId = lastActivity._id ?? lastActivity.uuid ?? null;

        if (lastSeenActivityId && lastActivityId !== lastSeenActivityId) {
            // Verifica se NÃO está no bottom
            const container = containerChat.current;
            const isAtBottom = container ? Math.abs(container.scrollTop) < 100 : false;

            if (!isAtBottom && lastActivity.from?.type === 'user') {
                // Nova mensagem chegou e não está no bottom -> mostra botão
                setShowScrollButton(true);
                setUnreadMessagesCount((prev) => prev + 1);
            } else if (isAtBottom) {
                // Está no bottom, apenas atualiza o último visto
                setLastSeenActivityId(lastActivityId);
            }
        }

        if (!lastSeenActivityId && activitiesArray.length > 0) {
            setLastSeenActivityId(lastActivityId);
        }
    }, [activities, lastSeenActivityId]);

    useEffect(() => {
        setShowScrollButton(false);
        setUnreadMessagesCount(0);
        setLastSeenActivityId(null);
    }, [conversationSelected._id]);

    UseWindowEvent(
        'setIsFocusOnReplyEvent',
        (event) => {
            setIsFocusOnReply(event.detail.onFocus);
        },
        []
    );

    const [cannotGetActivities, setCannotGetActivities] = useState<{
        retried: boolean;
        error: boolean;
    }>({ retried: false, error: false });

    const [failedMessages, setFailedMessages] = useState<{ [key: string]: any }>({});

    const scrollActivityRef: any = useRef(null);
    scrollActivityRef.current = {
        scrollActivity,
        setScrollActivity,
    };

    const timeOutRef: any = useRef(null);

    const activitiesRef: any = useRef(null);
    activitiesRef.current = {
        activities,
        setActivities,
    };

    const conversationSelectedRef: any = useRef(null);
    conversationSelectedRef.current = {
        conversationSelected,
        setConversationSelected,
    };

    const clearImageSettings = () => {
        localStorage.removeItem('imageSettings');
    };

    const canViewConversationRef: any = useRef(null);
    canViewConversationRef.current = {
        canViewConversation,
        setCanViewConversation,
    };

    useEffect(() => {
        handleCustomEvents();
        setFilePreview(false);

        return () => {
            window.removeEventListener('scrollActivity', setScrollActivityEvent);
        };
    }, []);

    const setScrollActivityEvent = function (e: any) {
        const { setScrollActivity } = scrollActivityRef.current;
        setScrollActivity(e.detail);
    };

    const handleCustomEvents = () => {
        window.addEventListener('scrollActivity', setScrollActivityEvent);
    };

    useEffect(() => {
        const { setConversationSelected } = conversationSelectedRef.current;
        setConversationSelected({ ...conversation });
        clearImageSettings();
    }, [conversation]);

    const ackAndHashActivity = async (message: IActivityAckAndHash) => {
        const { ack, activityId, hash } = message;
        const { activities, setActivities } = activitiesRef.current;

        if (!activities.hasOwnProperty(activityId)) {
            return;
        }

        activities[activityId] = {
            ...activities[activityId],
            hash,
            ack,
        };

        setActivities({ ...activities });
    };

    const ackActivity = (message: IActivityAck) => {
        const { ack, hash: hashes, conversationId } = message;
        const { activities, setActivities } = activitiesRef.current;
        const { conversationSelected } = conversationSelectedRef.current;

        if (conversationSelected._id !== conversationId) {
            return;
        }

        try {
            hashes.forEach((hash: string) => {
                Object.values(activities).forEach((activity: any) => {
                    if (activity.hash === hash && ack > (activity.ack ?? 0)) {
                        activities[activity._id] = {
                            ...activity,
                            ack,
                        };
                    }
                });
            });

            setActivities({ ...activities });
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const handleConversationUpdate = (updatedData: Partial<Conversation>) => {
        const newConversationState = { ...conversationSelected, ...updatedData };
        setConversationSelected(newConversationState);

        if (onUpdatedConversationSelected) {
            onUpdatedConversationSelected(newConversationState);
        }
    };

    const addActivityFromSocket = (data: any) => {
        const { activity, conversation: conversationFromSocket } = data;

        const currentLocalConversation = conversationSelectedRef.current.conversationSelected;

        if (currentLocalConversation?._id === activity.conversationId) {
            setRefActivity(activity);

            if (conversationFromSocket) {
                const newCompleteConversation = {
                    ...currentLocalConversation,
                    ...conversationFromSocket,
                };

                onUpdatedConversationSelected(newCompleteConversation);

                setConversationSelected(newCompleteConversation);
            }
        }
    };

    const updateWhatsAppExpiration = ({ whatsappExpiration, conversationId }: any) => {
        const { conversationSelected, setConversationSelected } = conversationSelectedRef.current;
        if (conversationSelected._id !== conversationId) {
            return;
        }

        try {
            const selectedConversationToUpdate = {
                ...conversationSelected,
                whatsappExpiration: whatsappExpiration,
            };

            setConversationSelected({ ...selectedConversationToUpdate });
            return onUpdatedConversationSelected(selectedConversationToUpdate);
        } catch (error) {
            dispatchSentryError(error);
        }
    };

    const initSocket = () => {
        if (socketConnection) {
            socketConnection.on('events', chatContainerListener);
        }
    };

    const chatContainerListener = (event: KissbotSocket) => {
        receiveEvent(event);
    };

    useEffect(() => {
        initSocket();

        return () => {
            socketConnection?.removeListener('events', chatContainerListener);
        };
    }, [socketConnection]);

    const createActivity = async (activity: any) => {
        let error: any;

        await LiveAgentService.sendNewActivity(
            workspaceId as string,
            conversationSelected._id,
            activity,
            (err: any) => {
                error = err;
            }
        );

        if (error !== undefined) {
            setFailedMessages((prevState) => ({
                ...prevState,
                [activity.uuid]: activity,
            }));
        }

        return !error;
    };

    const activityRetry = (activityId: string) => {
        const activity = failedMessages[activityId];

        setFailedMessages((prevState) => ({
            ...prevState,
            [activityId]: undefined,
        }));

        if (!!activity) {
            return createActivity(activity);
        }

        return notification({
            title: getTranslation('Error'),
            message: getTranslation('There was an error while trying to resend the message'),
            type: 'danger',
            duration: 3000,
        });
    };

    const setRefActivity = (activity: any) => {
        const { activities, setActivities } = activitiesRef.current;

        if (activity.uuid && !activity._id) {
            return setActivities({
                ...activities,
                [activity.uuid]: activity,
            });
        }

        delete activities[activity.uuid];

        activity = omit(
            {
                ...activity,
                pending: false,
            },
            'uuid'
        );

        return setActivities({
            ...activities,
            [activity._id]: activity,
        });
    };

    const getOrderedActivities = (activities: IActivity[]) => orderBy(activities, 'timestamp', 'desc');

    const containerChat = useRef<any>(null);
    const unreadMessageRef = useRef<any>(null);

    const viewConversation = async () => {
        const { conversationSelected } = conversationSelectedRef.current;

        if (conversationSelected) {
            workspaceId &&
                (await LiveAgentService.viewConversation(
                    workspaceId,
                    conversationSelected._id,
                    loggedUser._id as string,
                    true
                ));
        }
    };

    const scrollToBottom = () => {
        !!endBlock && endBlock.current && endBlock.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
    };

    const scrollToUnread = () => {
        !!unreadMessageRef &&
            unreadMessageRef.current &&
            unreadMessageRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    };

    useEffect(() => {
        setActivitiesLengthStart(Object.values(activities).length);
        timeout(() => {
            !!unreadMessageRef && !!unreadMessageRef.current && scrollToUnread();

            const assumeButton = document.getElementById('assumeButton');
            !!assumeButton && assumeButton.focus();
        }, 0);
    }, []);

    useEffect(() => {
        if (activitiesLengthStart !== -1 && Object.values(activities).length > activitiesLengthStart)
            timeout(scrollToBottom, 500);
    }, [activities.length]);

    const [filePreview, setFilePreview] = useState<any>(false);
    const [modalImage, setModalImage] = useState<{
        fileAttachment: FileAttachment | undefined;
        opened: boolean;
    }>({
        fileAttachment: undefined,
        opened: false,
    });

    let fetchTries = 0;

    const fetchConversationActivities = async () => {
        const { conversationSelected } = conversationSelectedRef.current;
        const { setActivities } = activitiesRef.current;

        if (workspaceId && conversationSelected?._id) {
            try {
                let error: any;

                const response = await LiveAgentService.getUniqueConversation(
                    conversationSelected._id,
                    workspaceId,
                    (err: any) => {
                        error = err;
                    }
                );

                if (error === undefined) {
                    const { activities } = response;

                    const newActivities = (activities || ([] as any[])).reduce((prev, curr) => {
                        prev[curr._id] = { ...curr };
                        return prev;
                    }, {});

                    setCannotGetActivities({
                        retried: false,
                        error: false,
                    });

                    setFetchedConversation(true);

                    setLoadingActivities(false);
                    setActivities({
                        ...newActivities,
                        ...failedMessages,
                    });
                    const { conversationSelected, setConversationSelected } = conversationSelectedRef.current;
                    if (conversationSelected?._id === response?._id) {
                        setConversationSelected({ ...conversationSelected, ...response });
                        forceUpdateConversationInList(response);
                    }
                } else {
                    if (cannotGetActivities.error && error !== undefined) {
                        setCannotGetActivities((prevState) => ({
                            ...prevState,
                            retried: true,
                        }));

                        return timeout(() => setLoadingActivities(false), 1000);
                    } else if (error !== undefined && fetchTries < 2) {
                        return timeout(() => {
                            fetchConversationActivities();
                            fetchTries = fetchTries + 1;
                        }, 1000);
                    } else if (fetchTries === 2) {
                        setActivities({});
                        setCannotGetActivities((prevState) => ({
                            ...prevState,
                            error: true,
                        }));
                        setLoadingActivities(false);
                    }
                }
            } catch (e) {
                console.log('Error on fetchConversationActivities', e);
            }
        }
    };

    useEffect(() => {
        const { scrollActivity } = scrollActivityRef.current;

        if (Object.values(activities).length > 0 && !!scrollActivity) {
            scrollIntoActivity();
        }
    }, [activities, scrollActivity, activities.length]);

    const scrollIntoActivity = () => {
        const { scrollActivity } = scrollActivityRef.current;
        const { conversationSelected } = conversationSelectedRef.current;

        if (scrollActivity?.conversationId === conversationSelected._id) {
            scrollToActivityHash(scrollActivity.activityHash);
        }
    };

    const scrollToActivityHash = (hash: string) => {
        const activityCard = document.getElementById(hash);

        if (!!activityCard) {
            activityCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            focusElement(activityCard);
        }

        setScrollActivity(undefined);
    };

    const focusElement = (element: any) => {
        timeout(() => element.classList.add('activity-focus'), 350);
        timeout(() => unFocusElement(element), 1400);
    };

    const unFocusElement = (element: any) => {
        element.classList.remove('activity-focus');
    };

    useEffect(() => {
        if (window.self !== window.top) return;

        conversation?._id && viewConversation();
    }, [conversation._id]);

    useEffect(() => {
        validateTeamPermissionViewActivities();
    }, [
        conversation._id,
        conversation.state,
        conversation.assignedToTeamId,
        conversation.assumed,
        conversation.members,
    ]);

    const validateTeamPermissionViewActivities = () => {
        const canAcessConversation =
            readingMode ||
            validateCanViewConversation({
                conversation,
                loggedUser,
                workspaceId,
                teams,
            });

        setCanViewConversation(canAcessConversation);
        if (canAcessConversation && !fetchedConversation) {
            return fetchConversationActivities();
        }
    };

    const handleFileChange = async (files: FileList | File, template?: TemplateMessage) => {
        // Suporta tanto File único quanto FileList (múltiplos)
        const fileArray = files instanceof FileList ? Array.from(files) : [files];

        // máximo 5 arquivos
        if (fileArray.length > 5) {
            return notification({
                title: getTranslation('Error'),
                message: getTranslation('You can select up to 5 files at once'),
                type: 'danger',
                duration: 3000,
            });
        }

        if (template && template?.type === TemplateType.file) {
            // Lógica existente para templates - mantém apenas 1 arquivo
            const fileReader = new FileReader();
            fileReader.readAsDataURL(fileArray[0]);

            fileReader.onload = () => {
                setFilePreview([
                    {
                        id: generateId(10),
                        file: fileArray[0],
                        template,
                        preview: fileReader.result,
                        isImage: AttachmentService.isImageFile(template?.fileContentType || ''),
                        isPdf: template?.fileContentType === uploadFileTypes.pdf,
                        isVideo: AttachmentService.isVideoFile(template?.fileContentType || ''),
                    },
                ]);
            };
            return;
        }

        const maxSizeMB = 10;
        const invalidFiles: string[] = [];

        const imageTypeValidation = (file: File) => {
            if (AttachmentService.isImageFile(file.type)) {
                const validTypes = [
                    'image/jpg',
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'image/svg+xml',
                    'image/svg',
                    'image/x-icon',
                    'image/x-wmf',
                    'image/x-emf',
                ];
                return validTypes.includes(file.type);
            }
            return true;
        };

        // Processar todos os arquivos em paralelo
        const filePromises = fileArray.map((file) => {
            return new Promise<FilePreviewItem | null>((resolve) => {
                const isValidSize = file.size <= maxSizeMB * 1000000;

                if (!isValidSize) {
                    invalidFiles.push(`${file.name} (excede 10MB)`);
                    resolve(null);
                    return;
                }

                if (!imageTypeValidation(file)) {
                    invalidFiles.push(`${file.name} (formato inválido)`);
                    resolve(null);
                    return;
                }

                // Processar preview do arquivo
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    resolve({
                        id: generateId(10),
                        file,
                        preview: fileReader.result,
                        isImage: AttachmentService.isImageFile(file.type),
                        isPdf: file.type === uploadFileTypes.pdf,
                        isVideo: AttachmentService.isVideoFile(file.type),
                    });
                };
                fileReader.onerror = () => {
                    invalidFiles.push(`${file.name} (erro ao ler)`);
                    resolve(null);
                };
                fileReader.readAsDataURL(file);
            });
        });

        // Aguardar todos os arquivos serem processados
        const results = await Promise.all(filePromises);
        const validResults = results.filter((item): item is FilePreviewItem => item !== null);

        // notificações de arquivos inválidos
        if (invalidFiles.length > 0) {
            notification({
                title: getTranslation('Error'),
                message: getTranslation('Some files could not be added') + ': ' + invalidFiles.join(', '),
                type: 'danger',
                duration: 5000,
            });
        }

        // Atualizar preview com arquivos válidos
        if (validResults.length > 0) {
            setFilePreview(validResults);
        }
    };

    const retryActivities = () => {
        fetchConversationActivities();
    };

    const openImage = (activity: any) => {
        const { attachmentFile, from, timestamp } = activity;
        if (!attachmentFile) {
            return;
        }

        // Primeiro, tenta encontrar o arquivo na lista de fileAttachments do conversation
        let fileAttachment = conversation?.fileAttachments?.find((file) => file._id === attachmentFile?.id);

        // Se não encontrar, cria um temporário (fallback)
        if (!fileAttachment) {
            fileAttachment = {
                mimeType: attachmentFile.contentType,
                name: attachmentFile.name,
                memberId: from.id,
                _id: attachmentFile?.id || activity._id,
                timestamp,
            };
        }

        setModalImage({
            fileAttachment,
            opened: true,
        });
    };

    const sendActivity = async (activity: any) => {
        setRefActivity(activity);
        const created = await createActivity(activity);

        if (created) {
            setMessageStorage({ value: '' });
            timeout(scrollToBottom, 500);
        }
    };

    const groupMessagesByDay = () => {
        const activitiesFiltered: any[] = Object.values(activitiesRef.current.activities)?.filter(
            (currAct: any) => !currAct?.data?.reactionHash
        );
        return groupBy<IActivity>(orderBy(activitiesFiltered, 'timestamp', 'desc'), (activity: IActivity) => {
            return moment(activity.timestamp).startOf('day').format('L');
        });
    };

    const setMessageStorage = ({ value }) => {
        try {
            const saved = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES);

            if (saved && typeof saved === 'string') {
                const parsed = JSON.parse(saved);

                if (value && value !== '') parsed[conversation._id] = value;
                else delete parsed[conversation._id];

                localStorage.setItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES, JSON.stringify(parsed));
            } else if (value && value !== '') {
                localStorage.setItem(
                    Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES,
                    JSON.stringify({
                        [conversation._id]: value,
                    })
                );
            }
        } catch (error) {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES);
        }
    };

    const scrollToActivity = (activityHash: string) => {
        scrollToActivityHash(activityHash);
    };

    const forceUpdateConversation = () => {
        if (!conversation._id) {
            return;
        }
        const event = new CustomEvent('@force_update_conversation', {
            detail: {
                conversationId: conversation._id,
            },
        });
        window.dispatchEvent(event);
    };

    const forceUpdateConversationInList = (conversation) => {
        if (!conversation._id) {
            return;
        }
        const event = new CustomEvent('@force_update_conversation_list', {
            detail: {
                conversation: conversation,
            },
        });
        window.dispatchEvent(event);
    };

    const groupedMessages = groupMessagesByDay();
    const currentConversation = conversationSelectedRef.current.conversationSelected;

    const dateFixedTop = () => {
        const chatContainer = containerChat.current;

        const dates = Object.keys(groupedMessages);
        const list = dates.reverse().filter((day) => {
            const dateId = document.getElementById(`${conversation._id}:date${day}`);
            const floatDateId = document.getElementById(`${conversation._id}:date${day}sombra`);

            if (dateId && floatDateId) {
                if (dateId.getBoundingClientRect().y <= 70) {
                    return day;
                } else {
                    floatDateId.style.visibility = 'hidden';
                }
            }
        });

        if (list.length === 0) return;

        list.forEach((day, index) => {
            const dateId = document.getElementById(`${conversation._id}:date${day}`);
            const floatDateId = document.getElementById(`${conversation._id}:date${day}sombra`);

            if (dateId && floatDateId) {
                if (index === list.length - 1) {
                    floatDateId.style.left = `${chatContainer.getBoundingClientRect().width / 2 - 47}px`;
                    floatDateId.style.visibility = 'visible';

                    if (timeOutRef.current) {
                        clearTimeout(timeOutRef.current);
                        timeOutRef.current = setTimeout(() => {
                            floatDateId.style.visibility = 'hidden';
                        }, 4000);
                        return;
                    }
                    timeOutRef.current = setTimeout(() => {
                        floatDateId.style.visibility = 'hidden';
                    }, 4000);
                } else {
                    floatDateId.style.visibility = 'hidden';
                }
            }
        });
    };

    const events = {
        [KissbotSocketType.ACTIVITY]: addActivityFromSocket,
        [KissbotSocketType.ACTIVITY_ACK]: ackActivity,
        [KissbotSocketType.UPDATE_ACTIVITY_ACK_AND_HASH]: ackAndHashActivity,
        [KissbotSocketType.CONVERSATION_WHATSAPP_EXPIRATION_UPDATED]: updateWhatsAppExpiration,
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
            const { canViewConversation } = canViewConversationRef.current;

            if (events[event.type] && canViewConversation) {
                queueEvents.push(event);
                if (!queueLock) {
                    queueLock = true;
                    processEvent();
                }
            }
        },
        [events]
    );

    const activitiesReaction = useMemo<ActivityReaction[]>(
        () =>
            Object.values(activities)
                .filter((currActv) => !!currActv?.quoted && !!currActv?.data?.reactionHash)
                .reverse()
                .map((activity) => ({
                    emoji: activity.text,
                    reactionHash: activity.data?.reactionHash,
                    fromType: activity.from.type,
                    fromName: activity.from.name,
                })),
        [activities]
    );

    return (
        <Wrapper height='100%' width='100%' flexBox key='liveAgentChatContainerWrapper'>
            <Wrapper height='100%' width='100%' flexBox flex column position='relative'>
                <ChatContainerHeader
                    channels={channelList}
                    disabled={!canViewConversationRef.current.canViewConversation}
                    conversation={currentConversation}
                    loggedUser={loggedUser}
                    workspaceId={workspaceId}
                    notification={notification}
                    readingMode={readingMode}
                    teams={teams}
                    groupedMessages={groupedMessages}
                    onUpdatedConversationSelected={handleConversationUpdate}
                />
                <Background position='absolute' top='0' left='0' width='100%' height='100%' />
                {loadingActivities ? (
                    <Wrapper
                        className='chatContainerBody'
                        flexBox
                        position='relative'
                        justifyContent='center'
                        alignItems='center'
                    >
                        <img
                            alt='loading'
                            src='assets/img/loading.gif'
                            style={{
                                height: '50px',
                            }}
                        />
                    </Wrapper>
                ) : (
                    <Body className={`chatContainerBody`}>
                        <DragDropZone
                            onDrop={handleFileChange}
                            disabled={readingMode || !conversationSelected.assumed}
                            maxFiles={5}
                        />
                        {!!filePreview && (
                            <FilePreview
                                replayActivity={replayActivity || ({} as IActivity)}
                                isFocusOnReply={isFocusOnReply}
                                setIsFocusOnReply={setIsFocusOnReply}
                                conversation={conversationSelected}
                                filePreview={filePreview}
                                notification={notification}
                                setFilePreview={setFilePreview}
                                loggedUser={loggedUser}
                                workspaceId={workspaceId as string}
                                channels={channelList}
                                teams={teams}
                            />
                        )}

                        <div
                            onScroll={dateFixedTop}
                            id={'container-chat'}
                            ref={containerChat}
                            style={{
                                display: 'flex',
                                height: '100%',
                                flex: 1,
                                overflow: 'auto',
                                flexDirection: 'column-reverse',
                                padding: '0 20px 0 20px',
                            }}
                        >
                            <div ref={endBlock} />

                            {canViewConversation &&
                                Object.keys(groupedMessages).map((day) => {
                                    const activities = Object.values(groupedMessages[day]);
                                    const userActivity = activities?.find((act) => act.from?.type === 'user');

                                    const userName: string = userActivity
                                        ? userActivity.from.name ?? 'Usuário desconhecido'
                                        : 'Usuário desconhecido';

                                    return (
                                        <PlainWrapper key={day}>
                                            {getOrderedActivities(activities).map((activity, index) => {
                                                let quotedActivity: IActivity | undefined;
                                                let lastUserReaction: string | undefined;
                                                let lastAgentReaction: string | undefined;

                                                if (activity.quoted) {
                                                    quotedActivity = activities.find(
                                                        (currActivity) => currActivity.hash === activity.quoted
                                                    );
                                                }

                                                const matchingReactions = activitiesReaction
                                                    .filter(
                                                        (currActReaction) =>
                                                            currActReaction.reactionHash === activity.hash
                                                    )
                                                    .reverse();

                                                matchingReactions.forEach((reaction) => {
                                                    if (reaction?.reactionHash) {
                                                        if (reaction.fromType === IdentityType.user) {
                                                            lastUserReaction = `${reaction.fromName}, emoji: ${reaction.emoji}`;
                                                        } else if (reaction.fromType === IdentityType.agent) {
                                                            lastAgentReaction = `${reaction.fromName}, emoji: ${reaction.emoji}`;
                                                        }
                                                    }
                                                });

                                                const reactions: string[] = [];
                                                if (lastUserReaction) reactions.push(`user: ${lastUserReaction}`);
                                                if (lastAgentReaction) reactions.push(`agent: ${lastAgentReaction}`);

                                                return (
                                                    <Wrapper>
                                                        <Activity
                                                            sendReplayActivity={HandleReplayActivity}
                                                            onReply={handleReply}
                                                            key={activity._id || activity.hash}
                                                            teams={teams}
                                                            activity={activity}
                                                            conversation={currentConversation}
                                                            loggedUser={loggedUser}
                                                            openImage={openImage}
                                                            nextActivity={Object.values(activities)[index - 1]}
                                                            failedMessages={failedMessages}
                                                            activityRetry={activityRetry}
                                                            quotedActivity={quotedActivity}
                                                            reactionText={reactions}
                                                            scrollToActivity={scrollToActivity}
                                                        />
                                                    </Wrapper>
                                                );
                                            })}
                                            <Wrapper
                                                id={`${conversation._id}:date${day}`}
                                                flexBox
                                                padding='7px 9px'
                                                margin='5px auto 10px auto'
                                                color='#444'
                                                fontSize='12px'
                                                bgcolor='#e1f4fb'
                                                borderRadius='6px'
                                                boxShadow='5px 5px 5px -5px rgba(0,0,0,0.4)'
                                                justifyContent='center'
                                            >
                                                {day}
                                            </Wrapper>
                                            <Wrapper
                                                id={`${conversation._id}:date${day}sombra`}
                                                padding='7px 9px'
                                                margin='5px auto 10px auto'
                                                color='#444'
                                                fontSize='12px'
                                                bgcolor='#e1f4fb'
                                                borderRadius='6px'
                                                boxShadow='5px 5px 5px -5px rgba(0,0,0,0.4)'
                                                position='absolute'
                                                top='65px'
                                                left='45%'
                                                visibility='hidden'
                                                style={{ zIndex: '5' }}
                                            >
                                                {day}
                                            </Wrapper>
                                        </PlainWrapper>
                                    );
                                })}
                            {cannotGetActivities.error && (
                                <Wrapper>
                                    <Wrapper
                                        margin='0 auto'
                                        maxWidth='50%'
                                        fontWeight='500'
                                        color='#000'
                                        style={{
                                            zIndex: 2,
                                        }}
                                    >
                                        <Wrapper flexBox justifyContent='center'>
                                            <img
                                                alt=''
                                                src={`assets/img/not_found.svg`}
                                                style={{ height: '140px', opacity: 0.9 }}
                                            />
                                        </Wrapper>
                                        <Wrapper
                                            padding='9px'
                                            bgcolor='#FFF'
                                            borderRadius='10px'
                                            color={getColor(ColorType.text, ColorVariation.dark)}
                                            margin='30px 0'
                                        >
                                            <Wrapper color='#555'>
                                                <Wrapper textAlign='center' flexBox justifyContent='center'>
                                                    {`${getTranslation('There was an error loading messages')}.`}
                                                </Wrapper>
                                                <Wrapper
                                                    margin='9px 0 0 0'
                                                    textAlign='center'
                                                    flexBox
                                                    color={!cannotGetActivities.retried ? '#555' : '#f13d3d'}
                                                    justifyContent='center'
                                                >
                                                    {!cannotGetActivities.retried
                                                        ? `${getTranslation('Try again')}.`
                                                        : `${getTranslation('Try again later')}.`}
                                                </Wrapper>
                                            </Wrapper>
                                            <Icon
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                }}
                                                name='reload'
                                                size='24px'
                                                title={getTranslation('Load messages')}
                                                onClick={() => retryActivities()}
                                            />
                                        </Wrapper>
                                    </Wrapper>
                                </Wrapper>
                            )}

                            {canViewConversation === false && (
                                <Wrapper
                                    margin='0 auto'
                                    maxWidth='50%'
                                    fontWeight='500'
                                    color='#000'
                                    style={{
                                        zIndex: 2,
                                    }}
                                >
                                    <Wrapper flexBox justifyContent='center'>
                                        <img
                                            alt=''
                                            src={`assets/img/authentication.svg`}
                                            style={{ height: '140px', opacity: 0.9 }}
                                        />
                                    </Wrapper>
                                    <Wrapper
                                        padding='9px'
                                        bgcolor='#FFF'
                                        borderRadius='10px'
                                        color={getColor(ColorType.text, ColorVariation.dark)}
                                        margin='30px 0'
                                    >
                                        <Wrapper color='#555'>
                                            <Wrapper textAlign='center' flexBox justifyContent='center'>
                                                {`${getTranslation('Start attendance to view messages')}.`}
                                            </Wrapper>
                                        </Wrapper>
                                    </Wrapper>
                                </Wrapper>
                            )}
                        </div>

                        <ScrollToBottomButton
                            visible={showScrollButton}
                            onClick={scrollToBottomNewMessages}
                            unreadCount={unreadMessagesCount}
                        />
                    </Body>
                )}

                {conversation.state === 'closed' && conversation?.invalidNumber && (
                    <Wrapper
                        padding='5px 10px'
                        borderRadius='5px'
                        bgcolor={'#ff6969'}
                        margin='4px auto 30px auto'
                        style={{ zIndex: 10 }}
                        color='#fff'
                        justifyContent='center'
                        fontWeight='600'
                        textAlign='center'
                        maxWidth='540px'
                        fontSize='13px'
                        flexDirection='column'
                        flexBox
                    >
                        {
                            <>
                                {getTranslation(
                                    'This number may not have a WhatsApp account. Please check that the number is correct or see our article for more details on sending errors.'
                                )}
                                <Row justify={'center'}>
                                    <HelpCenterLink
                                        text={getTranslation('Click here for more details')}
                                        textStyle={{ color: '#fff', textDecoration: 'underline' }}
                                        article={
                                            '69000869594-mudanca-na-forma-de-validar-o-número-do-contato-do-paciente-em-novo-atendimento-'
                                        }
                                        style={{ color: '#fff' }}
                                    />
                                </Row>
                            </>
                        }
                    </Wrapper>
                )}

                <ChatContainerMessage
                    replayActivity={replayActivity || ({} as IActivity)}
                    scrollToActivity={scrollToActivity}
                    isFocusOnReply={isFocusOnReply}
                    setIsFocusOnReply={setIsFocusOnReply}
                    setMessageStorage={setMessageStorage}
                    loggedUser={loggedUser}
                    readingMode={readingMode}
                    workspaceId={workspaceId}
                    conversation={currentConversation}
                    sendActivity={sendActivity}
                    onChangeInputFile={handleFileChange}
                    teams={teams}
                    channels={channelList}
                    forceUpdateConversation={forceUpdateConversation}
                    onUpdatedConversationSelected={handleConversationUpdate}
                />
            </Wrapper>
            {modalImage.opened && (
                <PreviewImage
                    modalImage={modalImage}
                    closeModal={() =>
                        setModalImage({
                            opened: false,
                            fileAttachment: undefined,
                        })
                    }
                    conversation={conversationSelected}
                />
            )}
        </Wrapper>
    );
};

export const ChatContainer = I18n(ChatContainerComponent) as FC<ChatContainerProps>;
