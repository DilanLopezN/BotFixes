import { Progress } from 'antd';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Icon, Wrapper } from '../../../../ui-kissbot-v2/common';
import { timeout } from '../../../../utils/Timer';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { AttachmentService } from '../../service/Atttachment.service';
import { TemplateMessage, TemplateType } from '../TemplateMessageList/interface';
import ComponentMessageFile from './components/ComponentMessageFile';
import { FilePreviewProps } from './props';
const LazyPDFPreview = React.lazy(() => import('../PdfPreview'));

const Scroll = styled(Wrapper)`
    &::-webkit-scrollbar {
        height: 5px;
        width: 5px;
    }

    &::-webkit-scrollbar-track {
        border-radius: 0px;
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(17, 17, 17, 0.3);
        border-radius: 0px;
        box-shadow: none;
    }
`;

const FilePreview: FC<FilePreviewProps & I18nProps> = ({
    getTranslation,
    filePreview,
    notification,
    setFilePreview,
    conversation,
    loggedUser,
    workspaceId,
    channels,
    teams,
    replayActivity,
    isFocusOnReply,
    setIsFocusOnReply,
}) => {
    const [uploadingFile, setUploadingFile] = useState<boolean>(false);
    const [uploadPercent, setUploadPercent] = useState<number>(0);
    const [numPagesPdf, setNumPagesPdf] = useState<number>(0);
    const [currentMessage, setCurrentMessage] = useState('');
    const [templateVariableValues, setTemplateVariableValues] = useState<string[]>([]);
    const [templateSelected, setTemplateSelected] = useState<TemplateMessage | undefined>(filePreview?.template);

    const uploadedRef: any = useRef(null);
    uploadedRef.current = {
        uploadingFile,
        setUploadingFile,
    };

    const currentMessageRef: any = useRef(null);
    currentMessageRef.current = {
        currentMessage,
        setCurrentMessage,
    };

    const templateVariableValuesRef: any = useRef(null);
    templateVariableValuesRef.current = {
        templateVariableValues,
        setTemplateVariableValues,
    };

    const templateSelectedRef: any = useRef(null);
    templateSelectedRef.current = {
        templateSelected,
        setTemplateSelected,
    };

    useEffect(() => {
        templateSelectedRef.current.setTemplateSelected(filePreview?.template);
    }, [filePreview?.template]);

    const uploadFileOnConversation = useCallback(
        async (formData) => {
            const { _id } = conversation;
            if (!loggedUser) return;
            const uploaded = await AttachmentService.sendAttachment(_id, loggedUser._id, formData);

            currentMessageRef.current.setCurrentMessage('');
            setTemplateSelected(undefined);
            // setIsFocusOnReply(false);
            return uploaded;
        },
        [conversation, loggedUser]
    );

    const uploadFile = useCallback(async () => {
        if (uploadedRef.current.uploadingFile) {
            return;
        }
        setUploadingFile(true);
        setUploadPercent(5);

        let progressInterval = setInterval(() => {
            uploadPercent <= 90 && setUploadPercent(uploadPercent + 10);
        }, 800);

        try {
            if (templateSelectedRef.current.templateSelected?.type === TemplateType.file) {
                const { _id } = conversation;
                let error;

                await AttachmentService.sendFileTemplate(
                    workspaceId,
                    _id,
                    {
                        memberId: loggedUser._id as string,
                        templateId: templateSelectedRef.current.templateSelected._id as string,
                        message:
                            currentMessageRef.current.currentMessage ||
                            templateSelectedRef.current.templateSelected?.message,
                        attributes: templateVariableValuesRef.current.templateVariableValues || [],
                        // quoted: isFocusOnReply ? replayActivity?.hash : null,
                    },
                    (err) => {
                        error = err;
                    }
                );

                if (!error) {
                    setCurrentMessage('');
                    notification({
                        title: getTranslation('Success'),
                        message: getTranslation('Template sent successfully'),
                        type: 'success',
                        duration: 3000,
                    });
                } else {
                    notification({
                        title: getTranslation('Error'),
                        message: getTranslation('An error has occurred. Try again'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            } else {
                const formData = new FormData();
                formData.append('attachment', filePreview.file);
                formData.append('message', currentMessageRef.current.currentMessage || '');
                formData.append('attributes', templateVariableValuesRef.current.templateVariableValues || []);

                if (templateSelectedRef.current.templateSelected) {
                    formData.append('templateId', templateSelectedRef.current.templateSelected._id as string);
                }

                const uploaded = await uploadFileOnConversation(formData);
                if (!uploaded) {
                    notification({
                        title: getTranslation('Error'),
                        message: getTranslation('An error has occurred. Try again'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            }
        } catch (error) {
            notification({
                title: getTranslation('Error'),
                message: getTranslation('An error has occurred. Try again'),
                type: 'danger',
                duration: 3000,
            });
        }

        clearInterval(progressInterval);
        setUploadPercent(100);

        timeout(() => {
            setFilePreview(false);
            setUploadingFile(false);
        }, 1500);
    }, [
        conversation,
        filePreview.file,
        getTranslation,
        loggedUser._id,
        notification,
        setFilePreview,
        uploadFileOnConversation,
        uploadPercent,
        workspaceId,
    ]);

    useEffect(() => {
        if (uploadedRef.current.uploadingFile === false && !!filePreview) {
            const sendWithEnter = (event: KeyboardEvent) => {
                const keyCode = event.key;
                if (
                    templateSelectedRef.current.templateSelected &&
                    templateSelectedRef.current.templateSelected?.variables?.length &&
                    templateSelectedRef.current.templateSelected?.variables?.length >
                        templateVariableValuesRef.current.templateVariableValues?.length
                ) {
                    return;
                }
                if (keyCode === 'Enter' && !event.shiftKey) {
                    uploadFile();
                }
            };
            window.addEventListener('keyup', sendWithEnter);
            return () => {
                templateVariableValuesRef.current.setTemplateVariableValues([]);
                window.removeEventListener('keyup', sendWithEnter);
            };
        }
    }, [filePreview, uploadFile]);

    return !!filePreview ? (
        <Wrapper
            position='absolute'
            flexBox
            column
            bgcolor='#FFF'
            margin='65px 0 0 0'
            width='100%'
            height='100%'
            style={{
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                zIndex: '9',
            }}
        >
            <Wrapper flexBox height='50px' bgcolor='#59a3d6' position='relative'>
                <Icon
                    name='close'
                    color='#FFF'
                    size='24px'
                    margin='auto 20px'
                    onClick={() => {
                        if (!uploadedRef.current.uploadingFile) {
                            currentMessageRef.current.setCurrentMessage('');
                            templateVariableValuesRef.current.setTemplateVariableValues([]);
                            templateSelectedRef.current.setTemplateSelected(undefined);
                            setFilePreview(false);
                        }
                    }}
                />
                <Wrapper color='#FFF' fontSize='18px' fontWeight='300' margin='auto 0'>
                    {getTranslation('View')}
                </Wrapper>
                {filePreview.isPdf && (
                    <Wrapper
                        flexBox
                        flexDirection='column'
                        alignItems='center'
                        color='#f5f5f5'
                        fontSize='14px'
                        position='absolute'
                        top='5px'
                        left='47%'
                    >
                        <Wrapper color='#f5f5f5' fontWeight='bold'>
                            {filePreview?.file?.name}
                        </Wrapper>
                        {numPagesPdf ? `${numPagesPdf} ${getTranslation('pages')}` : null}
                    </Wrapper>
                )}
            </Wrapper>

            <Wrapper height='10px' bgcolor='#e9ebeb'>
                {!!uploadedRef.current.uploadingFile && (
                    <Progress strokeColor='#59a3d6' trailColor='#e9ebeb' percent={uploadPercent} showInfo={false} />
                )}
            </Wrapper>

            <Scroll
                overflowY='auto'
                flexBox
                flex
                textAlign='center'
                bgcolor='#e9ebeb'
                padding='20px'
                opacity={uploadedRef.current.uploadingFile ? '0.8' : '1'}
            >
                {!!filePreview.isImage ? (
                    <img
                        alt='preview'
                        src={filePreview.preview}
                        style={{
                            maxWidth: '97%',
                            maxHeight: '60vh',
                            margin: 'auto',
                        }}
                    />
                ) : !!filePreview.isPdf ? (
                    <>
                        {filePreview?.template ? (
                            <>
                                <iframe
                                    src={filePreview?.preview}
                                    title='File Preview'
                                    style={{ width: '85%', height: '90%', margin: '0 auto' }}
                                ></iframe>
                            </>
                        ) : (
                            <React.Suspense
                                fallback={
                                    <Wrapper
                                        flexBox
                                        width='100%'
                                        justifyContent='center'
                                        alignItems='center'
                                        height='100%'
                                    >
                                        {`${getTranslation('Loading')}..`}
                                    </Wrapper>
                                }
                            >
                                <LazyPDFPreview onNumPages={(num) => setNumPagesPdf(num)} filePreview={filePreview} />
                            </React.Suspense>
                        )}
                    </>
                ) : (
                    <Wrapper margin='auto'>
                        <Icon name='file' size='48px' />
                        <Wrapper>{filePreview?.file?.name || filePreview?.template?.fileOriginalName}</Wrapper>
                    </Wrapper>
                )}
            </Scroll>

            {((!!templateSelectedRef.current.templateSelected &&
                !!templateSelectedRef.current.templateSelected?.isHsm) ||
                filePreview.isImage) && (
                <ComponentMessageFile
                    conversation={conversation}
                    loggedUser={loggedUser}
                    workspaceId={workspaceId}
                    currentMessage={currentMessageRef.current.currentMessage}
                    setCurrentMessage={(value: string) => {
                        currentMessageRef.current.setCurrentMessage(value);
                    }}
                    setTemplateVariableValues={(value) =>
                        templateVariableValuesRef.current.setTemplateVariableValues(value)
                    }
                    uploadingFile={uploadedRef.current.uploadingFile}
                    channels={channels}
                    teams={teams}
                    uploadFile={uploadFile}
                    template={templateSelectedRef.current.templateSelected || filePreview?.template}
                    closePreviewFile={() => {
                        currentMessageRef.current.setCurrentMessage('');
                        templateSelectedRef.current.setTemplateSelected(undefined);
                        setFilePreview(false);
                    }}
                />
            )}

            <Wrapper
                height='157px'
                bgcolor='#d8d8d8'
                position='relative'
                opacity={uploadedRef.current.uploadingFile ? '0.8' : '1'}
            >
                <Wrapper
                    width='60px'
                    height='60px'
                    position='absolute'
                    top='-31px'
                    right='50px'
                    bgcolor={uploadedRef.current.uploadingFile ? '#6194b8' : '#59a3d6'}
                    borderRadius='45px'
                    textAlign='center'
                    padding='4px 0 0 6px'
                >
                    <Icon
                        name='send'
                        color={uploadedRef.current.uploadingFile ? '#d1d1d1' : '#FFFFFF'}
                        size='36px'
                        onClick={() => !uploadedRef.current.uploadingFile && uploadFile()}
                    />
                </Wrapper>
            </Wrapper>
        </Wrapper>
    ) : null;
};

export default i18n(FilePreview) as FC<FilePreviewProps>;
