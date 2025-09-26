import { FC, useState, useEffect } from 'react';
import { Button, Select, Checkbox, Form, Input, Card, Divider } from 'antd';
import { SaveOutlined, EditOutlined, UserOutlined, FileTextOutlined, RobotOutlined, BranchesOutlined, ThunderboltOutlined, ApiOutlined } from '@ant-design/icons';
import { Agent, AgentType, AIAgentService } from '../../../../../../service/AIAgentService';
import { WorkspaceService } from '../../../../../../../workspace/services/WorkspaceService';
import { Bot } from '../../../../../../../../model/Bot';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import { HealthService } from '../../../../../../../integrations/services/HealthService';
import { HealthIntegration } from '../../../../../../../../model/Integrations';

const { Option } = Select;
const { TextArea } = Input;

interface BasicSettingsTabProps {
    agent: Agent;
    agentId: string;
    workspaceId: string;
    getTranslation: (key: string) => string;
    onAgentUpdate: () => void;
}

const BasicSettingsTab: FC<BasicSettingsTabProps> = ({
    agent,
    agentId,
    workspaceId,
    getTranslation,
    onAgentUpdate
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [bots, setBots] = useState<Bot[]>([]);
    const [personalities, setPersonalities] = useState<{ identifier: string; content: string }[]>([]);
    const [integrations, setIntegrations] = useState<HealthIntegration[]>([]);

    // Load data only once
    useEffect(() => {
        loadBots();
        loadPersonalities();
        loadIntegrations();
    }, [workspaceId]);

    // Set form values when agent or personalities change
    useEffect(() => {
        // Find personality identifier that matches the stored content
        const personalityIdentifier = agent.personality 
            ? personalities.find(p => p.content === agent.personality)?.identifier || agent.personality
            : '';
        
        form.setFieldsValue({
            name: agent.name,
            description: agent.description,
            prompt: agent.prompt,
            personality: personalityIdentifier,
            botId: agent.botId,
            isDefault: agent.isDefault,
            agentType: agent.agentType,
            modelName: agent.modelName || 'gpt-4o-mini', // Default to gpt-4o-mini if not set
            integrationId: agent.integrationId,
        });
    }, [agent, personalities, form]);

    const loadBots = async () => {
        if (!workspaceId) return;

        try {
            const response = await WorkspaceService.getWorkspaceBots(workspaceId);
            setBots(response?.data || []);
        } catch (error) {
            console.error('Error loading bots:', error);
        }
    };

    const loadPersonalities = async () => {
        if (!workspaceId) return;

        try {
            const response = await AIAgentService.listPredefinedPersonalities(workspaceId, (err) => {
                console.error('Error loading personalities:', err);
            });
            setPersonalities(response || []);
        } catch (error) {
            console.error('Error loading personalities:', error);
        }
    };

    const loadIntegrations = async () => {
        if (!workspaceId) return;

        try {
            const response = await HealthService.getHealthIntegrations(workspaceId);
            setIntegrations(response?.data || []);
        } catch (error) {
            console.error('Error loading integrations:', error);
        }
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            // Convert personality identifier to content before sending
            const personalityContent = values.personality 
                ? personalities.find(p => p.identifier === values.personality)?.content || values.personality
                : values.personality;

            const submitData = {
                ...values,
                personality: personalityContent
            };

            await AIAgentService.updateAgent(
                workspaceId,
                agentId,
                submitData,
                (err) => {
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao atualizar agente'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );

            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Agente atualizado com sucesso'),
                type: 'success',
                duration: 3000,
            });
            
            onAgentUpdate();
        } catch (error) {
            console.error('Error updating agent:', error);
            addNotification({
                title: getTranslation('Erro'),
                message: getTranslation('Erro ao atualizar agente'),
                type: 'danger',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };



    return (
        <>
            <Card bordered={false}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px'
                        }}>
                            <EditOutlined />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                            {getTranslation('Configurações Básicas')}
                        </h3>
                    </div>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        {getTranslation('Configure as propriedades fundamentais do agente')}
                    </p>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <Form.Item
                            label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <UserOutlined style={{ color: '#1890ff' }} />
                                    <span>{getTranslation('Nome')}</span>
                                </div>
                            }
                            name="name"
                            rules={[{ required: true, message: getTranslation('Nome é obrigatório') }]}
                        >
                            <Input placeholder={getTranslation('Nome do agente')} />
                        </Form.Item>

                        <Form.Item
                            label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BranchesOutlined style={{ color: '#1890ff' }} />
                                    <span>{getTranslation('Tipo')}</span>
                                </div>
                            }
                            name="agentType"
                        >
                            <Select placeholder={getTranslation('Selecionar Tipo')} allowClear>
                                <Option value={AgentType.REPORT_PROCESSOR_DETECTION}>
                                    {getTranslation('Leitor de pedido médico')}
                                </Option>
                                <Option value={AgentType.RAG}>
                                    {getTranslation('RAG')}
                                </Option>
                                <Option value={AgentType.ENTITIES_DETECTION}>
                                    {getTranslation('Detecção de Entidades')}
                                </Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileTextOutlined style={{ color: '#1890ff' }} />
                                <span>{getTranslation('Descrição')}</span>
                            </div>
                        }
                        name="description"
                        rules={[{ required: true, message: getTranslation('Descrição é obrigatória') }]}
                        style={{ marginBottom: 16 }}
                    >
                        <TextArea
                            placeholder={getTranslation('Descrição do agente')}
                            rows={3}
                            style={{ resize: 'none' }}
                        />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <Form.Item
                            label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <RobotOutlined style={{ color: '#1890ff' }} />
                                    <span>{getTranslation('Bot')}</span>
                                </div>
                            }
                            name="botId"
                            rules={[{ required: true, message: getTranslation('Bot é obrigatório') }]}
                        >
                            <Select placeholder={getTranslation('Selecionar Bot')}>
                                {bots.map((bot) => (
                                    <Option key={bot._id} value={bot._id}>
                                        {bot.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ApiOutlined style={{ color: '#1890ff' }} />
                                    <span>{getTranslation('Integração')}</span>
                                </div>
                            }
                            name="integrationId"
                        >
                            <Select
                                placeholder={getTranslation('Selecionar Integração')}
                                allowClear
                                showSearch
                                optionFilterProp="children"
                            >
                                {integrations.map((integration) => (
                                    <Option key={integration._id} value={integration._id}>
                                        {integration.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <Form.Item
                            label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>{getTranslation('Personalidade')}</span>
                                </div>
                            }
                            name="personality"
                        >
                            <Select
                                placeholder={getTranslation('Selecionar Personalidade')}
                                allowClear
                                showSearch
                                optionFilterProp="children"
                            >
                                {personalities.map((personality) => (
                                    <Option 
                                        key={personality.identifier} 
                                        value={personality.identifier}
                                        title={personality.identifier}
                                    >
                                        <div style={{ 
                                            maxWidth: '300px',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            <strong style={{ color: '#1890ff', display: 'block', marginBottom: 4 }}>
                                                {personality.identifier}
                                            </strong>
                                            <span style={{ color: '#666', fontSize: '12px', lineHeight: '1.4' }}>
                                                {personality.content}
                                            </span>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ThunderboltOutlined style={{ color: '#1890ff' }} />
                                    <span>{getTranslation('Modelo')}</span>
                                </div>
                            }
                            name="modelName"
                            rules={[{ required: true, message: getTranslation('Modelo é obrigatório') }]}
                        >
                            <Select placeholder={getTranslation('Selecionar Modelo')}>
                                <Option value="gpt-4o-mini">GPT-4o Mini</Option>
                                <Option value="gpt-4.1-mini">GPT-4.1 Mini</Option>
                                <Option value="gpt-5-mini">GPT-5 Mini</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Divider />

                    <Form.Item
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ 
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    display: 'inline-block'
                                }} />
                                <span>{getTranslation('Prompt Adicional')}</span>
                            </div>
                        }
                        name="prompt"
                    >
                        <TextArea
                            placeholder={getTranslation('Prompt do sistema para o agente')}
                            rows={8}
                            style={{ resize: 'vertical', fontFamily: 'monospace' }}
                        />
                    </Form.Item>

                    <Form.Item name="isDefault" valuePropName="checked">
                        <Checkbox>
                            {getTranslation('Definir como agente padrão')}
                        </Checkbox>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<SaveOutlined />}
                            className="antd-span-default-color"
                        >
                            {getTranslation('Salvar')}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </>
    );
};

export default BasicSettingsTab;