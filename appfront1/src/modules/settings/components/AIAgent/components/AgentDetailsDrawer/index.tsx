import { FC } from 'react';
import { Drawer, Button, Card as AntCard, Tag } from 'antd';
import { 
    EditOutlined, 
    DeleteOutlined, 
    RobotOutlined, 
    StarOutlined, 
    BulbOutlined, 
    TeamOutlined, 
    DatabaseOutlined, 
    ThunderboltOutlined, 
    BranchesOutlined, 
    ExperimentOutlined 
} from '@ant-design/icons';
import AgentForm from '../AgentForm';
import { Agent, AgentType } from '../../../../service/AIAgentService';
import { Bot } from '../../../../../../model/Bot';
import { HealthIntegration } from '../../../../../../model/Integrations';

interface AgentDetailsDrawerProps {
    visible: boolean;
    onClose: () => void;
    selectedAgent: Agent | null;
    editingInDrawer: Agent | null;
    onEdit: (agent: Agent) => void;
    onDelete: (agentId: string) => void;
    onSubmitEdit: () => void;
    formik: any;
    getTranslation: (key: string) => string;
    bots: Bot[];
    personalities: { identifier: string; content: string }[];
    integrations: HealthIntegration[];
}

const AgentDetailsDrawer: FC<AgentDetailsDrawerProps> = ({
    visible,
    onClose,
    selectedAgent,
    editingInDrawer,
    onEdit,
    onDelete,
    onSubmitEdit,
    formik,
    getTranslation,
    bots,
    personalities,
    integrations
}) => {
    const renderViewMode = () => {
        if (!selectedAgent) {
            return (
                <div style={{ textAlign: 'center', color: '#999', marginTop: '100px' }}>
                    {getTranslation('Nenhum agente selecionado')}
                </div>
            );
        }

        return (
            <div>
                <AntCard style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '50%',
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px'
                                }}>
                                    <RobotOutlined />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                                    {selectedAgent.name}
                                </h3>
                            </div>
                            {selectedAgent.isDefault && (
                                <Tag color='green' style={{ fontSize: '12px' }} icon={<StarOutlined />}>
                                    {getTranslation('Padrão')}
                                </Tag>
                            )}
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <BulbOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                            <strong style={{ color: '#1890ff' }}>{getTranslation('Descrição')}:</strong>
                        </div>
                        <div style={{ marginTop: 4, fontSize: '14px', lineHeight: '1.5', marginLeft: 24 }}>
                            {selectedAgent.description}
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <TeamOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                            <strong style={{ color: '#1890ff' }}>{getTranslation('Bot Associado')}:</strong>
                        </div>
                        <div style={{ marginTop: 4, fontSize: '14px', marginLeft: 24 }}>
                            {bots.find(bot => bot._id === selectedAgent.botId)?.name || getTranslation('Nenhum bot associado')}
                        </div>
                    </div>

                    {selectedAgent.integrationId && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <DatabaseOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                <strong style={{ color: '#1890ff' }}>{getTranslation('Integração')}:</strong>
                            </div>
                            <div style={{ marginTop: 4, fontSize: '14px', marginLeft: 24 }}>
                                {integrations.find(integration => integration._id === selectedAgent.integrationId)?.name || getTranslation('Integração não encontrada')}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <ThunderboltOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                            <strong style={{ color: '#1890ff' }}>{getTranslation('Modelo')}:</strong>
                        </div>
                        <div style={{ marginTop: 4, fontSize: '14px', marginLeft: 24 }}>
                            <Tag color="purple">
                                {(selectedAgent.modelName || 'gpt-4o-mini') === 'gpt-4o-mini' ? 'GPT-4o Mini' :
                                (selectedAgent.modelName || 'gpt-4o-mini') === 'gpt-4.1-mini' ? 'GPT-4.1 Mini' :
                                (selectedAgent.modelName || 'gpt-4o-mini') === 'gpt-5-mini' ? 'GPT-5 Mini' :
                                'GPT-4o Mini'}
                            </Tag>
                        </div>
                    </div>

                    {selectedAgent.agentType && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <BranchesOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                <strong style={{ color: '#1890ff' }}>{getTranslation('Tipo')}:</strong>
                            </div>
                            <div style={{ marginTop: 4, fontSize: '14px', marginLeft: 24 }}>
                                <Tag color={
                                    selectedAgent.agentType === AgentType.REPORT_PROCESSOR_DETECTION ? 'blue' :
                                    selectedAgent.agentType === AgentType.RAG ? 'green' : 'orange'
                                }>
                                    {selectedAgent.agentType === AgentType.REPORT_PROCESSOR_DETECTION ? 'Leitor de pedido médico' :
                                    selectedAgent.agentType === AgentType.RAG ? 'RAG' : 'Detecção de Entidades'}
                                </Tag>
                            </div>
                        </div>
                    )}

                    {selectedAgent.personality && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <ExperimentOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                <strong style={{ color: '#1890ff' }}>{getTranslation('Personalidade')}:</strong>
                            </div>
                            <div style={{ 
                                marginTop: 4, 
                                fontSize: '14px', 
                                marginLeft: 24,
                                padding: '12px',
                                background: '#f6f8ff',
                                border: '1px solid #e6f0ff',
                                borderRadius: '6px',
                                color: '#1890ff',
                                fontWeight: '500'
                            }}>
                                {personalities.find(p => p.identifier === selectedAgent.personality)?.content || selectedAgent.personality}
                            </div>
                        </div>
                    )}
                </AntCard>

                <AntCard>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <ThunderboltOutlined style={{ fontSize: '12px' }} />
                            </div>
                            <strong style={{ color: '#1890ff' }}>{getTranslation('Prompt Adicional')}:</strong>
                        </div>
                    </div>
                    <div
                        style={{
                            padding: 16,
                            background: '#f9f9f9',
                            borderRadius: 6,
                            border: '1px solid #e8e8e8',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6',
                            fontSize: '14px',
                            maxHeight: '400px',
                            overflow: 'auto',
                        }}
                    >
                        {selectedAgent.prompt || getTranslation('Nenhum prompt definido')}
                    </div>
                </AntCard>
            </div>
        );
    };

    const renderEditMode = () => (
        <div style={{ padding: '0 0 60px 0' }}>
            <AgentForm
                formik={formik}
                getTranslation={getTranslation}
                bots={bots}
                personalities={personalities}
                integrations={integrations}
            />
        </div>
    );

    return (
        <Drawer
            title={editingInDrawer ? getTranslation('Editar Agente') : selectedAgent ? getTranslation('Detalhes do Agente') : getTranslation('Agente')}
            placement='right'
            onClose={onClose}
            open={visible}
            width={700}
            extra={
                selectedAgent && !editingInDrawer && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => onEdit(selectedAgent)}
                        >
                            {getTranslation('Editar')}
                        </Button>
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onDelete(selectedAgent.id)}
                        >
                            {getTranslation('Excluir')}
                        </Button>
                    </div>
                )
            }
            footer={
                editingInDrawer && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={onClose}>
                            {getTranslation('Cancelar')}
                        </Button>
                        <Button
                            type="primary"
                            onClick={onSubmitEdit}
                            loading={formik.isSubmitting}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Salvar')}
                        </Button>
                    </div>
                )
            }
        >
            {editingInDrawer ? renderEditMode() : renderViewMode()}
        </Drawer>
    );
};

export default AgentDetailsDrawer;