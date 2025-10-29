import { FileTextOutlined } from '@ant-design/icons';
import { Input, Popover, Space } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import { useEffect, useRef, useState } from 'react';
import I18n from '../../../../../../i18n/components/i18n';
import { MessageInputProps } from './interfaces';
import { Container } from './styles';
import { TemplatePopover } from './template-popover';

const MessageInputComponent = ({
    isExpired,
    hasResponse,
    conversation,
    channels,
    value,
    onChange,
    getTranslation,
    setCurrentStep,
    setSelectedTemplate,
}: MessageInputProps) => {
    const textAreaRef = useRef<TextAreaRef>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handlePopoverOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onChange('');
        }

        if (!value) {
            setIsPopoverOpen(false);
            return;
        }

        if (value.length >= 1 && value[0].includes('/')) {
            setIsPopoverOpen(isOpen);
            return;
        }

        setIsPopoverOpen(false);
    };

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
        const { value } = event.target;

        if (!hasResponse && value && value[0] !== '/') {
            return;
        }

        onChange(value);
    };

    useEffect(() => {
        if (!textAreaRef.current) return;

        setTimeout(() => {
            textAreaRef.current?.focus();
        }, 100);
    }, []);

    useEffect(() => {
        if (!value) {
            setIsPopoverOpen(false);
            return;
        }

        if (value.length === 1 && value[0].includes('/')) {
            setIsPopoverOpen(true);
        }
    }, [value]);

    const popoverTitle = (
        <Space>
            <FileTextOutlined />
            <span>Selecione um template</span>
        </Space>
    );

    return (
        <Container>
            <Popover
                open={isPopoverOpen}
                content={
                    <TemplatePopover
                        value={value}
                        conversation={conversation}
                        channels={channels}
                        hasResponse={hasResponse}
                        onChangeMessage={onChange}
                        setCurrentStep={setCurrentStep}
                        setSelectedTemplate={setSelectedTemplate}
                        setIsPopoverOpen={setIsPopoverOpen}
                    />
                }
                onOpenChange={handlePopoverOpenChange}
                title={popoverTitle}
                trigger='click'
            >
                <Input.TextArea
                    ref={textAreaRef}
                    value={value || ''}
                    onChange={handleChange}
                    style={{
                        resize: 'none',
                    }}
                    allowClear
                    disabled={!hasResponse}
                    autoSize={{ minRows: 5, maxRows: 10 }}
                    maxLength={4096}
                    placeholder={
                        hasResponse
                            ? `${getTranslation('Enter your message here or type "/" to select a template')}..`
                            : `${getTranslation('Type "/" to select a template')}..`
                    }
                />
            </Popover>
        </Container>
    );
};

export const MessageInput = I18n(MessageInputComponent);
