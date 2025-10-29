import { Button, Col, Form, Input, Row } from 'antd';
import { useMemo } from 'react';
import { hasOnlyWhitespaces } from '../../../../../utils/antd-form-validators';
import { extractTemplateKeys } from '../../../../../utils/extract-template-keys';
import I18n from '../../../../i18n/components/i18n';
import { TemplateVariablesFooterProps, TemplateVariablesStepProps } from './interfaces';

export const TemplateVariablesStepComponent = ({ selectedTemplate, getTranslation }: TemplateVariablesStepProps) => {
    const form = Form.useFormInstance();
    const formValues = Form.useWatch([], form);

    const variables = useMemo(() => {
        return extractTemplateKeys(selectedTemplate?.message);
    }, [selectedTemplate?.message]);

    const messageWithVariables = useMemo(() => {
        return variables.reduce((message, variableKey) => {
            if (!message || !(formValues && formValues[variableKey])) return selectedTemplate?.message;

            const regex = new RegExp(`{{${variableKey}}}`, 'g');
            return message.replace(regex, formValues[variableKey]);
        }, selectedTemplate?.message);
    }, [formValues, selectedTemplate?.message, variables]);

    return (
        <Row gutter={16}>
            {variables.length > 0 && (
                <Col span={24} style={{ marginBottom: 16 }}>
                    Preencha os campos para prosseguir com o envio da mensagem:
                </Col>
            )}
            <Col span={24}>
                <Form.Item>
                    <Input.TextArea
                        value={messageWithVariables}
                        readOnly
                        autoSize={{ minRows: 5, maxRows: 10 }}
                        style={{ background: '#f5f5f5' }}
                    />
                </Form.Item>
            </Col>
            {variables.map((variable) => {
                return (
                    <Col key={variable} span={24}>
                        <Form.Item
                            label={variable}
                            name={variable}
                            rules={[
                                { required: true, message: 'Campo obrigatório' },
                                hasOnlyWhitespaces('Caracteres inválidos'),
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                );
            })}
        </Row>
    );
};

export const TemplateVariablesStep = I18n(TemplateVariablesStepComponent);

TemplateVariablesStep.Footer = ({ handleClose, getTranslation }: TemplateVariablesFooterProps) => {
    return (
        <>
            <Button onClick={handleClose} className='antd-span-default-color'>
                {getTranslation('Back')}
            </Button>
            <Button type='primary' htmlType='submit' className='antd-span-default-color' form='generate-message-form'>
                {getTranslation('Generate message')}
            </Button>
        </>
    );
};
