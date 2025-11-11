import { FC } from 'react';
import { Button, Tag, Card, Row, Col, Tooltip, Empty, Space } from 'antd';
import {
    RobotOutlined,
    StarOutlined,
    SettingOutlined,
    DeleteOutlined,
    ApiOutlined
} from '@ant-design/icons';
import { Agent, AgentType, AgentContext } from '../../../../service/AIAgentService';
import styled from 'styled-components';

interface AgentCardsProps {
    agents: Agent[];
    loading: boolean;
    getTranslation: (key: string) => string;
    onConfigure: (agentId: string) => void;
    onDelete: (agentId: string) => void;
}

const StyledCard = styled(Card)`
    height: 100%;
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #1890ff;
    }

    .ant-card-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        flex: 1;
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
`;

const AgentIcon = styled.div`
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    flex-shrink: 0;
`;

const HeaderContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const AgentTitle = styled.h3`
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const AgentDescription = styled.div`
    font-size: 13px;
    color: #8c8c8c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const CardContent = styled.div`
    margin-bottom: 12px;
    flex: 1;
`;

const TagsRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
`;

const CardActions = styled.div`
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    margin-top: auto;
`;

const EmptyContainer = styled.div`
    padding: 60px 20px;
`;

const AgentCards: FC<AgentCardsProps> = ({
    agents,
    loading,
    getTranslation,
    onConfigure,
    onDelete
}) => {
    const getAgentTypeInfo = (agentType: AgentType) => {
        const typeConfig = {
            [AgentType.REPORT_PROCESSOR_DETECTION]: {
                label: 'Leitor de pedido médico',
                color: 'blue'
            },
            [AgentType.RAG]: {
                label: 'RAG',
                color: 'green'
            },
            [AgentType.ENTITIES_DETECTION]: {
                label: 'Detecção de Entidades',
                color: 'orange'
            },
            [AgentType.CONVERSATIONAL]: {
                label: 'Conversacional',
                color: 'purple'
            },
        };

        return typeConfig[agentType] || { label: 'N/A', color: 'default' };
    };

    const getAgentContextInfo = (agentContext: AgentContext) => {
        const contextConfig = {
            [AgentContext.FAQ]: {
                label: 'FAQ',
                color: 'cyan'
            },
            [AgentContext.GENERAL]: {
                label: 'Geral',
                color: 'geekblue'
            },
        };

        return contextConfig[agentContext] || { label: agentContext, color: 'default' };
    };

    if (!loading && agents.length === 0) {
        return (
            <EmptyContainer>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={getTranslation('Nenhum agente encontrado')}
                />
            </EmptyContainer>
        );
    }

    return (
        <Row gutter={[16, 16]} style={{ minWidth: 0 }}>
            {agents.map((agent) => {
                const typeInfo = agent.agentType ? getAgentTypeInfo(agent.agentType) : null;
                const contextInfo = agent.agentContext ? getAgentContextInfo(agent.agentContext) : null;

                return (
                    <Col
                        key={agent.id}
                        xs={24}
                        sm={24}
                        md={12}
                        lg={8}
                        xl={6}
                        style={{ minWidth: '250px' }}
                    >
                        <StyledCard loading={loading}>
                            <CardHeader>
                                <AgentIcon>
                                    <RobotOutlined />
                                </AgentIcon>
                                <HeaderContent>
                                    <AgentTitle>{agent.name}</AgentTitle>
                                    {agent.description && (
                                        <AgentDescription title={agent.description}>
                                            {agent.description}
                                        </AgentDescription>
                                    )}
                                </HeaderContent>
                            </CardHeader>

                            <CardContent>
                                <TagsRow>
                                    {agent.isDefault && (
                                        <Tag icon={<StarOutlined />} color='gold'>
                                            {getTranslation('Padrão')}
                                        </Tag>
                                    )}
                                    {typeInfo && (
                                        <Tag color={typeInfo.color}>
                                            <strong>Tipo:</strong> {typeInfo.label}
                                        </Tag>
                                    )}
                                    {contextInfo && (
                                        <Tag color={contextInfo.color}>
                                            <strong>Contexto:</strong> {contextInfo.label}
                                        </Tag>
                                    )}
                                </TagsRow>
                            </CardContent>

                            <CardActions>
                                <Button
                                    type="primary"
                                    icon={<SettingOutlined />}
                                    onClick={() => onConfigure(agent.id)}
                                    disabled={!agent.id}
                                    style={{ flex: 1 }}
                                    className='antd-span-default-color'
                                >
                                    {getTranslation('Gerenciar')}
                                </Button>
                                <Tooltip title={getTranslation('Excluir este agente')}>
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => onDelete(agent.id)}
                                    />
                                </Tooltip>
                            </CardActions>
                        </StyledCard>
                    </Col>
                );
            })}
        </Row>
    );
};

export default AgentCards;
