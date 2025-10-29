import { Alert, Checkbox, Col, Form, Input, Modal, notification, Row, Select } from 'antd';
import { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguageContext } from '../../../../i18n/context';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { TriggersFormValues, TriggersProps } from './interfaces';
import { useCampaignAction } from './use-campaign-action';

export const Triggers = ({ currentInteraction, onChange }: TriggersProps) => {
    const [form] = Form.useForm<TriggersFormValues>();
    const [isModalVisible, setModalVisible] = useState(false);
    const [action, setAction] = useState('');
    const [isNameEnabled, setNameEnabled] = useState(false);
    const { workspaceId = '' } = useParams<{ workspaceId: string }>();
    const { disabledFields } = useContext(DisabledTypeContext);
    const { getTranslation } = useLanguageContext();
    const { executeAction, loading } = useCampaignAction({
        workspaceId,
        action,
    });

    const validateTrigger = (value: string) => {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
    };

    const handleSubmit = async (values: TriggersFormValues) => {
        if (isNameEnabled) {
            await executeAction(values.name);
        }
        form.resetFields(['name']);
        handleCancelModal();
    };

    const handleCancelModal = () => {
        setModalVisible(false);
        setAction('');
        setNameEnabled(false);
    };

    return (
        <Form<TriggersFormValues>
            form={form}
            layout='vertical'
            className='Triggers'
            onFinish={handleSubmit}
            id='create-new-trigger-form'
            initialValues={{
                triggers: currentInteraction?.triggers || [],
            }}
        >
            <Row>
                <Col span={24}>
                    <Form.Item
                        tooltip={getTranslation('Used to trigger this interaction by an action in another interaction')}
                        name='triggers'
                        label={getTranslation('Triggers')}
                        rules={[
                            {
                                required: true,
                            },
                            {
                                validator: (_, value) => {
                                    if (!value || value.every((item: string) => validateTrigger(item))) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error(
                                            getTranslation(
                                                'This field must contain only letters (A-Z), numbers (0-9), and underscores (_). It cannot start with a number. Special characters are not permitted.'
                                            )
                                        )
                                    );
                                },
                            },
                        ]}
                    >
                        <Select
                            size='large'
                            disabled={!!disabledFields}
                            mode='tags'
                            placeholder={getTranslation('Enter a trigger')}
                            onChange={(values: string[]) => {
                                const newValues = Array.from(
                                    new Set(values.map((value: string) => value.toLowerCase().replace(/\s+/g, '_')))
                                );

                                const invalidValues = newValues.filter((value: string) => !validateTrigger(value));

                                if (invalidValues.length === 0) {
                                    form.setFieldsValue({ triggers: newValues });
                                    onChange(newValues, true);
                                }
                            }}
                            onSelect={(value: string) => {
                                const newValue = value.toLowerCase().replace(/\s+/g, '_');

                                if (validateTrigger(newValue)) {
                                    const currentValues = form.getFieldValue('triggers') || [];

                                    const newValues = Array.from(new Set([...currentValues, newValue]));
                                    form.setFieldsValue({ triggers: newValues });
                                    onChange(newValues, true);
                                    setModalVisible(true);
                                    setAction(newValue);
                                }
                            }}
                            allowClear
                            showSearch={false}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Modal
                        title={`Configure ${action}`}
                        open={isModalVisible}
                        onCancel={handleCancelModal}
                        okText={getTranslation('Add')}
                        cancelText={getTranslation('Cancel')}
                        okButtonProps={{
                            loading,
                            className: 'antd-span-default-color',
                            htmlType: 'submit',
                            form: 'create-new-trigger-form',
                        }}
                    >
                        <Row>
                            <Col span={24}>
                                <Alert message={action} type='info' style={{ marginBottom: '16px' }} />
                            </Col>
                            <Col span={24}>
                                {isNameEnabled && (
                                    <Form.Item
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        name='name'
                                        label={getTranslation('Action Name')}
                                        rules={[
                                            {
                                                required: isNameEnabled,
                                                message: getTranslation('The action field is required'),
                                            },
                                        ]}
                                    >
                                        <Input
                                            size='large'
                                            placeholder={getTranslation('Enter the trigger action')}
                                            autoFocus={true}
                                        />
                                    </Form.Item>
                                )}
                            </Col>
                            <Checkbox checked={isNameEnabled} onChange={() => setNameEnabled(!isNameEnabled)}>
                                {getTranslation('Add to campaign')}
                            </Checkbox>
                        </Row>
                    </Modal>
                </Col>
            </Row>
        </Form>
    );
};
