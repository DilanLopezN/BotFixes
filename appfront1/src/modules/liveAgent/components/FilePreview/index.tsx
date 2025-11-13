import { Progress } from 'antd';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Icon, Wrapper } from '../../../../ui-kissbot-v2/common';
import { timeout } from '../../../../utils/Timer';
import { generateId } from '../../../../helpers/hex';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { AttachmentService } from '../../service/Atttachment.service';
import { TemplateMessage, TemplateType } from '../TemplateMessageList/interface';
import ComponentMessageFile from './components/ComponentMessageFile';
import { FilePreviewProps, FilePreviewItem } from './props';
import { FilePreviewGrid } from './components/FilePreviewGrid';

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
}) => {
    const [uploadingFile, setUploadingFile] = useState<boolean>(false);
    const [uploadPercent, setUploadPercent] = useState<number>(0);
    const [templateVariableValues, setTemplateVariableValues] = useState<string[]>([]);

    const initializeFiles = (): FilePreviewItem[] => {
        if (!filePreview) {
            return [];
        }

        if (Array.isArray(filePreview)) {
            return filePreview.map((item) => ({
                ...item,
                message: item.message || '',
            }));
        }

        return [
            {
                id: generateId(10),
                file: filePreview.file,
                preview: filePreview.preview,
                isImage: filePreview.isImage,
                isPdf: filePreview.isPdf,
                isVideo: filePreview.isVideo,
                template: filePreview.template,
                message: '',
            },
        ];
    };

    const [files, setFiles] = useState<FilePreviewItem[]>(initializeFiles());
    const [selectedFileId, setSelectedFileId] = useState<string | undefined>(
        files.length > 0 ? files[0].id : undefined
    );
    const [templateSelected, setTemplateSelected] = useState<TemplateMessage | undefined>(files[0]?.template);

    const selectedFile = files.find((f) => f.id === selectedFileId);
    const isBatchUpload = files.length > 1;

    const uploadedRef: any = useRef(null);
    uploadedRef.current = {
        uploadingFile,
        setUploadingFile,
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

    const updateFileMessage = useCallback(
        (message: string) => {
            setFiles((prevFiles) => prevFiles.map((f) => (f.id === selectedFileId ? { ...f, message } : f)));
        },
        [selectedFileId]
    );

    const currentFileMessage = selectedFile?.message || '';

    useEffect(() => {
        const newFiles = initializeFiles();
        setFiles(newFiles);

        if (newFiles.length > 0) {
            setSelectedFileId(newFiles[0].id);
        }
    }, [filePreview]);

    useEffect(() => {
        if (files[0]?.template) {
            templateSelectedRef.current.setTemplateSelected(files[0].template);
        }
    }, [files]);

    const handleRemoveFile = useCallback(
        (fileId: string) => {
            const updatedFiles = files.filter((f) => f.id !== fileId);

            if (updatedFiles.length === 0) {
                setFilePreview(false);
                return;
            }

            setFiles(updatedFiles);

            if (selectedFileId === fileId) {
                setSelectedFileId(updatedFiles[0].id);
            }
        },
        [files, selectedFileId, setFilePreview]
    );

    const uploadFile = useCallback(async () => {
        if (!loggedUser?._id) {
            notification({
                title: getTranslation('Error'),
                message: getTranslation('User not authenticated'),
                type: 'danger',
                duration: 3000,
            });
            return;
        }

        console.log('Iniciando upload de', files.length, 'arquivo(s)');

        setUploadingFile(true);
        setUploadPercent(0);

        const progressInterval = setInterval(() => {
            setUploadPercent((prevPercent) => {
                if (prevPercent >= 95) {
                    clearInterval(progressInterval);
                    return 95;
                }
                return prevPercent + 5;
            });
        }, 100);

        try {
            // === Upload via template ===
            if (files[0]?.template && files[0].template?.type === TemplateType.file) {
                console.log('Upload de template file');
                const { _id } = conversation;

                const sendFileTemplate = {
                    templateId: files[0].template._id as string,
                    memberId: loggedUser._id,
                    message: files[0].message || undefined,
                    attributes: templateVariableValues || undefined,
                };

                const sent = await AttachmentService.sendFileTemplate(workspaceId, _id, sendFileTemplate);

                if (!sent) {
                    notification({
                        title: getTranslation('Error'),
                        message: getTranslation('An error has occurred. Try again'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            }

            // === Upload múltiplo (vários arquivos + mensagens) ===
            else if (isBatchUpload) {
                console.log('Enviando batch de', files.length, 'arquivos');

                const formData = new FormData();

                // adiciona os arquivos
                files.forEach((fileItem) => {
                    formData.append('attachments', fileItem.file);
                });

                // adiciona as mensagens em JSON
                const messages = files.map((f) => f.message || '');
                formData.append('messages', JSON.stringify(messages));

                const uploaded = await AttachmentService.sendAttachmentBatch(
                    conversation._id,
                    loggedUser._id,
                    formData
                );

                if (!uploaded) {
                    notification({
                        title: getTranslation('Error'),
                        message: getTranslation('An error has occurred. Try again'),
                        type: 'danger',
                        duration: 3000,
                    });
                } else {
                    notification({
                        title: getTranslation('Success'),
                        message: `${files.length} ${getTranslation('files sent successfully')}`,
                        type: 'success',
                        duration: 3000,
                    });
                }
            }

            // === Upload único ===
            else {
                console.log('Upload único do arquivo:', files[0].file.name);
                const formData = new FormData();
                formData.append('attachment', files[0].file);

                if (files[0].message) {
                    formData.append('message', files[0].message);
                }

                if (templateSelected) {
                    formData.append('templateId', templateSelected._id as string);
                }

                const uploaded = await AttachmentService.sendAttachment(conversation._id, loggedUser._id, formData);

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
            console.error('Erro no upload:', error);
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
        files,
        conversation,
        isBatchUpload,
        getTranslation,
        loggedUser,
        notification,
        setFilePreview,
        templateSelected,
        templateVariableValues,
        workspaceId,
    ]);

    if (files.length === 0) {
        return null;
    }

    return (
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
                        if (!uploadingFile) {
                            setFilePreview(false);
                        }
                    }}
                />
                <Wrapper color='#FFF' fontSize='18px' fontWeight='300' margin='auto 0'>
                    {isBatchUpload
                        ? `${getTranslation('View')} (${files.length} ${getTranslation('files')})`
                        : getTranslation('View')}
                </Wrapper>
                {selectedFile && (
                    <Wrapper color='#FFF' fontSize='12px' position='absolute' right='20px' opacity='0.9'>
                        {selectedFile.file.name}
                    </Wrapper>
                )}
            </Wrapper>

            <Wrapper height='10px' bgcolor='#e9ebeb'>
                {uploadingFile && (
                    <Progress strokeColor='#59a3d6' trailColor='#e9ebeb' percent={uploadPercent} showInfo={false} />
                )}
            </Wrapper>

            <Scroll
                overflowY='auto'
                flexBox
                column
                flex
                bgcolor='#e9ebeb'
                padding='20px'
                opacity={uploadingFile ? '0.8' : '1'}
            >
                {isBatchUpload && (
                    <FilePreviewGrid
                        files={files}
                        onRemove={handleRemoveFile}
                        onSelect={setSelectedFileId}
                        selectedId={selectedFileId}
                    />
                )}

                {selectedFile && (
                    <Wrapper
                        flexBox
                        justifyContent='center'
                        alignItems='center'
                        flex={!isBatchUpload ? 1 : undefined}
                        marginTop={isBatchUpload ? '16px' : '0'}
                        textAlign='center'
                    >
                        {selectedFile.isImage ? (
                            <img
                                alt='preview'
                                src={selectedFile.preview as string}
                                style={{
                                    maxWidth: '97%',
                                    maxHeight: isBatchUpload ? '50vh' : '70vh',
                                    margin: 'auto',
                                    border: '1px solid #ccc',
                                }}
                            />
                        ) : selectedFile.isPdf ? (
                            <Wrapper margin='auto'>
                                <Icon name='file-pdf' size='48px' color='#d32f2f' />
                                <Wrapper marginTop='8px'>{selectedFile.file.name}</Wrapper>
                            </Wrapper>
                        ) : (
                            <Wrapper margin='auto'>
                                <Icon name='file' size='48px' />
                                <Wrapper marginTop='8px'>{selectedFile.file.name}</Wrapper>
                            </Wrapper>
                        )}
                    </Wrapper>
                )}
            </Scroll>

            {!uploadingFile && (
                <ComponentMessageFile
                    conversation={conversation}
                    loggedUser={loggedUser}
                    workspaceId={workspaceId}
                    currentMessage={currentFileMessage}
                    setCurrentMessage={updateFileMessage}
                    setTemplateVariableValues={setTemplateVariableValues}
                    uploadingFile={uploadingFile}
                    channels={channels}
                    teams={teams}
                    uploadFile={uploadFile}
                    template={templateSelected || selectedFile?.template}
                    closePreviewFile={() => {
                        setFiles([]);
                        setFilePreview(false);
                    }}
                />
            )}

            <Wrapper height='60px' bgcolor='#d8d8d8' position='relative' opacity={uploadingFile ? '0.8' : '1'}>
                <Wrapper
                    width='60px'
                    height='60px'
                    position='absolute'
                    top='-31px'
                    right='50px'
                    bgcolor={uploadingFile ? '#6194b8' : '#59a3d6'}
                    borderRadius='45px'
                    textAlign='center'
                    padding='4px 0 0 6px'
                    cursor={uploadingFile ? 'not-allowed' : 'pointer'}
                >
                    <Icon
                        name='send'
                        color={uploadingFile ? '#d1d1d1' : '#FFFFFF'}
                        size='36px'
                        onClick={() => !uploadingFile && uploadFile()}
                    />
                </Wrapper>
            </Wrapper>
        </Wrapper>
    );
};

export default i18n(FilePreview) as FC<FilePreviewProps>;
