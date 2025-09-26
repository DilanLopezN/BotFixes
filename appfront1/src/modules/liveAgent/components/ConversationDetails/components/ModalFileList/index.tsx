import { FC, useEffect, useState } from 'react'
import styled from 'styled-components';
import { Icon, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { FileAttachment } from '../../../../interfaces/conversation.interface';
import { AttachmentService } from '../../../../service/Atttachment.service';
import { Miniature } from '../FileList/styled';
import { timeout } from '../../../../../../utils/Timer';

const DynamicSize = styled(Wrapper)`
    width: 77px;
    margin: 5px;
    
    @media screen and (max-width: 1400px) {
        width: 72px;
    }
`;

interface ModalFileListProps {
    openImage: Function;
    conversation: any;
}

export const ModalFileList: FC<ModalFileListProps> = ({
    conversation,
    openImage,
}) => {
    const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>(conversation.fileAttachments);

    useEffect(() => {
        setFileAttachments(conversation.fileAttachments);

    }, [conversation.fileAttachments])

    const isImageFile = (fileAttachment: FileAttachment) => AttachmentService.isImageFile(fileAttachment.mimeType);

    const handleOpenFile = activity => {
        if (isImageFile(activity)) {
            openImage(activity);
        }
    }

    const onScrollToActivity = (attachmentId?: string) => {
        const hash = conversation?.activities?.find(act => act?.attachmentFile?.id === attachmentId)?.hash;

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
    }

    const fileDinamicProps = (fileAttachment: FileAttachment) => {
        const { mimeType } = fileAttachment;
        const attachmentUrl = AttachmentService.createAttachmentUrl(conversation._id, fileAttachment._id as string);

        if (mimeType.startsWith('application/pdf'))
            return {
                icon: 'file-pdf',
                action: () => openImage(fileAttachment),
            }

        else if (mimeType.startsWith('audio'))
            return {
                icon: 'volume-high',
                action: onScrollToActivity,
            }

        else if (mimeType.startsWith('video'))
            return {
                icon: 'video-box',
                action: onScrollToActivity,
            }

        else {
            return {
                icon: 'file-document',
                action: onScrollToActivity,
            }
        }
    }

    const ComponentFile = (fileAttachment, fileProps) => {
        const isPdf = fileAttachment.mimeType?.startsWith('application/pdf');
        
        return (
            <DynamicSize>
                <Wrapper
                    key={fileAttachment._id}
                    bgcolor={isPdf ? '#f8d7da' : '#cfe9ba'}
                    width='100%'
                    height='70px'
                    textAlign='center'
                    borderRadius='3px'
                    padding='8px 3px'
                    title={fileAttachment.name}
                    cursor={!!fileProps.action ? 'pointer' : 'auto'}
                    onClick={() => fileProps?.action?.(fileAttachment?._id)}
                    color={isPdf ? '#721c24' : 'inherit'}
                >
                    <Icon 
                        name={fileProps.icon} 
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
                        {fileAttachment.name}
                    </Wrapper>
                </Wrapper>
            </DynamicSize>
        );
    };

    return (
        <div
            style={{
                display: 'inline-flex',
                flexWrap: 'wrap',
            }}
        >
            {fileAttachments?.map((fileAttachment) => {
                const fileProps = fileDinamicProps(fileAttachment);
                const attachmentUrl = AttachmentService.createAttachmentUrl(
                    conversation._id,
                    fileAttachment._id as string
                );

                return AttachmentService.isImageFile(fileAttachment.mimeType) ? (
                    fileAttachment.mimeType === 'image/heic' ? (
                        ComponentFile(fileAttachment, fileProps)
                    ) : (
                        <DynamicSize>
                            <Miniature
                                title={fileAttachment.name}
                                key={fileAttachment._id}
                                width='100%'
                                height='70px'
                                textAlign='center'
                                borderRadius='3px'
                                attachmentUrl={attachmentUrl}
                                onClick={() => handleOpenFile(fileAttachment)}
                            ></Miniature>
                        </DynamicSize>
                    )
                ) : (
                    ComponentFile(fileAttachment, fileProps)
                );
            })}
        </div>
    );
}
