import { Dropdown, Space, Tooltip } from 'antd';
import { ActivityType, ChannelIdConfig, ConversationStatus, IdentityType } from 'kissbot-core';
import moment from 'moment';
import { FC, useMemo, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { connect } from 'react-redux';
import { Icon, PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import { formattingWhatsappText } from '../../../../utils/Activity';
import { isAnySystemAdmin } from '../../../../utils/UserPermission';
import { useLanguageContext } from '../../../i18n/context';
import { useEmojiReaction } from '../../hooks/use-emoji-reaction';
import { useMessageOptions } from '../../hooks/use-message-options/use-message-options';
import { useRenderAttachment } from '../../hooks/use-render-attachment';
import { Identity } from '../../interfaces/conversation.interface';
import ActivityFrom from '../ActivityFrom';
import ChatMessageViewed from '../ChatMessageViewed';
import { EmojiReactions } from '../EmojiReactions';
import { ReactionMessage } from '../ReactionMessage/ReactionMessage';
import { ChatCardProps } from './props';
import { Balloon, ContainerWrapped, EmojiTriggerStyle, NumberButton, OptionsResponse } from './styled';

const ChatCard: FC<any> = ({
    activity,
    ownerMessage,
    clientMessage,
    botMessage,
    renderTimestamp,
    settings,
    conversation,
    loggedUser,
    reactionText,
    onReply,
    sendReplayActivity,
    openImage,
    withError,
    retry,
    footer,
}: ChatCardProps) => {
    const content = activity.attachments?.[0].content;
    const activityTimestamp = moment(activity.timestamp);
    const [emojiVisible, setEmojiVisible] = useState(false);
    const { getTranslation } = useLanguageContext();

    const file = activity?.attachmentFile;

    const { attachmentElement } = useRenderAttachment({
        file,
        activity,
        conversation,
        openImage,
    });
    const [optionsVisible, setOptionsVisible] = useState(false);
    const handleReact = () => {
        setEmojiVisible(true);
    };
    const handleReply = async () => {
        if (onReply) {
            sendReplayActivity({ ...activity });
            onReply();
        }
    };

    const canReaction: boolean = useMemo<boolean>(() => {
        return (
            Boolean(conversation.whatsappExpiration) &&
            moment().valueOf() < conversation.whatsappExpiration && // O tempo atual deve ser menor que a expiração do WhatsApp
            ![ChannelIdConfig.webemulator, ChannelIdConfig.webchat, ChannelIdConfig.telegram].includes(
                conversation.createdByChannel
            ) && // O canal não pode ser webchat ou webemulator
            conversation.state === ConversationStatus.open && // A conversa deve estar aberta
            activity.type !== ActivityType.comment && // Não pode ser um comentário
            conversation.members.some(
                (member: Identity) => member.id === loggedUser?._id && !member.disabled // Verifica se o membro está ativo (não desabilitado) e listado
            ) &&
            activity?.from?.type === IdentityType.user // O agente só pode responder e reagir a mensagens recebidas do usuario
        );
    }, [
        conversation.members,
        conversation.whatsappExpiration,
        conversation.createdByChannel,
        conversation.state,
        activity.type,
        activity?.from?.type,
        loggedUser?._id,
    ]);

    const { options } = useMessageOptions({
        handleReact,
        handleReply,
        canReaction: canReaction,
    });

    const numberButtonVisible = (channel: string) => {
        switch (channel) {
            case ChannelIdConfig.emulator:
            case ChannelIdConfig.webemulator:
            case ChannelIdConfig.webchat:
            case ChannelIdConfig.wabox:
            case ChannelIdConfig.sms:
            case ChannelIdConfig.telegram:
            case ChannelIdConfig.facebook:
            case ChannelIdConfig.instagram:
                return false;
            default:
                return true;
        }
    };

    const { handleEmojiSelect } = useEmojiReaction(setEmojiVisible, activity, conversation);

    const buttonTypes = ['openUrl', 'flow', 'imBack'];

    return (
        <ContainerWrapped
            id={`activityWrapper:${activity.hash}`}
            margin={renderTimestamp ? '0 0 10px 0' : '0 0 3px 0'}
            flexBox
            flexDirection={!clientMessage ? 'row-reverse' : 'row'}
            position='relative'
        >
            <Wrapper minWidth='20px' flexBox>
                {withError && (
                    <Icon
                        name={'alert-circle'}
                        size='12px'
                        style={{
                            fontSize: '17px',
                            margin: '8px 0 0 0',
                        }}
                        margin={'0 0 0 4px'}
                        color='#e63517'
                        title={getTranslation('Error sending, click to retry')}
                        onClick={retry}
                    />
                )}
                {!withError && !!activity.ack && activity.ack < 0 && (
                    <Tooltip
                        placement='leftTop'
                        title={`${getTranslation('Error')} (${activity.ack}) - ${getTranslation(
                            'Click to open article'
                        )}`}
                    >
                        <Icon
                            name='alert-circle'
                            size='12px'
                            style={{
                                fontSize: '17px',
                                margin: '8px 0 0 0',
                            }}
                            margin='0 0 0 4px'
                            color='#e63517'
                            onClick={() => {
                                window.open(
                                    `https://botdesigner.freshdesk.com/support/solutions/articles/69000869589-erro-no-envio-de-mensagem`,
                                    '_blank'
                                );
                            }}
                        />
                    </Tooltip>
                )}
            </Wrapper>
            <Wrapper position='relative'>
                {isAnySystemAdmin(loggedUser) &&
                    activity.from.type === 'bot' &&
                    activity?.recognizerResult?.interactionId && (
                        <Wrapper
                            position='absolute'
                            right='23px'
                            top='-3px'
                            cursor='pointer'
                            title={'Ir para interação'}
                            style={{ zIndex: 5 }}
                            onClick={() => {}}
                        >
                            <a
                                href={`/workspace/${activity.workspaceId}/bot/${activity.from.id}/interaction/${activity?.recognizerResult?.interactionId}`}
                                target={'_blank'}
                                rel='noreferrer'
                            >
                                <img
                                    style={{ width: '11px', height: '11px' }}
                                    src='/assets/img/arrow.png'
                                    alt='arrow'
                                />
                            </a>
                        </Wrapper>
                    )}
                <EmojiReactions
                    clientMessage={clientMessage}
                    visible={emojiVisible}
                    onClose={() => setEmojiVisible(false)}
                    onSelectEmoji={handleEmojiSelect}
                >
                    <Balloon
                        botMessage={botMessage}
                        ownerMessage={ownerMessage}
                        clientMessage={clientMessage}
                        id={activity.hash}
                    >
                        <Wrapper
                            margin='2px 0 0 0'
                            color={'#696969'}
                            style={{
                                wordWrap: 'break-word',
                                display: 'inline-block',
                                width: '100%',
                                maxWidth: '45vw',
                            }}
                        >
                            {!!content?.images && !!content?.images.length && (
                                <Wrapper
                                    padding='8px'
                                    borderRadius='4px'
                                    textAlign='center'
                                    bgcolor='#F0F0F0'
                                    margin='0 0 6px 0'
                                >
                                    <img src={content?.images[0].url} width='100%' alt='url' />
                                </Wrapper>
                            )}

                            <Space direction='vertical' style={{ width: '100%' }}>
                                {attachmentElement}
                                {!!content?.title && (
                                    <Wrapper padding=' 0 0 7px 0'>
                                        <h6>{formattingWhatsappText(content?.title)}</h6>
                                    </Wrapper>
                                )}
                                {!!content?.subtitle && (
                                    <Wrapper padding=' 0 0 7px 0'>
                                        <h6 style={{ fontWeight: 400 }}>{formattingWhatsappText(content?.subtitle)}</h6>
                                    </Wrapper>
                                )}
                                <Wrapper padding=' 0 0 7px 0'>
                                    {content?.text && formattingWhatsappText(content?.text)}
                                </Wrapper>
                                {content?.footer && (
                                    <Wrapper
                                        style={{
                                            fontSize: '12px',
                                            color: '#82898c',
                                            marginTop: '6px',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        {formattingWhatsappText(content.footer)}
                                    </Wrapper>
                                )}
                                {!!content?.buttons && !!content?.buttons.length && (
                                    <Wrapper width='100%'>
                                        {content?.buttons.map((button, index) => {
                                            if (
                                                button?.displayText ||
                                                (button?.title && buttonTypes.includes(button?.type))
                                            ) {
                                                const buttonTitle = button?.displayText || button?.title;
                                                return (
                                                    <Wrapper flexBox alignItems='flex-end'>
                                                        {numberButtonVisible(conversation.createdByChannel) && (
                                                            <NumberButton
                                                                colorSettings={
                                                                    settings && settings.layout && settings.layout.color
                                                                }
                                                            >
                                                                {typeof button?.index === 'number'
                                                                    ? button?.index + 1
                                                                    : index + 1}
                                                            </NumberButton>
                                                        )}
                                                        <PrimaryButton
                                                            style={{
                                                                ...(settings && settings.layout && settings.layout.color
                                                                    ? {
                                                                          color: settings.layout.color,
                                                                          borderColor: settings.layout.color,
                                                                      }
                                                                    : {}),
                                                                overflow: 'hidden',
                                                                display: 'initial',
                                                                padding: '5px 8px',
                                                            }}
                                                            outline
                                                            width='100%'
                                                            minWidth='234px'
                                                            minHeight='32px'
                                                            margin={!index ? '0' : '4px 0 0 0'}
                                                            key={index}
                                                            whiteSpace='initial'
                                                        >
                                                            {formattingWhatsappText(buttonTitle)}
                                                        </PrimaryButton>
                                                    </Wrapper>
                                                );
                                            }
                                            return null;
                                        })}
                                    </Wrapper>
                                )}{' '}
                            </Space>
                        </Wrapper>
                        <Wrapper
                            flexBox
                            position='absolute'
                            bottom='0'
                            right='5px'
                            flexDirection='column'
                            justifyContent='flex-end'
                        >
                            <ChatMessageViewed
                                ack={activity.ack}
                                activityTimestamp={activityTimestamp}
                                clientMessage={clientMessage}
                            />
                        </Wrapper>
                    </Balloon>
                </EmojiReactions>
                {reactionText?.length ? (
                    <ReactionMessage reactions={reactionText} clientMessage={clientMessage} />
                ) : null}
                <ActivityFrom
                    activity={activity}
                    renderTimestamp={renderTimestamp}
                    clientMessage={clientMessage}
                    ownerMessage={ownerMessage}
                />
                <div
                    style={{
                        position: 'absolute',
                        right: '7%',
                        top: '8%',
                    }}
                >
                    {canReaction && (
                        <Dropdown
                            menu={{ items: options, onClick: () => setOptionsVisible(false) }}
                            trigger={['click']}
                            open={optionsVisible}
                            onOpenChange={(visible) => setOptionsVisible(visible)}
                            placement={clientMessage ? 'bottomLeft' : 'bottomRight'}
                        >
                            <Space>
                                <OptionsResponse clientMessage={clientMessage}>
                                    <IoIosArrowDown size={'15px'} />
                                </OptionsResponse>
                            </Space>
                        </Dropdown>
                    )}
                </div>
            </Wrapper>

            {canReaction && clientMessage && (
                <EmojiTriggerStyle clientMessage={clientMessage} onClick={() => setEmojiVisible(!emojiVisible)} />
            )}
        </ContainerWrapped>
    );
};

const mapStateToProps = (state) => ({
    settings: state.loginReducer.settings,
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default connect(mapStateToProps, null)(ChatCard);
