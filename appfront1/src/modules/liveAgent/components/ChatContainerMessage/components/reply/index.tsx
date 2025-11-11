import { Row } from 'antd';
import { ActivityType } from 'kissbot-core';
import merge from 'lodash/merge';
import moment from 'moment';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 } from 'uuid';
import { ActionTypes } from '../..';
import { generateId } from '../../../../../../helpers/hex';
import { UseWindowEvent } from '../../../../../../hooks/event.hook';
import { ChannelConfig } from '../../../../../../model/Bot';
import { TeamPermissionTypes, validateTeamPermission } from '../../../../../../model/Team';
import HelpCenterLink from '../../../../../../shared/HelpCenterLink';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { Constants } from '../../../../../../utils/Constants';
import { timeout } from '../../../../../../utils/Timer';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';
import { useContactContext } from '../../../../context/contact.context';
import { Activity } from '../../../../interfaces/activity.interface';
import AudioRecorder from '../../../AudioRecorder';
import EmojiSelector from '../../../EmojiSelector';
import ReplaceTemplateVariablesModal from '../../../ReplaceTemplateVariablesModal';
import TemplateMessageList from '../../../TemplateMessageList';
import { TemplateMessage, TemplateType } from '../../../TemplateMessageList/interface';
import { EmoticonIcon, FileIcon, SendIcon, TemplateIcon, TextareaContainer } from '../../styled';
import TextAreaAutoSize from '../../textarea-auto-size';
import { TextareaReplyProps } from './props';
import { InfoIcon } from './styled';

const TextareaReplyComponent: FC<TextareaReplyProps & I18nProps> = ({
    getTranslation,
    conversation,
    loggedUser,
    onChangeInputFile,
    workspaceId,
    focusTextArea,
    buttonTypes,
    emptyActivity,
    sendActivity,
    setMessageStorage,
    disabled,
    teams,
    channels,
    isFocusOnReply,
    setIsFocusOnReply,
    replayActivity,
    scrollToActivity,
}) => {
    const { contactSelected } = useContactContext();
    const getChannelConfig = () => channels.find((channel) => channel.token === conversation.token);
    const { settings } = useSelector((state: any) => state.loginReducer);
    const [openedTemplate, setOpenedTemplate] = useState<boolean>(false);
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [templateVariableValues, setTemplateVariableValues] = useState<string[]>([]);
    const [templateSelected, setTemplateSelected] = useState<TemplateMessage | undefined>(undefined);
    const [openedVariableReplacer, setOpenedVariableReplacer] = useState(false);
    const [whatsappExpired, setWhatsappExpired] = useState<boolean>(false);
    const [actionSelected, setActionSelected] = useState<ActionTypes | undefined>(undefined);
    const [openedEmoji, setOpenedEmoji] = useState(false);
    const [currentChannelConfig, setCurrentChannelConfig] = useState<ChannelConfig | undefined>(getChannelConfig);
    const [isReplying, setIsReplying] = useState(false);

    const templateSelectedRef: any = useRef(null);
    templateSelectedRef.current = {
        templateSelected,
        setTemplateSelected,
    };

    useEffect(() => {
        timeout(focusTextArea, 0);
    }, []);

    useEffect(() => {
        checkIsWhatsConversationAndExpired();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation.whatsappExpiration]);

    const checkIsWhatsConversationAndExpired = () => {
        return setWhatsappExpired(moment().valueOf() >= conversation.whatsappExpiration);
    };

    useEffect(() => {
        const { templateSelected } = templateSelectedRef.current;

        if (!templateSelected) {
            return;
        }
        timeout(() => {
            setOpenedTemplate(false);
            setOpenedVariableReplacer(true);
        }, 100);
    }, [templateSelected]);

    useEffect(() => {
        handleTextAreaEvents();
    }, []);

    const onPaste = (event: any) => {
        if (!conversation.assumed || whatsappExpired) return;
        const { nativeEvent } = event;

        if (nativeEvent.clipboardData) {
            for (const item of nativeEvent.clipboardData.items) {
                if (item.kind === 'file') {
                    onChangeInputFile(item.getAsFile());
                    break;
                }
            }
        }
    };

    const getSavedMessage = () => {
        let localMessages = {};

        const recentlyItems = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES);

        if (recentlyItems && typeof recentlyItems === 'string') {
            try {
                localMessages = JSON.parse(recentlyItems);
                return localMessages[conversation._id] || '';
            } catch (error) {
                localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_CHANNELS);
                console.log('err get saved messages', error);
            }
        }
        return '';
    };

    useEffect(() => {
        const savedMessage = getSavedMessage();
        setCurrentMessage(savedMessage);
    }, []);

    const onEmojiSelected = (emoji: string) => {
        setCurrentMessage((prevState) => `${prevState}${emoji}`);
    };

    const handleTextAreaEvents = useCallback(() => {
        const textArea = document.getElementById(`chatContainerTextInput`);
        textArea?.addEventListener('keydown', listener);

        return () => textArea?.removeEventListener('keydown', listener);
    }, []);

    const forceCloseModal = () => {
        setOpenedTemplate(false);
        setCurrentMessage('');

        const { setTemplateSelected } = templateSelectedRef.current;

        setTemplateSelected(undefined);
    };

    const listener = (event: any) => {
        const area = document.getElementById('templateMessage');
        if (!area) return;

        const key = event.key;

        switch (key) {
            case 'Enter': {
                const event = new CustomEvent('@template_enter', {
                    detail: {},
                });
                return window.dispatchEvent(event);
            }

            case 'Escape':
                return forceCloseModal();

            case 'ArrowUp': {
                const event = new CustomEvent('@template_move', {
                    detail: {
                        move: -1,
                    },
                });
                return window.dispatchEvent(event);
            }

            case 'ArrowDown': {
                const event = new CustomEvent('@template_move', {
                    detail: {
                        move: 1,
                    },
                });
                return window.dispatchEvent(event);
            }
        }
    };

    const onCloseTemplates = () => {
        const { templateSelected } = templateSelectedRef.current;
        setOpenedTemplate(false);

        // limpa o textarea ao fechar para setar a msg do template ou para abir o modal novamente
        if (currentMessage.substr(0, 1) === '/' && !templateSelected) {
            setCurrentMessage('');
            return focusTextArea();
        }
    };

    const textAreaKeyUp = async (event: any) => {
        const { setTemplateSelected } = templateSelectedRef.current;
        const { templateSelected } = templateSelectedRef.current;
        const { value = '' } = event.target;

        // se digitar "/" abre o modal de seleção de templates
        if (value.substr(0, 1) === '/' && value.length === 1 && !openedTemplate) {
            await handleOpenTemplateList();
        } else if (openedTemplate && (value.substr(0, 1) !== '/' || value === '')) {
            return setOpenedTemplate(false);
        }

        // Navegar pelo texto do template, após selecionado, sem apagar caso não sejá editavel.
        if (
            !openedTemplate &&
            (event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40)
        ) {
            return event.preventDefault();
        }

        // se o template não pode ser editado ou conversa esta expirada,
        // ao digitar qualquer tecla, reseta o texto
        if (event.keyCode !== 13 && templateSelected && (!templateSelected.canEdit || whatsappExpired)) {
            setCurrentMessage('');
            setTemplateSelected(undefined);
        }
    };

    const onChangeInputText = (e: any) => {
        const { value = '' } = e.target;
        const firstLetter = value.substr(0, 1);

        // garante que vai resetar o template ao apagar tudo
        if (firstLetter === '') {
            setTemplateSelected(undefined);
        }

        // se esta expirada a conversa só permite dititar "/"
        if (whatsappExpired && !templateSelected) {
            if (firstLetter === '/' || firstLetter === '') {
                setCurrentMessage(value);
            } else {
                setCurrentMessage('');
            }
        } else {
            setCurrentMessage(value);
        }

        // não salva no localstorage se for / ou se for um template, caso contrário teria que salvar
        // o template junto para enviar na request
        firstLetter !== '/' &&
            !templateSelected &&
            setMessageStorage({
                value,
            });
    };

    const textAreaKeyPress = async (event: any) => {
        if (event.keyCode === 13 && event.shiftKey === false && !openedTemplate) {
            event.preventDefault();
            await createMessageActivity();

            // se o modal de templates estiver aberto, desabilita as teclas ArrowUp e ArrowDown para o cursor do textarea
            // não ficar andando enquando seleciona o template
        } else if ((event.keyCode === 38 || event.keyCode === 40) && openedTemplate) {
            event.preventDefault();
        } else if (event.keyCode === 13 && (templateSelected || openedTemplate)) {
            event.preventDefault();
        }
    };

    const createMessageActivity = async () => {
        if (!currentMessage) {
            return;
        }

        const message = currentMessage.trim();

        if (!conversation || !message || message === '') {
            return;
        }

        const activity: Activity = {
            ...merge(emptyActivity, {
                uuid: v4(),
                text: currentMessage,
                type: ActivityType.message,
                from: {
                    _id: loggedUser._id,
                    id: loggedUser._id,
                    name: loggedUser.name,
                },
                to: {
                    id: conversation.user?.id,
                },
                conversationId: conversation._id,
                hash: generateId(20),
                quoted: isFocusOnReply ? replayActivity?.hash : null,
            }),
        };

        const { templateSelected, setTemplateSelected } = templateSelectedRef.current;

        if (templateSelected) {
            activity.templateId = templateSelected._id;
            activity.templateVariableValues = templateVariableValues;
        }
        setIsReplying(false);
        setIsFocusOnReply(false);
        setTemplateSelected(undefined);
        setTemplateVariableValues([]);
        setCurrentMessage('');
        sendActivity(activity);
        focusTextArea();
    };

    const canSendAudio = validateTeamPermission(
        teams,
        conversation.assignedToTeamId,
        TeamPermissionTypes.canSendAudioMessage,
        loggedUser,
        workspaceId
    );

    const canSendOfficialTemplate = validateTeamPermission(
        teams,
        conversation.assignedToTeamId,
        TeamPermissionTypes.canSendOfficialTemplate,
        loggedUser,
        workspaceId
    );

    const handleOpenTemplateList = async () => {
        if (!!currentChannelConfig) {
            return setOpenedTemplate(true);
        }

        //se o canal nao estiver no array ja precarregado, tenta buscar ao abrir
        const channels = await ChannelConfigService.getChannelsConfig({
            workspaceId,
            token: conversation.token,
        });

        if (!!channels?.[0]) {
            setCurrentChannelConfig(channels[0]);
            return setOpenedTemplate(true);
        }
    };

    UseWindowEvent(
        'setCommentToActivity',
        (event) => {
            setCurrentMessage(event.detail.message);
        },
        []
    );

    return (
        <>
            {currentChannelConfig && (
                <TemplateMessageList
                    onChange={(template: TemplateMessage) => {
                        if (template?.type === TemplateType.file) {
                            timeout(() => {
                                onChangeInputFile(undefined, template);
                            }, 200);
                            return;
                        }
                        focusTextArea();
                        setTemplateSelected(template);
                    }}
                    workspaceId={workspaceId as string}
                    opened={openedTemplate}
                    onClose={onCloseTemplates}
                    textFilter={currentMessage}
                    hsmFilter={whatsappExpired}
                    channelId={currentChannelConfig._id}
                    canSendOfficialTemplate={canSendOfficialTemplate}
                />
            )}

            {openedVariableReplacer && templateSelectedRef.current.templateSelected && (
                <ReplaceTemplateVariablesModal
                    conversation={conversation}
                    loggedUser={loggedUser}
                    onCancel={() => {
                        setCurrentMessage('');
                        setOpenedVariableReplacer(false);
                        setTemplateSelected(undefined);
                        focusTextArea();
                    }}
                    template={templateSelectedRef.current.templateSelected}
                    onClose={() => {}}
                    onChange={(replacedText, paramsVariable?: string[]) => {
                        if (paramsVariable) {
                            setTemplateVariableValues(paramsVariable);
                        }
                        setCurrentMessage(replacedText);
                        setOpenedVariableReplacer(false);
                        focusTextArea();
                    }}
                />
            )}

            {(whatsappExpired || conversation?.invalidNumber || !!contactSelected?.blockedAt) && (
                <Wrapper
                    padding='5px 10px'
                    borderRadius='5px'
                    bgcolor={conversation?.invalidNumber ? '#ff6969' : '#3366a5'}
                    margin='0 0 4px 0'
                    color='#fff'
                    justifyContent='center'
                    fontWeight='600'
                    textAlign='center'
                    maxWidth='540px'
                    fontSize='13px'
                    flexDirection='column'
                    flexBox
                >
                    {conversation?.invalidNumber ? (
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
                    ) : !!contactSelected?.blockedAt ? (
                        <>
                            {getTranslation('This contact is blocked!')}
                            <HelpCenterLink
                                text={getTranslation('Click here for more details')}
                                textStyle={{ color: '#fff', textDecoration: 'underline' }}
                                article={'69000869591-como-bloquear-um-contato-na-plataforma-'}
                                style={{ color: '#fff' }}
                            />
                        </>
                    ) : whatsappExpired ? (
                        getTranslation('Template submission required. Select one by typing "/".')
                    ) : (
                        <></>
                    )}
                </Wrapper>
            )}

            <TextareaContainer
                disabled={!!contactSelected?.blockedAt || !conversation.assumed || conversation?.invalidNumber}
            >
                <Wrapper
                    opacity={
                        !!contactSelected?.blockedAt || !conversation.assumed || conversation?.invalidNumber
                            ? '0.5'
                            : '1'
                    }
                >
                    <TextAreaAutoSize
                        scrollToActivity={scrollToActivity}
                        replayActivity={replayActivity || ({} as Activity)}
                        id={`chatContainerTextInput`}
                        placeholder={`${getTranslation("Type a message or press '/' to select a template")}`}
                        tabIndex={101}
                        maxLength={4096}
                        onPaste={onPaste}
                        value={currentMessage}
                        onKeyDown={textAreaKeyPress}
                        onKeyUp={textAreaKeyUp}
                        onChange={onChangeInputText}
                        disabled={disabled || openedVariableReplacer || conversation?.invalidNumber}
                        isFocusOnReply={isFocusOnReply}
                        setIsReplying={setIsReplying}
                        isReplying={isReplying}
                    />
                    <Wrapper
                        bgcolor='#f9f9f9'
                        padding='0 12px'
                        borderRadius=' 0 0 .3em .3em'
                        flexBox
                        margin='-7px 0 0 0'
                        height='36px'
                        alignItems='center'
                        justifyContent='space-between'
                    >
                        {buttonTypes}
                        <Wrapper flexBox>
                            {canSendAudio && !whatsappExpired && (
                                <AudioRecorder
                                    onRecord={onChangeInputFile}
                                    disabled={!conversation.assumed || whatsappExpired || conversation?.invalidNumber}
                                />
                            )}
                            <TemplateIcon
                                title={getTranslation('Template')}
                                onClick={async () => {
                                    if (!conversation.assumed || conversation?.invalidNumber) return;
                                    if (actionSelected === ActionTypes.template) {
                                        setOpenedTemplate(false);
                                        return setActionSelected(undefined);
                                    }

                                    setActionSelected(ActionTypes.template);
                                    await handleOpenTemplateList();
                                    setCurrentMessage('/');
                                    return focusTextArea();
                                }}
                            />
                            {!whatsappExpired && (
                                <EmojiSelector
                                    onSelect={onEmojiSelected}
                                    opened={openedEmoji}
                                    onClose={() => setOpenedEmoji(false)}
                                >
                                    <EmoticonIcon
                                        title={getTranslation('Emoticons')}
                                        onClick={() => {
                                            if (!conversation.assumed || whatsappExpired || conversation?.invalidNumber)
                                                return;

                                            if (actionSelected === ActionTypes.emoticons) {
                                                setOpenedEmoji(false);
                                                return setActionSelected(undefined);
                                            }

                                            setActionSelected(ActionTypes.emoticons);
                                            setOpenedEmoji(true);
                                        }}
                                    />
                                </EmojiSelector>
                            )}
                            {!whatsappExpired && (
                                <div>
                                    <label
                                        htmlFor='multi'
                                        style={{
                                            cursor: whatsappExpired ? 'default' : 'pointer',
                                            margin: 0,
                                            display: 'flex',
                                        }}
                                    >
                                        <FileIcon
                                            title={getTranslation('File')}
                                            onClick={(e: any) => {
                                                if (!conversation.assumed || conversation?.invalidNumber)
                                                    e.preventDefault();
                                                setActionSelected(ActionTypes.file);
                                            }}
                                        />
                                    </label>
                                    <input
                                        disabled={whatsappExpired || conversation?.invalidNumber}
                                        key={actionSelected}
                                        type='file'
                                        id='multi'
                                        style={{ display: 'none' }}
                                        onChange={(event) => {
                                            setActionSelected(undefined);
                                            // Passa o FileList completo
                                            const files = event.target.files;
                                            if (files && files.length > 0) {
                                                onChangeInputFile(files); // Passa FileList completo
                                            }
                                        }}
                                        accept='*/*'
                                        multiple
                                    />
                                </div>
                            )}
                            <SendIcon
                                title={getTranslation('Send')}
                                disabled={!conversation.assumed || conversation?.invalidNumber}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    createMessageActivity();
                                }}
                            />
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
                {!openedVariableReplacer && templateSelected && !templateSelected.canEdit && (
                    <InfoIcon title={getTranslation('Template text cannot be edited')} />
                )}
            </TextareaContainer>
        </>
    );
};

export const TextareaReply = i18n(TextareaReplyComponent) as FC<TextareaReplyProps>;
