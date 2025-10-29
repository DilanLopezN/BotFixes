import { FC } from 'react';
import { Table, Button, Tag } from 'antd';
import { RobotOutlined, StarOutlined, ThunderboltOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { Agent, AgentType } from '../../../../service/AIAgentService';

interface AgentTableProps {
    agents: Agent[];
    loading: boolean;
    getTranslation: (key: string) => string;
    onConfigure: (agentId: string) => void;
    onDelete: (agentId: string) => void;
}

const AgentTable: FC<AgentTableProps> = ({ 
    agents, 
    loading, 
    getTranslation, 
    onConfigure, 
    onDelete 
}) => {
    const columns = [
        {
            title: getTranslation('Nome'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Agent) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                    }}>
                        <RobotOutlined />
                    </div>
                    <div>
                        <strong>{text}</strong>
                        {record.isDefault && (
                            <Tag 
                                icon={<StarOutlined />} 
                                color='green' 
                                style={{ fontSize: '10px', marginLeft: 8 }}
                            >
                                {getTranslation('Padrão')}
                            </Tag>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: getTranslation('Descrição'),
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: getTranslation('Tipo'),
            dataIndex: 'agentType',
            key: 'agentType',
            render: (agentType: AgentType) => {
                if (!agentType) return '-';
                
                const typeLabels = {
                    [AgentType.REPORT_PROCESSOR_DETECTION]: 'Leitor de pedido médico',
                    [AgentType.RAG]: 'RAG',
                    [AgentType.ENTITIES_DETECTION]: 'Detecção de Entidades',
                };
                
                const typeColors = {
                    [AgentType.REPORT_PROCESSOR_DETECTION]: 'blue',
                    [AgentType.RAG]: 'green',
                    [AgentType.ENTITIES_DETECTION]: 'orange',
                };
                
                return (
                    <Tag color={typeColors[agentType]}>
                        {typeLabels[agentType]}
                    </Tag>
                );
            },
        },
        {
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ThunderboltOutlined style={{ color: '#1890ff' }} />
                    <span>{getTranslation('Preview do Prompt')}</span>
                </div>
            ),
            dataIndex: 'prompt',
            key: 'prompt',
            render: (text: string) => (
                <div
                    style={{
                        maxHeight: '40px',
                        overflow: 'hidden',
                        lineHeight: '20px',
                        color: '#666',
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: '#f6f8ff',
                        border: '1px solid #e6f0ff',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                    }}
                    title={text}
                >
                    {text || getTranslation('Nenhum prompt definido')}
                </div>
            ),
        },
        {
            title: getTranslation('Ações'),
            key: 'actions',
            width: 180,
            render: (text: any, record: Agent) => {
                return (
                    <div style={{ display: 'flex', gap: 4 }}>
                        <Button
                            type="primary"
                            size='small'
                            icon={<SettingOutlined />}
                            onClick={() => onConfigure(record.id)}
                            disabled={!record.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            title={getTranslation('Gerenciar todas as configurações do agente')}
                        >
                            {getTranslation('Gerenciar')}
                        </Button>
                        <Button
                            size='small'
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onDelete(record.id)}
                            title={getTranslation('Excluir este agente')}
                        />
                    </div>
                );
            },
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={agents}
            loading={loading}
            rowKey={(record) => record.id || ''}
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
            }}
        />
    );
};

export default AgentTable;