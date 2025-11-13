import { ChannelIdConfig, ConversationStatus } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { UseWindowEvent, dispatchWindowEvent } from '../../../../hooks/event.hook';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { timeout } from '../../../../utils/Timer';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { useContactContext } from '../../context/contact.context';
import AssumeButton from '../AssumeButton';
import TextareaComment from './components/comment';
import { TextareaReply } from './components/reply';
import { ChatContainerMessageProps } from './props';
import { CommentTypeButton, Footer, MessageTypeButton } from './styled';

const emptyActivity = {
    type: null,
    uuid: null,
    pending: true,
    text: '',
    from: {
        _id: null,
        id: null,
        name: null,
        channelId: ChannelIdConfig.liveagent,
    },
    data: {},
    to: {
        id: null,
    },
    conversationId: null,
    locale: 'pt-BR',
    ack: 0,
} as any;

export enum MessageType {
    reply = 'reply',
    comment = 'comment',
}

export enum ActionTypes {
    emoticons = 'emoticons',
    file = 'file',
    template = 'template',
}

const ChatContainerMessageComponent: FC<ChatContainerMessageProps & I18nProps> = ({
    conversation,
    getTranslation,
    loggedUser,
    readingMode,
    workspaceId,
    sendActivity,
    setMessageStorage,
    teams,
    onChangeInputFile,
    forceUpdateConversation,
    channels,
    onUpdatedConversationSelected,
    isFocusOnReply,
    setIsFocusOnReply,
    replayActivity,
    scrollToActivity,
    onMessageTypeChange,
}) => {
    const { contactSelected } = useContactContext();
    const [messageTypeSelected, setMessageTypeSelected] = useState<MessageType>(MessageType.reply);

    useEffect(() => {
        timeout(focusTextArea, 0);
    }, []);
    useEffect(() => {
        if (onMessageTypeChange) {
            onMessageTypeChange(messageTypeSelected === MessageType.reply ? 'reply' : 'comment');
        }
    }, [messageTypeSelected, onMessageTypeChange]);
    UseWindowEvent(
        'setComponentToActivity',
        (event) => {
            setMessageTypeSelected?.(MessageType.reply);
            setTimeout(() => {
                dispatchWindowEvent('setCommentToActivity', { message: event.detail.message });
            }, 100);
        },
        []
    );

    const focusTextArea = () => {
        timeout(() => {
            const textArea = document.getElementById(`chatContainerTextInput`);
            textArea?.focus();
        }, 10);
    };

    const activityTypeRender = () => {
        switch (messageTypeSelected) {
            case MessageType.reply:
                return {
                    Component: TextareaReply,
                    props: {
                        isFocusOnReply,
                        setIsFocusOnReply: setIsFocusOnReply || (() => {}),
                        replayActivity,
                        scrollToActivity,
                    },
                };

            case MessageType.comment:
                return {
                    Component: TextareaComment,
                };

            default:
                return {
                    Component: null,
                };
        }
    };

    const params = activityTypeRender();
    const { Component: TextArea, props } = params;

    return !readingMode && conversation.state === ConversationStatus.open ? (
        <Footer>
            {
                <AssumeButton
                    conversation={conversation}
                    workspaceTeams={teams}
                    workspaceId={workspaceId as string}
                    loggedUser={loggedUser}
                    focusTextArea={focusTextArea}
                    forceUpdateConversation={forceUpdateConversation}
                    onUpdatedConversationSelected={onUpdatedConversationSelected}
                />
            }
            {!!TextArea ? (
                <TextArea
                    {...props}
                    channels={channels}
                    loggedUser={loggedUser}
                    conversation={conversation}
                    onChangeInputFile={onChangeInputFile}
                    disabled={!conversation.assumed || !!contactSelected?.blockedAt}
                    focusTextArea={focusTextArea}
                    workspaceId={workspaceId as string}
                    emptyActivity={emptyActivity}
                    sendActivity={sendActivity}
                    setMessageStorage={setMessageStorage}
                    teams={teams}
                    setIsFocusOnReply={setIsFocusOnReply || (() => {})}
                    buttonTypes={
                        <Wrapper height='100%' margin='-1px 0 0 0' flexBox>
                            <MessageTypeButton
                                title={getTranslation('Message to user')}
                                onClick={() => {
                                    if (setIsFocusOnReply) setIsFocusOnReply(false);
                                    setMessageTypeSelected && setMessageTypeSelected(MessageType.reply);
                                }}
                                className={messageTypeSelected === MessageType.reply ? 'active' : undefined}
                            >
                                {getTranslation('Message')}
                            </MessageTypeButton>
                            <CommentTypeButton
                                title={`${getTranslation('Annotation')} (${getTranslation('Not sent to user')})`}
                                onClick={() => {
                                    if (setIsFocusOnReply) setIsFocusOnReply(false);
                                    setMessageTypeSelected && setMessageTypeSelected(MessageType.comment);
                                }}
                                className={messageTypeSelected === MessageType.comment ? 'active' : undefined}
                            >
                                {getTranslation('Annotation')}
                            </CommentTypeButton>
                        </Wrapper>
                    }
                />
            ) : null}
        </Footer>
    ) : null;
};

export const ChatContainerMessage = i18n(ChatContainerMessageComponent) as FC<ChatContainerMessageProps>;
