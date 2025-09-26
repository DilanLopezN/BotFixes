import { FC, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik-latest';
import { get } from 'lodash';
import * as Yup from 'yup';
import { Col, Form, Input, Modal, Row, Select, Switch, notification } from 'antd';
import { BotService } from '../../../bot/services/BotService';
import { WorkspaceService } from '../../services/WorkspaceService';
import { Bot } from 'kissbot-core';
import { CloneBot } from '../../../bot/Interfaces/clone-bot.interface';
import { Workspace } from '../../../../model/Workspace';

interface ModalCloneProps {
    visible: boolean;
    onClose: (botName?: string) => void;
    getTranslation: Function;
    workspaceId: string;
}

const initialValues = {
    cloneFromWorkspaceId: undefined,
    createTeams: false,
    botName: '',
    cloneFromBotId: undefined,
};

const validationSchema = Yup.object().shape({
    botName: Yup.string().required('Campo obrigatório'),
    cloneFromWorkspaceId: Yup.string().required('Campo obrigatório'),
    cloneFromBotId: Yup.string().required('Campo obrigatório'),
});

const ModalCloneBot: FC<ModalCloneProps> = (props) => {
    const { visible, onClose, getTranslation, workspaceId } = props;
    const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
    const [botNameList, setBotNameList] = useState<Bot[]>([]);
    const [isLoadingBotName, setIsLoadingBotName] = useState<boolean>(false);
    const [isLoadingCloneName, setIsLoadingCloneName] = useState<boolean>(false);
    const [form] = Form.useForm();

    const handleSubmit = (values) => {
        createCloneBot(values);
        form.resetFields();
        handleClose();
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: initialValues,
        validationSchema: validationSchema,
        onSubmit: handleSubmit,
    });

    const workspaceEqual = workspaceId !== formik.values.cloneFromWorkspaceId;

    const getWorkspaces = async () => {
        const response = await WorkspaceService.getWorkspaceList();
        if (!response) return;
        setWorkspaceList(response.data);
    };

    const createCloneBot = async (data: CloneBot) => {
        const clonedBot = await BotService.cloneBot(workspaceId, data)
            .catch((error) => {
                notification.error({
                    message: `Erro`,
                    description: error as string,
                    placement: 'bottom',
                });
                setIsLoadingCloneName(true);
            })
            .finally(() => {
                setIsLoadingCloneName(false);
                notification.success({
                    message: getTranslation('Request completed successfully'),
                    description: getTranslation('Your clone will be available in a few minutes.'),
                    placement: 'top',
                });
            });

        if (clonedBot) {
        }
    };
    const getErrorProps = (fieldName: string) => {
        const erroMessage = get(formik.errors, fieldName);
        const isTouched = get(formik.touched, fieldName);
        return {
            validateStatus: isTouched && erroMessage ? ('error' as const) : undefined,
            help: isTouched ? erroMessage : undefined,
        };
    };

    const botOptions = useMemo(() => {
        if (!formik.values.cloneFromWorkspaceId) return [];
        const options = botNameList.map((bot) => ({
            value: bot._id,
            label: bot.name,
            key: bot._id,
        }));
        return options;
    }, [botNameList, formik.values]);

    const workspaceOptions = useMemo(
        () =>
            workspaceList.map((workspace) => ({
                value: workspace._id,
                label: workspace.name,
                key: workspace._id,
            })),
        [workspaceList]
    );
    const handleClose = () => {
        onClose(formik.values.botName);
    };

    useEffect(() => {
        const fetchData = async () => {
            getWorkspaces();
        };
        fetchData();
    }, [isLoadingCloneName]);

    useEffect(() => {
        const getIntegrations = async () => {
            try {
                if (!formik.values.cloneFromWorkspaceId) return;
                setIsLoadingBotName(true);
                const response = await WorkspaceService.getWorkspaceBots(formik.values.cloneFromWorkspaceId);

                setBotNameList(response.data || []);
            } catch (error) {
                notification.error({
                    message: `Erro`,
                    description: error as string,
                    placement: 'bottom',
                });
            } finally {
                setIsLoadingBotName(false);
            }
        };
        getIntegrations();
    }, [formik.values.cloneFromWorkspaceId]);

    useEffect(() => {
        if (!visible) {
            form.resetFields();
            formik.resetForm();
        }
    }, [visible]);

    return (
        <Modal
            open={visible}
            title={getTranslation('Clone bot')}
            onCancel={() => onClose()}
            okText={getTranslation('Clone bot')}
            cancelText='Fechar'
            okButtonProps={{
                form: 'create-clone-form',
                htmlType: 'submit',
                loading: false,
                className: 'antd-span-default-color',
            }}
            cancelButtonProps={{ className: 'antd-span-default-color' }}
        >
            <Form form={form} layout='vertical' onFinish={formik.handleSubmit} id='create-clone-form'>
                <Form.Item name='botName' label='Nome do clone' {...getErrorProps('botName')}>
                    <Input
                        placeholder={getTranslation('Enter a Name')}
                        name='botName'
                        value={formik.values.botName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </Form.Item>
                <Form.Item name='cloneFromWorkspaceId' label='Workspace' {...getErrorProps('cloneFromWorkspaceId')}>
                    <Select
                        showSearch
                        onBlur={formik.handleBlur}
                        options={workspaceOptions}
                        placeholder={getTranslation('Select an item...')}
                        value={formik.values.cloneFromWorkspaceId || undefined}
                        filterOption={(inputValue, option) =>
                            (option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
                        }
                        onChange={(value) => {
                            formik.setFieldValue('cloneFromWorkspaceId', value);
                            form.setFieldsValue({ cloneFromBotId: undefined });
                        }}
                    />
                </Form.Item>
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Form.Item name='cloneFromBotId' label='Bot' {...getErrorProps('cloneFromBotId')}>
                            <Select
                                allowClear
                                placeholder={getTranslation('Select an item...')}
                                disabled={!formik.values.cloneFromWorkspaceId}
                                onChange={(value) => formik.setFieldValue(`cloneFromBotId`, value)}
                                onBlur={formik.handleBlur}
                                options={botOptions}
                                loading={isLoadingBotName}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        {workspaceEqual && (
                            <Form.Item name='createTeams' label='Clonar times' {...getErrorProps('createTeams')}>
                                <Switch onChange={(value) => formik.setFieldValue(`createTeams`, value)} />
                            </Form.Item>
                        )}
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export { ModalCloneBot };
