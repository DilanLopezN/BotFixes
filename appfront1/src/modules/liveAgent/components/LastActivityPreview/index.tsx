import { FC } from 'react';
import { LastActivityPreviewProps } from './props';
import { Wrapper, Icon } from '../../../../ui-kissbot-v2/common';
import AckMessage from '../AckMessage';
import { formattingWhatsappText, activityIsCard } from '../../../../utils/Activity';
import { AttachmentService } from '../../service/Atttachment.service';
import { ActivityType, IdentityType } from 'kissbot-core';
import { Tooltip } from 'antd';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';


const LastActivityPreview: FC<LastActivityPreviewProps & I18nProps> = ({ lastActivity, getTranslation }) => {
    const lastActivityPreview = () => {
        const clientMessage = lastActivity?.from?.type === IdentityType.user;
        const fontSize = 13;

        if (!lastActivity) {
            return null;
        }

        if (activityIsCard(lastActivity)) {
            const content = lastActivity.attachments[0].content;
            const formattedText = !!lastActivity
                ? formattingWhatsappText(content.title || content.subtitle || content.text || '')
                : null;

            const numWords = (content.title || content.subtitle || content.text || '')?.split(' ')?.length;
            const bigText = numWords > 30 ? 530 : 55;

            return (
                <Wrapper flexBox>
                    {!clientMessage && (
                        <Wrapper margin='0 1px 0 0'>
                            <AckMessage ackType={lastActivity.ack} />
                        </Wrapper>
                    )}
                    <Icon name='card-text-outline' size='18px' margin='-3px 5px 0 0' />
                    <Tooltip
                        mouseLeaveDelay={0}
                        mouseEnterDelay={4}
                        placement='rightTop'
                        title={formattedText}
                        overlayInnerStyle={{ minWidth: bigText, width: 'auto', fontSize: fontSize }}
                    >
                        <span
                            style={{
                                textOverflow: 'ellipsis',
                                flexWrap: 'nowrap',
                                overflow: 'hidden',
                                paddingTop: '1px',
                            }}
                        >
                            {formattedText}
                        </span>
                    </Tooltip>
                </Wrapper>
            );
        }

        if (
            lastActivity.type === ActivityType.member_upload_attachment ||
            (!!lastActivity.attachments && lastActivity.attachments?.length)
        ) {
            const fileIcon = AttachmentService.getIconByMimeType(
                lastActivity.attachmentFile
                    ? lastActivity.attachmentFile.contentType
                    : lastActivity.attachments[0].contentType
            );

            const getFileName = () => {
                let fileName =
                    lastActivity.attachmentFile && lastActivity.attachmentFile.name
                        ? lastActivity.attachmentFile.name.split('.').slice(0, -1).join('.')
                        : '';

                if (!lastActivity.attachmentFile?.contentType.startsWith('audio')) {
                    return fileName;
                }

                if (lastActivity.attachmentFile?.contentType.startsWith('audio')) {
                    return (fileName = 'Áudio');
                }
            };

            return (
                <Wrapper flexBox>
                    {!clientMessage && (
                        <Wrapper margin='0 1px 0 0'>
                            <AckMessage ackType={lastActivity.ack} />
                        </Wrapper>
                    )}
                    <Icon name={fileIcon} size='18px' margin='-3px 5px 0 0' />
                    <Tooltip
                        mouseLeaveDelay={0}
                        mouseEnterDelay={0.4}
                        placement='rightTop'
                        title={`${getFileName()}`}
                        overlayInnerStyle={{ fontSize: fontSize }}
                    >
                        <span
                            style={{
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                paddingTop: '1px',
                            }}
                        >
                            {getFileName()}
                        </span>
                    </Tooltip>
                </Wrapper>
            );
        }

        let text = lastActivity.text;
        if (text?.length > 500) {
            text = text?.slice(0, 500) + '...';
        }

        const formatedTitle = !!lastActivity ? (text ? formattingWhatsappText(text.trim()) : null) : null;
        let numWords = lastActivity.text?.split(' ')?.length;
        let bigText = numWords > 30 ? 550 : 55;

        const reactionMessage = () => {
            if (lastActivity?.data?.reactionHash && text) {
                return `${lastActivity?.from?.name || 'Visitante'} ${getTranslation('reacted with')} "${text}" ${getTranslation('to a message')}`
            }
        }

        const replyButtonMessage = () => {
            if (lastActivity?.data?.replyTitle) {
                return lastActivity?.data?.replyTitle
            }
        }

        return (
            <Wrapper truncate flexBox>
                {!clientMessage && (
                    <Wrapper margin='0 1px 0 0'>
                        <AckMessage ackType={lastActivity.ack} />
                    </Wrapper>
                )}
                <Tooltip
                    mouseLeaveDelay={0}
                    mouseEnterDelay={0.4}
                    placement='rightTop'
                    title={reactionMessage() || replyButtonMessage() || formatedTitle}
                    overlayInnerStyle={{ minWidth: bigText, width: 'auto', fontSize: fontSize }}
                >
                    <span
                        style={{
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            display: 'inline-block',
                        }}
                    >
                        {reactionMessage() || replyButtonMessage() || formatedTitle}
                    </span>
                </Tooltip>
            </Wrapper>
        );
    };

    return lastActivityPreview();
};

export default I18n(LastActivityPreview) as FC<LastActivityPreviewProps>;
