import { Button, Card, Col, Menu, Row, Tag, Typography, Empty, Input, Spin } from 'antd';
import { HealthEntityType } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { BsPlusCircle, BsCheckCircle, BsExclamationCircle, BsLink } from 'react-icons/bs';
import { connect, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { HealthIntegration, IntegrationEnvironment } from '../../../../model/Integrations';
import { MenuLink } from '../../../../shared-v2/MenuLink';
import { MainMenu } from '../../../../shared/MainMenu/styles';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { MenuList, MenuListGroup } from '../../../../ui-kissbot-v2/common/MenuProps/props';
import { isAnySystemAdmin } from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { useIntegrationContext } from '../../integration.context';
import { HealthService } from '../../services/HealthService';
import Flow from './components/Flow';
import { FlowProps } from './components/Flow/props';
import { Scroll } from './components/HealthEntityForm/styles';
import HealthEntityList from './components/HealthEntityList';
import { HealthEntityListProps } from './components/HealthEntityList/props';
import HealthIntegrationSettings from './components/HealthIntegrationSettings';
import { HealthIntegrationsSettingsProps } from './components/HealthIntegrationSettings/props';
import { HealthPageProps } from './props';
const { SubMenu } = Menu;
const { Title, Text } = Typography;
const { Search } = Input;

const HealthPage = ({ getTranslation, selectedWorkspace }: HealthPageProps & I18nProps) => {
    const menuList: MenuListGroup[] = [
        {
            title: getTranslation('Integrations'),
            list: [
                {
                    title: getTranslation('Settings'),
                    component: HealthIntegrationSettings,
                    ref: 'settings',
                    order: 1,
                },
                {
                    title: getTranslation('Flow'),
                    component: Flow,
                    ref: 'flow',
                    order: 2,
                },
            ],
        },
        {
            title: getTranslation('Entities'),
            list: [
                {
                    title: getTranslation('Appointment types'),
                    component: HealthEntityList,
                    ref: HealthEntityType.appointmentType,
                    order: 3,
                },
                {
                    title: getTranslation('Specialities'),
                    component: HealthEntityList,
                    ref: HealthEntityType.speciality,
                    order: 3,
                },
                {
                    title: getTranslation('Procedures'),
                    component: HealthEntityList,
                    ref: HealthEntityType.procedure,
                    order: 3,
                },
                {
                    title: getTranslation('Organization units'),
                    component: HealthEntityList,
                    ref: HealthEntityType.organizationUnit,
                    order: 3,
                },
                {
                    title: getTranslation('Insurances'),
                    component: HealthEntityList,
                    ref: HealthEntityType.insurance,
                    order: 3,
                },
                {
                    title: getTranslation('Plans'),
                    component: HealthEntityList,
                    ref: HealthEntityType.insurancePlan,
                    order: 3,
                },
                {
                    title: getTranslation('Subplans'),
                    component: HealthEntityList,
                    ref: HealthEntityType.insuranceSubPlan,
                    order: 3,
                },
                {
                    title: getTranslation('Categories'),
                    component: HealthEntityList,
                    ref: HealthEntityType.planCategory,
                    order: 3,
                },
                {
                    title: getTranslation('Doctors'),
                    component: HealthEntityList,
                    ref: HealthEntityType.doctor,
                    order: 3,
                },
                {
                    title: getTranslation('Occupation area'),
                    component: HealthEntityList,
                    ref: HealthEntityType.occupationArea,
                    order: 3,
                },
                {
                    title: getTranslation('Location'),
                    component: HealthEntityList,
                    ref: HealthEntityType.organizationUnitLocation,
                    order: 3,
                },
                {
                    title: getTranslation('typeOfService'),
                    component: HealthEntityList,
                    ref: HealthEntityType.typeOfService,
                    order: 3,
                },
                {
                    title: getTranslation('laterality'),
                    component: HealthEntityList,
                    ref: HealthEntityType.laterality,
                    order: 3,
                },
                {
                    title: getTranslation('Motivos não agendamento'),
                    component: HealthEntityList,
                    ref: HealthEntityType.reason,
                    order: 3,
                },
            ],
        },
    ];
    const [shouldScroll, setShouldScroll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const canCreateIntegration = isAnySystemAdmin(loggedUser);

    useEffect(() => {
        const handleResize = () => {
            const windowHeight = window.innerHeight;
            const shouldScroll = windowHeight <= 900;
            setShouldScroll(shouldScroll);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const initialIntegration = {
        codeIntegration: '',
        name: '',
        type: '',
        entitiesToSync: [
            HealthEntityType.insurance,
            HealthEntityType.insurancePlan,
            HealthEntityType.speciality,
            HealthEntityType.doctor,
            HealthEntityType.procedure,
            HealthEntityType.appointmentType,
            HealthEntityType.organizationUnit,
        ],
        entitiesFlow: [
            HealthEntityType.insurance,
            HealthEntityType.insurancePlan,
            HealthEntityType.speciality,
            HealthEntityType.doctor,
            HealthEntityType.procedure,
            HealthEntityType.appointmentType,
            HealthEntityType.organizationUnit,
        ],
        workspaceId: selectedWorkspace?._id,
        apiToken: '',
        requiredAuthentication: false,
        enabled: true,
        environment: IntegrationEnvironment.production,
    };

    const { path: urlPath, integrationId } = useParams<{ path: string; integrationId: string }>();
    const history = useHistory();

    // Extrair o path da URL atual se não vier dos parâmetros
    const getCurrentPath = () => {
        if (urlPath) return urlPath;

        const currentPath = window.location.pathname;
        const segments = currentPath.split('/');
        // /integrations/{integrationId}/{path}
        if (segments.length >= 4 && segments[1] === 'integrations') {
            return segments[3];
        }
        return undefined;
    };

    const path = getCurrentPath();

    const getInitialComponent = () => {
        if (!path) return menuList[0].list[0]; // Default para Settings se não há path

        const menu = menuList.map((group) => {
            return group.list.find((menu) => menu.ref === path);
        });

        const found = menu.find((e) => e !== undefined);
        return found || menuList[0].list[0];
    };

    const [selectedMenu, setSelectedMenu] = useState<MenuList>(getInitialComponent());
    const { integrations, setIntegrations, selectedIntegration, setSelectedIntegration, isLoading, setIsLoading } = useIntegrationContext();
    useEffect(() => {
        setSelectedMenu(getInitialComponent());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path]);

    useEffect(() => {
        getHealthIntegration();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWorkspace?._id]);

    // Limpar seleção apenas quando acessar a rota raiz
    useEffect(() => {
        if (!integrationId && !path) {
            setSelectedIntegration(undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [integrationId, path]);

    const getHealthIntegration = async () => {
        if (!!selectedWorkspace) {
            setIsLoading(true);
            try {
                const response = await HealthService.getHealthIntegrations(selectedWorkspace._id);
                if (!response?.data.length) {
                    setIntegrations([]);
                    setSelectedIntegration(undefined);
                    return;
                }
                setIntegrations(response?.data ?? []);

                // Seleciona automaticamente baseado na URL
                if (integrationId && integrationId !== 'new') {
                    const integration = response?.data?.find((element) => element._id === integrationId);
                    if (integration) {
                        setSelectedIntegration(integration);
                    } else {
                        // ID não encontrado, volta para seleção
                        setSelectedIntegration(undefined);
                        history.push('/integrations');
                    }
                } else if (integrationId === 'new') {
                    // Permite criar nova integração
                    setSelectedIntegration({
                        ...initialIntegration,
                    });
                } else {
                    // Sem ID na URL, limpa seleção
                    setSelectedIntegration(undefined);
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getIntegrationStatusIcon = (integration: HealthIntegration) => {
        if (!integration.enabled) {
            return <BsExclamationCircle style={{ color: '#ff4d4f', fontSize: '20px' }} />;
        }
        if (integration.integrationStatus?.online === false) {
            return <BsExclamationCircle style={{ color: '#faad14', fontSize: '20px' }} />;
        }
        if (integration.lastSyncTimestamp) {
            return <BsCheckCircle style={{ color: '#52c41a', fontSize: '20px' }} />;
        }
        return <BsLink style={{ color: '#1890ff', fontSize: '20px' }} />;
    };

    const getIntegrationStatusText = (integration: HealthIntegration) => {
        if (!integration.enabled) {
            return { text: 'Inativa', color: '#ff4d4f' };
        }
        if (integration.integrationStatus?.online === false) {
            return { text: 'Offline', color: '#faad14' };
        }
        if (integration.lastSyncTimestamp) {
            return { text: 'Ativa', color: '#52c41a' };
        }
        return { text: 'Configurada', color: '#1890ff' };
    };


    const renderIntegrationCards = () => {
        if (isLoading) {
            return (
                <div
                    style={{
                        padding: '60px 24px',
                        textAlign: 'center',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Spin size="large" style={{ marginBottom: '20px' }} />
                    <Text type='secondary' style={{ fontSize: '16px', fontWeight: '500' }}>
                        Carregando integrações...
                    </Text>
                </div>
            );
        }

        if (!integrations.length) {
            return (
                <div
                    style={{
                        padding: '60px 24px',
                        textAlign: 'center',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div>
                                <Title level={3} style={{ color: '#8c8c8c', marginBottom: '8px' }}>
                                    Nenhuma integração encontrada
                                </Title>
                                <Text type='secondary' style={{ fontSize: '16px' }}>
                                    Crie sua primeira integração para começar
                                </Text>
                            </div>
                        }
                    >
                        {canCreateIntegration && (
                            <Button
                                type='primary'
                                size='large'
                                icon={<BsPlusCircle />}
                                onClick={() => {
                                    setSelectedMenu(menuList[0].list[0]);
                                    history.push('/integrations/new/settings');
                                }}
                                style={{
                                    color: 'white',
                                    backgroundColor: '#1890ff',
                                    borderColor: '#1890ff',
                                }}
                            >
                                <span style={{ color: 'white', marginLeft: '6px' }}>Criar Integração</span>
                            </Button>
                        )}
                    </Empty>
                </div>
            );
        }

        return (
            <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                >
                    <Row justify='space-between' align='middle'>
                        <Col>
                            <Title level={3} style={{ margin: 0, marginBottom: '4px' }}>
                                Integrações
                            </Title>
                            <Text type='secondary'>Selecione uma integração para gerenciar</Text>
                        </Col>
                        <Col>
                            {canCreateIntegration && (
                                <Button
                                    type='primary'
                                    icon={<BsPlusCircle />}
                                    onClick={() => {
                                        setSelectedMenu(menuList[0].list[0]);
                                        history.push('/integrations/new/settings');
                                    }}
                                    style={{
                                        color: 'white',
                                        backgroundColor: '#1890ff',
                                        borderColor: '#1890ff',
                                    }}
                                >
                                    <span style={{ color: 'white', marginLeft: '6px' }}>Nova Integração</span>
                                </Button>
                            )}
                        </Col>
                    </Row>
                </div>

                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    {integrations?.length > 10 && (
                        <div style={{ marginBottom: '24px' }}>
                            <Search
                                placeholder='Buscar integrações...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ maxWidth: '400px' }}
                                allowClear
                                autoFocus
                            />
                        </div>
                    )}
                    <Row gutter={[16, 16]}>
                        {integrations
                            .filter(
                                (integration) =>
                                    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    integration.type.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .sort((a, b) => {
                                // Primeiro: production na frente
                                const aIsProduction = (a.environment || 'production') === 'production';
                                const bIsProduction = (b.environment || 'production') === 'production';
                                if (aIsProduction !== bIsProduction) {
                                    return aIsProduction ? -1 : 1;
                                }
                                // Segundo: ativas antes de inativas
                                if (a.enabled !== b.enabled) {
                                    return a.enabled ? -1 : 1;
                                }
                                // Terceiro: ordem alfabética
                                return a.name.localeCompare(b.name);
                            })
                            .map((integration) => (
                                <Col key={integration._id} xs={24} sm={12} md={8} lg={6}>
                                    <Card
                                        hoverable
                                        style={{
                                            height: '220px',
                                            borderRadius: '8px',
                                            border: integration.enabled ? '1px solid #d9d9d9' : '1px solid #ff4d4f20',
                                        }}
                                        onClick={() => {
                                            setSelectedIntegration(integration);
                                            setSelectedMenu(menuList[0].list[0]);
                                            history.push(`/integrations/${integration._id}/settings`);
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}
                                            >
                                                {getIntegrationStatusIcon(integration)}
                                                <Title level={5} style={{ margin: 0, marginLeft: '8px' }}>
                                                    {integration.name}
                                                </Title>
                                            </div>
                                            <div style={{ marginBottom: '12px' }}>
                                                <Tag color={integration.enabled ? 'green' : 'red'}>
                                                    {integration.enabled ? 'Ativa' : 'Inativa'}
                                                </Tag>
                                                <Tag>{integration.type}</Tag>
                                                {(integration.environment || 'production') === 'production' ? (
                                                    <Tag color='blue' style={{ fontWeight: 'bold' }}>
                                                        PRODUÇÃO
                                                    </Tag>
                                                ) : (
                                                    <Tag color='default'>
                                                        {integration.environment === 'test'
                                                            ? 'Teste'
                                                            : integration.environment}
                                                    </Tag>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <Text
                                                    style={{
                                                        color: getIntegrationStatusText(integration).color,
                                                        fontSize: '13px',
                                                    }}
                                                >
                                                    {getIntegrationStatusText(integration).text}
                                                </Text>
                                            </div>
                                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <Text type='secondary' style={{ fontSize: '11px' }}>
                                                        <strong>Última atualização:</strong>{' '}
                                                        {integration.lastPublishFlow && 
                                                        !isNaN(new Date(integration.lastPublishFlow).getTime())
                                                            ? new Date(integration.lastPublishFlow).toLocaleDateString('pt-BR') + ' ' + 
                                                              new Date(integration.lastPublishFlow).toLocaleTimeString('pt-BR', { 
                                                                  hour: '2-digit', 
                                                                  minute: '2-digit' 
                                                              })
                                                            : 'Nunca realizada'}
                                                    </Text>
                                                    <Text type='secondary' style={{ fontSize: '11px' }}>
                                                        <strong>Última atualização de entidades:</strong>{' '}
                                                        {integration.lastSyncEntities && 
                                                        !isNaN(new Date(integration.lastSyncEntities).getTime())
                                                            ? new Date(integration.lastSyncEntities).toLocaleDateString('pt-BR') + ' ' + 
                                                              new Date(integration.lastSyncEntities).toLocaleTimeString('pt-BR', { 
                                                                  hour: '2-digit', 
                                                                  minute: '2-digit' 
                                                              })
                                                            : 'Nunca realizada'}
                                                    </Text>
                                                    <Text type='secondary' style={{ fontSize: '11px' }}>
                                                        <strong>Última sincronização de entidades:</strong>{' '}
                                                        {integration.lastSyncTimestamp && 
                                                        !isNaN(new Date(integration.lastSyncTimestamp).getTime())
                                                            ? new Date(integration.lastSyncTimestamp).toLocaleDateString('pt-BR') + ' ' + 
                                                              new Date(integration.lastSyncTimestamp).toLocaleTimeString('pt-BR', { 
                                                                  hour: '2-digit', 
                                                                  minute: '2-digit' 
                                                              })
                                                            : 'Nunca realizada'}
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                    </Row>
                </div>
            </div>
        );
    };

    const getMainComponent = () => {
        // SEM integração selecionada E não está criando nova → mostra cards
        if (!selectedIntegration?._id && integrationId !== 'new') {
            return renderIntegrationCards();
        }

        // COM integração selecionada → mostra componente baseado no menu selecionado

        if (selectedMenu?.ref === 'settings') {
            const Component: FC<HealthIntegrationsSettingsProps> = selectedMenu.component;
            const currentIntegration = selectedIntegration || { ...initialIntegration };
            return (
                <Component
                    key={selectedIntegration?._id || 'new'}
                    setSelectedIntegration={(integration: HealthIntegration) => setSelectedIntegration(integration)}
                    integration={currentIntegration}
                    integrations={integrations}
                    onIntegrationCreated={(createdIntegration) => {
                        const existentIntegration = integrations.find((i) => i._id === createdIntegration._id);

                        if (!!existentIntegration) {
                            setIntegrations((prevState) => [
                                ...prevState.map((integration) => {
                                    if (integration._id === createdIntegration._id) {
                                        return createdIntegration;
                                    }
                                    return integration;
                                }),
                            ]);
                            return setSelectedIntegration(createdIntegration);
                        }

                        setIntegrations((prevState) => [...prevState, createdIntegration]);

                        return setSelectedIntegration(createdIntegration);
                    }}
                    onChangeIntegrationSelected={setSelectedIntegration}
                    workspaceId={selectedWorkspace._id}
                    onCancelCreatingIntegration={() => {
                        setSelectedIntegration(undefined);
                        history.push('/integrations');
                    }}
                />
            );
        }

        if (selectedMenu?.ref === 'flow') {
            const Component: FC<FlowProps> = selectedMenu.component;
            const currentIntegration = selectedIntegration || { ...initialIntegration };
            return (
                <Component
                    key={selectedIntegration?._id || 'new'}
                    integration={currentIntegration}
                    workspaceId={selectedWorkspace._id}
                    setSelectedIntegration={(integration: HealthIntegration) => setSelectedIntegration(integration)}
                />
            );
        }

        // Outras entidades (appointmentType, speciality, etc.)
        if (selectedIntegration?._id) {
            const Component: FC<HealthEntityListProps> = selectedMenu.component;
            return (
                <Component
                    key={selectedIntegration._id}
                    entityType={selectedMenu.ref as HealthEntityType}
                    workspaceId={selectedWorkspace._id}
                    integration={selectedIntegration}
                    setSelectedIntegration={(integration: HealthIntegration) => setSelectedIntegration(integration)}
                />
            );
        }

        // Se chegou aqui sem integração mas com integrationId='new', mostra settings
        return (
            <HealthIntegrationSettings
                key='new'
                setSelectedIntegration={(integration: HealthIntegration) => setSelectedIntegration(integration)}
                integration={{ ...initialIntegration }}
                integrations={integrations}
                onIntegrationCreated={(createdIntegration) => {
                    setIntegrations((prevState) => [...prevState, createdIntegration]);
                    setSelectedIntegration(createdIntegration);
                }}
                onChangeIntegrationSelected={setSelectedIntegration}
                workspaceId={selectedWorkspace._id}
                onCancelCreatingIntegration={() => {
                    setSelectedIntegration(undefined);
                    history.push('/integrations');
                }}
            />
        );
    };

    const transformedMenuList = selectedIntegration?._id
        ? menuList.map((group) => {
              const transformedList = group.list.map((item) => {
                  return (
                      <Menu.Item
                          style={{ paddingLeft: '24px' }}
                          title={item.title}
                          key={item.ref}
                          onClick={() => setSelectedMenu(item)}
                      >
                          <MenuLink
                              isAbsolutePath={item?.isAbsolutePath}
                              to={`/integrations/${selectedIntegration?._id || 'new'}/${item.ref}`}
                          >
                              {item.title}
                          </MenuLink>
                      </Menu.Item>
                  );
              });

              return (
                  <SubMenu
                      key={group.title}
                      title={
                          <span
                              style={{
                                  fontSize: '13px',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                              }}
                          >
                              {group.title}
                          </span>
                      }
                  >
                      {transformedList}
                  </SubMenu>
              );
          })
        : [];

    // Menu lateral aparece APENAS quando há integração selecionada (não quando criando nova)
    const showSidebar = !!selectedIntegration?._id;

    return (
        <MainMenu className='HealthPage'>
            <>
                {showSidebar ? (
                    <>
                        <Wrapper width='200px' bgcolor='#fafafa' height='100vh' borderRight='1px #d0d0d091 solid' position='relative'>
                            <Scroll
                                overflowX='hidden'
                                height={shouldScroll ? 'calc(100vh - 20px)' : '100vh'}
                                overflowY={'auto'}
                            >
                                <Menu
                                    defaultOpenKeys={[getTranslation('Integrations'), getTranslation('Entities')]}
                                    expandIcon
                                    openKeys={[getTranslation('Integrations'), getTranslation('Entities')]}
                                    mode='inline'
                                    selectedKeys={[selectedMenu.ref]}
                                    onClick={({ key }) => setSelectedMenu((item) => ({ ...item, ref: key }))}
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                        backgroundColor: '#fafafa',
                                    }}
                                >
                                    {transformedMenuList}
                                </Menu>
                            </Scroll>
                        </Wrapper>
                        <Wrapper height='100vh' overflowY='auto' flex>
                            {getMainComponent()}
                        </Wrapper>
                    </>
                ) : (
                    <Wrapper height='100vh' overflowY='auto' width='100%'>
                        {getMainComponent()}
                    </Wrapper>
                )}
            </>
        </MainMenu>
    );
};

const mapStateToProps = (state: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default connect(mapStateToProps, {})(i18n(HealthPage));
