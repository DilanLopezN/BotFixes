import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Popover, Row, Select, Tooltip, notification } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { IPart } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { BotAttribute } from '../../../model/BotAttribute';
import I18nWrapper from '../../../modules/i18n/components/i18n';
import { I18nProps } from '../../../modules/i18n/interface/i18n.interface';
import { IPartDefault } from '../enum/i-part-default.enum';
import { DraftDecoratorsBlockProps } from '../interfaces';
import { OptGroup, Option } from './interfaces';

const BlockDecorator: FC<DraftDecoratorsBlockProps & I18nProps> = ({
    props,
    setOpenEditVariable,
    onChangeVariableBlock,
    getTranslation,
}) => {
    const [form] = useForm();
    const botAttributes = useSelector((state: any) => state.botReducer.botAttributes);
    const [open, setOpen] = useState<boolean | undefined>(undefined);
    const text = props?.decoratedText?.replace(/[{,}]/g, '');
    const [parts, setParts] = useState<IPart>({ value: text.replaceAll(' ', '_') });
    const [newAttributeName, setNewAttributeName] = useState<string>('');

    const onFinish = async () => {
        try {
            await form.validateFields();
        } catch (error) {
            notification.error({
                message: getTranslation('Erro'),
                description: getTranslation('An error has occurred. Check the fields'),
            });
        }
    };

    const handleVariableChange = (selectedAttribute: BotAttribute) => {
        const newVariable: IPart = {
            value: selectedAttribute.name,
        };
        setParts(newVariable);
    };

    const onChangeAttribute = (selectedAttribute: BotAttribute): void => {
        const newVariable: IPart = {
            value: selectedAttribute.name,
        };
        setParts(newVariable);
        handleVariableChange(selectedAttribute);
    };

    const validateAttribute = (rule: any, value: string) => {
        if (value === IPartDefault.parameter) {
            return Promise.reject(new Error(getTranslation('The "parameter" naming is not allowed.')));
        }
        return Promise.resolve();
    };

    const renderOptions = (groupLabel: string, filterFunc: (attr: any) => boolean) => {
        return (
            <OptGroup label={groupLabel} key={groupLabel}>
                {botAttributes.filter(filterFunc).map((botAttr) => (
                    <Option key={botAttr._id} value={botAttr.name} label={botAttr.label}>
                        {botAttr.name}
                    </Option>
                ))}
            </OptGroup>
        );
    };

    const onSearch = (inputValue: string) => {
        setNewAttributeName(inputValue);
    };

    const onChange = (nameSelected: string) => {
        const selectedAttribute = botAttributes.find((attr) => attr.name === nameSelected);
        const newAttr = selectedAttribute
            ? selectedAttribute
            : { _id: '', name: nameSelected, label: nameSelected, botId: '', type: '' };
        onChangeAttribute(newAttr);
    };

    const filterOption = (input: string, option: any) => {
        return (
            option &&
            option.props &&
            ((option.props.label && option.props.label.toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
                (option.props.value && option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0))
        );
    };

    useEffect(() => {
        if (parts.value) {
            form.setFieldsValue({
                label: parts.value,
            });
        }
    }, [form, parts.value]);

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
                <div
                    key={props?.offsetKey}
                    onBlur={(event) => event.stopPropagation()}
                    onChange={(event) => event.stopPropagation()}
                >
                    <Form
                        onFinish={onFinish}
                        form={form}
                        layout='vertical'
                        style={{ width: 400 }}
                        id='create-user-text'
                    >
                        <Form.Item
                            name='label'
                            rules={[
                                {
                                    required: true,
                                    message: getTranslation('This field is required'),
                                },
                                {
                                    validator: validateAttribute,
                                },
                            ]}
                        >
                            <Select
                                showSearch
                                size='large'
                                optionFilterProp='label'
                                placeholder={getTranslation('Add attribute')}
                                onChange={onChange}
                                onSearch={onSearch}
                                filterOption={filterOption}
                                allowClear
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
                                {renderOptions(
                                    getTranslation('Defaults'),
                                    (botAttr) => botAttr.name && botAttr.name.startsWith('default_')
                                )}
                                {newAttributeName && (
                                    <Option key={newAttributeName} value={newAttributeName} label={newAttributeName}>
                                        {newAttributeName}
                                    </Option>
                                )}
                            </Select>
                        </Form.Item>

                        <Row justify={'end'} style={{ marginBottom: 8 }}>
                            <Button
                                children={getTranslation('Ok')}
                                form='create-user-text'
                                data-offset-key={props?.offsetKey}
                                className='antd-span-default-color'
                                type='primary'
                                onClick={async () => {
                                    try {
                                        await form.validateFields(['label']);
                                        setOpen(false);
                                        setOpenEditVariable(false);
                                        onChangeVariableBlock(parts, props.start, props.end);
                                    } catch (error) {}
                                }}
                                htmlType='submit'
                            />
                        </Row>
                    </Form>
                </div>
            }
        >
            {IPartDefault.parameter === text ? (
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
                    title={parts.value}
                    style={{
                        background: '#e6f7ff',
                        width: 'fit-content',
                        display: 'inline-block',
                        cursor: 'pointer',
                    }}
                >
                    {props.children}
                </div>
            )}
        </Popover>
    );
};

export const BlockResponseText = I18nWrapper(BlockDecorator);
