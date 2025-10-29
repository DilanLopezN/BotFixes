import {
    Button,
    Card,
    Col,
    Drawer,
    Form,
    Input,
    InputNumber,
    Row,
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
    DocumentsConfiguration
} from '../../../../../../../model/Integrations';
import { Wrapper } from '../../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../../utils/AddNotification';
import i18n from '../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../../services/HealthService';

interface DocumentsConfigProps {
    integration: HealthIntegration;
    workspaceId: string;
    visible: boolean;
    onClose: () => void;
    onIntegrationUpdated?: (updatedIntegration: HealthIntegration) => void;
}

const getValidationSchema = (): Yup.ObjectSchema<any> => {
    return Yup.object().shape({
        enableDocumentsUpload: Yup.boolean(),
        documentsMaxSizeInMb: Yup.number()
            .nullable()
            .when('enableDocumentsUpload', {
                is: true,
                then: (schema) => schema
                    .required('Tamanho máximo é obrigatório quando documentos estão habilitados')
                    .positive('Deve ser um número maior que zero')
                    .max(20, 'Tamanho máximo de 20MB')
                    .integer('Deve ser um número inteiro'),
                otherwise: (schema) => schema
                    .typeError('Deve ser um número válido')
                    .positive('Deve ser um número maior que zero')
                    .max(20, 'Tamanho máximo de 20MB')
                    .integer('Deve ser um número inteiro'),
            }),
    });
};

const DocumentsConfigComponent: FC<DocumentsConfigProps & I18nProps> = (props) => {
    const { getTranslation, integration, workspaceId, visible, onClose } = props;

    const createLabelWithTooltip = (label: string, tooltip: string) => (
        <span>
            {label}{' '}
            <Tooltip title={tooltip}>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
        </span>
    );

    const defaultDocuments: DocumentsConfiguration = {
        enableDocumentsUpload: false,
        documentsMaxSizeInMb: 5,
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

    const getInitialValues = (): DocumentsConfiguration => {
        return currentIntegration?.documents || defaultDocuments;
    };

    const onSubmit = async (values: DocumentsConfiguration) => {
        setLoading(true);

        const updatedIntegration = {
            ...currentIntegration,
            documents: values,
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
            message: 'Configuração de documentos salva com sucesso',
        });

        onClose();
    };

    return (
        <Drawer
            title={
                <strong style={{ color: '#696969' }}>
                    Configuração de Envio de Documentos
                </strong>
            }
            placement='right'
            onClose={onClose}
            open={visible}
            width={600}
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
                                <Card title='Configuração de Documentos' style={{ marginBottom: 24 }}>
                                    <Row gutter={16}>
                                        <Col span={24}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    'Habilitar Upload de Documentos',
                                                    'Permite que os pacientes façam upload de documentos através do modal de envio de documentos no chat'
                                                )}
                                                validateStatus={touched.enableDocumentsUpload && errors.enableDocumentsUpload ? 'error' : ''}
                                                help={touched.enableDocumentsUpload && errors.enableDocumentsUpload}
                                            >
                                                <Switch
                                                    checked={values.enableDocumentsUpload}
                                                    onChange={(checked) => setFieldValue('enableDocumentsUpload', checked)}
                                                />
                                                <span style={{ marginLeft: 8 }}>
                                                    {values.enableDocumentsUpload ? 'Habilitado' : 'Desabilitado'}
                                                </span>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item 
                                                label={createLabelWithTooltip(
                                                    values.enableDocumentsUpload ? 'Tamanho Máximo (MB) *' : 'Tamanho Máximo (MB)',
                                                    'Tamanho máximo permitido para cada arquivo enviado pelos pacientes (entre 1MB e 20MB)'
                                                )}
                                                validateStatus={touched.documentsMaxSizeInMb && errors.documentsMaxSizeInMb ? 'error' : ''}
                                                help={touched.documentsMaxSizeInMb && errors.documentsMaxSizeInMb}
                                            >
                                                <InputNumber
                                                    min={1}
                                                    max={20}
                                                    value={values.documentsMaxSizeInMb}
                                                    onChange={(value) => 
                                                        setFieldValue('documentsMaxSizeInMb', value && value > 0 ? value : 5)
                                                    }
                                                    disabled={!values.enableDocumentsUpload}
                                                    placeholder='Ex: 5'
                                                    style={{ width: '100%' }}
                                                    parser={(value) => {
                                                        if (!value) return 5;
                                                        const parsed = parseInt(value.replace(/\D/g, ''));
                                                        return isNaN(parsed) || parsed === 0 ? 5 : parsed;
                                                    }}
                                                    formatter={(value) => value && value > 0 ? `${value}` : '5'}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={24}>
                                            <Card 
                                                type="inner" 
                                                size="small"
                                                title="Informações Importantes"
                                                style={{ backgroundColor: '#f6f8fa' }}
                                            >
                                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                    <li>Os documentos serão enviados através do modal de documentos no chat</li>
                                                    <li>É necessário autenticação por CPF para envio de documentos</li>
                                                    <li>Formatos aceitos: PDF, JPG, PNG, DOC, DOCX</li>
                                                    <li>O tamanho máximo por arquivo é configurável de 1MB a 20MB</li>
                                                </ul>
                                            </Card>
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

export default i18n(DocumentsConfigComponent) as FC<DocumentsConfigProps>;