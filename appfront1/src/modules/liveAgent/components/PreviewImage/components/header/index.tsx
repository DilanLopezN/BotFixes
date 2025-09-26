import { FC } from 'react';
import { UserAvatar, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Content, IconTag } from './styled';
import moment from 'moment';
import { FileAttachment, Identity } from '../../../../interfaces/conversation.interface';
import DownloadButton from '../downloadButton';
import SendDocumentButton from '../sendDocumentButton';
import { User } from 'kissbot-core';
import { useSelector } from 'react-redux';
import { AttachmentService } from '../../../../service/Atttachment.service';
import { DocumentStatusResponse } from '../../../../service/DocumentService';

interface ModalImageHeaderProps {
    from: Identity | undefined;
    attachment: FileAttachment;
    onClose: () => void;
    onCropping: () => void;
    onRotate: () => void;
    onShowIntegration: () => void;
    onShowDocumentUpload?: () => void;
    loggedUser: User;
    showIntegration: boolean;
    children?: React.ReactNode;
    conversationId: string;
    showPdfPopover?: boolean;
    onClosePdfPopover?: () => void;
    documentStatus?: DocumentStatusResponse | null;
    loadingDocumentStatus?: boolean;
}

const Header: FC<ModalImageHeaderProps & I18nProps> = ({
    getTranslation,
    from,
    attachment,
    onCropping,
    onClose,
    onRotate,
    showIntegration,
    onShowIntegration,
    onShowDocumentUpload,
    conversationId,
    showPdfPopover,
    onClosePdfPopover,
    loadingDocumentStatus,
}) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const attachmentUrl = AttachmentService.createAttachmentUrl(conversationId, attachment?._id as string);

    return (
        <Content>
            {from && (
                <Wrapper flexBox flex>
                    <UserAvatar user={from} margin='auto 12px auto 8px' />
                    <Wrapper margin='auto 0'>
                        <span style={{ color: '#000' }}>{from.name}</span>
                        <br />
                        {attachment.timestamp && (
                            <span
                                style={{
                                    fontSize: '12px',
                                }}
                            >
                                {moment(attachment?.timestamp).format('HH:ss DD/MM/YYYY')}
                            </span>
                        )}
                    </Wrapper>
                </Wrapper>
            )}
            {showIntegration && (
                <Wrapper alignItems='center' flexBox margin='0 38px 0 0'>
                    <IconTag title={getTranslation('Crop')} className='mdi mdi-crop' onClick={onCropping} />
                </Wrapper>
            )}
            {/* Botão para envio de anexo para agendamentos */}
            {onShowDocumentUpload && (
                <SendDocumentButton 
                    onClick={onShowDocumentUpload} 
                    loading={loadingDocumentStatus}
                />
            )}
            {/* @TODO: remover id fixo */}
            {(selectedWorkspace?._id === '5ee0f255afd25a000704aba9' ||
                selectedWorkspace?._id === '5d72b996c14f04001b7afe8b') && (
                <Wrapper alignItems='center' flexBox margin='0 0 0 18px'>
                    <IconTag title={getTranslation('Upload')} className='mdi mdi-upload' onClick={onShowIntegration} />
                </Wrapper>
            )}
            {!AttachmentService.isPdfFile(attachment.mimeType) && (
                <Wrapper alignItems='center' flexBox margin='0 0 0 18px'>
                    <IconTag
                        style={{
                            fontSize: '22px',
                            transform: 'scale(-1, 1)',
                        }}
                        title={getTranslation('Rotate')}
                        className='mdi mdi-format-rotate-90'
                        onClick={onRotate}
                    />
                </Wrapper>
            )}
            <DownloadButton 
                fileName={attachment.name} 
                url={attachmentUrl} 
                showPdfPopover={showPdfPopover}
                onClosePdfPopover={onClosePdfPopover}
                isPdfFile={AttachmentService.isPdfFile(attachment.mimeType)}
            />
            <Wrapper alignItems='center' flexBox margin='0 15px 0 18px'>
                <IconTag title={getTranslation('Title')} className='mdi mdi-close' onClick={onClose} />
            </Wrapper>
        </Content>
    );
};

export default i18n(Header) as FC<ModalImageHeaderProps>;
