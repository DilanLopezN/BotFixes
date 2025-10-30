import { FC, useEffect, useState, useRef } from 'react';
import { Modal, Input, Button, Alert, Tag, Divider } from 'antd';
import styled from 'styled-components';
import {
    BugOutlined,
    SendOutlined,
    RedoOutlined,
    ReloadOutlined,
    EyeOutlined,
    PlusOutlined,
    DeleteOutlined,
    RobotOutlined,
    UserOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import { AIAgentService, DoQuestionResponse } from '../../../../../../service/AIAgentService';
import { addNotification } from '../../../../../../../../utils/AddNotification';

const LoadingDotsAnimation = styled.div`
    @keyframes loading-dots {
        0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
        } 
        40% { 
            transform: scale(1);
            opacity: 1;
        }
    }
`;

interface TestTrainingModalProps {
    visible: boolean;
    onClose: () => void;
    agent: any;
    agentId: string;
    workspaceId: string;
    getTranslation: (key: string) => string;
}

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    result?: DoQuestionResponse;
    responseTime?: number;
}

const TestTrainingModal: FC<TestTrainingModalProps> = ({
    visible,
    onClose,
    agent,
    agentId,
    workspaceId,
    getTranslation
}) => {
    const [debugText, setDebugText] = useState('');
    const [debugLoading, setDebugLoading] = useState(false);
    const [debugError, setDebugError] = useState<string | null>(null);
    const [contextId, setContextId] = useState('');
    const [useHistoricMessages, setUseHistoricMessages] = useState(false);
    const [agentVariables, setAgentVariables] = useState<any[]>([]);
    const [loadingVariables, setLoadingVariables] = useState(false);
    const [debugParameters, setDebugParameters] = useState<Record<string, string>>({});
    const [showParametersPanel, setShowParametersPanel] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<any>(null);

    const composeBotMessageContent = (response: DoQuestionResponse): string => {
        const trimmedMessage = response?.message?.content?.trim();
        if (trimmedMessage) {
            return trimmedMessage;
        }

        return getTranslation('Agent empty reply placeholder');
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [chatHistory, debugLoading]);

    // Auto-focus textarea when modal opens and after sending messages
    useEffect(() => {
        if (visible && textAreaRef.current) {
            setTimeout(() => {
                textAreaRef.current.focus();
            }, 100);
        }
    }, [visible]);

    // Re-focus textarea after sending a message
    useEffect(() => {
        if (!debugLoading && visible && textAreaRef.current) {
            setTimeout(() => {
                textAreaRef.current.focus();
            }, 100);
        }
    }, [debugLoading, visible]);

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const loadAgentVariables = async () => {
        if (!workspaceId) return;
        
        setLoadingVariables(true);
        try {
            const variables = await AIAgentService.listContextVariables(workspaceId, agentId, (err) => {
                console.error('Error loading agent variables:', err);
            });
            setAgentVariables(variables || []);
        } catch (error) {
            console.error('Error loading agent variables:', error);
            setAgentVariables([]);
        } finally {
            setLoadingVariables(false);
        }
    };

    const loadDebugParametersFromStorage = () => {
        try {
            const savedParams = localStorage.getItem(`debugParams_${agentId}`);
            if (savedParams) {
                const params = JSON.parse(savedParams);
                setDebugParameters(params);
            }
            // Sempre mantém o painel fechado ao carregar
            setShowParametersPanel(false);
        } catch (error) {
            console.error('Error loading debug parameters from localStorage:', error);
            setShowParametersPanel(false);
        }
    };

    const saveDebugParametersToStorage = (params: Record<string, string>) => {
        try {
            localStorage.setItem(`debugParams_${agentId}`, JSON.stringify(params));
        } catch (error) {
            console.error('Error saving debug parameters to localStorage:', error);
        }
    };

    const handleOpenModal = () => {
        setDebugText('');
        setDebugError(null);
        setContextId(generateUUID());
        setUseHistoricMessages(false);
        setChatHistory([]);
        setShowParametersPanel(false);
        loadAgentVariables();
        loadDebugParametersFromStorage();
    };

    const handleCloseModal = () => {
        setDebugText('');
        setDebugError(null);
        setContextId('');
        setUseHistoricMessages(false);
        setDebugParameters({});
        setShowParametersPanel(false);
        setChatHistory([]);
        onClose();
    };

    const handleNewSession = () => {
        setDebugText('');
        setDebugError(null);
        setContextId(generateUUID());
        setUseHistoricMessages(false);
        setChatHistory([]);
        
        setTimeout(() => {
            if (textAreaRef.current) {
                textAreaRef.current.focus();
            }
        }, 100);
    };

    const handleParameterChange = (key: string, value: string) => {
        const newParams = {
            ...debugParameters,
            [key]: value
        };
        setDebugParameters(newParams);
        saveDebugParametersToStorage(newParams);
    };

    const handleAddParameter = () => {
        const newKey = `param_${Object.keys(debugParameters).length + 1}`;
        const newParams = {
            ...debugParameters,
            [newKey]: ''
        };
        setDebugParameters(newParams);
        saveDebugParametersToStorage(newParams);
    };

    const handleRemoveParameter = (key: string) => {
        const newParams = { ...debugParameters };
        delete newParams[key];
        setDebugParameters(newParams);
        saveDebugParametersToStorage(newParams);
    };

    const handleRetryMessage = (messageContent: string) => {
        setDebugText(messageContent);
        setTimeout(() => {
            if (textAreaRef.current) {
                textAreaRef.current.focus();
            }
        }, 100);
    };

    const handleDebugQuestion = async () => {
        const botId = agent?.botId;
        
        if (!debugText.trim() || !botId || !contextId.trim()) {
            addNotification({
                title: getTranslation('Erro'),
                message: getTranslation('Erro ao processar pergunta'),
                type: 'danger',
                duration: 3000,
            });
            return;
        }

        // Add user message to chat
        const userMessageId = Date.now().toString();
        const userMessage: ChatMessage = {
            id: userMessageId,
            type: 'user',
            content: debugText,
            timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, userMessage]);
        const questionText = debugText;
        setDebugText('');
        setDebugLoading(true);
        setDebugError(null);

        const startTime = Date.now();

        try {
            const response = await AIAgentService.doQuestion(
                workspaceId,
                questionText,
                botId,
                contextId,
                agentId,
                useHistoricMessages,
                debugParameters,
                (err) => {
                    if (err?.response?.data?.message) {
                        setDebugError(err.response.data.message);
                    } else if (err?.message) {
                        setDebugError(err.message);
                    } else {
                        setDebugError(getTranslation('Erro ao processar pergunta'));
                    }
                }
            );

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            if (response) {
                // Add bot response to chat
                const botMessageId = Date.now().toString() + '_bot';
                const botMessageContent = composeBotMessageContent(response);
                const botMessage: ChatMessage = {
                    id: botMessageId,
                    type: 'bot',
                    content: botMessageContent,
                    timestamp: new Date(),
                    result: response,
                    responseTime: responseTime
                };
                
                setChatHistory(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('Error in debug question:', error);
            setDebugError(getTranslation('Erro ao processar pergunta'));
        } finally {
            setDebugLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!debugLoading && debugText.trim() && agent?.botId) {
                handleDebugQuestion();
            }
        }
    };

    const handleCopyAllMessages = () => {
        if (chatHistory.length === 0) {
            addNotification({
                title: getTranslation('Aviso'),
                message: getTranslation('Nenhuma mensagem para copiar'),
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        const formattedMessages = chatHistory.map(message => {
            const sender = message.type === 'user' ? 'Usuário' : 'Bot';
            const time = message.timestamp.toLocaleTimeString();
            return `[${time}] ${sender}: ${message.content}`;
        }).join('\n\n');

        navigator.clipboard.writeText(formattedMessages).then(() => {
            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Mensagens copiadas com sucesso'),
                type: 'success',
                duration: 2000,
            });
        }).catch((err) => {
            console.error('Erro ao copiar mensagens:', err);
            addNotification({
                title: getTranslation('Erro'),
                message: getTranslation('Erro ao copiar mensagens'),
                type: 'danger',
                duration: 3000,
            });
        });
    };

    // Initialize modal when it becomes visible
    useEffect(() => {
        if (visible) {
            setShowParametersPanel(false);
            handleOpenModal();
        }
    }, [visible]);

    return (
        <>
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BugOutlined style={{ color: '#1890ff' }} />
                        <span>{getTranslation('Testar Treinamento do Agente')}</span>
                    </div>
                }
                open={visible}
                onCancel={handleCloseModal}
                footer={null}
                width={900}
                style={{ top: 20 }}
                bodyStyle={{ height: '70vh', padding: 0 }}
            >
                <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: '#f5f5f5'
                }}>
                    {/* Header */}
                    <div style={{ 
                        padding: '16px 20px', 
                        borderBottom: '1px solid #e8e8e8',
                        backgroundColor: '#fff'
                    }}>
                        {/* Agent Info Bar */}
                        <div style={{ 
                            marginBottom: 16, 
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '6px',
                            padding: '8px 12px'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: 16
                            }}>
                                {/* Agent info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ 
                                        background: '#1890ff',
                                        borderRadius: '4px',
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
                                        <span style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '500',
                                            color: '#1f2937'
                                        }}>
                                            {agent?.name || getTranslation('Agente')}
                                        </span>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            color: '#6b7280',
                                            marginLeft: '8px'
                                        }}>
                                            • {agent?.agentType === 'RAG' ? 'RAG' : 
                                               agent?.agentType === 'ENTITIES_DETECTION' ? 'Entidades' : 
                                               agent?.agentType === 'CLASSIFICATION' ? 'Classificação' : 
                                               agent?.agentType === 'CONVERSATIONAL' ? 'Conversacional' :
                                               agent?.agentType === 'conversational' ? 'Conversacional' :
                                               getTranslation('Agente')}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    {/* Historic Messages */}
                                    {(() => {
                                        const historicMessagesLengthVar = agentVariables.find(v => v.name === 'historicMessagesLength');
                                        if (historicMessagesLengthVar) {
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{getTranslation('Memória')}:</span>
                                                    <span style={{ fontSize: '12px', color: '#1890ff', fontWeight: '500' }}>
                                                        {historicMessagesLengthVar.value} {getTranslation('msgs')}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Chat count */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{getTranslation('Conversas')}:</span>
                                        <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: '500' }}>
                                            {chatHistory.length}
                                        </span>
                                    </div>

                                    {/* Parameters count */}
                                    {Object.keys(debugParameters).length > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{getTranslation('Parâmetros')}:</span>
                                            <span style={{ fontSize: '12px', color: '#f5222d', fontWeight: '500' }}>
                                                {Object.keys(debugParameters).length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {debugError && (
                            <Alert 
                                message={getTranslation('Erro')} 
                                description={debugError} 
                                type="error" 
                                showIcon 
                                closable
                                onClose={() => setDebugError(null)}
                            />
                        )}

                        {/* Debug Parameters Panel */}
                        <div style={{ marginTop: 16 }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginBottom: 8
                            }}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => setShowParametersPanel(!showParametersPanel)}
                                    style={{ 
                                        fontSize: '12px',
                                        color: '#666',
                                        padding: '4px 8px',
                                        height: 'auto'
                                    }}
                                >
                                    {showParametersPanel ? getTranslation('Ocultar') : getTranslation('Mostrar')} {getTranslation('Parâmetros de Debug')}
                                    {Object.keys(debugParameters).length > 0 && (
                                        <span style={{ 
                                            marginLeft: '4px',
                                            backgroundColor: '#1890ff',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            fontWeight: 'bold'
                                        }}>
                                            {Object.keys(debugParameters).length}
                                        </span>
                                    )}
                                </Button>
                            </div>

                            {showParametersPanel && (
                                <div style={{ 
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    marginBottom: 16
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        marginBottom: 12
                                    }}>
                                        <div style={{ 
                                            fontSize: '13px', 
                                            fontWeight: '500',
                                            color: '#333'
                                        }}>
                                            {getTranslation('Parâmetros Opcionais')}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Button
                                                type="default"
                                                size="small"
                                                onClick={() => handleParameterChange('paciente_nome', '')}
                                                style={{ fontSize: '10px', height: '22px' }}
                                                disabled={debugParameters.hasOwnProperty('paciente_nome')}
                                            >
                                                + paciente_nome
                                            </Button>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<PlusOutlined />}
                                                onClick={handleAddParameter}
                                                style={{ fontSize: '11px' }}
                                                className="antd-span-default-color"
                                            >
                                                {getTranslation('Adicionar')}
                                            </Button>
                                        </div>
                                    </div>

                                    {Object.keys(debugParameters).length === 0 ? (
                                        <div style={{ 
                                            textAlign: 'center',
                                            color: '#999',
                                            fontSize: '12px',
                                            padding: '20px 0'
                                        }}>
                                            {getTranslation('Nenhum parâmetro definido')}
                                            <br />
                                            <span style={{ fontSize: '11px' }}>
                                                {getTranslation('Ex: paciente_nome, idade, etc.')}
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {Object.entries(debugParameters).map(([key, value]) => (
                                                <div key={key} style={{ 
                                                    display: 'flex', 
                                                    gap: '8px', 
                                                    alignItems: 'center'
                                                }}>
                                                    <Input
                                                        placeholder={getTranslation('Nome do parâmetro')}
                                                        value={key}
                                                        onChange={(e) => {
                                                            const newKey = e.target.value;
                                                            if (newKey !== key) {
                                                                const newParams = { ...debugParameters };
                                                                delete newParams[key];
                                                                newParams[newKey] = value;
                                                                setDebugParameters(newParams);
                                                                saveDebugParametersToStorage(newParams);
                                                            }
                                                        }}
                                                        size="small"
                                                        style={{ flex: '0 0 150px', fontSize: '12px' }}
                                                    />
                                                    <Input
                                                        placeholder={getTranslation('Valor')}
                                                        value={value}
                                                        onChange={(e) => handleParameterChange(key, e.target.value)}
                                                        size="small"
                                                        style={{ flex: 1, fontSize: '12px' }}
                                                    />
                                                    <Button
                                                        type="text"
                                                        danger
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleRemoveParameter(key)}
                                                        style={{ 
                                                            fontSize: '12px',
                                                            width: '24px',
                                                            height: '24px',
                                                            minWidth: '24px',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {Object.keys(debugParameters).length > 0 && (
                                        <div style={{ 
                                            marginTop: 12,
                                            paddingTop: 12,
                                            borderTop: '1px solid #e8e8e8',
                                            fontSize: '11px',
                                            color: '#666'
                                        }}>
                                            <strong>{getTranslation('Exemplo')}:</strong> paciente_nome = "João Silva"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div 
                        ref={chatAreaRef}
                        style={{ 
                            flex: 1, 
                            padding: '16px 20px',
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                        {chatHistory.length === 0 && (
                            <div style={{ 
                                textAlign: 'center', 
                                color: '#999', 
                                marginTop: '50px',
                                fontSize: '14px'
                            }}>
                                {getTranslation('Inicie uma conversa para testar o treinamento do agente')}
                            </div>
                        )}
                        
                        {chatHistory.map((message) => {
                            const resultMessage = message.result?.message;
                            return (
                                <div key={message.id} style={{
                                    display: 'flex',
                                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-start',
                                    marginBottom: '8px',
                                    gap: '8px'
                            }}>
                                {/* Bot Avatar */}
                                {message.type === 'bot' && (
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f0f0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '4px',
                                        border: '1px solid #d9d9d9'
                                    }}>
                                        <RobotOutlined style={{ color: '#666', fontSize: '14px' }} />
                                    </div>
                                )}
                                
                                <div style={{ 
                                    maxWidth: '70%',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '4px',
                                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                                }}>
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            backgroundColor: message.type === 'user' ? '#1890ff' : (message.type === 'bot' && !resultMessage ? '#fffbe6' : '#fff'),
                                            color: message.type === 'user' ? '#fff' : '#333',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            border: message.type === 'bot' ? (resultMessage ? '1px solid #e8e8e8' : '1px solid #fadb14') : 'none',
                                            whiteSpace: 'pre-wrap',
                                            wordWrap: 'break-word',
                                            userSelect: 'text',
                                            cursor: 'text',
                                            position: 'relative',
                                            flex: 1,
                                            WebkitUserSelect: 'text',
                                            MozUserSelect: 'text',
                                            msUserSelect: 'text'
                                        }}
                                    >
                                        <div
                                            style={{
                                                userSelect: 'text',
                                                cursor: 'text',
                                                WebkitUserSelect: 'text',
                                                MozUserSelect: 'text',
                                                msUserSelect: 'text',
                                                color: message.type === 'user' ? '#fff' : '#333'
                                            }}
                                        >
                                            {message.content}
                                        </div>

                                        {/* Bot message details */}
                                        {message.type === 'bot' && message.result && (
                                            <div style={{
                                                marginTop: '8px',
                                                paddingTop: '8px',
                                                borderTop: '1px solid #f0f0f0',
                                                fontSize: '10px',
                                                color: '#666',
                                                display: 'flex',
                                                gap: '8px',
                                                flexWrap: 'wrap',
                                                alignItems: 'center'
                                            }}>
                                                {message.result.intent?.interaction && (
                                                    <Tag color="green" style={{ fontSize: '9px', margin: 0 }}>
                                                        {message.result.intent.interaction.name}
                                                    </Tag>
                                                )}
                                                {resultMessage?.modelName && (
                                                    <Tag color="purple" style={{ fontSize: '9px', margin: 0 }}>
                                                        {resultMessage.modelName}
                                                    </Tag>
                                                )}
                                                {resultMessage && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{resultMessage.promptTokens} + {resultMessage.completionTokens} tokens</span>
                                                    </>
                                                )}
                                                {message.responseTime && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{message.responseTime}ms</span>
                                                    </>
                                                )}
                                                {resultMessage?.isFallback && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{getTranslation('Fallback')}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Empty message indicator */}
                                        {message.type === 'bot' && !resultMessage && (
                                            <div style={{
                                                marginTop: '8px',
                                                paddingTop: '8px',
                                                borderTop: '1px dashed #fadb14',
                                                fontSize: '11px',
                                                color: '#d48806',
                                                fontStyle: 'italic'
                                            }}>
                                                {getTranslation('Sem mensagem de resposta')}
                                            </div>
                                        )}

                                        <div style={{
                                            fontSize: '10px',
                                            opacity: message.type === 'user' ? 0.8 : 0.7,
                                            marginTop: '4px',
                                            textAlign: message.type === 'user' ? 'right' : 'left',
                                            color: message.type === 'user' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)'
                                        }}>
                                            {message.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>

                                    {/* Retry button for user messages */}
                                    {message.type === 'user' && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ReloadOutlined />}
                                            onClick={() => handleRetryMessage(message.content)}
                                            style={{
                                                opacity: 0.6,
                                                color: '#666',
                                                width: '20px',
                                                height: '20px',
                                                minWidth: '20px',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                marginTop: '2px',
                                                flexShrink: 0
                                            }}
                                            title={getTranslation('Reenviar mensagem')}
                                            disabled={debugLoading}
                                        />
                                    )}
                                </div>
                                
                                {/* User Avatar */}
                                {message.type === 'user' && (
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1890ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '4px',
                                        border: '2px solid #fff',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }}>
                                        <UserOutlined style={{ color: '#fff', fontSize: '14px' }} />
                                    </div>
                                )}
                            </div>
                            );
                        })}
                        
                        {debugLoading && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                marginBottom: '8px',
                                gap: '8px'
                            }}>
                                {/* Bot Avatar for loading */}
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: '4px',
                                    border: '1px solid #d9d9d9'
                                }}>
                                    <RobotOutlined style={{ color: '#666', fontSize: '14px' }} />
                                </div>
                                
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '18px 18px 18px 4px',
                                    backgroundColor: '#f8f8f8',
                                    color: '#666',
                                    border: '1px solid #e8e8e8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        gap: '2px'
                                    }}>
                                        <span style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            backgroundColor: '#999',
                                            animation: 'loading-dots 1.4s infinite ease-in-out both',
                                            animationDelay: '-0.32s'
                                        }}></span>
                                        <span style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            backgroundColor: '#999',
                                            animation: 'loading-dots 1.4s infinite ease-in-out both',
                                            animationDelay: '-0.16s'
                                        }}></span>
                                        <span style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            backgroundColor: '#999',
                                            animation: 'loading-dots 1.4s infinite ease-in-out both',
                                            animationDelay: '0s'
                                        }}></span>
                                    </div>
                                    {getTranslation('Digitando...')}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div style={{ 
                        padding: '16px 20px', 
                        borderTop: '1px solid #e8e8e8',
                        backgroundColor: '#fff'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                            <Input.TextArea
                                ref={textAreaRef}
                                placeholder={getTranslation('Digite sua mensagem...')}
                                value={debugText}
                                onChange={(e) => setDebugText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={2}
                                style={{
                                    resize: 'none',
                                    borderRadius: '18px',
                                    paddingTop: '8px'
                                }}
                                disabled={debugLoading}
                            />
                            <Button
                                type="default"
                                icon={<CopyOutlined />}
                                onClick={handleCopyAllMessages}
                                disabled={debugLoading || chatHistory.length === 0}
                                title={getTranslation('Copiar todas as mensagens')}
                                style={{
                                    borderRadius: '50%',
                                    width: '44px',
                                    height: '44px',
                                    minWidth: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '3px',
                                    borderColor: '#d9d9d9',
                                    color: '#666'
                                }}
                            />
                            <Button
                                type="default"
                                icon={<RedoOutlined />}
                                onClick={handleNewSession}
                                disabled={debugLoading}
                                title={getTranslation('Nova Sessão')}
                                style={{
                                    borderRadius: '50%',
                                    width: '44px',
                                    height: '44px',
                                    minWidth: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '3px',
                                    borderColor: '#d9d9d9',
                                    color: '#666'
                                }}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleDebugQuestion}
                                loading={debugLoading}
                                disabled={!debugText.trim() || !agent?.botId}
                                className="antd-span-default-color"
                                style={{
                                    borderRadius: '50%',
                                    width: '44px',
                                    height: '44px',
                                    minWidth: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '3px'
                                }}
                            />
                        </div>
                    </div>
                </div>
                <LoadingDotsAnimation />
            </Modal>
        </>
    );
};

export default TestTrainingModal;
