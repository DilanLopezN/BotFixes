import { FC, useEffect, useState } from 'react';
import { Card, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import Header from '../../../../../newChannelConfig/components/Header';
import { AgentConfigurationProps } from './props';
import I18n from '../../../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ScrollView } from '../../../ScrollView';
import { Tabs, Button } from 'antd';
import { ArrowLeftOutlined, RobotOutlined, ExperimentOutlined, DatabaseOutlined, ExclamationCircleOutlined, CommentOutlined, ThunderboltOutlined, ApiOutlined } from '@ant-design/icons';
import { AIAgentService, Agent, AgentType } from '../../../../service/AIAgentService';
import { addNotification } from '../../../../../../utils/AddNotification';
import BasicSettingsTab from './components/BasicSettingsTab';
import VariablesTab from './components/VariablesTab';
import TrainingsTab from './components/TrainingsTab';
import FallbacksTab from './components/FallbacksTab';
import MessagesTab from './components/MessagesTab';
import IntentionsTab from './components/IntentionsTab';
import SkillsTab from './components/SkillsTab';

const { TabPane } = Tabs;

const AgentConfiguration: FC<AgentConfigurationProps> = (props) => {
    const { getTranslation, addNotification, history, match, selectedWorkspace } = props;
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const agentId = match.params.agentId;

    useEffect(() => {
        loadAgent();
    }, [agentId, selectedWorkspace]);

    const loadAgent = async () => {
        if (!agentId || !selectedWorkspace?._id) return;
        
        setLoading(true);
        try {
            const response = await AIAgentService.getAgent(selectedWorkspace._id, agentId, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao carregar agente'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            setAgent(response);
        } catch (error) {
            console.error('Error loading agent:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        history.push('/settings/ai-agent');
    };

    if (loading) {
        return (
            <Wrapper>
                <div style={{ padding: 20, textAlign: 'center' }}>
                    {getTranslation('Carregando...')}
                </div>
            </Wrapper>
        );
    }

    if (!agent) {
        return (
            <Wrapper>
                <div style={{ padding: 20, textAlign: 'center' }}>
                    {getTranslation('Agente não encontrado')}
                </div>
            </Wrapper>
        );
    }

    return (
        <>
            <Wrapper>
                <Header
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '16px'
                            }}>
                                <RobotOutlined />
                            </div>
                            <span>{`${getTranslation('Configurar Agente')}: ${agent.name}`}</span>
                        </div>
                    }
                    action={
                        <Button
                            type="default"
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBack}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Voltar')}
                        </Button>
                    }
                />
            </Wrapper>
            <ScrollView id="content-AgentConfiguration">
                <Wrapper margin="0 auto" maxWidth="1600px" minWidth="800px" padding="20px 30px">
                    <Wrapper flexBox width="100%">
                        <Card>
                            <Tabs 
                                defaultActiveKey="basic"
                                type="card"
                                size="large"
                            >
                                <TabPane 
                                    tab={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <RobotOutlined style={{ color: '#1890ff' }} />
                                            <span>{getTranslation('Configurações')}</span>
                                        </div>
                                    } 
                                    key="basic"
                                >
                                    <BasicSettingsTab
                                        agent={agent}
                                        agentId={agentId}
                                        workspaceId={selectedWorkspace?._id || ''}
                                        getTranslation={getTranslation}
                                        onAgentUpdate={loadAgent}
                                    />
                                </TabPane>
                                {agent.agentType === AgentType.ENTITIES_DETECTION && (
                                    <TabPane 
                                        tab={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <ThunderboltOutlined style={{ color: '#faad14' }} />
                                                <span>{getTranslation('Intenções')}</span>
                                            </div>
                                        } 
                                        key="intentions"
                                    >
                                        <IntentionsTab
                                            agentId={agentId}
                                            workspaceId={selectedWorkspace?._id || ''}
                                            getTranslation={getTranslation}
                                        />
                                    </TabPane>
                                )}
                                {agent.agentType !== AgentType.ENTITIES_DETECTION && (
                                    <TabPane 
                                        tab={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <ExperimentOutlined style={{ color: '#1890ff' }} />
                                                <span>{getTranslation('Treinamentos')}</span>
                                            </div>
                                        } 
                                        key="trainings"
                                    >
                                        <TrainingsTab
                                            agentId={agentId}
                                            workspaceId={selectedWorkspace?._id || ''}
                                            getTranslation={getTranslation}
                                            agent={agent}
                                        />
                                    </TabPane>
                                )}
                                {agent.agentType === AgentType.RAG && (
                                    <TabPane 
                                        tab={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <ThunderboltOutlined style={{ color: '#faad14' }} />
                                                <span>{getTranslation('Intenções')}</span>
                                            </div>
                                        } 
                                        key="intentions"
                                    >
                                        <IntentionsTab
                                            agentId={agentId}
                                            workspaceId={selectedWorkspace?._id || ''}
                                            getTranslation={getTranslation}
                                        />
                                    </TabPane>
                                )}
                                {agent.agentType === AgentType.RAG && (
                                    <TabPane 
                                        tab={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <ApiOutlined style={{ color: '#1890ff' }} />
                                                <span>{getTranslation('Habilidades')}</span>
                                            </div>
                                        } 
                                        key="skills"
                                    >
                                        <SkillsTab
                                            agentId={agentId}
                                            workspaceId={selectedWorkspace?._id || ''}
                                            getTranslation={getTranslation}
                                            agent={agent}
                                        />
                                    </TabPane>
                                )}
                                {agent.agentType !== AgentType.ENTITIES_DETECTION && (
                                    <TabPane 
                                        tab={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <DatabaseOutlined style={{ color: '#1890ff' }} />
                                                <span>{getTranslation('Variáveis')}</span>
                                            </div>
                                        } 
                                        key="variables"
                                    >
                                        <VariablesTab
                                            agentId={agentId}
                                            workspaceId={selectedWorkspace?._id || ''}
                                            botId={agent.botId || ''}
                                            getTranslation={getTranslation}
                                        />
                                    </TabPane>
                                )}
                                {agent.agentType !== AgentType.ENTITIES_DETECTION && (
                                    <TabPane 
                                        tab={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
                                                <span>{getTranslation('Fallbacks')}</span>
                                            </div>
                                        } 
                                        key="fallbacks"
                                    >
                                        <FallbacksTab
                                            agentId={agentId}
                                            workspaceId={selectedWorkspace?._id || ''}
                                            getTranslation={getTranslation}
                                        />
                                    </TabPane>
                                )}
                                {agent.agentType !== AgentType.ENTITIES_DETECTION && (
                                    <TabPane 
                                        tab={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <CommentOutlined style={{ color: '#1890ff' }} />
                                                <span>{getTranslation('Mensagens')}</span>
                                            </div>
                                        } 
                                        key="messages"
                                    >
                                        <MessagesTab
                                            agentId={agentId}
                                            workspaceId={selectedWorkspace?._id || ''}
                                            getTranslation={getTranslation}
                                        />
                                    </TabPane>
                                )}
                            </Tabs>
                        </Card>
                    </Wrapper>
                </Wrapper>
            </ScrollView>
        </>
    );
};

const mapStateToProps = (state: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

const mapDispatchToProps = {
    addNotification,
};

export default I18n(withRouter(connect(mapStateToProps, mapDispatchToProps)(AgentConfiguration)));