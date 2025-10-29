import { Button, Input, Modal } from 'antd';
import { ChannelIdConfig, IdentityType } from 'kissbot-core';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { Constants } from '../../../../utils/Constants';
import I18n from '../../../i18n/components/i18n';
import { DefaultClosingMessageModalComponentProps } from './interfaces';

const { TextArea } = Input;

const DefaultClosingMessageModalComponent: FC<DefaultClosingMessageModalComponentProps> = (props) => {
    const {
        addNotification,
        opened,
        setOpened,
        getTranslation,
        workspaceId,
        loggedUser,
        closeConversation,
        conversation,
    } = props;

    const [canSendMessage, setCanSendMessage] = useState(false);
    const [savedMessage, setSavedMessage] = useState('');

    useEffect(() => {
        if (!!conversation?.whatsappExpiration && moment().valueOf() >= conversation.whatsappExpiration) {
            return setCanSendMessage(false);
        }
        setCanSendMessage(true);
    }, [conversation.whatsappExpiration]);

    useEffect(() => {
        if (canSendMessage) {
            const message = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.END_CONVERSATION_TEXT) || '';
            if (message) {
                try {
                    // dispatchSentryError(`${workspaceId} - mensagem de finalização`)
                } catch (error) {
                    console.log(error);
                }
            }
            setSavedMessage(message);
        }
    }, [canSendMessage]);

    const handleEndConversation = async () => {
        if (!workspaceId || !loggedUser) return;

        try {
            const message: any = document.getElementById('content-finish-message');
            canSendMessage && localStorage.setItem(Constants.LOCAL_STORAGE_MAP.END_CONVERSATION_TEXT, message.value);

            const result = await closeConversation(message.value);

            if (result?.status === 400) {
                return addNotification({
                    title: getTranslation('Error'),
                    message: getTranslation('Conversation cannot be terminated'),
                    type: 'danger',
                    duration: 3000,
                });
            }
            setOpened(false);
        } catch (error) {
            return addNotification({
                title: getTranslation('Error'),
                message: getTranslation('An error has occurred. Try again'),
                type: 'danger',
                duration: 3000,
            });
        }
    };

    useEffect(() => {
        handleScape();
    }, []);

    const handleScape = () => {
        document.onkeydown = (event) => {
            if (event.key === 'Escape') {
                setOpened(false);
            }
        };
    };

    useEffect(() => {
        const element = document.getElementById('content-finish-message');
        if (!element) return;

        setTimeout(() => element.focus(), 100);
    }, []);

    const getCantSendMessageError = () => {
        const user = conversation.members.find((member) => member.type === IdentityType.user);

        switch (user?.channelId) {
            case ChannelIdConfig.gupshup:
                return getTranslation(
                    'Conversation expired. It is necessary to send templates or wait for the user to respond to send messages normally.'
                );

            default:
                break;
        }
    };

    const cantSendMessageError = getCantSendMessageError();

    return (
        <Modal
            title={getTranslation('End attendance')}
            style={{ maxWidth: '490px' }}
            className='confirmationModal'
            open={opened}
            onCancel={() => setOpened(false)}
            footer={[
                <Button key='cancel' className='antd-span-default-color' onClick={() => setOpened(false)}>
                    {getTranslation('Leave')}
                </Button>,
                <Button
                    className='antd-span-default-color'
                    key='close'
                    type='primary'
                    onClick={() => {
                        handleEndConversation();
                    }}
                >
                    {getTranslation('Close')}
                </Button>,
            ]}
        >
            <Wrapper
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-evenly',
                    paddingTop: '10px',
                }}
            >
                <Wrapper>
                    <TextArea
                        className='finish-message'
                        autoFocus
                        style={{
                            borderRadius: 5,
                            height: 85,
                            resize: 'none',
                        }}
                        defaultValue={savedMessage}
                        value={savedMessage}
                        disabled={!canSendMessage}
                        rows={3}
                        maxLength={4096}
                        id='content-finish-message'
                        placeholder={`${getTranslation('Enter your message here')}..`}
                        onChange={(ev) => setSavedMessage(ev.target.value)}
                    />
                </Wrapper>
                {!canSendMessage && cantSendMessageError && (
                    <Wrapper
                        style={{
                            backgroundColor: '#3366a5de',
                            textAlign: 'center',
                            margin: '4px 5px 10px 5px',
                            padding: '4px 8px',
                            color: '#FFF',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }}
                    >
                        {cantSendMessageError}
                    </Wrapper>
                )}
            </Wrapper>
        </Modal>
    );
};

export const DefaultClosingMessageModal = I18n(DefaultClosingMessageModalComponent);
