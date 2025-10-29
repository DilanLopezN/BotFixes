import React, { FC } from 'react';
import moment from 'moment';
import { ActivityType, IdentityType } from 'kissbot-core';
import { Icon } from '../../../../ui-kissbot-v2/common';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import { ExportConversationButtonProps } from './props';
import { AttachmentService } from '../../service/Atttachment.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import emojiRegex from 'emoji-regex';
import { useWindowSize } from '../../hooks/use-window-size';
import { breakpoint } from '../ChatContainerHeader';
import { Row } from 'antd';

const ExportConversationButton: FC<ExportConversationButtonProps & I18nProps> = ({
    conversation,
    groupedMessages,
    getTranslation,
}) => {
    const windowSize = useWindowSize();
    const isSmallScreen = windowSize.width < breakpoint;
    const resolveActivityUserName = (activity): string => {
        switch (activity.from.type) {
            case IdentityType.bot:
                return getTranslation('Bot');
            case IdentityType.agent:
                return `${getTranslation('Agent')} ${activity.from.name}`;
            default:
                return activity.from.name;
        }
    };

    const resolveActivityMessage = (activity): string => {
        switch (activity.type) {
            case ActivityType.message:
                const attachmentsContent = [
                    activity?.attachments?.[0]?.content?.title,
                    activity?.attachments?.[0]?.content?.subtitle,
                    activity?.attachments?.[0]?.content?.text,
                ];

                if (attachmentsContent.some((item) => !!item)) {
                    return attachmentsContent.find((item) => !!item);
                }

                if (activity.text) {
                    return activity.text;
                }

                return getTranslation('Sent a message');
            case ActivityType.member_upload_attachment:
                const attachmentUrl = AttachmentService.createAttachmentUrl(
                    conversation._id,
                    activity.attachmentFile?.id
                );

                if (activity.attachmentFile.contentType.match(/^image\/*/)) {
                    return `${getTranslation('Sent an image')} ${attachmentUrl}`;
                }

                if (activity.attachmentFile.contentType.match(/^video\/*/)) {
                    return `${getTranslation('Sent a video')} ${attachmentUrl}`;
                }

                if (activity.attachmentFile.contentType.match(/^audio\/*/)) {
                    return `${getTranslation('Sent an audio')} ${attachmentUrl}`;
                }

                return `${getTranslation('Sent a file')} ${attachmentUrl}`;
            default:
                return getTranslation('Sent a message');
        }
    };

    const makeFileContent = (doc: jsPDF) => {
        const activities = Object.keys(groupedMessages).reduce<any[]>((accumulator, date) => {
            for (const activity of groupedMessages[date]) {
                const isExportable = [ActivityType.message, ActivityType.member_upload_attachment].includes(
                    activity.type
                );

                if (isExportable) {
                    accumulator.push(activity);
                }
            }

            return accumulator;
        }, []);

        activities.reverse();

        const conversationArray = activities.reduce((contents, activity) => {
            const time = moment(activity.timestamp).format('HH:mm');
            const date = moment(activity.timestamp).format('DD/MM/YYYY');
            const hasButtons = activity.type === ActivityType.message && activity?.attachments?.[0]?.content?.buttons;
            let text;

            text = `[${time}, ${date}] ${resolveActivityUserName(activity)}: ${resolveActivityMessage(activity)}\n`;

            if (hasButtons) {
                for (const button of activity.attachments[0].content.buttons) {
                    text += `${' '.repeat(25)}[${getTranslation('Button')}] ${button.title}\n`;
                }
            }

            try {
                const regex = emojiRegex();

                contents.push([text.replace(regex, '')]);
            } catch (e) {
                console.log(e);
                contents.push([text]);
            }

            return contents;
        }, []);

        autoTable(doc, {
            body: conversationArray,
        });

        doc.save(`${getTranslation('Conversation').toLowerCase()}-${conversation.iid}.pdf`);
    };

    const handleFileDownload = () => {
        const doc = new jsPDF({
            unit: 'pt',
            format: 'a4',
            orientation: 'p',
        });

        makeFileContent(doc);
    };

    return (
        <Row onClick={handleFileDownload} align={'middle'} style={{ width: '100%' }}>
            <Icon
                // style={{ display: 'flex', alignItems: 'center' }}
                title={getTranslation('Download conversation')}
                name='file-download'
                size='24px'
            />
            {isSmallScreen && <span style={{ marginLeft: 8 }}>{getTranslation('Exportar')}</span>}
        </Row>
    );
};

export default i18n(ExportConversationButton) as FC<ExportConversationButtonProps>;
