import {
    Button,
    Card,
    Col,
    Drawer,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Spin,
    Switch,
    Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Formik } from 'formik';
import { FC, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { 
    HealthIntegration, 
    Scheduling, 
    SchedulingGuidanceFormat 
} from '../../../../../../../model/Integrations';
import { Wrapper } from '../../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../../utils/AddNotification';
import i18n from '../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../../services/HealthService';


interface SchedulingLinkConfigProps {
    integration: HealthIntegration;
    workspaceId: string;
    visible: boolean;
    onClose: () => void;
    onIntegrationUpdated?: (updatedIntegration: HealthIntegration) => void;
}

const getValidationSchema = (): Yup.ObjectSchema<any> => {
    return Yup.object().shape({
        active: Yup.boolean(),
        guidanceFormatType: Yup.string()
            .nullable()
            .when('active', {
                is: true,
                then: (schema) => schema.required('Formato da orientação é obrigatório quando ativo'),
                otherwise: (schema) => schema,
            }),
        config: Yup.object().when('active', {
            is: true,
            then: (schema: any) => schema.shape({
                friendlyName: Yup.string().required('Nome amigável é obrigatório quando ativo'),
                logo: Yup.string().required('Logo é obrigatória quando ativo'),
                whatsapp: Yup.object().shape({
                    phoneNumber: Yup.string().required('Número do WhatsApp é obrigatório quando ativo'),
                    startSchedulingMessage: Yup.string().required('Mensagem de agendamento é obrigatória quando ativo'),
                    startReschedulingMessage: Yup.string().required('Mensagem de reagendamento é obrigatória quando ativo'),
                }),
                resources: Yup.object().shape({
                    cancellation: Yup.object().shape({
                        enableScheduleCancellation: Yup.boolean(),
                        hoursBeforeAppointmentToAllowCancellation: Yup.number()
                            .nullable()
                            .typeError('Deve ser um número válido')
                            .positive('Deve ser um número maior que zero')
                            .integer('Deve ser um número inteiro')
                            .max(168, 'Máximo de 168 horas (7 dias)'),
                    }),
                    confirmation: Yup.object().shape({
                        enableScheduleConfirmation: Yup.boolean(),
                        hoursBeforeAppointmentToAllowConfirmation: Yup.number()
                            .nullable()
                            .typeError('Deve ser um número válido')
                            .positive('Deve ser um número maior que zero')
                            .integer('Deve ser um número inteiro')
                            .max(168, 'Máximo de 168 horas (7 dias)'),
                    }),
                    rescheduling: Yup.object().shape({
                        enableScheduleRescheduling: Yup.boolean(),
                        hoursBeforeAppointmentToAllowRescheduling: Yup.number()
                            .nullable()
                            .typeError('Deve ser um número válido')
                            .positive('Deve ser um número maior que zero')
                            .integer('Deve ser um número inteiro')
                            .max(168, 'Máximo de 168 horas (7 dias)'),
                    }),
                }),
                documents: Yup.object().shape({
                    enableDocumentsUpload: Yup.boolean(),
                    documentsMaxSizeInMb: Yup.number()
                        .nullable()
                        .typeError('Deve ser um número válido')
                        .positive('Deve ser um número maior que zero')
                        .max(20, 'Tamanho máximo de 20MB')
                        .integer('Deve ser um número inteiro'),
                    suporteMessage: Yup.string(),
                }),
            }),
            otherwise: (schema: any) => schema.shape({
                friendlyName: Yup.string(),
                logo: Yup.string(),
                whatsapp: Yup.object().shape({
                    phoneNumber: Yup.string(),
                    startSchedulingMessage: Yup.string(),
                    startReschedulingMessage: Yup.string(),
                }),
                resources: Yup.object().shape({
                    cancellation: Yup.object().shape({
                        enableScheduleCancellation: Yup.boolean(),
                        hoursBeforeAppointmentToAllowCancellation: Yup.number()
                            .nullable()
                            .typeError('Deve ser um número válido')
                            .positive('Deve ser um número maior que zero')
                            .integer('Deve ser um número inteiro')
                            .max(168, 'Máximo de 168 horas (7 dias)'),
                    }),
                    confirmation: Yup.object().shape({
                        enableScheduleConfirmation: Yup.boolean(),
                        hoursBeforeAppointmentToAllowConfirmation: Yup.number()
                            .nullable()
                            .typeError('Deve ser um número válido')
                            .positive('Deve ser um número maior que zero')
                            .integer('Deve ser um número inteiro')
                            .max(168, 'Máximo de 168 horas (7 dias)'),
                    }),
                    rescheduling: Yup.object().shape({
                        enableScheduleRescheduling: Yup.boolean(),
                        hoursBeforeAppointmentToAllowRescheduling: Yup.number()
                            .nullable()
                            .typeError('Deve ser um número válido')
                            .positive('Deve ser um número maior que zero')
                            .integer('Deve ser um número inteiro')
                            .max(168, 'Máximo de 168 horas (7 dias)'),
                    }),
                }),
                documents: Yup.object().shape({
                    enableDocumentsUpload: Yup.boolean(),
                    documentsMaxSizeInMb: Yup.number()
                        .nullable()
                        .typeError('Deve ser um número válido')
                        .positive('Deve ser um número maior que zero')
                        .max(20, 'Tamanho máximo de 20MB')
                        .integer('Deve ser um número inteiro'),
                    suporteMessage: Yup.string(),
                }),
            }),
        }),
    });
};

const SchedulingLinkConfig: FC<SchedulingLinkConfigProps & I18nProps> = (props) => {
    const { getTranslation, integration, workspaceId, visible, onClose } = props;

    const createLabelWithTooltip = (label: string, tooltip: string) => (
        <span>
            {label}{' '}
            <Tooltip title={tooltip}>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
        </span>
    );

    const defaultScheduling: Scheduling = {
        active: false,
        identifier: 'default',
        guidanceFormatType: SchedulingGuidanceFormat.file,
        createScheduleNotification: false,
        createSchedulingLinkAfterCreateSchedule: false,
        config: {
            friendlyName: '',
            logo: '',
            whatsapp: {
                phoneNumber: '',
                startSchedulingMessage: '',
                startReschedulingMessage: '',
            },
            resources: {
                cancellation: {
                    enableScheduleCancellation: false,
                    hoursBeforeAppointmentToAllowCancellation: undefined,
                },
                confirmation: {
                    enableScheduleConfirmation: false,
                    hoursBeforeAppointmentToAllowConfirmation: undefined,
                },
                rescheduling: {
                    enableScheduleRescheduling: false,
                    hoursBeforeAppointmentToAllowRescheduling: undefined,
                },
            },
            documents: {
                enableDocumentsUpload: false,
                documentsMaxSizeInMb: 5,
                suporteMessage: '',
            },
        },
    };

    const [loading, setLoading] = useState<boolean>(false);
    const [currentIntegration, setCurrentIntegration] = useState<HealthIntegration>(integration);

    useEffect(() => {
        if (integration?._id) {
            fetchCurrentIntegration();
        } else {
            setCurrentIntegration(integration);
        }
    }, [integration?._id, workspaceId]);

    const fetchCurrentIntegration = async () => {
        if (!integration?._id || !workspaceId) return;

        setLoading(true);
        const integrations = await HealthService.getHealthIntegrations(workspaceId).catch(() => null);

        if (integrations && integrations.data) {
            const updateIntegration = integrations.data.find((item) => item._id === integration._id);
            if (updateIntegration) {
                setCurrentIntegration(updateIntegration);
            }
        }
        setLoading(false);
    };

    const getInitialValues = (): Scheduling => {
        return currentIntegration?.scheduling || defaultScheduling;
    };

    const onSubmit = async (values: Scheduling) => {
        setLoading(true);

        const updatedIntegration = {
            ...currentIntegration,
            scheduling: values,
        };

        let error: any;
        await HealthService.updateHealthIntegration(
            workspaceId,
            updatedIntegration,
            (responseError) => (error = responseError)
        );

        setLoading(false);

        if (error) {
            addNotification({
                type: 'danger',
                title: getTranslation('Error'),
                message: error?.message || getTranslation('Error saving configuration'),
            });
            return;
        }

        setCurrentIntegration(updatedIntegration);

        if (props.onIntegrationUpdated) {
            props.onIntegrationUpdated(updatedIntegration);
        }

        addNotification({
            type: 'success',
            title: getTranslation('Success'),
            message: getTranslation('Configuration saved successfully'),
        });

        onClose();
    };

    return (
        <Drawer
            title={
                <strong style={{ color: '#696969' }}>
                    {getTranslation('Configuração de Agendamento Online')}
                </strong>
            }
            placement='right'
            onClose={onClose}
            open={visible}
            width={900}
            footer={null}
        >
            <Wrapper flexBox flexDirection='column' padding='20px'>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size='large' />
                    </div>
                ) : (
                    <Formik
                        initialValues={getInitialValues()}
                        enableReinitialize
                        validationSchema={getValidationSchema()}
                        onSubmit={onSubmit}
                    >
                        {({ values, errors, touched, setFieldValue, handleSubmit, isSubmitting }) => (
                            <Form layout='vertical'>
                                {/* Configuração Geral */}
                                <Card title='Configuração Geral' style={{ marginBottom: 24 }}>
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    'Ativo',
                                                    'Habilita ou desabilita toda a funcionalidade de agendamento online. Quando desativado, nenhum agendamento poderá ser feito através do link.'
                                                )}
                                                validateStatus={touched.active && errors.active ? 'error' : ''}
                                                help={touched.active && errors.active}
                                            >
                                                <Switch
                                                    checked={values.active}
                                                    onChange={(checked) => setFieldValue('active', checked)}
                                                />
                                                <span style={{ marginLeft: 8 }}>
                                                    {values.active ? 'Habilitado' : 'Desabilitado'}
                                                </span>
                                            </Form.Item>
                                        </Col>
                                        <Col span={16}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    values.active ? 'Formato da Orientação *' : 'Formato da Orientação',
                                                    'Define como as orientações serão enviadas aos pacientes: Arquivo (PDF, imagem) ou Texto (mensagem simples)'
                                                )}
                                                validateStatus={touched.guidanceFormatType && errors.guidanceFormatType ? 'error' : ''}
                                                help={touched.guidanceFormatType && errors.guidanceFormatType}
                                            >
                                                <Select
                                                    value={values.guidanceFormatType}
                                                    onChange={(value) => setFieldValue('guidanceFormatType', value)}
                                                    disabled={!values.active}
                                                    placeholder='Selecione o formato'
                                                >
                                                    <Select.Option value={SchedulingGuidanceFormat.file}>
                                                        {getTranslation('Arquivo')}
                                                    </Select.Option>
                                                    <Select.Option value={SchedulingGuidanceFormat.rawText}>
                                                        {getTranslation('Texto')}
                                                    </Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={24}>
                                            <Form.Item label={createLabelWithTooltip(
                                                'Criar link após agendamento',
                                                'Gera automaticamente um link de agendamento online sempre que uma nova consulta for criada no sistema'
                                            )}>
                                                <Switch
                                                    checked={values.createSchedulingLinkAfterCreateSchedule}
                                                    onChange={(checked) => 
                                                        setFieldValue('createSchedulingLinkAfterCreateSchedule', checked)
                                                    }
                                                    disabled={!values.active}
                                                />
                                                <span style={{ marginLeft: 8 }}>
                                                    Gerar automaticamente um link de agendamento após criar consulta
                                                </span>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                {/* Informações da Clínica */}
                                <Card title='Informações da Clínica' style={{ marginBottom: 24 }}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    values.active ? 'Nome Amigável *' : 'Nome Amigável',
                                                    'Nome mais simples e familiar que será exibido para os pacientes na tela de agendamento'
                                                )}
                                                validateStatus={(touched.config as any)?.friendlyName && (errors.config as any)?.friendlyName ? 'error' : ''}
                                                help={(touched.config as any)?.friendlyName && (errors.config as any)?.friendlyName}
                                            >
                                                <Input
                                                    value={values.config?.friendlyName || ''}
                                                    onChange={(e) => setFieldValue('config.friendlyName', e.target.value)}
                                                    disabled={!values.active}
                                                    placeholder='Nome exibido ao paciente'
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    values.active ? 'Logo (URL) *' : 'Logo (URL)',
                                                    'Endereço web da imagem da logo da clínica que aparecerá na tela de agendamento. Formatos aceitos: PNG, JPG, SVG'
                                                )}
                                                validateStatus={(touched.config as any)?.logo && (errors.config as any)?.logo ? 'error' : ''}
                                                help={(touched.config as any)?.logo && (errors.config as any)?.logo}
                                            >
                                                <Input
                                                    value={values.config?.logo || ''}
                                                    onChange={(e) => setFieldValue('config.logo', e.target.value)}
                                                    disabled={!values.active}
                                                    placeholder='URL da logo da clínica'
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                {/* WhatsApp */}
                                <Card title='Configurações WhatsApp' style={{ marginBottom: 24 }}>
                                    <Row gutter={16}>
                                        <Col span={6}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    values.active ? 'Número do WhatsApp *' : 'Número do WhatsApp',
                                                    'Número do WhatsApp da clínica no formato internacional (+5511999999999) para contato direto com os pacientes'
                                                )}
                                                validateStatus={(touched.config as any)?.whatsapp?.phoneNumber && (errors.config as any)?.whatsapp?.phoneNumber ? 'error' : ''}
                                                help={(touched.config as any)?.whatsapp?.phoneNumber && (errors.config as any)?.whatsapp?.phoneNumber}
                                            >
                                                <Input
                                                    value={values.config?.whatsapp?.phoneNumber || ''}
                                                    onChange={(e) => 
                                                        setFieldValue('config.whatsapp.phoneNumber', e.target.value)
                                                    }
                                                    disabled={!values.active}
                                                    placeholder='Ex: +5511999999999'
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={9}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    values.active ? 'Mensagem de Agendamento *' : 'Mensagem de Agendamento',
                                                    'Mensagem que será enviada automaticamente quando o paciente iniciar um novo agendamento'
                                                )}
                                                validateStatus={(touched.config as any)?.whatsapp?.startSchedulingMessage && (errors.config as any)?.whatsapp?.startSchedulingMessage ? 'error' : ''}
                                                help={(touched.config as any)?.whatsapp?.startSchedulingMessage && (errors.config as any)?.whatsapp?.startSchedulingMessage}
                                            >
                                                <Input.TextArea
                                                    value={values.config?.whatsapp?.startSchedulingMessage || ''}
                                                    onChange={(e) => 
                                                        setFieldValue('config.whatsapp.startSchedulingMessage', e.target.value)
                                                    }
                                                    disabled={!values.active}
                                                    rows={3}
                                                    placeholder='Mensagem enviada ao iniciar agendamento'
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={9}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    values.active ? 'Mensagem de Reagendamento *' : 'Mensagem de Reagendamento',
                                                    'Mensagem que será enviada automaticamente quando o paciente solicitar reagendamento de uma consulta'
                                                )}
                                                validateStatus={(touched.config as any)?.whatsapp?.startReschedulingMessage && (errors.config as any)?.whatsapp?.startReschedulingMessage ? 'error' : ''}
                                                help={(touched.config as any)?.whatsapp?.startReschedulingMessage && (errors.config as any)?.whatsapp?.startReschedulingMessage}
                                            >
                                                <Input.TextArea
                                                    value={values.config?.whatsapp?.startReschedulingMessage || ''}
                                                    onChange={(e) => 
                                                        setFieldValue('config.whatsapp.startReschedulingMessage', e.target.value)
                                                    }
                                                    disabled={!values.active}
                                                    rows={3}
                                                    placeholder='Mensagem enviada ao reagendar'
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                {/* Recursos */}
                                <Card title='Recursos do Agendamento' style={{ marginBottom: 24 }}>
                                    <Row gutter={24}>
                                        {/* Cancelamento */}
                                        <Col span={8}>
                                            <Card size='small' title='Cancelamento' type='inner'>
                                                <Form.Item>
                                                    <Switch
                                                        checked={values.config?.resources?.cancellation?.enableScheduleCancellation}
                                                        onChange={(checked) => 
                                                            setFieldValue('config.resources.cancellation.enableScheduleCancellation', checked)
                                                        }
                                                        disabled={!values.active}
                                                    />
                                                    <span style={{ marginLeft: 8 }}>
                                                        <Tooltip title="Permite que os pacientes cancelem seus agendamentos através do sistema online">
                                                            Permitir cancelamento
                                                        </Tooltip>
                                                    </span>
                                                </Form.Item>
                                                <Form.Item 
                                                    label={createLabelWithTooltip(
                                                        'Horas antes do agendamento',
                                                        'Número mínimo de horas de antecedência necessárias para permitir o cancelamento da consulta'
                                                    )}
                                                    validateStatus={
                                                        (touched.config as any)?.resources?.cancellation?.hoursBeforeAppointmentToAllowCancellation && 
                                                        (errors.config as any)?.resources?.cancellation?.hoursBeforeAppointmentToAllowCancellation ? 'error' : ''
                                                    }
                                                    help={
                                                        (touched.config as any)?.resources?.cancellation?.hoursBeforeAppointmentToAllowCancellation && 
                                                        (errors.config as any)?.resources?.cancellation?.hoursBeforeAppointmentToAllowCancellation
                                                    }
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        max={168}
                                                        value={values.config?.resources?.cancellation?.hoursBeforeAppointmentToAllowCancellation}
                                                        onChange={(value) => 
                                                            setFieldValue('config.resources.cancellation.hoursBeforeAppointmentToAllowCancellation', value && value > 0 ? value : undefined)
                                                        }
                                                        disabled={
                                                            !values.active || 
                                                            !values.config?.resources?.cancellation?.enableScheduleCancellation
                                                        }
                                                        placeholder='Ex: 24'
                                                        style={{ width: '100%' }}
                                                        parser={(value) => {
                                                            if (!value) return 0;
                                                            const parsed = parseInt(value.replace(/\D/g, ''));
                                                            return isNaN(parsed) ? 0 : parsed;
                                                        }}
                                                        formatter={(value) => value && value > 0 ? `${value}` : ''}
                                                    />
                                                </Form.Item>
                                            </Card>
                                        </Col>

                                        {/* Confirmação */}
                                        <Col span={8}>
                                            <Card size='small' title='Confirmação' type='inner'>
                                                <Form.Item>
                                                    <Switch
                                                        checked={values.config?.resources?.confirmation?.enableScheduleConfirmation}
                                                        onChange={(checked) => 
                                                            setFieldValue('config.resources.confirmation.enableScheduleConfirmation', checked)
                                                        }
                                                        disabled={!values.active}
                                                    />
                                                    <span style={{ marginLeft: 8 }}>
                                                        <Tooltip title="Permite que os pacientes confirmem seus agendamentos através do sistema online">
                                                            Permitir confirmação
                                                        </Tooltip>
                                                    </span>
                                                </Form.Item>
                                                <Form.Item 
                                                    label={createLabelWithTooltip(
                                                        'Horas antes do agendamento',
                                                        'Número mínimo de horas de antecedência necessárias para permitir a confirmação da consulta'
                                                    )}
                                                    validateStatus={
                                                        (touched.config as any)?.resources?.confirmation?.hoursBeforeAppointmentToAllowConfirmation && 
                                                        (errors.config as any)?.resources?.confirmation?.hoursBeforeAppointmentToAllowConfirmation ? 'error' : ''
                                                    }
                                                    help={
                                                        (touched.config as any)?.resources?.confirmation?.hoursBeforeAppointmentToAllowConfirmation && 
                                                        (errors.config as any)?.resources?.confirmation?.hoursBeforeAppointmentToAllowConfirmation
                                                    }
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        max={168}
                                                        value={values.config?.resources?.confirmation?.hoursBeforeAppointmentToAllowConfirmation}
                                                        onChange={(value) => 
                                                            setFieldValue('config.resources.confirmation.hoursBeforeAppointmentToAllowConfirmation', value && value > 0 ? value : undefined)
                                                        }
                                                        disabled={
                                                            !values.active || 
                                                            !values.config?.resources?.confirmation?.enableScheduleConfirmation
                                                        }
                                                        placeholder='Ex: 24'
                                                        style={{ width: '100%' }}
                                                        parser={(value) => {
                                                            if (!value) return 0;
                                                            const parsed = parseInt(value.replace(/\D/g, ''));
                                                            return isNaN(parsed) ? 0 : parsed;
                                                        }}
                                                        formatter={(value) => value && value > 0 ? `${value}` : ''}
                                                    />
                                                </Form.Item>
                                            </Card>
                                        </Col>

                                        {/* Reagendamento */}
                                        <Col span={8}>
                                            <Card size='small' title='Reagendamento' type='inner'>
                                                <Form.Item>
                                                    <Switch
                                                        checked={values.config?.resources?.rescheduling?.enableScheduleRescheduling}
                                                        onChange={(checked) => 
                                                            setFieldValue('config.resources.rescheduling.enableScheduleRescheduling', checked)
                                                        }
                                                        disabled={!values.active}
                                                    />
                                                    <span style={{ marginLeft: 8 }}>
                                                        <Tooltip title="Permite que os pacientes reagendem suas consultas para outros horários disponíveis">
                                                            Permitir reagendamento
                                                        </Tooltip>
                                                    </span>
                                                </Form.Item>
                                                <Form.Item 
                                                    label={createLabelWithTooltip(
                                                        'Horas antes do agendamento',
                                                        'Número mínimo de horas de antecedência necessárias para permitir o reagendamento da consulta'
                                                    )}
                                                    validateStatus={
                                                        (touched.config as any)?.resources?.rescheduling?.hoursBeforeAppointmentToAllowRescheduling && 
                                                        (errors.config as any)?.resources?.rescheduling?.hoursBeforeAppointmentToAllowRescheduling ? 'error' : ''
                                                    }
                                                    help={
                                                        (touched.config as any)?.resources?.rescheduling?.hoursBeforeAppointmentToAllowRescheduling && 
                                                        (errors.config as any)?.resources?.rescheduling?.hoursBeforeAppointmentToAllowRescheduling
                                                    }
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        max={168}
                                                        value={values.config?.resources?.rescheduling?.hoursBeforeAppointmentToAllowRescheduling}
                                                        onChange={(value) => 
                                                            setFieldValue('config.resources.rescheduling.hoursBeforeAppointmentToAllowRescheduling', value && value > 0 ? value : undefined)
                                                        }
                                                        disabled={
                                                            !values.active || 
                                                            !values.config?.resources?.rescheduling?.enableScheduleRescheduling
                                                        }
                                                        placeholder='Ex: 24'
                                                        style={{ width: '100%' }}
                                                        parser={(value) => {
                                                            if (!value) return 0;
                                                            const parsed = parseInt(value.replace(/\D/g, ''));
                                                            return isNaN(parsed) ? 0 : parsed;
                                                        }}
                                                        formatter={(value) => value && value > 0 ? `${value}` : ''}
                                                    />
                                                </Form.Item>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Card>

                                {/* Upload de Documentos */}
                                <Card title='Upload de Documentos' style={{ marginBottom: 24 }}>
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item label="Permitir Upload de Documentos">
                                                <Switch
                                                    checked={values.config?.documents?.enableDocumentsUpload}
                                                    onChange={(checked) => 
                                                        setFieldValue('config.documents.enableDocumentsUpload', checked)
                                                    }
                                                    disabled={!values.active}
                                                />
                                                <span style={{ marginLeft: 8 }}>
                                                    <Tooltip title="Habilita a funcionalidade de upload de documentos pelos pacientes durante o agendamento">
                                                        {values.config?.documents?.enableDocumentsUpload ? 'Habilitado' : 'Desabilitado'}
                                                    </Tooltip>
                                                </span>
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    'Tamanho máximo (MB)',
                                                    'Tamanho máximo permitido para cada arquivo enviado pelos pacientes (entre 1MB e 20MB)'
                                                )}
                                                validateStatus={
                                                    (touched.config as any)?.documents?.documentsMaxSizeInMb && 
                                                    (errors.config as any)?.documents?.documentsMaxSizeInMb ? 'error' : ''
                                                }
                                                help={
                                                    (touched.config as any)?.documents?.documentsMaxSizeInMb && 
                                                    (errors.config as any)?.documents?.documentsMaxSizeInMb
                                                }
                                            >
                                                <InputNumber
                                                    min={1}
                                                    max={20}
                                                    value={values.config?.documents?.documentsMaxSizeInMb}
                                                    onChange={(value) => 
                                                        setFieldValue('config.documents.documentsMaxSizeInMb', value && value > 0 ? value : undefined)
                                                    }
                                                    disabled={
                                                        !values.active || 
                                                        !values.config?.documents?.enableDocumentsUpload
                                                    }
                                                    placeholder='Ex: 5'
                                                    style={{ width: '100%' }}
                                                    parser={(value) => {
                                                        if (!value) return 0;
                                                        const parsed = parseInt(value.replace(/\D/g, ''));
                                                        return isNaN(parsed) ? 0 : parsed;
                                                    }}
                                                    formatter={(value) => value && value > 0 ? `${value}` : ''}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label={createLabelWithTooltip(
                                                'Instruções para o Paciente',
                                                'Texto extra para orientar o paciente sobre quais documentos enviar, formatos aceitos, tamanho máximo, etc. Aparece na tela de upload como instrução adicional'
                                            )}>
                                                <Input.TextArea
                                                    value={values.config?.documents?.suporteMessage || ''}
                                                    onChange={(e) => 
                                                        setFieldValue('config.documents.suporteMessage', e.target.value)
                                                    }
                                                    disabled={
                                                        !values.active || 
                                                        !values.config?.documents?.enableDocumentsUpload
                                                    }
                                                    rows={3}
                                                    placeholder='Ex: Envie documentos em PDF ou JPG de até 20MB. Aceitos: RG, CPF, carteirinha do plano...'
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                                {/* Botões de Ação */}
                                <Row justify='end' style={{ marginTop: 24 }}>
                                    <Space>
                                        <Button onClick={onClose}>
                                            {getTranslation('Cancel')}
                                        </Button>
                                        <Button
                                            type='primary'
                                            onClick={() => handleSubmit()}
                                            loading={isSubmitting}
                                            style={{ 
                                                color: '#ffffff', 
                                                backgroundColor: '#1890ff',
                                                borderColor: '#1890ff'
                                            }}
                                        >
                                            <span style={{ color: '#ffffff' }}>{getTranslation('Save')}</span>
                                        </Button>
                                    </Space>
                                </Row>
                            </Form>
                        )}
                    </Formik>
                )}
            </Wrapper>
        </Drawer>
    );
};

export default i18n(SchedulingLinkConfig) as FC<SchedulingLinkConfigProps>;