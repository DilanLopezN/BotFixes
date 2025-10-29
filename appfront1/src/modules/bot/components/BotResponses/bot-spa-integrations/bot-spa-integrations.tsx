import { Col, Form, Row, Select } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { Option } from 'antd/lib/mentions';
import { IResponseElementSapIntegration } from 'kissbot-core';
import { orderBy } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { BotAttribute } from '../../../../../model/BotAttribute';
import { Interaction } from '../../../../../model/Interaction';
import { OptGroup } from '../../../../../shared-v2/flex-text-editor/block-response-text/interfaces';
import { FormItemInteraction } from '../../../../../shared-v2/FormItemInteraction';
import { InteractionSelect } from '../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { useLanguageContext } from '../../../../i18n/context';
import { BotService } from '../../../services/BotService';
import { BotResponseTextProps } from './interfaces';

const BotSpaIntegrations: React.FC<BotResponseTextProps> = ({ response, onChange }) => {
    const [form] = useForm();
    const errors = form.getFieldsError();
    const { workspaceId = '', botId = '' } = useParams<{ workspaceId: string; botId: string }>();
    const botAttributes = useSelector((state: any) => state.botReducer.botAttributes);
    const [newAttributeName, setNewAttributeName] = useState<string>('');
    const [interactionList, setInteractionList] = useState<undefined | Array<Interaction>>([]);
    const [isErrorGoto, setIsErrorGoto] = useState(response.elements[0]?.isErrorGoto || '');
    const { getTranslation } = useLanguageContext();
    const handleChange = (value: string, field: string) => {
        form.validateFields()
            .then(() => {
                const elements: IResponseElementSapIntegration[] = response.elements;
                const updatedResponse = {
                    ...response,
                    elements: elements.map((element) => ({
                        ...element,
                        [field]: value,
                    })),
                    isResponseValid: true,
                };
                onChange(updatedResponse);
            })
            .catch(() => {
                const updatedResponse = {
                    ...response,
                    isResponseValid: false, // Há erros, não é válido
                };
                onChange(updatedResponse);
            });
    };

    const onSearch = useCallback((inputValue: string) => {
        setNewAttributeName(inputValue);
    }, []);

    const filterOption = useCallback((input: string, optionValue: any) => {
        const optionLabel = optionValue?.children?.toString().toLowerCase();
        const optionKey = optionValue?.value?.toString().toLowerCase();

        return optionLabel?.includes(input.toLowerCase()) || optionKey?.includes(input.toLowerCase());
    }, []);

    const handleClear = useCallback(
        (field: string) => {
            form.setFieldsValue({ [field]: undefined });

            form.validateFields()
                .then(() => {
                    const updatedResponse = {
                        ...response,
                        elements: response.elements.map((element) => ({
                            ...element,
                            [field]: undefined,
                        })),
                        isResponseValid: true,
                    };
                    onChange(updatedResponse);
                })
                .catch(() => {
                    const updatedResponse = {
                        ...response,
                        isResponseValid: false,
                    };
                    onChange(updatedResponse);
                });
        },
        [form, response, onChange]
    );

    const renderOptions = useCallback(
        (groupLabel: string, filterFunc: (attr) => boolean) => {
            const filteredBotAttributes = orderBy(botAttributes.filter(filterFunc), ['name']);
            return (
                <OptGroup label={groupLabel} key={groupLabel}>
                    {filteredBotAttributes.map((botAttr: BotAttribute) => (
                        <Option key={`${botAttr._id}-${botAttr.name}`} value={botAttr.name}>
                            {botAttr.name}
                        </Option>
                    ))}
                </OptGroup>
            );
        },
        [botAttributes]
    );

    const fetchInteractions = useCallback(async () => {
        setInteractionList([]);
        try {
            const { data: interactions } = await BotService.getInteractions(workspaceId, botId);
            setInteractionList(interactions || []);
        } catch (error) {
            dispatchSentryError(error);
        }
    }, [botId, workspaceId]);

    const handleInteractionChange = (interaction) => {
        if (!interaction) {
            return handleClear('isErrorGoto');
        }
        setIsErrorGoto(interaction.value);
        setTimeout(() => {
            handleChange(interaction.value, 'isErrorGoto');
        }, 50);
    };
    useEffect(() => {
        form.setFieldsValue({ isErrorGoto });
    }, [isErrorGoto, form]);

    useEffect(() => {
        fetchInteractions();
    }, [fetchInteractions]);

    return (
        <Form
            initialValues={{
                isErrorGoto: isErrorGoto,
                attrRequesitionNumber: response.elements[0]?.attrRequesitionNumber || '',
                attrPhoneNumberDebug: response.elements[0]?.attrPhoneNumberDebug || '',
            }}
            form={form}
            layout='vertical'
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        help={errors['attrRequesitionNumber']?.errors?.[0]}
                        name='attrRequesitionNumber'
                        label={getTranslation('Purchase requisition attribute')}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Select
                            size='large'
                            showSearch
                            optionFilterProp='label'
                            onSearch={onSearch}
                            filterOption={filterOption}
                            allowClear
                            onClear={() => handleClear('attrRequesitionNumber')}
                            onSelect={(value) => handleChange(value, 'attrRequesitionNumber')}
                        >
                            {renderOptions(
                                'Entity',
                                (botAttr) => botAttr.name && !botAttr.name.startsWith('default_') && botAttr.fromEntity
                            )}
                            {renderOptions(
                                'Others',
                                (botAttr) => botAttr.name && !botAttr.name.startsWith('default_') && !botAttr.fromEntity
                            )}
                            {newAttributeName && (
                                <Option key={newAttributeName} value={newAttributeName}>
                                    {newAttributeName}
                                </Option>
                            )}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name='attrPhoneNumberDebug' label={getTranslation('Phone number attribute')}>
                        <Select
                            size='large'
                            showSearch
                            optionFilterProp='label'
                            onSearch={onSearch}
                            filterOption={filterOption}
                            allowClear
                            onClear={() => handleClear('attrPhoneNumberDebug')}
                            onSelect={(value) => handleChange(value, 'attrPhoneNumberDebug')}
                        >
                            {renderOptions(
                                'Entity',
                                (botAttr) => botAttr.name && !botAttr.name.startsWith('default_') && botAttr.fromEntity
                            )}
                            {renderOptions(
                                'Others',
                                (botAttr) => botAttr.name && !botAttr.name.startsWith('default_') && !botAttr.fromEntity
                            )}
                            {newAttributeName && (
                                <Option key={newAttributeName} value={newAttributeName}>
                                    {newAttributeName}
                                </Option>
                            )}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        help={errors[getTranslation('isErrorGoto')]?.errors?.[0]}
                        name='isErrorGoto'
                        rules={[
                            {
                                required: true,
                                message: getTranslation('This field is required'),
                            },
                        ]}
                    >
                        <FormItemInteraction
                            interaction={isErrorGoto}
                            label={getTranslation('Choose an interaction')}
                            validate={{
                                touched: errors['isErrorGoto']?.touched,
                                errors,
                                fieldName: 'isErrorGoto',
                                isSubmitted: false,
                            }}
                        >
                            <InteractionSelect
                                name='isErrorGoto'
                                options={interactionList || []}
                                interactionTypeToShow={['interaction', 'welcome', 'fallback']}
                                defaultValue={isErrorGoto}
                                onChange={handleInteractionChange}
                            />
                        </FormItemInteraction>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};

export { BotSpaIntegrations };
