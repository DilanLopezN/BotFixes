import { Col, Form, Modal, Row, Select } from 'antd';
import { useEffect, useMemo } from 'react';
import { useUserActivity } from '../../hooks/use-user-activity';
import { normalizeText } from '../../utils/normalize-text';
import { notifySuccess } from '../../utils/notify-success';
import { useBreaks } from './hooks/use-breaks';
import { useStartBreak } from './hooks/use-start-break';
import type { BreakModalProps, StartBreakFormValues } from './interfaces';

export const BreakModal = ({ isVisible, onClose }: BreakModalProps) => {
    const { fetchUserActivity, isLoadingUserActivity } = useUserActivity();
    const { breaks, isFetchingBreaks, fetchBreaks } = useBreaks();
    const { startBreak, isStartingBreak } = useStartBreak();
    const [form] = Form.useForm<StartBreakFormValues>();

    const breakOptions = useMemo(() => {
        if (!breaks) {
            return [];
        }

        return breaks
            .filter((item) => Boolean(item.enabled))
            .map((breakTime) => {
                return {
                    value: breakTime.id,
                    label: `${breakTime.name} - ${breakTime.durationSeconds / 60} minutos`,
                    name: breakTime.name,
                };
            });
    }, [breaks]);

    const handleModalAfterClose = () => {
        form.resetFields();
    };

    const handleFinish = async (values: StartBreakFormValues) => {
        const result = await startBreak(values.breakSettingId);

        if (result) {
            notifySuccess({ message: 'Sucesso', description: 'Pausa iniciada' });
            await fetchUserActivity();
            onClose();
        }
    };

    useEffect(() => {
        fetchBreaks();
    }, [fetchBreaks]);

    return (
        <Modal
            title='Registrar pausa'
            closable={false}
            keyboard={false}
            maskClosable={false}
            open={isVisible}
            okText='Iniciar pausa'
            cancelText='Cancelar'
            onCancel={onClose}
            okButtonProps={{
                htmlType: 'submit',
                form: 'start-break-form',
                loading: isLoadingUserActivity || isStartingBreak,
                disabled: isFetchingBreaks,
                className: 'antd-span-default-color',
            }}
            cancelButtonProps={{
                disabled: isLoadingUserActivity || isStartingBreak || isFetchingBreaks,
            }}
            afterClose={handleModalAfterClose}
        >
            <Form id='start-break-form' form={form} layout='vertical' onFinish={handleFinish}>
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name='breakSettingId'
                            label='Motivo da pausa'
                            rules={[{ required: true, message: 'Campo obrigatório' }]}
                        >
                            <Select
                                options={breakOptions}
                                loading={isFetchingBreaks}
                                placeholder='Escolha uma pausa'
                                showSearch
                                autoClearSearchValue={false}
                                filterOption={(search, option) => {
                                    return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};
