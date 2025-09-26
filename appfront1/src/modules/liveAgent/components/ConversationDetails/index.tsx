import { ActivityType, IdentityType, KissbotSocket, KissbotSocketType } from 'kissbot-core';
import merge from 'lodash/merge';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { validateCanViewConversation } from '../../../../model/Team';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { dispatchSentryError } from '../../../../utils/Sentry';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { useContactContext } from '../../context/contact.context';
import { Contact } from '../../interfaces/contact.interface';
import { FileAttachment } from '../../interfaces/conversation.interface';
import { ContactService } from '../../service/Contact.service';
import { LiveAgentService } from '../../service/LiveAgent.service';
import { ConversationCardData } from '../ConversationCard/props';
import PreviewImage from '../PreviewImage';
import ContactInfo from './components/ContactInfo';
import ConversationInfo from './components/ConversationInfo';
import MenuIconLateral from './components/MenuIconLateral';
import { ConversationDetailsProps } from './props';
import { useRemiOptimistic } from '../../context/RemiOptimisticContext';

const eventsToUpdateMember = [
    ActivityType.member_added,
    ActivityType.member_connected,
    ActivityType.member_disconnected,
    ActivityType.member_exit,
    ActivityType.member_reconnected,
    ActivityType.member_removed,
];

interface MenuOption {
    label: string;
    value: string;
    icon: string;
    component: Function;
}

const Container = styled(Wrapper)`
    &.disabled {
        pointer-events: none;
        opacity: 0.7;
    }

    @media screen and (max-width: 1400px) {
        max-width: 275px;
        min-width: 275px;
    }
`;

const ConversationDetailsComponent: FC<ConversationDetailsProps & I18nProps> = ({
    selectedConversation,
    onConversationSelected,
    workspaceId,
    notification,
    getTranslation,
    readingMode,
    loggedUser,
    socketConnection,
    channelList,
    teams,
}) => {
    const { setOptimisticStatus } = useRemiOptimistic();
    const menuList: MenuOption[] = useMemo(
        () => [
            {
                label: getTranslation('Conversation details'),
                value: 'conversationInfo',
                icon: 'message-text',
                component: ConversationInfo,
            },
            {
                label: getTranslation('Contact details'),
                value: 'contactInfo',
                icon: 'account',
                component: ContactInfo,
            },
        ],
        [getTranslation]
    );

    const { setContactSelected, contactSelected } = useContactContext();
    const [viewSelected, setViewSelected] = useState<MenuOption>(menuList[0]);
    const [modalImage, setModalImage] = useState<{
        fileAttachment: FileAttachment | undefined;
        opened: boolean;
    }>({
        fileAttachment: undefined,
        opened: false,
    });
    const [conversation, setConversation] = useState<ConversationCardData>(selectedConversation);
    const [canViewConversation, setCanViewConversation] = useState<boolean | undefined>(undefined);

    const validateTeamPermissionViewActivities = useCallback(() => {
        const canAcessConversation = validateCanViewConversation({
            conversation,
            loggedUser,
            workspaceId,
            teams,
        });

        setCanViewConversation(canAcessConversation);

        if (!canAcessConversation) {
            return setViewSelected(menuList[0]);
        }
    }, [conversation, loggedUser, menuList, teams, workspaceId]);

    const updateAttributes = useCallback(({ conversationId, attributes }: any) => {
        setConversation((currentState) => {
            if (conversationId !== currentState._id) {
                return currentState;
            }

            return {
                ...currentState,
                attributes,
            };
        });
    }, []);

    const findContactInMember = useCallback(() => {
        const user =
            selectedConversation && selectedConversation.members.find((member) => member.type === IdentityType.user);
        let contactId = user.contactId || undefined;
        // condição feita porque pode chegar um evento com membro sem id depois de já ter setado um contato
        // task # 1754
        if (contactSelected && contactSelected.phone === user.phone && !contactId) {
            contactId = contactSelected._id;
        }

        return contactId;
    }, [contactSelected, selectedConversation]);

    const findContact = useCallback(async () => {
        const contactId = findContactInMember();

        if (!contactId) {
            setContactSelected(undefined);
            return;
        }

        if (contactSelected && contactSelected._id === contactId) {
            return;
        }

        try {
            const contact = await ContactService.getContact(contactId, workspaceId);

            if (contact) {
                setContactSelected(contact);
                return;
            }

            return setContactSelected(undefined);
        } catch (error) {
            setContactSelected(undefined);
            dispatchSentryError(error);
            return;
        }
    }, [contactSelected, findContactInMember, setContactSelected, workspaceId]);

    const updateConversation = useCallback((receivedConversation: any) => {
        setConversation((currentValue) => {
            if (receivedConversation._id !== currentValue._id) return currentValue;

            if (!receivedConversation?.fileAttachments?.length) {
                delete receivedConversation.fileAttachments;
            }

            if (!receivedConversation?.attributes?.length) {
                delete receivedConversation.attributes;
            }

            return {
                ...merge(currentValue, receivedConversation),
            };
        });
    }, []);

    const updateMembers = useCallback(({ _id: conversationId, members }: any) => {
        setConversation((currentValue) => {
            if (conversationId._id !== currentValue._id) return currentValue;

            return {
                ...currentValue,
                members,
            };
        });
    }, []);

    const updateTags = useCallback(({ conversationId, tags }: any) => {
        setConversation((currentValue) => {
            if (conversationId !== currentValue._id) return currentValue;

            return {
                ...currentValue,
                tags,
            };
        });
    }, []);

    const updateConversationFromActivity = useCallback((activity: any, receivedConversation: any) => {
        setConversation((currentValue) => {
            let currentConversation: ConversationCardData = { ...currentValue };

            if (receivedConversation._id !== currentValue._id) return currentValue;

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
                        currentConversation.fileAttachments?.findIndex(
                            (attachment) => attachment._id === fileAttachment._id
                        ) === -1
                    ) {
                        currentConversation.fileAttachments?.push(fileAttachment);
                    }
                    break;
                }

                case ActivityType.member_removed_by_admin: {
                    currentConversation.members = [...receivedConversation.members];
                    break;
                }

                case ActivityType.assigned_to_team: {
                    currentConversation.assignedToTeamId = receivedConversation.assignedToTeamId;
                    break;
                }

                case ActivityType.end_conversation: {
                    currentConversation.state = receivedConversation.state;
                    break;
                }

                default:
                    break;
            }

            if (eventsToUpdateMember.includes(activity.type)) {
                const memberIndex = currentConversation.members?.findIndex((member) => member.id === activity.from.id);

                if (memberIndex > -1) {
                    currentConversation.members = currentConversation.members.map((member) => {
                        if (member.id === activity?.from.id) {
                            return activity.from;
                        }
                        return member;
                    });
                } else {
                    currentConversation.members = [...currentConversation.members, activity.from];
                }
            }

            return { ...currentConversation };
        });
    }, []);

    const handleConversationSelected = async (conversationId: string) => {
        let error;
        const conversation = await LiveAgentService.getUniqueConversation(conversationId, workspaceId, (err) => {
            error = err;
        });

        if (conversation) {
            const tranformedConversation = LiveAgentService.transformConversations([conversation], loggedUser);
            return onConversationSelected(tranformedConversation?.[conversationId]);
        }

        if (error && error.statusCode === 401) {
            return notification({
                title: getTranslation('Error'),
                message: `${getTranslation('You do not have permission to access this conversation!')}`,
                type: 'danger',
                duration: 4000,
            });
        }
        return notification({
            type: 'danger',
            duration: 5000,
            title: getTranslation('Error'),
            message: getTranslation('The conversation could not be loaded. Try again'),
        });
    };

    const updateCurrentContact = (contact: Contact) => {
        setContactSelected({ ...contactSelected, ...contact });
    };

    const receiveEvent = useCallback(
        (event: KissbotSocket) => {
            const { type, message } = event;
            const { activity, conversation: receivedConversation } = message;
            setOptimisticStatus(receivedConversation?._id, {
                isWithSmtRe: receivedConversation?.isWithSmtRe,
                smtReId: receivedConversation?.smtReId,
                stoppedSmtReId: receivedConversation?.stoppedSmtReId,
            });

            switch (type) {
                case KissbotSocketType.CONVERSATION_TAGS_UPDATED:
                    updateTags(message);
                    break;

                case KissbotSocketType.CONVERSATION_ATTRIBUTES_UPDATED:
                    updateAttributes(message);
                    break;

                case KissbotSocketType.ACTIVITY:
                    if (receivedConversation) {
                        updateConversationFromActivity(activity, receivedConversation);
                    }
                    break;

                case KissbotSocketType.CONVERSATION_UPDATED:
                    updateConversation(message);
                    break;

                case KissbotSocketType.CONVERSATION_MEMBERS_UPDATED:
                    updateMembers(message);
                    break;

                default:
                    break;
            }
        },
        [
            setOptimisticStatus,
            updateAttributes,
            updateConversation,
            updateConversationFromActivity,
            updateMembers,
            updateTags,
        ]
    );

    const initSocket = useCallback(() => {
        if (socketConnection) {
            socketConnection.on('events', receiveEvent);
        }
    }, [receiveEvent, socketConnection]);

    useEffect(() => {
        // Foi feito esse if para só atualizar os dados da conversa ao clicar em um item diferente da lista
        if (selectedConversation._id !== conversation._id) {
            setConversation({
                ...selectedConversation,
            });
        }
    }, [conversation._id, selectedConversation]);

    useEffect(() => {
        validateTeamPermissionViewActivities();
    }, [validateTeamPermissionViewActivities]);

    useEffect(() => {
        initSocket();

        return () => {
            socketConnection?.removeListener('events', receiveEvent);
        };
    }, [receiveEvent, initSocket, socketConnection]);

    useEffect(() => {
        findContact();
    }, [findContact]);

    const SideModalComponent: Function = viewSelected?.component as Function;

    return (
        <Container
            minWidth='300px'
            maxWidth='300px'
            height='100%'
            bgcolor='#f8f8f8'
            flexBox
            column
            className={!canViewConversation ? 'disabled' : ''}
        >
            {!!modalImage.opened && (
                <PreviewImage
                    modalImage={modalImage}
                    closeModal={() =>
                        setModalImage({
                            opened: false,
                            fileAttachment: undefined,
                        })
                    }
                    conversation={conversation}
                />
            )}

            {viewSelected && (
                <MenuIconLateral
                    options={menuList}
                    onSelectMenu={(viewSelected: MenuOption) => !!canViewConversation && setViewSelected(viewSelected)}
                    selected={viewSelected}
                />
            )}

            {viewSelected && (
                <SideModalComponent
                    conversation={conversation}
                    onOpenConversation={(conversationId: string) => handleConversationSelected(conversationId)}
                    workspaceId={workspaceId}
                    notification={notification}
                    contact={contactSelected}
                    readingMode={readingMode}
                    updateContact={updateCurrentContact}
                    channelList={channelList}
                    conversationDisabled={canViewConversation === false}
                    teams={teams}
                    openImage={(fileAttachment: FileAttachment) => {
                        setModalImage({
                            fileAttachment,
                            opened: true,
                        });
                    }}
                    loggedUser={loggedUser}
                />
            )}
        </Container>
    );
};

export const ConversationDetails = I18n(ConversationDetailsComponent) as FC<ConversationDetailsProps>;
