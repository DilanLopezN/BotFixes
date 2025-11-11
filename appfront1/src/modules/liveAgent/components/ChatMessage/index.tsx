import { Col, Dropdown, Row, Space, Tooltip } from 'antd';
import { ActivityType, ChannelIdConfig, ConversationStatus, IdentityType, OrganizationSettings } from 'kissbot-core';
import moment from 'moment-timezone';
import { FC, useMemo, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useSelector } from 'react-redux';
import { Icon, UserAvatar, Wrapper } from '../../../../ui-kissbot-v2/common';
import { isAnySystemAdmin } from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { useMessageOptions } from '../../hooks/use-message-options/use-message-options';
import { Identity } from '../../interfaces/conversation.interface';
import { AttachmentService } from '../../service/Atttachment.service';
import ActivityComment from '../ActivityComment';
import ActivityError from '../ActivityError';
import ActivityFile from '../ActivityFile';
import ActivityFrom from '../ActivityFrom';
import ActivityText from '../ActivityText';
import { ReactionMessage } from '../ReactionMessage/ReactionMessage';
import { ChatMessageProps } from './props';
import { ContainerWrapped, OptionsResponse } from './styled';

const ChatMessage = ({
    attachment,
    activity,
    ownerMessage,
    clientMessage,
    botMessage,
    openImage,
    renderTimestamp,
    withError,
    retry,
    getTranslation,
    quotedActivity,
    reactionText,
    scrollToActivity,
    conversation,
    loggedUser,
    onReply,
    sendReplayActivity,
}: ChatMessageProps & I18nProps) => {
    const { attachmentFile, hash } = activity;
    const file = attachment || attachmentFile;
    const isFileActivity = !!file;
    const viewAvatar = renderTimestamp && (ownerMessage || activity.from.type === IdentityType.agent);
    const [emojiVisible, setEmojiVisible] = useState(false);
    const settings: OrganizationSettings & { generalFeatureFlag: { [key: string]: any } } = useSelector(
        (state: any) => state.loginReducer.settings
    );
    const [optionsVisible, setOptionsVisible] = useState(false);
    const audioUrl = AttachmentService.createAttachmentUrl(activity?.conversationId, file?.id, true);

    const isAudioPlayer: boolean =
        !!file && AttachmentService.isAudioFile(file?.contentType) && settings.generalFeatureFlag?.v2AudioPlayer;

    const handleReact = () => {
        setEmojiVisible(true);
    };
    const handleReply = async () => {
        if (onReply) {
            sendReplayActivity(activity);
            onReply();
        }
    };

    const data = {
        name: conversation.user.name,
        hash: activity.hash,
        conversationId: activity.conversationId,
        activityId: activity._id,
        audioTranscriptions: conversation.audioTranscriptions,
        clientMessage,
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
                (member: Identity) => member.id === loggedUser._id && !member.disabled // Verifica se o membro está ativo (não desabilitado) e listado
            ) && // O agente só pode responder e reagir a mensagens recebidas do usuario
            activity?.from?.type === IdentityType.user
        );
    }, [
        conversation.whatsappExpiration,
        conversation.createdByChannel,
        conversation.state,
        conversation.members,
        activity.type,
        activity?.from?.type,
        loggedUser._id,
    ]);

    const { options } = useMessageOptions({
        audioUrl,
        data,
        handleReact,
        handleReply,
        isAudioPlayer,
        canReaction: canReaction,
        activityText: activity.text,
    });

    return (
        <ContainerWrapped
            id={`activityWrapper:${hash}`}
            margin={reactionText ? '0 0 20px 0' : '0 0 7px 0'}
            flexBox
            flexDirection={!clientMessage ? 'row-reverse' : 'row'}
            position='relative'
            clientMessage={clientMessage}
        >
            <Wrapper minWidth='20px' flexBox>
                {viewAvatar && (
                    <UserAvatar
                        size={18}
                        hashColor={activity.from.id}
                        margin={'10px 0 0 0'}
                        user={{ name: activity.from.name }}
                    />
                )}
                {withError && (
                    <Icon
                        name={'alert-circle'}
                        size='12px'
                        style={{
                            fontSize: '17px',
                            margin: !viewAvatar ? '10px 15px 0 0' : '8px 0 0 0',
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
                                margin: !viewAvatar ? '10px 15px 0 0' : '8px 0 0 0',
                            }}
                            margin='0 0 0 4px'
                            color='#e63517'
                            onClick={() => {
                                window.open(
                                    'https://botdesigner.freshdesk.com/support/solutions/articles/69000869589-erro-no-envio-de-mensagem',
                                    '_blank'
                                );
                            }}
                        />
                    </Tooltip>
                )}
            </Wrapper>

            <Row>
                <Col>
                    <Wrapper>
                        <div>
                            {isFileActivity ? (
                                <ActivityFile
                                    handleReact={handleReact}
                                    handleReply={handleReply}
                                    conversation={conversation}
                                    ownerMessage={ownerMessage}
                                    clientMessage={clientMessage}
                                    botMessage={botMessage}
                                    renderTimestamp={renderTimestamp}
                                    openImage={openImage}
                                    activity={activity}
                                    quotedActivity={quotedActivity}
                                    scrollToActivity={scrollToActivity}
                                    file={file}
                                    canReaction={canReaction}
                                    emojiVisible={emojiVisible}
                                    setEmojiVisible={setEmojiVisible}
                                />
                            ) : activity.type === ActivityType.error ? (
                                <ActivityError
                                    ownerMessage={false}
                                    clientMessage={false}
                                    renderTimestamp={renderTimestamp}
                                    activity={activity}
                                    quotedActivity={quotedActivity}
                                    scrollToActivity={scrollToActivity}
                                />
                            ) : activity.type === ActivityType.comment ? (
                                <ActivityComment
                                    conversation={conversation}
                                    ownerMessage={ownerMessage}
                                    renderTimestamp={renderTimestamp}
                                    activity={activity}
                                />
                            ) : (
                                <ActivityText
                                    conversation={conversation}
                                    loggedUser={loggedUser}
                                    ownerMessage={ownerMessage}
                                    clientMessage={clientMessage}
                                    botMessage={botMessage}
                                    renderTimestamp={renderTimestamp}
                                    activity={activity}
                                    quotedActivity={quotedActivity}
                                    scrollToActivity={scrollToActivity}
                                    canReaction={canReaction}
                                    emojiVisible={emojiVisible}
                                    setEmojiVisible={setEmojiVisible}
                                />
                            )}
                        </div>
                    </Wrapper>
                    {reactionText?.length ? (
                        <ReactionMessage reactions={reactionText} clientMessage={clientMessage} />
                    ) : null}
                    <ActivityFrom
                        activity={activity}
                        renderTimestamp={renderTimestamp}
                        clientMessage={clientMessage}
                        ownerMessage={ownerMessage}
                    />
                </Col>
                <Col
                    style={{
                        position: 'relative',
                        right: clientMessage ? '26px' : '46px',
                        top: '4px',
                    }}
                >
                    {canReaction && !isAudioPlayer && (
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
                </Col>
            </Row>
        </ContainerWrapped>
    );
};

export default i18n(ChatMessage) as FC<ChatMessageProps>;
