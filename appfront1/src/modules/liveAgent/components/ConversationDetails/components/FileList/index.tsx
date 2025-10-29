import { IdentityType } from 'kissbot-core';
import { FC, useEffect, useMemo, useState } from 'react';
import { Icon, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { downloadAllFiles } from '../../../../../../utils/DownloadAllFile';
import { timeout } from '../../../../../../utils/Timer';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { FileAttachment } from '../../../../interfaces/conversation.interface';
import { AttachmentService } from '../../../../service/Atttachment.service';
import CardWrapper from '../CardWrapper';
import { Label } from '../Common/common';
import { FileListProps } from './props';
import { DownloadAllFiles, DownloadIcon, Miniature, ModalFilesIcon } from './styled';

const FileList: FC<FileListProps & I18nProps> = ({ getTranslation, conversation, openImage, openModal }) => {
    const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>(conversation.fileAttachments);

    useEffect(() => {
        setFileAttachments(conversation.fileAttachments || []);
    }, [conversation.fileAttachments]);

    const attachmentsReceivedFiltered = useMemo((): FileAttachment[] => {
        if (conversation?.fileAttachments?.length) {
            return [];
        }
        const memberUserId = conversation?.members?.find((member) => member.type === IdentityType.user)?.id;
        if (!memberUserId) {
            return [];
        }
        return conversation?.fileAttachments?.filter(
            (att) => att?.memberId === memberUserId && !att?.mimeType?.startsWith('audio')
        );
    }, [conversation?.fileAttachments, conversation?.members]);

    const isImageFile = (fileAttachment: FileAttachment) => AttachmentService.isImageFile(fileAttachment.mimeType);

    const handleOpenFile = (activity: FileAttachment) => {
        if (isImageFile(activity)) {
            openImage(activity);
        }
    };

    const onScrollToActivity = (attachmentId?: string) => {
        const hash = conversation?.activities?.find((act) => act?.attachmentFile?.id === attachmentId)?.hash;

        if (!hash) {
            return;
        }
        const event = new CustomEvent('scrollActivity', {
            detail: {
                conversationId: conversation._id,
                activityHash: hash,
            },
        });
        timeout(() => window.dispatchEvent(event), 300);
    };

    const fileDinamicProps = (fileAttachment: FileAttachment) => {
        const { mimeType } = fileAttachment;
        const attachmentUrl = AttachmentService.createAttachmentUrl(conversation._id, fileAttachment._id as string);

        if (mimeType.startsWith('application/pdf'))
            return {
                icon: 'file-pdf',
                action: () => openImage(fileAttachment),
            };
        else if (mimeType.startsWith('audio'))
            return {
                icon: 'volume-high',
                action: onScrollToActivity,
            };
        else if (mimeType.startsWith('video'))
            return {
                icon: 'video-box',
                action: onScrollToActivity,
            };
        else {
            return {
                icon: 'file-document',
                action: onScrollToActivity,
            };
        }
    };

    const ComponentFile = (fileAttachment, fileProps) => {
        const isPdf = fileAttachment.mimeType?.startsWith('application/pdf');
        
        return (
            <Wrapper
                key={fileAttachment?._id}
                bgcolor={isPdf ? '#f8d7da' : '#cfe9ba'}
                margin='3px'
                width='30%'
                height='70px'
                textAlign='center'
                borderRadius='3px'
                padding='8px 3px'
                title={fileAttachment?.name}
                cursor={!!fileProps?.action ? 'pointer' : 'auto'}
                onClick={() => fileProps?.action?.(fileAttachment?._id)}
                color={isPdf ? '#721c24' : 'inherit'}
            >
                <Icon 
                    name={fileProps?.icon} 
                    size='18px' 
                    margin='8px 0 0 0'
                    color={isPdf ? '#721c24' : 'inherit'}
                />
                <Wrapper
                    height='fit-content'
                    margin='auto 0'
                    padding='0 4px'
                    fontSize='12px'
                    color={isPdf ? '#721c24' : 'inherit'}
                    style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {fileAttachment?.name}
                </Wrapper>
            </Wrapper>
        );
    };

    return fileAttachments?.length > 0 ? (
        <CardWrapper>
            <Wrapper minHeight='46px'>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                        <Label title={`${getTranslation('Files')}`}>{`${getTranslation('Files')}:`}</Label>
                        {attachmentsReceivedFiltered?.length ? (
                            <DownloadAllFiles
                                onClick={() =>
                                    downloadAllFiles(conversation._id, attachmentsReceivedFiltered, conversation?.iid)
                                }
                                title={getTranslation('Download all received files (except audio)')}
                            >
                                <DownloadIcon />
                            </DownloadAllFiles>
                        ) : null}
                    </div>
                    {fileAttachments.length > 3 && (
                        <ModalFilesIcon title={getTranslation('Show more')} onClick={() => openModal('files')} />
                    )}
                </div>
                <Wrapper
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                    }}
                >
                    {fileAttachments.slice(0, 3).map((fileAttachment) => {
                        const fileProps = fileDinamicProps(fileAttachment);
                        const attachmentUrl = AttachmentService.createAttachmentUrl(
                            conversation._id,
                            fileAttachment._id as string
                        );

                        return AttachmentService.isImageFile(fileAttachment?.mimeType) ? (
                            fileAttachment.mimeType === 'image/heic' ? (
                                ComponentFile(fileAttachment, fileProps)
                            ) : (
                                <Miniature
                                    title={fileAttachment?.name}
                                    key={fileAttachment?._id}
                                    margin='3px'
                                    width='30%'
                                    height='70px'
                                    textAlign='center'
                                    borderRadius='3px'
                                    attachmentUrl={attachmentUrl}
                                    onClick={() => handleOpenFile(fileAttachment)}
                                ></Miniature>
                            )
                        ) : (
                            ComponentFile(fileAttachment, fileProps)
                        );
                    })}
                </Wrapper>
            </Wrapper>
        </CardWrapper>
    ) : null;
};

export default i18n(FileList) as FC<FileListProps>;
