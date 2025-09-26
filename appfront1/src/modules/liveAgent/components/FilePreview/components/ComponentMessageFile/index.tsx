import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { ComponentMessageFileProps } from './props';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import TextAreaAutoSize from '../../components/TextAreaAutoSize';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { timeout } from '../../../../../../utils/Timer';
import { ChannelConfig } from '../../../../../../model/Bot';
import { TemplateMessage, TemplateType } from '../../../TemplateMessageList/interface';
import { TeamPermissionTypes, validateTeamPermission } from '../../../../../../model/Team';
import TemplateMessageList from '../../../TemplateMessageList';
import ReplaceTemplateVariablesModal from '../../../ReplaceTemplateVariablesModal';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';
import { EmoticonIcon, InfoIcon } from './styled';
import EmojiSelector from '../../../EmojiSelector';

const ComponentMessageFile: FC<ComponentMessageFileProps & I18nProps> = ({
    getTranslation,
    conversation,
    loggedUser,
    uploadingFile,
    currentMessage,
    setCurrentMessage,
    setTemplateVariableValues,
    channels,
    teams,
    workspaceId,
    uploadFile,
    template,
    closePreviewFile,
}) => {
    const getChannelConfig = () => channels.find((channel) => channel.token === conversation.token);

    const [openedTemplate, setOpenedTemplate] = useState<boolean>(false);
    const [openedVariableReplacer, setOpenedVariableReplacer] = useState(false);
    const [openedEmoji, setOpenedEmoji] = useState(false);
    const [templateSelected, setTemplateSelected] = useState<TemplateMessage | undefined>(template);
    const [currentChannelConfig, setCurrentChannelConfig] = useState<ChannelConfig | undefined>(getChannelConfig);

    const templateSelectedRef: any = useRef(null);
    templateSelectedRef.current = {
        templateSelected,
        setTemplateSelected,
    };

    const focusTextArea = () => {
        timeout(() => {
            const textArea = document.getElementById(`filePreviewChatContainerTextInput`);
            textArea?.focus();
        }, 10);
    };

    const canSendOfficialTemplate = validateTeamPermission(
        teams,
        conversation.assignedToTeamId,
        TeamPermissionTypes.canSendOfficialTemplate,
        loggedUser,
        workspaceId
    );

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

    const handleTextAreaEvents = useCallback(() => {
        const textArea = document.getElementById(`filePreviewChatContainerTextInput`);
        textArea?.addEventListener('keydown', listener);

        return () => textArea?.removeEventListener('keydown', listener);
    }, []);

    const forceCloseModal = () => {
        setOpenedTemplate(false);
        setCurrentMessage('');
        if (template && template.type === TemplateType.file) {
            closePreviewFile();
        }

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

    const onChangeInputText = (e: any) => {
        const { value = '' } = e.target;
        const firstLetter = value.substr(0, 1);

        // garante que vai resetar o template ao apagar tudo
        if (firstLetter === '') {
            templateSelectedRef.current.setTemplateSelected(undefined);
            if (template && template.type === TemplateType.file) {
                closePreviewFile();
            }
        }

        setCurrentMessage(value);
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
        if (event.keyCode !== 13 && templateSelected && !templateSelected.canEdit) {
            setCurrentMessage('');
            setTemplateSelected(undefined);
            if (template && template.type === TemplateType.file) {
                closePreviewFile();
            }
        }
    };

    const textAreaKeyPress = async (event: any) => {
        if (event.keyCode === 13 && event.shiftKey === false && !openedTemplate) {
            event.preventDefault();

            // se o modal de templates estiver aberto, desabilita as teclas ArrowUp e ArrowDown para o cursor do textarea
            // não ficar andando enquando seleciona o template
        } else if ((event.keyCode === 38 || event.keyCode === 40) && openedTemplate) {
            event.preventDefault();
        } else if (event.keyCode === 13 && (templateSelected || openedTemplate)) {
            event.preventDefault();
        }
    };

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

    const onEmojiSelected = (emoji: string) => {
        const { templateSelected } = templateSelectedRef.current;

        if ((template && !template?.canEdit) || (templateSelected && !templateSelected?.canEdit)) {
            return;
        }
        setCurrentMessage((prevState) => `${prevState}${emoji}`);
    };

    return (
        <>
            {currentChannelConfig && (
                <TemplateMessageList
                    onChange={(template: TemplateMessage) => {
                        focusTextArea();
                        templateSelectedRef.current.setTemplateSelected(template);
                    }}
                    workspaceId={workspaceId as string}
                    opened={openedTemplate}
                    onClose={onCloseTemplates}
                    textFilter={currentMessage}
                    hsmFilter={false}
                    channelId={currentChannelConfig._id}
                    canSendOfficialTemplate={canSendOfficialTemplate}
                    typeMessage
                />
            )}

            {openedVariableReplacer && templateSelectedRef.current.templateSelected && (
                <ReplaceTemplateVariablesModal
                    conversation={conversation}
                    loggedUser={loggedUser}
                    onCancel={() => {
                        setCurrentMessage('');
                        setOpenedVariableReplacer(false);
                        templateSelectedRef.current.setTemplateSelected(undefined);
                        focusTextArea();
                    }}
                    template={templateSelectedRef.current.templateSelected}
                    onClose={() => {}}
                    onChange={(replacedText, paramsVariable) => {
                        setCurrentMessage(replacedText);
                        setTemplateVariableValues(paramsVariable || [])
                        setOpenedVariableReplacer(false);
                        focusTextArea();
                    }}
                />
            )}

            <Wrapper
                flexBox
                justifyContent='center'
                position='relative'
                bgcolor='#e9ebeb'
                padding='10px 0 15px 0'
                opacity={uploadingFile ? '0.8' : '1'}
            >
                <TextAreaAutoSize
                    id={'filePreviewChatContainerTextInput'}
                    placeholder={`${getTranslation("Type a message or press '/' to select a template")}`}
                    tabIndex={101}
                    maxLength={4096}
                    autoFocus
                    value={currentMessage}
                    onKeyDown={textAreaKeyPress}
                    onKeyUp={textAreaKeyUp}
                    onChange={onChangeInputText}
                    disabled={!conversation.assumed || openedVariableReplacer}
                />
                {templateSelected && !templateSelected.canEdit && (
                    <InfoIcon title={getTranslation('Template text cannot be edited')} />
                )}
                <EmojiSelector onSelect={onEmojiSelected} opened={openedEmoji} onClose={() => setOpenedEmoji(false)}>
                    <EmoticonIcon
                        title={getTranslation('Emoticons')}
                        onClick={() => {
                            if (openedEmoji) {
                                setOpenedEmoji(false);
                                return;
                            }

                            if (!openedVariableReplacer) {
                                setOpenedEmoji(true);
                            }
                        }}
                    />
                </EmojiSelector>
            </Wrapper>
        </>
    );
};

export default i18n(ComponentMessageFile) as FC<ComponentMessageFileProps>;
