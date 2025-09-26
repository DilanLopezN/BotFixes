import {
    Badge,
    Button,
    Col,
    Dropdown,
    Form,
    Input,
    Modal,
    Popover,
    Row,
    Select,
    Space,
    Switch,
    Tag,
    Timeline,
    Tooltip,
    Card,
    Divider,
    Typography,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { BsArrowLeft } from 'react-icons/bs';
import { Formik } from 'formik';
import { HealthEntityType, HealthIntegrationSynchronizeStatus } from 'kissbot-core';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import * as Yup from 'yup';
import { HealthIntegration, IntegrationEnvironment, IntegrationsType } from '../../../../../../model/Integrations';
import Header from '../../../../../../shared-v2/Header/Header';
import { TextLink } from '../../../../../../shared/TextLink/styled';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../utils/AddNotification';
import { isAnySystemAdmin, isSystemAdmin, isSystemDevAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../services/HealthService';
import HealthIntegrationFormRules from '../HealthIntegrationFormRules';
import NotificationsList from '../NotificationsList';
import IntegratedMessage from './IntegratedMessage';
import { HealthIntegrationsSettingsProps, statusProps } from './props';
import SchedulingLinkConfig from './SchedulingLinkConfig/SchedulingLinkConfig';
import { DocumentsConfig } from './DocumentsConfig';
import { CustomLastTimelineItem, CustomTimeline, MenuBodyWrap } from './styles';
import useRequestEntityImport from './useRequestEntityImport';

const { Option } = Select;

const getValidationSchema = (): Yup.ObjectSchema<any> => {
    return Yup.object().shape({
        name: Yup.string().required(),
        showExternalEntities: Yup.string(),
        type: Yup.string().required(),
        entities: Yup.array().of(Yup.string()),
        requiredAuthentication: Yup.boolean(),
        enabled: Yup.boolean(),
    });
};

const HealthIntegrationSettings: FC<HealthIntegrationsSettingsProps & I18nProps> = (props) => {
    const {
        getTranslation,
        integration,
        onIntegrationCreated,
        workspaceId,
        integrations,
        onCancelCreatingIntegration,
        onChangeIntegrationSelected,
        setSelectedIntegration,
    } = props;

    let activeComponent: JSX.Element = <div />;
    const history: any = useHistory();
    const [showRules, setShowRules] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isIntegratedMessage, setIsIntegratedMessage] = useState(false);
    const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
    const [forceCorrelationOpened, setForceCorrelationOpened] = useState(false);
    const [publishingEntities, setpublishingEntities] = useState(false);
    const [loadingClearCache, setLoadingClearCache] = useState(false);
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);
    const [showSchedulingLink, setShowSchedulingLink] = useState(false);
    const [showDocumentsConfig, setShowDocumentsConfig] = useState(false);
    const [lastPublishEntities, setLastPubishEntities] = useState<number | null>(null);
    const [increment, setIncrement] = useState<number>(0);
    const [formSubmitRef, setFormSubmitRef] = useState<(() => void) | null>(null);
    const { loading: loadingEntities, onRequestEntityImport } = useRequestEntityImport();
    const newMessagesCount = integration.newMessagesCount + increment;

    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const disableForm = !isAnySystemAdmin(loggedUser);
    const defaultProps: any = { size: 'large' };
    const onSubmit = async (formIntegration: HealthIntegration) => {
        const errorToken = 'ERR';
        let response: any;
        let message: string;
        let integrationToSave: HealthIntegration = {
            ...formIntegration,
            syncStatus: integration.syncStatus,
            lastSyncTimestamp: integration.lastSyncTimestamp,
        };

        if (formIntegration.type === IntegrationsType.CM && !formIntegration.environment) {
            integrationToSave.environment = IntegrationEnvironment.production;
        }

        if (!!integration._id) {
            response = await HealthService.updateHealthIntegration(workspaceId, integrationToSave, () => errorToken);
            message = getTranslation('Health integration updated');
        } else {
            response = await HealthService.createHealthIntegration(workspaceId, integrationToSave, () => errorToken);
            if (response !== errorToken) {
                integrationToSave = response;
            }
            message = getTranslation('Health integration created');
        }

        if (response === errorToken) {
            addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Error. Try again'),
                type: 'danger',
            });
        } else {
            addNotification({
                title: getTranslation('Success'),
                message,
                type: 'success',
            });
            setIsSaveDisabled(true);
            history.replace(`/integrations/${integrationToSave._id}/settings`);

            return onIntegrationCreated(integrationToSave);
        }
    };

    const onSynchronize = async (force?: boolean) => {
        if (!force && integration.syncStatus === HealthIntegrationSynchronizeStatus.synchronizing) {
            return setForceCorrelationOpened(true);
        }

        addNotification({
            title: getTranslation('Success'),
            message: getTranslation('Synchronization effected. Follow the progress through the status field'),
            type: 'success',
        });

        onChangeIntegrationSelected({
            ...integration,
            syncStatus: HealthIntegrationSynchronizeStatus.synchronizing,
        });

        let error: any;
        await HealthService.synchronizeHealthIntegration(workspaceId, integration, force, (err) => (error = err));

        if (error?.error === 'CORRELATE_RUNNING') {
            setForceCorrelationOpened(true);
        }

        if (error?.code === 'ECONNABORTED') {
            return;
        }

        if (error?.error) {
            addNotification({
                title: getTranslation('Error'),
                message: error?.error?.message,
                type: 'danger',
            });
        }
    };

    const onRequesteIntegrationStatus = async () => {
        if (!integration._id) {
            return;
        }
        try {
            const status: statusProps = await HealthService.getIntegrationStatus(workspaceId, integration._id);
            if (status.online === true) {
                addNotification({
                    title: getTranslation('Online'),
                    message: getTranslation('The integration is online'),
                    type: 'info',
                });
            } else {
                addNotification({
                    title: getTranslation('Offline'),
                    message: getTranslation('The integration is offline'),
                    type: 'warning',
                });
            }
            setSelectedIntegration({ ...integration, integrationStatus: status });
        } catch (error) {
            console.log(error, 'error');
        }
    };

    const requestEntityImport = () => {
        onRequestEntityImport({
            workspaceId,
            integration,
            addNotification,
            getTranslation,
            integrations,
            setSelectedIntegration,
        });
    };

    const onRequestPublishEntities = async () => {
        setpublishingEntities(true);
        let error: any;
        await HealthService.synchronizeHealthEntities(workspaceId, integration, (err: any) => {
            error = err;
        });

        if (error) {
            setpublishingEntities(false);
            return addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Error publishing to entities'),
                type: 'danger',
            });
        }

        setpublishingEntities(false);
        addNotification({
            title: getTranslation('Success'),
            message: getTranslation('Published entities'),
            type: 'success',
        });

        const date = +new Date();
        setSelectedIntegration({
            ...integration,
            lastSinglePublishEntities: {
                ...integration.lastSinglePublishEntities,
                appointmentType: date,
                doctor: date,
                group: date,
                insurance: date,
                insurancePlan: date,
                insuranceSubPlan: date,
                organizationUnit: date,
                planCategory: date,
                procedure: date,
                speciality: date,
            },
        });
    };

    const updateRules = async (formIntegration: HealthIntegration) => {
        const errorToken = 'ERR';
        let response: any;
        let message: string;
        let integrationToSave: HealthIntegration = {
            ...formIntegration,
            syncStatus: integration.syncStatus,
            lastSyncTimestamp: integration.lastSyncTimestamp,
        };

        response = await HealthService.updateHealthIntegration(workspaceId, integrationToSave, () => errorToken);
        message = getTranslation('Integration rules updated');

        if (response === errorToken) {
            addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Failed to update integration rules.'),
                type: 'danger',
            });
        } else {
            addNotification({ title: getTranslation('Success'), message, type: 'success' });
            onChangeIntegrationSelected(integrationToSave);
        }

        setShowRules(false);
    };

    const onRequestClearCache = async () => {
        setLoadingClearCache(true);
        let error: any;
        await HealthService.clearCacheIntegration(workspaceId, integration._id as string, (err: any) => {
            error = err;
        });

        if (error) {
            setLoadingClearCache(false);
            return addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Error clearing integration cache'),
                type: 'danger',
            });
        }
        setLoadingClearCache(false);
        addNotification({
            title: getTranslation('Success'),
            message: getTranslation('Successfully cleared integration cache'),
            type: 'success',
        });
    };

    const generateAccessToken = async () => {
        const response = await HealthService.generateAccessToken(workspaceId, integration._id as string);

        if (response?.token) {
            setAccessToken(response.token);
        }
    };

    const redirectLink = (integration: HealthIntegration) => {
        let dynamicLink: string | undefined;

        if (integration.type === 'DOCTORALIA') {
            dynamicLink = `https://app.tuotempo.com/mop/index.php?dbName=${integration.codeIntegration}`;
        }

        window.open(dynamicLink, '_blank');
    };

    const getHealthEntityTypeOptions = () => {
        return Object.keys(HealthEntityType)
            .map((key) => ({
                label: getTranslation(key),
                value: key,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    };

    const options = Object.keys(IntegrationsType).map((key) => {
        if (key === 'CUSTOM_IMPORT') {
            return {
                label: 'CUSTOMIZADO',
                value: key,
            };
        }

        return {
            label: key,
            value: key,
        };
    });

    useEffect(() => {
        const { lastSinglePublishEntities } = integration;
        if (lastSinglePublishEntities) {
            const maxDateValue = Math.max(...Object.values(lastSinglePublishEntities));
            setLastPubishEntities(maxDateValue);
        }
    }, [integration]);

    const editRules = () => {
        return (
            <HealthIntegrationFormRules
                integration={integration}
                onIntegrationSaved={(integration) => {
                    updateRules(integration);
                }}
                onClose={() => setShowRules(false)}
            />
        );
    };

    const schedulingLinkConfig = (
        <SchedulingLinkConfig
            integration={integration}
            workspaceId={workspaceId}
            visible={showSchedulingLink}
            onClose={() => setShowSchedulingLink(false)}
            onIntegrationUpdated={(updatedIntegration) => {
                setSelectedIntegration(updatedIntegration);
            }}
        />
    );

    const documentsConfig = (
        <DocumentsConfig
            integration={integration}
            workspaceId={workspaceId}
            visible={showDocumentsConfig}
            onClose={() => setShowDocumentsConfig(false)}
            onIntegrationUpdated={(updatedIntegration) => {
                setSelectedIntegration(updatedIntegration);
            }}
        />
    );

    const notificationComponent = () => {
        return (
            <NotificationsList
                increment={increment}
                setIncrement={setIncrement}
                getTranslation={getTranslation}
                workspaceId={workspaceId}
                integrationId={integration._id}
                setShowNotifications={setShowNotifications}
                Close={() => {
                    setShowNotifications(false);
                    setShowRules(false);
                }}
            />
        );
    };

    const integratedMessage = () => {
        return (
            <IntegratedMessage
                integration={integration}
                workspaceId={workspaceId}
                onClose={() => setIsIntegratedMessage(false)}
                onIntegrationUpdated={(updatedIntegration) => {
                    setSelectedIntegration(updatedIntegration);
                }}
            />
        );
    };

    const createIntegrationMenuOptions = () => {
        const items = [
            {
                key: 'importEntities',
                label: getTranslation('Import entities'),
                disabled: !isSaveDisabled || loadingEntities,
                children: loadingEntities
                    ? `${getTranslation('Import entities')}...`
                    : getTranslation('Import entities'),
                onClick: requestEntityImport,
            },
            {
                key: 'clearCache',
                label: getTranslation('Clear integration cache'),
                disabled: disableForm || loadingClearCache,
                children: loadingClearCache
                    ? `${getTranslation('Clear integration cache')}...`
                    : getTranslation('Clear integration cache'),
                onClick: onRequestClearCache,
            },
            {
                key: 'testIntegration',
                label: getTranslation('Test integration'),
                children: getTranslation('Test integration'),
                onClick: onRequesteIntegrationStatus,
            },
        ];

        return {
            items: items.filter(
                (item) => integration.type !== IntegrationsType.CUSTOM_IMPORT || item.key === 'testIntegration'
            ),
        };
    };

    const healthIntegrationComponent = () => {
        return (
            <Form layout='vertical'>
                <Modal
                    title={getTranslation('Access token')}
                    open={!!accessToken}
                    onOk={() => {
                        setAccessToken(undefined);
                    }}
                    footer={null}
                    onCancel={() => {
                        setAccessToken(undefined);
                    }}
                >
                    <p>{accessToken}</p>
                </Modal>
                <Header
                    title={
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 600 }}>
                                {integration._id ? getTranslation('Settings') : getTranslation('New')}
                            </div>
                            {integration._id && (
                                <div style={{ 
                                    fontSize: '14px', 
                                    color: '#666', 
                                    fontWeight: 400, 
                                    marginTop: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <BsArrowLeft 
                                        style={{ 
                                            cursor: 'pointer', 
                                            fontSize: '12px',
                                            color: '#1890ff'
                                        }}
                                        onClick={() => {
                                            history.push('/integrations');
                                        }}
                                    />
                                    {integration.name}
                                </div>
                            )}
                        </div>
                    }
                    action={
                        <>
                            {integration._id ? (
                                <Space>
                                    {integration.integrationStatus && !integration.integrationStatus?.online && (
                                        <span>
                                            <Tooltip
                                                title={`Offline ${getTranslation('since')} ${new Date(
                                                    integration.integrationStatus.since
                                                ).toLocaleString()}`}
                                                overlayStyle={{ maxWidth: '300em' }}
                                            >
                                                <Tag
                                                    color='red'
                                                    style={{
                                                        height: '26px',
                                                        justifyContent: 'center',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {getTranslation('Offline Integration')}
                                                </Tag>
                                            </Tooltip>
                                        </span>
                                    )}
                                    {!disableForm && (
                                        <Button
                                            type='primary'
                                            className='antd-span-default-color'
                                            onClick={() => formSubmitRef && formSubmitRef()}
                                            disabled={isSaveDisabled}
                                            children={getTranslation('Save')}
                                        />
                                    )}
                                    {integration.type !== IntegrationsType.CUSTOM_IMPORT && (
                                        <Dropdown.Button
                                            type='default'
                                            className='antd-span-default-color'
                                            loading={publishingEntities}
                                            onClick={onRequestPublishEntities}
                                            disabled={!isSaveDisabled}
                                            menu={{
                                                items: createIntegrationMenuOptions().items.map((item) => ({
                                                    key: item.key,
                                                    label: item.children,
                                                    disabled: item.disabled,
                                                    onClick: item.onClick,
                                                })),
                                            }}
                                        >
                                            {getTranslation('Publish changes')}
                                        </Dropdown.Button>
                                    )}

                                    {integration.type === IntegrationsType.CM && integration.rules?.usesCorrelation ? (
                                        <Popover
                                            open={forceCorrelationOpened}
                                            trigger='click'
                                            content={
                                                <>
                                                    <div
                                                        style={{
                                                            width: '180px',
                                                        }}
                                                    >
                                                        <span>{getTranslation('Correlation in progress')}</span>
                                                        <div
                                                            style={{
                                                                margin: '15px 0 0 0',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                            }}
                                                        >
                                                            <Button
                                                                type='ghost'
                                                                className='antd-span-default-color'
                                                                onClick={() => {
                                                                    setForceCorrelationOpened(false);
                                                                }}
                                                            >
                                                                {getTranslation('Cancel')}
                                                            </Button>
                                                            <Button
                                                                type='primary'
                                                                className='antd-span-default-color'
                                                                onClick={() => {
                                                                    onSynchronize(true);
                                                                    setForceCorrelationOpened(false);
                                                                }}
                                                            >
                                                                {getTranslation('Force')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                        >
                                            <Wrapper flexBox flexDirection='column' margin='0 0 0 10px'>
                                                <Button
                                                    type='default'
                                                    className='antd-span-default-color'
                                                    onClick={() => !forceCorrelationOpened && onSynchronize()}
                                                >
                                                    {getTranslation('Synchronize')}
                                                </Button>
                                            </Wrapper>
                                        </Popover>
                                    ) : null}
                                </Space>
                            ) : integrations.length ? (
                                <Button
                                    type='ghost'
                                    className='antd-span-default-color'
                                    onClick={onCancelCreatingIntegration}
                                    children={getTranslation('Cancel')}
                                />
                            ) : null}
                        </>
                    }
                />
                <Formik
                    initialValues={integration}
                    enableReinitialize
                    onSubmit={onSubmit}
                    validationSchema={getValidationSchema()}
                    render={({ values, submitForm, setFieldValue, touched, errors }) => {
                        // Define a referência do submitForm para uso no header
                        if (formSubmitRef !== submitForm) {
                            setFormSubmitRef(() => submitForm);
                        }
                        
                        return (
                        <MenuBodyWrap>
                            <div style={{ marginBottom: '16px' }}>
                                <Button
                                    type="default"
                                    icon={<span>←</span>}
                                    onClick={() => {
                                        history.push('/integrations');
                                    }}
                                >
                                    Voltar às Integrações
                                </Button>
                            </div>
                            
                            <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                                <Card style={{ marginBottom: '16px' }} bodyStyle={{ padding: '12px 24px' }}>
                                    <Row justify={'space-between'} align='top'>
                                        <Col xs={24} lg={12}>
                                            <Typography.Title level={5} style={{ marginBottom: '8px', marginTop: '0' }}>
                                                Status da Integração
                                            </Typography.Title>
                                        <CustomTimeline>
                                            {integration.type === IntegrationsType.CM && integration.environment && (
                                                <Timeline.Item>
                                                    {getTranslation('Environment')}:
                                                    <b>{getTranslation(integration.environment)}</b>
                                                </Timeline.Item>
                                            )}
                                            <Timeline.Item>
                                                {`${getTranslation('Last synced')}`}:
                                                <b>
                                                    {integration.lastSyncTimestamp && !isNaN(new Date(integration.lastSyncTimestamp).getTime())
                                                        ? moment(integration.lastSyncTimestamp).format('DD/MM/yyyy HH:mm')
                                                        : 'Nunca realizada'}
                                                </b>
                                            </Timeline.Item>
                                            <Timeline.Item>
                                                {`${getTranslation('Last entities synced')}`}:
                                                <b>
                                                    {integration.lastSyncEntities && !isNaN(new Date(integration.lastSyncEntities).getTime())
                                                        ? moment(integration.lastSyncEntities).format('DD/MM/yyyy HH:mm')
                                                        : 'Nunca realizada'}
                                                </b>
                                            </Timeline.Item>

                                            <CustomLastTimelineItem>
                                                {`${getTranslation(`Last entities sync`)}`}:
                                                <b>
                                                    {lastPublishEntities && lastPublishEntities !== 0 && !isNaN(new Date(lastPublishEntities).getTime())
                                                        ? moment(lastPublishEntities).format('DD/MM/yyyy HH:mm')
                                                        : 'Nunca realizada'}
                                                </b>
                                            </CustomLastTimelineItem>
                                        </CustomTimeline>
                                        {(integration.type === 'DOCTORALIA' || integration.type === 'MANAGER') && (
                                            <TextLink
                                                style={{ color: '#1890FF' }}
                                                onClick={() => redirectLink(integration)}
                                            >{`${getTranslation('Open online booking')}`}</TextLink>
                                        )}
                                        </Col>
                                        <Col xs={24} lg={12}>
                                            <Typography.Title level={5} style={{ marginBottom: '8px', marginTop: '0' }}>
                                                Ações
                                            </Typography.Title>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {(isSystemDevAdmin(loggedUser) || isSystemAdmin(loggedUser)) && (
                                                <Button
                                                    type='default'
                                                    className='antd-span-default-color'
                                                    onClick={() => {
                                                        generateAccessToken();
                                                    }}
                                                    children={'Gerar token'}
                                                />
                                            )}
                                            <Button
                                                type='default'
                                                className='antd-span-default-color'
                                                onClick={() => {
                                                    setIsIntegratedMessage(true);
                                                }}
                                                children={getTranslation('Messaging')}
                                            />
                                            {
                                                <Badge
                                                    className='antd-span-default-color'
                                                    count={newMessagesCount > 0 ? newMessagesCount : null}
                                                    offset={[-12, 0]}
                                                >
                                                    <Button
                                                        type='default'
                                                        className='antd-span-default-color'
                                                        onClick={() => {
                                                            setShowNotifications(true);
                                                        }}
                                                        children={getTranslation('Notifications')}
                                                    />
                                                </Badge>
                                            }
                                            {!integration._id && !disableForm && (
                                                <Button
                                                    type='primary'
                                                    className='antd-span-default-color'
                                                    onClick={() => formSubmitRef && formSubmitRef()}
                                                    disabled={isSaveDisabled}
                                                    children={getTranslation('Save')}
                                                />
                                            )}
                                            {integration._id && !disableForm && (
                                                <Button
                                                    type='default'
                                                    className='antd-span-default-color'
                                                    onClick={() => {
                                                        setShowRules(true);
                                                    }}
                                                    children={getTranslation('Rules')}
                                                />
                                            )}
                                            {integration._id && values.type !== IntegrationsType.CUSTOM_IMPORT && (
                                                <Button
                                                    type='default'
                                                    className='antd-span-default-color'
                                                    onClick={() => setShowSchedulingLink(true)}
                                                    children='Agendamento Online'
                                                />
                                            )}
                                            {integration._id && values.type !== IntegrationsType.CUSTOM_IMPORT && (
                                                <Button
                                                    type='default'
                                                    className='antd-span-default-color'
                                                    onClick={() => setShowDocumentsConfig(true)}
                                                    children='Configurar Documentos'
                                                />
                                            )}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>

                                <Card bodyStyle={{ padding: '12px 24px' }}>
                                    <Typography.Title level={5} style={{ marginBottom: '12px', marginTop: '0' }}>
                                        Configuração Básica
                                    </Typography.Title>
                                <Row gutter={[12, 8]}>
                                    <Col xs={24} sm={12} lg={8}>
                                        <Form.Item
                                            label={getTranslation('Name')}
                                            validateStatus={touched.name && errors.name ? 'error' : ''}
                                            help={touched.name && errors.name}
                                        >
                                            <Input
                                                {...defaultProps}
                                                disabled={disableForm}
                                                value={values.name}
                                                name={`name`}
                                                placeholder={getTranslation('Name')}
                                                onChange={(event) => {
                                                    setFieldValue('name', event.target.value);
                                                    setIsSaveDisabled(false);
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} lg={8}>
                                        <Form.Item
                                            label={getTranslation('Type')}
                                            validateStatus={touched.type && errors.type ? 'error' : ''}
                                            help={touched.type && errors.type}
                                        >
                                            <Select
                                                {...defaultProps}
                                                disabled={disableForm}
                                                options={options}
                                                value={values.type}
                                                placeholder={getTranslation('Type')}
                                                onChange={(value) => {
                                                    const newType = value;
                                                    const newAuditRequests = newType !== IntegrationsType.CUSTOM_IMPORT;
                                                    setFieldValue('type', newType);
                                                    setFieldValue('auditRequests', newAuditRequests);
                                                    setIsSaveDisabled(false);
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '12px 0' }} />

                                <Row gutter={[12, 8]}>
                                    {values.type !== IntegrationsType.CUSTOM_IMPORT && (
                                        <Col xs={24} sm={12} lg={8}>
                                            <Form.Item
                                                label={getTranslation('Environment')}
                                                validateStatus={
                                                    touched.environment && errors.environment ? 'error' : ''
                                                }
                                                help={touched.environment && errors.environment}
                                            >
                                                <Select
                                                    {...defaultProps}
                                                    disabled={
                                                        (integration.type === IntegrationsType.CM && !!values._id) ||
                                                        (values.type === IntegrationsType.CM &&
                                                            !integration.environment) ||
                                                        disableForm
                                                    }
                                                    value={values.environment || IntegrationEnvironment.production}
                                                    onChange={(value) => {
                                                        setFieldValue('environment', value);
                                                        setIsSaveDisabled(false);
                                                    }}
                                                >
                                                    <Option value={IntegrationEnvironment.production}>
                                                        {getTranslation('production')}
                                                    </Option>
                                                    <Option value={IntegrationEnvironment.test}>
                                                        {getTranslation('test')}
                                                    </Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    )}
                                    {!disableForm && (
                                        <>
                                            <Col xs={8} sm={4} lg={2}>
                                                <Form.Item
                                                    label={getTranslation('Active')}
                                                    validateStatus={touched.enabled && errors.enabled ? 'error' : ''}
                                                    help={touched.enabled && errors.enabled}
                                                >
                                                    <Switch
                                                        disabled={disableForm}
                                                        checked={values.enabled}
                                                        onChange={(checked) => {
                                                            setFieldValue('enabled', checked);
                                                            setIsSaveDisabled(false);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            {(isSystemDevAdmin(loggedUser) || isSystemAdmin(loggedUser)) && (
                                                <Col xs={8} sm={4} lg={2}>
                                                    <Form.Item
                                                        label={getTranslation('Auditar')}
                                                        validateStatus={
                                                            touched.auditRequests && errors.auditRequests ? 'error' : ''
                                                        }
                                                        help={touched.auditRequests && errors.auditRequests}
                                                    >
                                                        <Switch
                                                            disabled={disableForm}
                                                            checked={values.auditRequests || false}
                                                            onChange={(checked) => {
                                                                setFieldValue('auditRequests', checked);
                                                                setIsSaveDisabled(false);
                                                            }}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            )}
                                            {(isSystemDevAdmin(loggedUser) || isSystemAdmin(loggedUser)) && (
                                                <Col xs={8} sm={4} lg={2}>
                                                    {values.type !== IntegrationsType.CUSTOM_IMPORT ? (
                                                        <Form.Item
                                                            label={getTranslation('Debug')}
                                                            validateStatus={touched.debug && errors.debug ? 'error' : ''}
                                                            help={touched.debug && errors.debug}
                                                        >
                                                            <Switch
                                                                disabled={disableForm}
                                                                checked={values.debug || false}
                                                                onChange={(checked) => {
                                                                    setFieldValue('debug', checked);
                                                                    setIsSaveDisabled(false);
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    ) : null}
                                                </Col>
                                            )}
                                        </>
                                    )}
                                </Row>

                                <Divider style={{ margin: '12px 0' }} />

                                <Typography.Title level={5} style={{ marginBottom: '12px', marginTop: '0' }}>
                                    Configuração de Entidades
                                </Typography.Title>
                                <Row gutter={[12, 8]}>
                                    <Col xs={24}>
                                        <Form.Item
                                            label={getTranslation('Show external entities')}
                                            validateStatus={
                                                touched.showExternalEntities && errors.showExternalEntities ? 'error' : ''
                                            }
                                            help={touched.showExternalEntities && errors.showExternalEntities}
                                        >
                                            <Select
                                                size='large'
                                                disabled={disableForm}
                                                mode='multiple'
                                                options={getHealthEntityTypeOptions()}
                                                value={values.showExternalEntities}
                                                onChange={(values) => {
                                                    setFieldValue('showExternalEntities', values);
                                                    setIsSaveDisabled(false);
                                                }}
                                                placeholder={getTranslation('Entities')}
                                                showSearch
                                                optionFilterProp='label'
                                                filterOption={(input, option) =>
                                                    option && option.label
                                                        ? option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                        : false
                                                }
                                            >
                                                {getHealthEntityTypeOptions().map((option) => (
                                                    <Select.Option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={[12, 8]}>
                                    {values.type !== IntegrationsType.CUSTOM_IMPORT && (
                                        <Col xs={24} lg={12}>
                                            <Form.Item
                                                label={
                                                    <span>
                                                        {getTranslation('Entities')}
                                                        <Tooltip title="Entidades que serão importadas do ERP">
                                                            <InfoCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                                                        </Tooltip>
                                                    </span>
                                                }
                                                validateStatus={touched && errors.entitiesFlow ? 'error' : ''}
                                                help={touched && errors.entitiesFlow}
                                            >
                                                <Select
                                                    size='large'
                                                    disabled={disableForm}
                                                    mode='multiple'
                                                    options={getHealthEntityTypeOptions()}
                                                    value={values.entitiesToSync}
                                                    onChange={(values) => {
                                                        setFieldValue('entitiesToSync', values);
                                                        setIsSaveDisabled(false);
                                                    }}
                                                    placeholder={getTranslation('Entities')}
                                                    showSearch
                                                    optionFilterProp='label'
                                                    filterOption={(input, option) =>
                                                        option && option.label
                                                            ? option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                            : false
                                                    }
                                                >
                                                    {getHealthEntityTypeOptions().map((option) => (
                                                        <Select.Option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    )}
                                    <Col xs={24} lg={values.type === IntegrationsType.CUSTOM_IMPORT ? 24 : 12}>
                                        <Form.Item
                                            label={
                                                <span>
                                                    {getTranslation('Entities in the flow')}
                                                    <Tooltip title="Entidades que serão utilizadas no menu de fluxo para execução de regras">
                                                        <InfoCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                                                    </Tooltip>
                                                </span>
                                            }
                                            validateStatus={touched && errors.entitiesFlow ? 'error' : ''}
                                            help={touched && errors.entitiesFlow}
                                        >
                                            <Select
                                                disabled={disableForm}
                                                size='large'
                                                mode='multiple'
                                                options={getHealthEntityTypeOptions()}
                                                onChange={(values) => {
                                                    setFieldValue('entitiesFlow', values);
                                                    setIsSaveDisabled(false);
                                                }}
                                                value={values.entitiesFlow}
                                                placeholder={getTranslation('Entities')}
                                                showSearch
                                                optionFilterProp='label'
                                                filterOption={(input, option) =>
                                                    option && option.label
                                                        ? option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                        : false
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                </Card>
                            </Space>
                        </MenuBodyWrap>
                        );
                    }}
                />
            </Form>
        );
    };

    if (showNotifications) {
        activeComponent = notificationComponent();
    }

    if (showRules) {
        activeComponent = editRules();
    }

    if (isIntegratedMessage) {
        activeComponent = integratedMessage();
    }

    if (!showNotifications && !showRules && !isIntegratedMessage) {
        activeComponent = healthIntegrationComponent();
    }

    return (
        <div>
            {activeComponent}
            {schedulingLinkConfig}
            {documentsConfig}
        </div>
    );
};

export default i18n(HealthIntegrationSettings) as FC<HealthIntegrationsSettingsProps>;
