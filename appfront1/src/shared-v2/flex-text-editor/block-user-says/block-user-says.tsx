import { CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Popover, Row, Select, Tooltip, notification } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { Entity, IPart } from 'kissbot-core';
import { orderBy } from 'lodash';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { BotAttribute } from '../../../model/BotAttribute';
import { BotActions } from '../../../modules/bot/redux/actions';
import I18nWrapper from '../../../modules/i18n/components/i18n';
import { IPartDefault } from '../enum/i-part-default.enum';
import { DraftDecoratorsBlockProps } from '../interfaces';
import { TranslatedOptions } from './interfaces';
import { useCreateBotAttribute } from './use-create-bot-attribute';

const { Option, OptGroup } = Select;

const BlockDecorator: FC<DraftDecoratorsBlockProps> = ({
    props,
    setOpenEditVariable,
    onChangeVariableBlock,
    getTranslation,
    userSaysParts,
}) => {
    const [open, setOpen] = useState<boolean | undefined>(undefined);
    const [disabled, setDisabled] = useState<boolean>(false);
    const [newAttributeName, setNewAttributeName] = useState<string>('');
    const [translatedOptions, setTranslatedOptions] = useState<TranslatedOptions>({
        systemOptions: [],
        customOptions: [],
    });
    const text = props?.decoratedText?.replace(/[{,}]/g, '');
    const [iPart, setIParts] = useState<IPart>({ value: text.replaceAll(' ', '_') });
    const botAttributes = useSelector((state: any) => state.botReducer.botAttributes);
    const entitiesList = useSelector((state: any) => state.entityReducer.entitiesList);
    const currentInteraction = useSelector((state: any) => state.botReducer.currentInteraction);
    const { createBotAttribute, error, isLoading: isCreating } = useCreateBotAttribute();
    const { botId = '' } = useParams<{ workspaceId: string; botId: string }>();
    const [partIndex, setPartIndex] = useState<number | null>(null);
    const dispatch = useDispatch();
    const [form] = useForm<IPart>();

    const objectsWithType = userSaysParts?.filter((obj) => obj?.hasOwnProperty('type'));

    const initialValues = useMemo(() => {
        let mandatory = false;
        if (partIndex !== null) {
            mandatory = (objectsWithType?.[partIndex] ?? {}).mandatory ?? false;
        }

        return {
            value: iPart.value,
            type: botAttributes.find((attr: BotAttribute) => attr.name === iPart.value)?.type,
            mandatory: mandatory,
        };
    }, [botAttributes, objectsWithType, partIndex, iPart.value]);

    const notIncludeInVariables: boolean = !botAttributes.find((curr: BotAttribute) => curr.name === text);

    const onFinish = async (values: IPart) => {
        const botAttr: BotAttribute = {
            name: values.value,
            interactions: [currentInteraction?._id],
            botId: botId,
            type: values.type as string,
        };

        try {
            const updatedAttributes = await createBotAttribute(botAttr);
            dispatch(BotActions.setBotAttributes(updatedAttributes));
            onChangeVariableBlock(values, props.start, props.end);
            setIParts(values);
            setTimeout(() => {
                setOpen(false);
                setOpenEditVariable(false);
            }, 300);
        } catch (err) {
            throw new Error(err.message);
        }
    };

    const handleValueChange = useCallback(() => {
        if (newAttributeName) {
            const newPart = {
                name: newAttributeName,
                value: newAttributeName,
                type: '@sys.any',
            };

            setIParts(newPart);
        }
    }, [newAttributeName]);

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
    const onSearch = useCallback((inputValue: string) => {
        setNewAttributeName(inputValue);
    }, []);

    const filterOption = useCallback((input: string, optionValue: any) => {
        const optionLabel = optionValue?.children?.toString().toLowerCase();
        const optionKey = optionValue?.value?.toString().toLowerCase();

        return optionLabel?.includes(input.toLowerCase()) || optionKey?.includes(input.toLowerCase());
    }, []);

    const handleClear = useCallback(() => {
        form.setFieldsValue({
            value: '',
            type: undefined,
            mandatory: false,
        });
        setDisabled(false);
    }, [form]);

    const transformLastTwoNumbers = (str: string) => {
        const numbers = str
            .split('-')
            .splice(-2)
            .map((num) => parseInt(num));
        const lastTwoDigits = numbers[0] * 10 + numbers[1];
        return Math.floor(lastTwoDigits / 20);
    };

    const validateEntityType = (type: string) => {
        if (type === '@sys.any') {
            return Promise.reject(new Error(getTranslation('The selected entity type "Any" is not allowed.')));
        }
        return Promise.resolve();
    };

    const validateAttribute = (attribute: string) => {
        if (attribute.includes(' ')) {
            return Promise.reject(new Error(getTranslation('Spaces are not allowed')));
        }

        if (!/^[A-Za-z0-9_-]+$/.test(attribute)) {
            return Promise.reject(
                new Error(
                    getTranslation(
                        'This field must contain only letters (A-Z), numbers (0-9), underscores (_), and dashes (-). Special characters are not permitted.'
                    )
                )
            );
        }
        if (attribute === IPartDefault.parameter) {
            return Promise.reject(new Error(getTranslation('The "parameter" naming is not allowed.')));
        }

        const selectedAttribute: BotAttribute = botAttributes.find((attr: BotAttribute) => attr.name === attribute);
        if (selectedAttribute) {
            if (selectedAttribute.type) {
                form.setFieldsValue({
                    value: selectedAttribute.name,
                    type: selectedAttribute.type,
                });
                setDisabled(true);
            } else {
                if (attribute !== IPartDefault.parameter) {
                    setDisabled(false);
                }
                form.setFieldsValue({
                    mandatory: false,
                    type: undefined,
                });
            }
        } else {
            if (attribute !== IPartDefault.parameter) {
                setDisabled(false);
            }
            form.setFieldsValue({
                mandatory: false,
            });
        }

        return Promise.resolve();
    };

    const extractLastTwoNumbers = (str: string) => {
        const transformedNumber = transformLastTwoNumbers(str);
        return transformedNumber;
    };

    const showErrorNotification = () => {
        notification.error({
            message: getTranslation('Error'),
            description: getTranslation('Error on create attribute'),
        });
    };

    useEffect(() => {
        if (error) {
            showErrorNotification();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    useEffect(() => {
        const selectedAttribute: BotAttribute = botAttributes.find((attr) => attr.name === iPart.value);

        if (!!selectedAttribute) {
            setDisabled(true);
        } else {
            setDisabled(false);
        }
    }, [botAttributes, iPart.value]);

    useEffect(() => {
        const systemOptionsTranslated = [
            { value: '@sys.any', label: getTranslation('Any') },
            { value: '@sys.number', label: getTranslation('Number') },
            { value: '@sys.text', label: getTranslation('Text') },
            { value: '@sys.fullName', label: getTranslation('Full name') },
            { value: '@sys.unimedCard', label: 'Carteirinha Unimed' },
            { value: '@sys.height', label: getTranslation('Height') },
            { value: '@sys.date', label: getTranslation('Date') },
            { value: '@sys.time', label: getTranslation('Time') },
            { value: '@sys.email', label: getTranslation('Email') },
            { value: '@sys.phone', label: getTranslation('Phone') },
            { value: '@sys.cpf', label: getTranslation('CPF') },
            { value: '@sys.cnpj', label: getTranslation('CNPJ') },
            { value: '@sys.pdf', label: getTranslation('PDF') },
            { value: '@sys.image', label: getTranslation('Image') },
            { value: '@sys.file', label: getTranslation('File') },
            { value: '@sys.command', label: getTranslation('Command') },
        ];

        const customOptionsTranslated = entitiesList.map((entity: Entity) => ({
            value: `@${entity.name}`,
            label: getTranslation(entity.name) || entity.name,
        }));

        setTranslatedOptions({
            systemOptions: systemOptionsTranslated,
            customOptions: customOptionsTranslated,
        });
    }, [entitiesList, getTranslation]);

    return (
        <Popover
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{getTranslation('Variable editing')}</span>
                    <CloseOutlined
                        onClick={() => {
                            setOpen(false);
                            setOpenEditVariable(false);
                        }}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            }
            key={props?.offsetKey}
            trigger={'click'}
            placement='bottom'
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                setOpenEditVariable(value);
            }}
            content={
                <div onBlur={(event) => event.stopPropagation()} onChange={(event) => event.stopPropagation()}>
                    <Form
                        style={{ width: 400 }}
                        form={form}
                        layout='vertical'
                        initialValues={initialValues}
                        onFinish={onFinish}
                    >
                        <Form.Item
                            name='value'
                            label={getTranslation('Attribute')}
                            rules={[
                                {
                                    required: true,
                                },
                                {
                                    validator: (_, value) => validateAttribute(value),
                                },
                            ]}
                            tooltip={getTranslation('User says will be saved in attribute')}
                        >
                            <Select
                                size='large'
                                showSearch
                                optionFilterProp='label'
                                placeholder={getTranslation('Save input to attribute')}
                                onSearch={onSearch}
                                filterOption={filterOption}
                                allowClear
                                onClear={handleClear}
                                onSelect={handleValueChange}
                            >
                                {renderOptions(
                                    getTranslation('Entity'),
                                    (botAttr) =>
                                        botAttr.name && !botAttr.name.startsWith('default_') && botAttr.fromEntity
                                )}
                                {renderOptions(
                                    getTranslation('Others'),
                                    (botAttr) =>
                                        botAttr.name && !botAttr.name.startsWith('default_') && !botAttr.fromEntity
                                )}
                                {newAttributeName && (
                                    <Option key={newAttributeName} value={newAttributeName}>
                                        {newAttributeName}
                                    </Option>
                                )}
                            </Select>
                        </Form.Item>
                        <Row gutter={[16, 16]}>
                            <Col span={16}>
                                <Form.Item
                                    label={getTranslation('Validation entity')}
                                    name='type'
                                    rules={[
                                        {
                                            required: true,
                                            message: getTranslation('This field is required'),
                                        },
                                        {
                                            validator: (_, value) => validateEntityType(value),
                                        },
                                    ]}
                                    tooltip={getTranslation('Validation entity')}
                                >
                                    <Select
                                        size='large'
                                        disabled={disabled}
                                        showSearch
                                        allowClear
                                        optionFilterProp='children'
                                        filterOption={filterOption}
                                    >
                                        <OptGroup label={getTranslation('System')}>
                                            {translatedOptions.systemOptions.map((option) => (
                                                <Option key={option.value} value={option.value}>
                                                    {option.label}
                                                </Option>
                                            ))}
                                        </OptGroup>
                                        <OptGroup label={getTranslation('Custom')}>
                                            {translatedOptions.customOptions.map((option, index) => (
                                                <Option key={index} value={option.value}>
                                                    {option.label}
                                                </Option>
                                            ))}
                                        </OptGroup>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    valuePropName='checked'
                                    name='mandatory'
                                    label={getTranslation('Mandatory')}
                                    tooltip={getTranslation('Will only match this attribute if is equal to entity')}
                                >
                                    <Checkbox />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row justify={'end'} style={{ marginBottom: 8 }}>
                            <Button
                                children={getTranslation('Ok')}
                                loading={isCreating}
                                data-offset-key={props?.offsetKey}
                                className='antd-span-default-color'
                                htmlType='submit'
                                onClick={async () => {
                                    try {
                                        const values = await form.validateFields(['value', 'type', 'mandatory']);
                                        onChangeVariableBlock(values, props.start, props.end);
                                        setOpen(false);
                                        setOpenEditVariable(false);
                                    } catch (error) {}
                                }}
                                type='primary'
                            />
                        </Row>
                    </Form>
                </div>
            }
        >
            {notIncludeInVariables ? (
                <Tooltip
                    placement='bottom'
                    title={getTranslation('The attribute has not yet been edited')}
                    color={'#ef3232'}
                >
                    <div
                        data-offset-key={props?.offsetKey}
                        style={{
                            background: '#fde9ef',
                            width: 'fit-content',
                            display: 'inline-block',
                            cursor: 'pointer',
                        }}
                    >
                        {props.children}
                    </div>
                </Tooltip>
            ) : (
                <div
                    data-offset-key={props?.offsetKey}
                    title={iPart?.value}
                    style={{
                        background: '#e6f7ff',
                        width: 'fit-content',
                        display: 'inline-block',
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        const indexPart = extractLastTwoNumbers(props?.offsetKey);
                        setPartIndex(indexPart);
                    }}
                >
                    {props.children}
                </div>
            )}
        </Popover>
    );
};
export const BlockUserSays = I18nWrapper(BlockDecorator);
