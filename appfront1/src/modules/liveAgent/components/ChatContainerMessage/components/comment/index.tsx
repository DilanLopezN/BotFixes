import { CloseOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Typography } from 'antd';
import { ActivityType } from 'kissbot-core';
import merge from 'lodash/merge';
import { FC, useRef, useState } from 'react';
import { v4 } from 'uuid';
import { ActionTypes } from '../..';
import { generateId } from '../../../../../../helpers/hex';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Activity } from '../../../../interfaces/activity.interface';
import { AttachmentService, validateWhatsappFile } from '../../../../service/Atttachment.service';
import EmojiSelector from '../../../EmojiSelector';
import { EmoticonIcon, FileIcon, SendIcon, TextareaContainer } from '../../styled';
import TextAreaAutoSize from '../../textarea-auto-size';
import { TextareaCommentProps } from './props';

const TextareaComment: FC<TextareaCommentProps & I18nProps> = ({
    getTranslation,
    conversation,
    buttonTypes,
    focusTextArea,
    loggedUser,
    emptyActivity,
    sendActivity,
    disabled,
}) => {
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [openedEmoji, setOpenedEmoji] = useState(false);
    const [actionSelected, setActionSelected] = useState<ActionTypes | undefined>(undefined);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const createCommentActivity = async () => {
        if (!currentMessage.trim() && selectedFiles.length === 0) {
            return;
        }

        const message = currentMessage.trim();

        if (!conversation || (message === '' && selectedFiles.length === 0)) {
            return;
        }

        try {
            if (selectedFiles.length > 0) {
                setIsUploading(true);

                for (let i = 0; i < selectedFiles.length; i++) {
                    const formData = new FormData();
                    formData.append('attachment', selectedFiles[i]);

                    if (message && i === 0) {
                        formData.append('message', message);
                    }

                    formData.append('type', 'comment');

                    await AttachmentService.sendAttachment(conversation._id, loggedUser._id, formData);
                }

                setIsUploading(false);
                setCurrentMessage('');
                setSelectedFiles([]);
                setFileError(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                focusTextArea();
                return;
            }

            const activity: Activity = {
                ...merge(emptyActivity, {
                    uuid: v4(),
                    text: currentMessage,
                    type: ActivityType.comment,
                    from: {
                        _id: loggedUser._id,
                        id: loggedUser._id,
                        name: loggedUser.name,
                    },
                    to: {
                        _id: loggedUser._id,
                        id: loggedUser._id,
                        name: loggedUser.name,
                    },
                    conversationId: conversation._id,
                    hash: generateId(20),
                    quoted: null,
                }),
            };

            setCurrentMessage('');
            sendActivity(activity);
            focusTextArea();
        } catch (error) {
            setIsUploading(false);
        }
    };

    const onEmojiSelected = (emoji: string) => {
        setCurrentMessage((prevState) => `${prevState}${emoji}`);
    };

    const textAreaKeyPress = async (event: any) => {
        if (event.keyCode === 13 && event.shiftKey === false) {
            event.preventDefault();
            await createCommentActivity();
        }
    };

    const onChangeInputText = (e: any) => {
        const { value } = e.target;
        setCurrentMessage(value);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        if (fileArray.length > 5) {
            setFileError(getTranslation('You can select up to 5 files at once'));
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setTimeout(() => setFileError(null), 3000);
            return;
        }

        const invalidFiles: string[] = [];
        const validFiles: File[] = [];

        fileArray.forEach((file) => {
            const validation = validateWhatsappFile(file);
            if (!validation.isValid) {
                invalidFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        });

        if (invalidFiles.length > 0) {
            setFileError(`${getTranslation('Invalid files')}: ${invalidFiles.join(', ')}`);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setTimeout(() => setFileError(null), 3000);
            return;
        }

        setFileError(null);
        setSelectedFiles(validFiles);
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';

        const bytesPerUnit = 1024;
        const sizeUnits = ['Bytes', 'KB', 'MB'];
        const unitIndex = Math.floor(Math.log(bytes) / Math.log(bytesPerUnit));
        const convertedSize = bytes / Math.pow(bytesPerUnit, unitIndex);

        return `${parseFloat(convertedSize.toFixed(1))} ${sizeUnits[unitIndex]}`;
    };

    return (
        <>
            <TextareaContainer disabled={!conversation.assumed || conversation?.invalidNumber}>
                <Wrapper opacity={!conversation.assumed || conversation?.invalidNumber ? '0.5' : '1'}>
                    {selectedFiles.length > 0 && (
                        <div
                            style={{
                                backgroundColor: isUploading ? '#f0f8ff' : '#e6f3ff',
                                padding: '8px 12px',
                                borderRadius: '.3em .3em 0 0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                margin: '0 0 -1px 0',
                                border: '1px solid #d1d5db',
                            }}
                        >
                            {selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <Space align='center'>
                                        <Typography.Text type='secondary' style={{ fontSize: '12px' }}>
                                            <FileIcon style={{ marginRight: '4px', fontSize: '12px' }} />
                                            {file.name} ({formatFileSize(file.size)})
                                        </Typography.Text>
                                    </Space>
                                    <Button
                                        type='text'
                                        size='small'
                                        icon={<CloseOutlined />}
                                        onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                                        disabled={isUploading}
                                        title={getTranslation('Remove file')}
                                    />
                                </div>
                            ))}
                            {isUploading && (
                                <span style={{ fontSize: '11px', color: '#1890ff' }}>
                                    {getTranslation('Sending...')}
                                </span>
                            )}
                        </div>
                    )}
                    {fileError && <Alert style={{ marginBottom: '8px' }} message={fileError} type='error' showIcon />}
                    <TextAreaAutoSize
                        id={`chatContainerTextInput`}
                        placeholder={`${getTranslation(
                            'Create an annotation that will be available only at the attendance'
                        )}`}
                        autoFocus
                        tabIndex={101}
                        maxLength={4096}
                        value={currentMessage}
                        onChange={onChangeInputText}
                        disabled={disabled || isUploading}
                        onKeyDown={textAreaKeyPress}
                    />

                    <Wrapper
                        bgcolor='#fff6cc'
                        padding='0 12px'
                        borderRadius=' 0 0 .3em .3em'
                        flexBox
                        margin='-7px 0 0 0'
                        height='36px'
                        alignItems='center'
                        justifyContent='space-between'
                    >
                        {buttonTypes}

                        <Space>
                            <input
                                ref={fileInputRef}
                                type='file'
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                accept='*/*'
                                disabled={isUploading}
                                multiple
                            />

                            <EmojiSelector
                                onSelect={onEmojiSelected}
                                opened={openedEmoji}
                                onClose={() => setOpenedEmoji(false)}
                            >
                                <EmoticonIcon
                                    title={getTranslation('Emoticons')}
                                    onClick={() => {
                                        if (!conversation.assumed || conversation?.invalidNumber || isUploading) return;

                                        if (actionSelected === ActionTypes.emoticons) {
                                            setOpenedEmoji(false);
                                            return setActionSelected(undefined);
                                        }

                                        setActionSelected(ActionTypes.emoticons);
                                        setOpenedEmoji(true);
                                    }}
                                />
                            </EmojiSelector>
                            <FileIcon
                                title={isUploading ? getTranslation('Sending...') : getTranslation('Upload file')}
                                onClick={() => {
                                    if (
                                        disabled ||
                                        isUploading ||
                                        !conversation?.assumed ||
                                        conversation?.invalidNumber
                                    )
                                        return;
                                    fileInputRef.current?.click();
                                }}
                                style={{
                                    opacity:
                                        disabled || isUploading || !conversation?.assumed || conversation?.invalidNumber
                                            ? 0.5
                                            : 1,
                                    cursor:
                                        disabled || isUploading || !conversation?.assumed || conversation?.invalidNumber
                                            ? 'not-allowed'
                                            : 'pointer',
                                }}
                            />
                            <SendIcon
                                title={isUploading ? getTranslation('Sending...') : getTranslation('Send')}
                                disabled={!conversation?.assumed || conversation?.invalidNumber || isUploading}
                                onClick={(e: any) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    createCommentActivity();
                                }}
                            />
                        </Space>
                    </Wrapper>
                </Wrapper>
            </TextareaContainer>
        </>
    );
};

export default i18n(TextareaComment) as FC<TextareaCommentProps>;
