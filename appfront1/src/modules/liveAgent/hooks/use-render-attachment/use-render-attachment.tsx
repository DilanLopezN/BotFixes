import { OrganizationSettings } from 'kissbot-core';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Icon, Wrapper } from '../../../../ui-kissbot-v2/common';
import { truncate } from '../../../../utils/String';
import ActivityContact from '../../components/ActivityContact';
import { Audio } from '../../components/ActivityFile/styled';
import ActivityFlowResponse from '../../components/ActivityFlowResponse';
import AudioPlayer from '../../components/AudioPlayer/components/player';
import { ReactPlayerDiv } from '../../components/ChatMessage/styled';
import { AttachmentService } from '../../service/Atttachment.service';
import { UseRenderAttachmentParams, UseRenderAttachmentResult } from './interfaces';

export const useRenderAttachment = ({
    file,
    activity,
    conversation,
    openImage,
    handleReact,
    handleReply,
    canReaction,
    isFilesize,
    clientMessage,
}: UseRenderAttachmentParams): UseRenderAttachmentResult => {
    const settings: OrganizationSettings & { generalFeatureFlag: { [key: string]: any } } = useSelector(
        (state: any) => state.loginReducer.settings
    );

    const attachmentUrl = useMemo(() => {
        return file?.id ? AttachmentService.createAttachmentUrl(activity.conversationId, file?.id) : file?.contentUrl;
    }, [file, activity.conversationId]);

    const attachmentUrlWithoutCache = useMemo(() => {
        return file?.id
            ? AttachmentService.createAttachmentUrl(activity.conversationId, file?.id, true)
            : file?.contentUrl;
    }, [file, activity.conversationId]);

    const data = {
        name: conversation.user.name,
        hash: activity.hash,
        conversationId: activity.conversationId,
        activityId: activity._id,
        audioTranscriptions: conversation.audioTranscriptions,
        clientMessage,
        conversation,
    };

    const downloadFile = () => {
        const win: any = window.open(attachmentUrl, '_blank');
        win?.focus();
        return;
    };

    const ComponentFile = (
        <Wrapper flexBox bgcolor='#cfe9ba' padding='8px' borderRadius='8px'>
            <Icon name='file-document' size='36px' />
            <Wrapper
                minWidth='200px'
                height='fit-content'
                margin='auto 0'
                padding='0 8px'
                style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
                title={file?.name}
            >
                {truncate(file?.name || '', 20)}
            </Wrapper>
            <Wrapper
                border='1px solid'
                borderRadius='20px'
                width='38px'
                height='38px'
                textAlign='center'
                margin='auto 0'
                cursor='pointer'
                onClick={() => openImage ? openImage() : downloadFile()}
            >
                <Icon name={AttachmentService.isPdfFile(file?.contentType || '') ? 'eye' : 'arrow-down-bold'} />
            </Wrapper>
        </Wrapper>
    );

    const RenderedComponent: JSX.Element | null = !file?.contentType ? null : AttachmentService.isImageFile(
          file?.contentType
      ) ? (
        file?.contentType === 'image/heic' ? (
            ComponentFile
        ) : (
            <Wrapper bgcolor='#696969' borderRadius='8px' cursor='pointer'>
                <Wrapper
                    style={{
                        backgroundImage: `url(${attachmentUrl})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: isFilesize ? 'cover' : 'contain',
                        minWidth: '200px',
                        minHeight: '150px',
                        borderRadius: '5px',
                    }}
                    onClick={() => openImage && openImage()}
                />
            </Wrapper>
        )
    ) : AttachmentService.isPdfFile(file?.contentType) ? (
        <Wrapper flexBox bgcolor='#f8d7da' padding='8px' borderRadius='8px' cursor='pointer' onClick={() => openImage && openImage()}>
            <Icon name='file-pdf' size='36px' color='#721c24' />
            <Wrapper
                minWidth='200px'
                height='fit-content'
                margin='auto 0'
                padding='0 8px'
                color='#721c24'
                style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
                title={file?.name}
            >
                {truncate(file?.name || '', 20)}
            </Wrapper>
            <Wrapper
                border='1px solid #721c24'
                borderRadius='20px'
                width='38px'
                height='38px'
                textAlign='center'
                margin='auto 0'
                cursor='pointer'
                flexBox
                alignItems='center'
                justifyContent='center'
            >
                <Icon name='eye' color='#721c24' size='18px' />
            </Wrapper>
        </Wrapper>
    ) : file?.contentType === 'application/vnd.microsoft.card.video' ? (
        <ReactPlayerDiv key={file?.key} url={file?.content?.media?.[0]?.url} controls width='100%' heigth='100%' />
    ) : file?.contentType === 'application/contact' ? (
        <ActivityContact contact={file?.content} />
    ) : AttachmentService.isVideoFile(file?.contentType) ? (
        <ReactPlayerDiv key={file?.key} url={attachmentUrl} controls width='100%' heigth='100%' />
    ) : AttachmentService.isAudioFile(file?.contentType) ? (
        settings.generalFeatureFlag?.v2AudioPlayer ? (
            <AudioPlayer
                handleReact={handleReact}
                handleReply={handleReply}
                canReaction={canReaction}
                type='default'
                url={attachmentUrlWithoutCache}
                id={file?.key}
                key={file?.key}
                contextId={activity.conversationId}
                data={data}
            />
        ) : (
            <Wrapper borderRadius='6px'>
                <Audio
                    key={file?.key}
                    style={{
                        margin: 0,
                        outline: 'none',
                    }}
                    src={attachmentUrlWithoutCache}
                    controls
                />
            </Wrapper>
        )
    ) : file?.contentType === 'flow_response' ? (
        <ActivityFlowResponse content={file?.content} />
    ) : (
        ComponentFile
    );

    return {
        attachmentElement: RenderedComponent,
    };
};
