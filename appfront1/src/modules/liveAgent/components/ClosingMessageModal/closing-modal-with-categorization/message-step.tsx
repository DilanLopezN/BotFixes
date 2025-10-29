import { Alert, Button, Col, Form, Row } from 'antd';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import { ChannelIdConfig, IdentityType } from 'kissbot-core';
import moment from 'moment';
import { useEffect, useRef } from 'react';
import { Constants } from '../../../../../utils/Constants';
import I18n from '../../../../i18n/components/i18n';
import { MessageInput } from './components/message-input';
import { MessageStepFooterProps, MessageStepProps } from './interfaces';

const MessageStepComponent = ({
    form,
    conversation,
    channels,
    selectedTemplate,
    getTranslation,
    setCurrentStep,
    setSelectedTemplate,
}: MessageStepProps) => {
    const textAreaRef = useRef<TextAreaRef>(null);

    const isExpired =
        Boolean(conversation?.whatsappExpiration) && moment().valueOf() >= conversation.whatsappExpiration;

    const hasResponse = conversation.activities?.some((activity) => {
        return activity.type === 'message' && activity.from?.type === 'agent';
    });

    const getCantSendMessageError = () => {
        const user = conversation.members.find((member) => member.type === IdentityType.user);

        if (!user) return '';

        if (!hasResponse) {
            return getTranslation('It is necessary to wait for the user`s response before sending messages');
        }

        if (isExpired && user?.channelId === ChannelIdConfig.gupshup) {
            return getTranslation('The conversation expired');
        }

        return '';
    };

    const cantSendMessageError = getCantSendMessageError();

    useEffect(() => {
        if (isExpired) {
            return;
        }

        const message = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.END_CONVERSATION_TEXT) || '';
        form.setFieldsValue({ message });
    }, [form, isExpired]);

    useEffect(() => {
        if (!textAreaRef.current) return;

        setTimeout(() => {
            textAreaRef.current?.focus();
        }, 100);
    }, []);

    return (
        <Row gutter={[16, 16]}>
            {cantSendMessageError && (
                <Col span={24}>
                    <Alert message={cantSendMessageError} type='warning' />
                </Col>
            )}
            <Col span={24}>
                <Form.Item name='message' label='Mensagem'>
                    <MessageInput
                        channels={channels}
                        conversation={conversation}
                        isExpired={isExpired}
                        hasResponse={hasResponse}
                        setCurrentStep={setCurrentStep}
                        setSelectedTemplate={setSelectedTemplate}
                    />
                </Form.Item>
            </Col>
        </Row>
    );
};

export const MessageStep = I18n(MessageStepComponent);

MessageStep.Footer = ({ handleOk, handleClose, getTranslation }: MessageStepFooterProps) => {
    return (
        <>
            <Button onClick={handleClose} className='antd-span-default-color'>
                {getTranslation('Leave')}
            </Button>
            <Button type='primary' htmlType='button' onClick={handleOk} className='antd-span-default-color'>
                {getTranslation('Next')}
            </Button>
        </>
    );
};
