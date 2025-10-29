import { Col, Form, Row } from 'antd';
import { FormInstance } from 'antd/es/form/Form';
import { useForm } from 'antd/lib/form/Form';
import { ContentState, DraftComponent } from 'draft-js';
import { IResponseElementText } from 'kissbot-core';
import React, { useEffect, useRef, useState } from 'react';
import { FlexTextEditor } from '../../../../../shared-v2/flex-text-editor';
import { FlexTextType } from '../../../../../shared-v2/flex-text-editor/enum/flex-text-type.enum';
import { IPartDefault } from '../../../../../shared-v2/flex-text-editor/enum/i-part-default.enum';
import I18n from '../../../../i18n/components/i18n';
import { BotResponseTextProps } from './interfaces';
import { AddNewFieldBtn, DeleteIcon } from './styles';

const BotResponseTextV2: React.FC<BotResponseTextProps> = ({ response, onChange, getTranslation }) => {
    const [form] = useForm();
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const errors = form.getFieldsError();
    const newEditorRefs = useRef<(DraftComponent.Base.DraftEditor | null)[]>([]);

    const containsDefaultValue = (obj: string[]): boolean => {
        for (const value of obj) {
            if (value.includes(IPartDefault.parameter)) {
                return true;
            }
        }
        return false;
    };

    const onChangeHandler = (values: { text: string[] }, isValid: boolean) => {
        const elements: IResponseElementText[] = response.elements;
        elements[0].text = values.text;

        const updatedResponse = {
            ...response,
            elements,
            isResponseValid: isValid,
        };
        onChange(updatedResponse);
    };

    const validateUserSays = async (_, value) => {
        if (!value) {
            return Promise.reject(getTranslation('This field is required'));
        }
        return Promise.resolve();
    };

    const onChangeText = (
        updatedContentState: ContentState,
        formInstance: FormInstance,
        currentField: any,
        onFormChange: (values: { text: string[] }, isValid: boolean) => void
    ) => {
        const newPlainText = updatedContentState.getPlainText();
        const currentFieldIndex = currentField.name;

        formInstance.setFieldsValue({
            text: formInstance
                .getFieldValue('text')
                .map((text: string, index: number) => (index === currentFieldIndex ? newPlainText : text)),
        });
        const updatedTexts = formInstance.getFieldValue('text');
        const containsDefault = containsDefaultValue(updatedTexts);
        const hasErrors = formInstance.getFieldsError().some(({ errors }) => errors.length > 0);
        const isEmpty = updatedTexts.some((text) => !text.trim());
        const isValid = !hasErrors && !containsDefault && !isEmpty;

        onFormChange({ text: updatedTexts }, isValid);
    };

    useEffect(() => {
        if (
            focusedIndex !== null &&
            focusedIndex < newEditorRefs.current.length &&
            newEditorRefs.current[focusedIndex] !== null
        ) {
            setTimeout(() => {
                newEditorRefs.current[focusedIndex]?.focus();
            }, 100);
        }
    }, [focusedIndex]);

    useEffect(() => {
        const initial = response.elements[0].text.reduce((acc, text, index) => {
            acc[index] = text;
            return acc;
        }, {});

        form.setFieldsValue({
            text: initial,
        });
        setTimeout(() => form.validateFields(), 300);
    }, [form, response]);

    return (
        <Form initialValues={{ text: response.elements[0].text }} form={form} layout='vertical' id='create-user-form'>
            <Form.List name='text'>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map((field, index) => (
                            <Row key={field.key} gutter={16}>
                                <Col span={23}>
                                    <Form.Item
                                        {...field}
                                        hasFeedback
                                        help={errors[field.name]?.errors?.[0]}
                                        name={[field.name]}
                                        rules={[
                                            {
                                                required: true,
                                                validator: validateUserSays,
                                            },
                                        ]}
                                    >
                                        <FlexTextEditor
                                            onEntityChange={(contentState: ContentState) => {
                                                onChangeText(contentState, form, field, onChangeHandler);
                                            }}
                                            typeBlock={FlexTextType.SELECT}
                                            initialText={form.getFieldValue('text')[field.name] || ''}
                                            maxLength={4096}
                                            disabled={false}
                                            ref={(ref) => (newEditorRefs.current[index] = ref)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={1}>
                                    {response.elements[0].text.length > 1 && (
                                        <DeleteIcon
                                            onClick={() => {
                                                remove(field.name);
                                                const updatedTexts = form
                                                    .getFieldValue('text')
                                                    .filter((_, idx) => idx !== field.name);
                                                onChangeHandler({ text: updatedTexts }, !!updatedTexts.length);
                                            }}
                                        />
                                    )}
                                </Col>
                            </Row>
                        ))}
                        <Row>
                            <Col span={24}>
                                <AddNewFieldBtn
                                    onClick={() => {
                                        const newIndex = fields.length;
                                        add('');
                                        setFocusedIndex(newIndex);
                                        setTimeout(() => form.validateFields(), 300);
                                    }}
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </Form.List>
        </Form>
    );
};

export default I18n(BotResponseTextV2);
