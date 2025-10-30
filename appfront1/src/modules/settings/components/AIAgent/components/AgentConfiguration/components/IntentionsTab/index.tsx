import { FC, useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Card, Drawer, Input, Tag, Space, Select, Popover, Dropdown, Menu } from 'antd';
import styled from 'styled-components';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    BulbOutlined,
    ToolOutlined,
    ExclamationCircleOutlined,
    SettingOutlined,
    DeploymentUnitOutlined,
    RobotOutlined,
    ThunderboltOutlined,
    BugOutlined,
    ImportOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { useFormik } from 'formik-latest';
import {
    AIAgentService,
    IntentDetection,
    DetectIntentResponse,
    ActionType,
    IntentAction,
    CreateIntentAction,
    UpdateIntentAction,
    AgentType,
    IntentLibraryItem,
} from '../../../../../../service/AIAgentService';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../../../../../shared/InputSample/InputSimple';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { BotService } from '../../../../../../../bot/services/BotService';
import { Interaction } from '../../../../../../../../model/Interaction';

const { TextArea } = Input;

const StyledTextArea = styled.textarea`
    background: var(--color8);
    border: 1px solid #d9d9d9;
    color: var(--color7);
    padding: 9px 24px 9px 19px !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    height: 120px;
    min-height: 42px;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    resize: vertical;

    ::placeholder {
        color: #666 !important;
        opacity: 1 !important;
    }

    :hover {
        border: 1px solid rgba(3, 102, 214, 0.6);
    }

    :focus {
        border: 1px solid rgba(3, 102, 214, 0.6);
    }
`;

interface IntentionsTabProps {
    agentId: string;
    workspaceId: string;
    getTranslation: (key: string) => string;
}

const IntentionsTab: FC<IntentionsTabProps> = ({ agentId, workspaceId, getTranslation }) => {
    const [intentions, setIntentions] = useState<IntentDetection[]>([]);
    const [loading, setLoading] = useState(false);
    const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
    const [editDrawerVisible, setEditDrawerVisible] = useState(false);
    const [selectedIntention, setSelectedIntention] = useState<IntentDetection | null>(null);
    const [searchText, setSearchText] = useState('');
    const [debugModalVisible, setDebugModalVisible] = useState(false);
    const [debugText, setDebugText] = useState('');
    const [debugResult, setDebugResult] = useState<DetectIntentResponse | null>(null);
    const [debugError, setDebugError] = useState<string | null>(null);
    const [debugLoading, setDebugLoading] = useState(false);
    const [actionsModalVisible, setActionsModalVisible] = useState(false);
    const [selectedIntentForActions, setSelectedIntentForActions] = useState<IntentDetection | null>(null);
    const [currentAction, setCurrentAction] = useState<IntentAction | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [ragAgents, setRagAgents] = useState<any[]>([]);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [intentLibrary, setIntentLibrary] = useState<IntentLibraryItem[]>([]);
    const [intentLibraryLoading, setIntentLibraryLoading] = useState(false);
    const [librarySearch, setLibrarySearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const debugTextAreaRef = useRef<any>(null);

    const loadInteractions = async (botId: string) => {
        try {
            const interactionsData = await BotService.getInteractions(workspaceId, botId);
            setInteractions(interactionsData.data || []);
        } catch (error) {
            console.error('Error loading interactions:', error);
        }
    };

    const loadRagAgents = async () => {
        try {
            const agents = await AIAgentService.listAgents(workspaceId);
            const ragAgentsData = agents.filter(agent => agent.agentType === AgentType.RAG);
            setRagAgents(ragAgentsData);
        } catch (error) {
            console.error('Error loading RAG agents:', error);
        }
    };

    const loadIntentLibrary = async (searchTerm?: string) => {
        if (!workspaceId) return;
        try {
            setIntentLibraryLoading(true);
            const params = searchTerm ? { search: searchTerm } : undefined;
            const response = await AIAgentService.listIntentLibrary(
                workspaceId,
                params,
                (err) => {
                    console.error('Error loading intents from library:', err);
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao carregar biblioteca de intenções'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );
            setIntentLibrary(response || []);
        } catch (error) {
            console.error('Error loading intent library:', error);
        } finally {
            setIntentLibraryLoading(false);
        }
    };

    const createForm = useFormik({
        initialValues: {
            name: '',
            description: '',
            examples: [''],
        },
        onSubmit: async (values) => {
            try {
                const filteredExamples = values.examples.filter((example) => example.trim() !== '');
                await AIAgentService.createIntentDetection(
                    workspaceId,
                    {
                        name: values.name,
                        description: values.description,
                        examples: filteredExamples,
                        agentId,
                    },
                    (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao criar intenção'),
                            type: 'danger',
                            duration: 3000,
                        });
                    }
                );

                addNotification({
                    title: getTranslation('Sucesso'),
                    message: getTranslation('Intenção criada com sucesso'),
                    type: 'success',
                    duration: 3000,
                });

                setCreateDrawerVisible(false);
                createForm.resetForm();
                loadIntentions();
            } catch (error) {
                console.error('Error creating intention:', error);
            }
        },
    });

    const editForm = useFormik({
        initialValues: {
            name: '',
            description: '',
            examples: [''],
        },
        onSubmit: async (values) => {
            if (!selectedIntention) return;

            try {
                const filteredExamples = values.examples.filter((example) => example.trim() !== '');
                await AIAgentService.updateIntentDetection(
                    workspaceId,
                    {
                        intentDetectionId: selectedIntention.id,
                        name: values.name,
                        description: values.description,
                        examples: filteredExamples,
                        agentId,
                    },
                    (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao atualizar intenção'),
                            type: 'danger',
                            duration: 3000,
                        });
                    }
                );

                addNotification({
                    title: getTranslation('Sucesso'),
                    message: getTranslation('Intenção atualizada com sucesso'),
                    type: 'success',
                    duration: 3000,
                });

                setEditDrawerVisible(false);
                setSelectedIntention(null);
                loadIntentions();
            } catch (error) {
                console.error('Error updating intention:', error);
            }
        },
    });

    useEffect(() => {
        loadIntentions();
        loadInitialData();
    }, [agentId, workspaceId]);

    useEffect(() => {
        if (!importModalVisible) return;
        const trimmedSearch = librarySearch.trim();
        loadIntentLibrary(trimmedSearch || undefined);
    }, [importModalVisible, workspaceId]);

    useEffect(() => {
        if (!importModalVisible) return;
        const timeout = setTimeout(() => {
            const trimmedSearch = librarySearch.trim();
            loadIntentLibrary(trimmedSearch || undefined);
        }, 300);

        return () => clearTimeout(timeout);
    }, [librarySearch, importModalVisible]);

    const loadInitialData = async () => {
        try {
            const agent = await AIAgentService.getAgent(workspaceId, agentId);
            if (agent.botId) {
                await loadInteractions(agent.botId);
            }
            await loadRagAgents();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const loadIntentions = async () => {
        setLoading(true);
        try {
            const response = await AIAgentService.listIntentDetection(workspaceId, agentId, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao carregar intenções'),
                    type: 'danger',
                    duration: 3000,
                });
            });

            // Filter intentions for current agent
            const filteredIntentions = response.filter((intention) => intention.agentId === agentId);
            setIntentions(filteredIntentions);
        } catch (error) {
            console.error('Error loading intentions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (intentionId: string) => {
        try {
            await AIAgentService.deleteIntentDetection(workspaceId, intentionId, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao deletar intenção'),
                    type: 'danger',
                    duration: 3000,
                });
            });

            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Intenção deletada com sucesso'),
                type: 'success',
                duration: 3000,
            });

            loadIntentions();
        } catch (error) {
            console.error('Error deleting intention:', error);
        }
    };

    const handleEdit = (intention: IntentDetection) => {
        setSelectedIntention(intention);
        editForm.setValues({
            name: intention.name,
            description: intention.description,
            examples: intention.examples,
        });
        setEditDrawerVisible(true);
    };

    const handleConfigureActions = async (intention: IntentDetection) => {
        setSelectedIntentForActions(intention);
        setCurrentAction(null);
        setActionsModalVisible(true);
        
        // Load agent to get botId
        try {
            const agent = await AIAgentService.getAgent(workspaceId, agentId);
            if (agent.botId) {
                await loadInteractions(agent.botId);
            }
            await loadRagAgents();
            
            // Pre-populate form if action exists (only one action per intention)
            if (intention.actions && intention.actions.length > 0) {
                const existingAction = intention.actions[0]; // Always use first (and only) action
                setCurrentAction(existingAction);
                actionsForm.setValues({
                    actionType: existingAction.actionType,
                    targetValue: existingAction.targetValue,
                });
            } else {
                // Reset form for new action
                actionsForm.resetForm();
            }
        } catch (error) {
            console.error('Error loading data for actions:', error);
        }
    };

    const handleOpenImportModal = () => {
        setLibrarySearch('');
        setImportModalVisible(true);
    };

    const handleCloseImportModal = () => {
        setImportModalVisible(false);
        setLibrarySearch('');
        setIntentLibrary([]);
    };

    const handleImportIntention = async (item: IntentLibraryItem) => {
        if (!workspaceId || !agentId) return;
        try {
            await AIAgentService.importIntentFromLibrary(
                workspaceId,
                {
                    intentLibraryId: item.id,
                    agentId,
                },
                (err) => {
                    console.error('Error importing intent from library:', err);
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao importar intenção da biblioteca'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );

            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Intenção importada da biblioteca'),
                type: 'success',
                duration: 3000,
            });

            handleCloseImportModal();
            loadIntentions();
        } catch (error) {
            console.error('Error importing intent library item:', error);
        }
    };

    const handleDeleteIntentLibraryItem = async (item: IntentLibraryItem) => {
        if (!workspaceId) return;

        try {
            await AIAgentService.deleteIntentLibrary(
                workspaceId,
                item.id,
                (err) => {
                    console.error('Error deleting intent library item:', err);
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao remover intenção da biblioteca'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );

            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Intenção removida da biblioteca'),
                type: 'success',
                duration: 3000,
            });

            const trimmedSearch = librarySearch.trim();
            await loadIntentLibrary(trimmedSearch || undefined);
        } catch (error) {
            console.error('Error deleting intent library item:', error);
        }
    };

    const handleDebugIntent = async () => {
        if (!debugText.trim()) return;

        setDebugLoading(true);
        setDebugError(null);
        setDebugResult(null);

        try {
            const response = await AIAgentService.detectIntent(workspaceId, debugText, agentId, (err) => {
                // Captura erros específicos da API
                if (err?.response?.data?.message) {
                    setDebugError(err.response.data.message);
                } else if (err?.message) {
                    setDebugError(err.message);
                } else {
                    setDebugError(getTranslation('Erro ao detectar intenção'));
                }
            });

            if (response) {
                setDebugResult(response);
            }
        } catch (error: any) {
            console.error('Error detecting intent:', error);
            // Fallback para erros não capturados pelo callback
            if (error?.response?.data?.message) {
                setDebugError(error.response.data.message);
            } else if (error?.message) {
                setDebugError(error.message);
            } else {
                setDebugError(getTranslation('Erro ao detectar intenção'));
            }
        } finally {
            setDebugLoading(false);
        }
    };

    const handleDebugKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!debugLoading && debugText.trim()) {
                handleDebugIntent();
            }
        }
    };

    // Auto-focus textarea quando modal abre
    useEffect(() => {
        if (debugModalVisible && debugTextAreaRef.current) {
            setTimeout(() => {
                debugTextAreaRef.current.focus();
            }, 100);
        }
    }, [debugModalVisible]);

    const addExample = (form: any) => {
        const currentExamples = form.values.examples;
        if (currentExamples.length < 4) {
            form.setFieldValue('examples', [...currentExamples, '']);
        }
    };

    const removeExample = (form: any, index: number) => {
        const currentExamples = form.values.examples;
        form.setFieldValue(
            'examples',
            currentExamples.filter((_, i) => i !== index)
        );
    };

    const updateExample = (form: any, index: number, value: string) => {
        const currentExamples = [...form.values.examples];
        currentExamples[index] = value;
        form.setFieldValue('examples', currentExamples);
    };

    const actionsForm = useFormik({
        initialValues: {
            actionType: ActionType.TREE,
            targetValue: '',
        },
        onSubmit: async (values) => {
            if (!selectedIntentForActions) return;
            
            if (!values.targetValue) {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Por favor, selecione um target para a ação'),
                    type: 'danger',
                    duration: 3000,
                });
                return;
            }
            
            try {
                if (currentAction) {
                    // Update existing action
                    const updateData: UpdateIntentAction = {
                        intentActionsId: currentAction.id,
                        actionType: values.actionType,
                        targetValue: values.targetValue,
                    };

                    await AIAgentService.updateIntentAction(workspaceId, updateData);
                    
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Ação atualizada com sucesso!'),
                        type: 'success',
                        duration: 3000,
                    });
                } else {
                    // Create new action
                    const createData: CreateIntentAction = {
                        intentId: selectedIntentForActions.id,
                        actionType: values.actionType,
                        targetValue: values.targetValue,
                    };

                    await AIAgentService.createIntentAction(workspaceId, createData);
                    
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Ação criada com sucesso!'),
                        type: 'success',
                        duration: 3000,
                    });
                }
                
                setActionsModalVisible(false);
                setSelectedIntentForActions(null);
                setCurrentAction(null);
                actionsForm.resetForm();
                loadIntentions(); // Reload to show updated actions
            } catch (error) {
                console.error('Error saving intent action:', error);
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao salvar ação'),
                    type: 'danger',
                    duration: 3000,
                });
            }
        },
    });

    const handleRemoveAction = async () => {
        if (!currentAction) return;

        try {
            // Since we don't have a delete endpoint, we'll just reset the form
            // and set currentAction to null to indicate it should be treated as new
            setCurrentAction(null);
            actionsForm.resetForm();
            
            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Ação removida com sucesso!'),
                type: 'success',
                duration: 3000,
            });
        } catch (error) {
            console.error('Error removing action:', error);
            addNotification({
                title: getTranslation('Erro'),
                message: getTranslation('Erro ao remover ação'),
                type: 'danger',
                duration: 3000,
            });
        }
    };

    const getTargetDisplayName = (action: IntentAction) => {
        if (action.actionType === ActionType.TREE || action.actionType === ActionType.TREE_IMMEDIATELY) {
            const interaction = interactions.find(i => i._id === action.targetValue);
            return interaction ? interaction.name : action.targetValue;
        } else {
            const agent = ragAgents.find(a => a.id === action.targetValue);
            return agent ? agent.name : action.targetValue;
        }
    };

    // Função para buscar nome da ação no debug result
    const getDebugActionDisplayName = (action: any, debugResult: any) => {
        if (action.actionType === 'TREE' || action.actionType === 'tree' || action.actionType === 'TREE_IMMEDIATELY' || action.actionType === 'tree_immediately') {
            // Se a API retornou a interaction, usar diretamente
            if (debugResult?.interaction && debugResult.interaction._id === action.targetValue) {
                return debugResult.interaction.name;
            }
            // Fallback: buscar nas interactions carregadas
            const interaction = interactions.find(i => i._id === action.targetValue);
            return interaction ? interaction.name : action.targetValue;
        } else if (action.actionType === 'AGENT') {
            // Buscar agent onde id === action.targetValue
            const agent = ragAgents.find(a => a.id === action.targetValue);
            return agent ? agent.name : action.targetValue;
        }
        return action.targetValue;
    };

    // Função para traduzir o tipo de ação
    const getActionTypeLabel = (actionType: string) => {
        if (actionType === 'TREE' || actionType === 'tree') {
            return getTranslation('Árvore');
        } else if (actionType === 'AGENT') {
            return getTranslation('Agente');
        }
        return actionType;
    };

    const filteredIntentions = intentions.filter(
        (intention) =>
            intention.name.toLowerCase().includes(searchText.toLowerCase()) ||
            intention.description.toLowerCase().includes(searchText.toLowerCase())
    );

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText]);

    const columns = [
        {
            title: getTranslation('Nome'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ThunderboltOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontWeight: 'bold' }}>{text}</span>
                </div>
            ),
        },
        {
            title: getTranslation('Descrição'),
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: getTranslation('Exemplos'),
            dataIndex: 'examples',
            key: 'examples',
            render: (examples: string[]) => (
                <div>
                    {examples.slice(0, 4).map((example, index) => (
                        <Tag key={index} color='blue' style={{ marginBottom: 4 }}>
                            {example}
                        </Tag>
                    ))}
                    {examples.length > 4 && <Tag color='default'>+{examples.length - 4} mais</Tag>}
                </div>
            ),
        },
        {
            title: getTranslation('Detalhes da ação'),
            key: 'configuredActions',
            width: 140,
            render: (_, record: IntentDetection) => (
                <div>
                    {record.actions && record.actions.length > 0 ? (
                        <Popover
                            content={
                                <div>
                                    <div style={{ marginBottom: 4 }}>
                                        <strong>{getTranslation('Tipo')}:</strong>{' '}
                                        {record.actions[0].actionType === ActionType.TREE 
                                            ? getTranslation('Redirecionar para árvore')
                                            : record.actions[0].actionType === ActionType.TREE_IMMEDIATELY
                                            ? getTranslation('Redirecionar imediatamente para árvore')
                                            : getTranslation('Redirecionar para outro agente')}
                                    </div>
                                    <div>
                                        <strong>{getTranslation('Destino')}:</strong>{' '}
                                        {getTargetDisplayName(record.actions[0])}
                                    </div>
                                </div>
                            }
                            title={getTranslation('Detalhes da Ação')}
                            trigger="hover"
                        >
                            <Tag
                                color={
                                    record.actions[0].actionType === ActionType.TREE ? 'blue' 
                                    : record.actions[0].actionType === ActionType.TREE_IMMEDIATELY ? 'cyan'
                                    : 'purple'
                                }
                                style={{
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    width: 'fit-content',
                                    cursor: 'pointer',
                                }}
                            >
                                {(record.actions[0].actionType === ActionType.TREE || record.actions[0].actionType === ActionType.TREE_IMMEDIATELY) ? (
                                    <DeploymentUnitOutlined style={{ fontSize: '12px' }} />
                                ) : (
                                    <RobotOutlined style={{ fontSize: '12px' }} />
                                )}
                                {record.actions[0].actionType === ActionType.TREE 
                                    ? 'Desenho bot' 
                                    : record.actions[0].actionType === ActionType.TREE_IMMEDIATELY
                                    ? 'Desenho bot (imediato)'
                                    : 'Agente'}
                            </Tag>
                        </Popover>
                    ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>
                            {getTranslation('Nenhuma ação')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: getTranslation('Ações'),
            key: 'actions',
            width: 72,
            render: (_, record: IntentDetection) => {
                const hasActions = Boolean(record.actions && record.actions.length > 0);
                const configureLabel = hasActions ? getTranslation('Editar Ação') : getTranslation('Configurar Ações');

                const menu = (
                    <Menu>
                        <Menu.Item
                            key='edit'
                            onClick={(info) => {
                                info.domEvent.stopPropagation();
                                handleEdit(record);
                            }}
                        >
                            {getTranslation('Editar')}
                        </Menu.Item>
                        <Menu.Item
                            key='configure'
                            onClick={(info) => {
                                info.domEvent.stopPropagation();
                                handleConfigureActions(record);
                            }}
                        >
                            {configureLabel}
                        </Menu.Item>
                        <Menu.Item
                            key='delete'
                            onClick={(info) => {
                                info.domEvent.stopPropagation();
                                Modal.confirm({
                                    title: getTranslation('Tem certeza que deseja deletar esta intenção?'),
                                    okText: getTranslation('Sim'),
                                    cancelText: getTranslation('Não'),
                                    okButtonProps: { danger: true },
                                    onOk: () => handleDelete(record.id),
                                });
                            }}
                        >
                            <span style={{ color: '#ff4d4f' }}>{getTranslation('Excluir')}</span>
                        </Menu.Item>
                    </Menu>
                );

                return (
                    <Dropdown overlay={menu} trigger={['click']} placement='bottomRight'>
                        <Button
                            type='text'
                            icon={<MenuOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                            }}
                        />
                    </Dropdown>
                );
            },
        },
    ];

    const libraryColumns = [
        {
            title: getTranslation('Nome'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <Tag color='purple'>{text}</Tag>
                </Space>
            ),
        },
        {
            title: getTranslation('Descrição'),
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: getTranslation('Exemplos'),
            dataIndex: 'examples',
            key: 'examples',
            render: (examples: string[]) => (
                <Space wrap>
                    {examples && examples.length
                        ? examples.map((example, index) => (
                              <Tag color='blue' key={`${example}-${index}`}>
                                  {example}
                              </Tag>
                          ))
                        : '-'}
                </Space>
            ),
        },
        {
            title: getTranslation('Ações'),
            key: 'actions',
            width: 72,
            render: (_: unknown, record: IntentLibraryItem) => {
                const menu = (
                    <Menu>
                        <Menu.Item
                            key='use'
                            onClick={(info) => {
                                info.domEvent.stopPropagation();
                                handleImportIntention(record);
                            }}
                        >
                            {getTranslation('Usar')}
                        </Menu.Item>
                        <Menu.Item
                            key='delete'
                            onClick={(info) => {
                                info.domEvent.stopPropagation();
                                Modal.confirm({
                                    title: getTranslation('Deseja remover esta intenção da biblioteca?'),
                                    okText: getTranslation('Remover'),
                                    cancelText: getTranslation('Cancelar'),
                                    okButtonProps: { danger: true },
                                    onOk: () => handleDeleteIntentLibraryItem(record),
                                });
                            }}
                        >
                            <span style={{ color: '#ff4d4f' }}>{getTranslation('Excluir')}</span>
                        </Menu.Item>
                    </Menu>
                );

                return (
                    <Dropdown overlay={menu} trigger={['click']} placement='bottomRight'>
                        <Button
                            type='text'
                            icon={<MenuOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                            }}
                        />
                    </Dropdown>
                );
            },
        },
    ];

    const renderExampleInputs = (form: any) => (
        <div>
            <LabelWrapper>
                <span>{getTranslation('Exemplos')}</span>
            </LabelWrapper>
            {form.values.examples.map((example: string, index: number) => (
                <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <InputSimple
                        value={example}
                        onChange={(e) => updateExample(form, index, e.target.value)}
                        placeholder={getTranslation('Digite um exemplo')}
                    />
                    {form.values.examples.length > 1 && (
                        <Button type='link' danger onClick={() => removeExample(form, index)} icon={<DeleteOutlined />} />
                    )}
                </div>
            ))}
            <Button 
                type='dashed' 
                onClick={() => addExample(form)} 
                icon={<PlusOutlined />} 
                style={{ width: '100%' }}
                disabled={form.values.examples.length >= 4}
            >
                {getTranslation('Adicionar Exemplo')}
            </Button>
        </div>
    );

    return (
        <div>
            <Card bordered={false}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Input
                        placeholder={getTranslation('Buscar intenções...')}
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                <Space>
                    <Button
                        icon={<BugOutlined />}
                        onClick={async () => {
                            setDebugModalVisible(true);
                            // Garantir que as interações estejam carregadas
                            await loadInitialData();
                        }}
                        style={{
                            background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                            border: 'none',
                            color: 'white',
                            boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)',
                        }}
                        className='antd-span-default-color'
                    >
                        {getTranslation('Testar Intenção')}
                    </Button>
                    <Button
                        icon={<ImportOutlined />}
                        onClick={handleOpenImportModal}
                        className='antd-span-default-color'
                    >
                        {getTranslation('Importar da biblioteca')}
                    </Button>
                    <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        onClick={() => setCreateDrawerVisible(true)}
                        className='antd-span-default-color'
                    >
                            {getTranslation('Nova Intenção')}
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredIntentions}
                    rowKey='id'
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '30', '50', '100'],
                        showQuickJumper: true,
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            if (size && size !== pageSize) {
                                setPageSize(size);
                            }
                        },
                        onShowSizeChange: (current, size) => {
                            setCurrentPage(1);
                            setPageSize(size);
                        },
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} ${getTranslation('de')} ${total} ${getTranslation('intenções')}${
                                searchText ? ` (${getTranslation('filtradas de')} ${intentions.length})` : ''
                            }`,
                    }}
                />
            </Card>

            <Modal
                title={getTranslation('Importar intenções da biblioteca')}
                visible={importModalVisible}
                onCancel={handleCloseImportModal}
                footer={null}
                width={720}
            >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <Input
                        placeholder={getTranslation('Buscar na biblioteca...')}
                        prefix={<SearchOutlined />}
                        value={librarySearch}
                        onChange={(event) => setLibrarySearch(event.target.value)}
                        allowClear
                    />
                </div>

                <Table
                    columns={libraryColumns}
                    dataSource={intentLibrary}
                    rowKey='id'
                    loading={intentLibraryLoading}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    locale={{ emptyText: getTranslation('Nenhuma intenção encontrada na biblioteca') }}
                />
            </Modal>

            <Drawer
                title={getTranslation('Nova Intenção')}
                width={600}
                onClose={() => {
                    setCreateDrawerVisible(false);
                    createForm.resetForm();
                }}
                visible={createDrawerVisible}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button
                            onClick={() => {
                                setCreateDrawerVisible(false);
                                createForm.resetForm();
                            }}
                            style={{ marginRight: 8 }}
                        >
                            {getTranslation('Cancelar')}
                        </Button>
                        <Button
                            type='primary'
                            onClick={() => createForm.handleSubmit()}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Criar')}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={createForm.handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Nome')}</span>
                        </LabelWrapper>
                        <InputSimple
                            value={createForm.values.name}
                            onChange={createForm.handleChange}
                            name='name'
                            placeholder={getTranslation('Digite o nome da intenção')}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Descrição')}</span>
                        </LabelWrapper>
                        <StyledTextArea
                            value={createForm.values.description}
                            onChange={createForm.handleChange}
                            name='description'
                            placeholder={getTranslation('Digite a descrição da intenção')}
                        />
                    </div>

                    {renderExampleInputs(createForm)}
                </form>
            </Drawer>

            <Drawer
                title={getTranslation('Editar Intenção')}
                width={600}
                onClose={() => {
                    setEditDrawerVisible(false);
                    setSelectedIntention(null);
                }}
                visible={editDrawerVisible}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button
                            onClick={() => {
                                setEditDrawerVisible(false);
                                setSelectedIntention(null);
                            }}
                            style={{ marginRight: 8 }}
                        >
                            {getTranslation('Cancelar')}
                        </Button>
                        <Button
                            type='primary'
                            onClick={() => editForm.handleSubmit()}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Salvar')}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={editForm.handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Nome')}</span>
                        </LabelWrapper>
                        <InputSimple
                            value={editForm.values.name}
                            onChange={editForm.handleChange}
                            name='name'
                            placeholder={getTranslation('Digite o nome da intenção')}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Descrição')}</span>
                        </LabelWrapper>
                        <StyledTextArea
                            value={editForm.values.description}
                            onChange={editForm.handleChange}
                            name='description'
                            placeholder={getTranslation('Digite a descrição da intenção')}
                        />
                    </div>

                    {renderExampleInputs(editForm)}
                </form>
            </Drawer>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                            }}
                        >
                            <ToolOutlined />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 500 }}>
                            {getTranslation('Debug - Detectar Intenção')}
                        </span>
                    </div>
                }
                visible={debugModalVisible}
                onCancel={() => {
                    setDebugModalVisible(false);
                    setDebugText('');
                    setDebugResult(null);
                    setDebugError(null);
                }}
                footer={[
                    <Button
                        key='cancel'
                        onClick={() => {
                            setDebugModalVisible(false);
                            setDebugText('');
                            setDebugResult(null);
                            setDebugError(null);
                        }}
                        style={{ marginRight: 8 }}
                    >
                        {getTranslation('Fechar')}
                    </Button>,
                    <Button
                        key='detect'
                        type='primary'
                        loading={debugLoading}
                        onClick={handleDebugIntent}
                        disabled={!debugText.trim()}
                        className='antd-span-default-color'
                        style={{
                            background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                            borderColor: '#722ed1',
                            fontWeight: 500,
                            color: 'white',
                        }}
                    >
                        <span style={{ color: 'white' }}>{getTranslation('Detectar')}</span>
                    </Button>,
                ]}
                width={500}
                bodyStyle={{ padding: '24px' }}
                style={{ top: 20 }}
            >
                <div style={{ marginBottom: 16 }}>
                    <LabelWrapper>
                        <span style={{ fontWeight: 500 }}>{getTranslation('Texto para detecção')}</span>
                    </LabelWrapper>
                    <TextArea
                        ref={debugTextAreaRef}
                        value={debugText}
                        onChange={(e) => setDebugText(e.target.value)}
                        onKeyDown={handleDebugKeyPress}
                        placeholder={getTranslation('Digite o texto para detectar a intenção')}
                        rows={3}
                        style={{
                            fontSize: '14px',
                            borderRadius: '6px',
                            border: '1px solid #d9d9d9',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                    />
                </div>

                {debugError && (
                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                        <Card
                            style={{
                                borderRadius: '8px',
                                border: '1px solid #ffccc7',
                                backgroundColor: '#fff2f0',
                                boxShadow: '0 2px 8px rgba(255,77,79,0.1)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    padding: '8px',
                                }}
                            >
                                <div
                                    style={{
                                        background: '#ff4d4f',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px',
                                        flexShrink: 0,
                                        marginTop: '2px',
                                    }}
                                >
                                    <ExclamationCircleOutlined />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            color: '#cf1322',
                                            marginBottom: 4,
                                        }}
                                    >
                                        {getTranslation('Erro na detecção')}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            color: '#a8071a',
                                            lineHeight: '1.4',
                                        }}
                                    >
                                        {debugError}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {debugResult && (
                    <div style={{ marginTop: 16 }}>
                        <Card
                            style={{
                                borderRadius: '8px',
                                border: '1px solid #e8f5e8',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: (debugResult.actions && debugResult.actions.length > 0) ? 16 : 0,
                                    padding: '14px',
                                    background: '#f8f9fa',
                                    borderRadius: '6px',
                                    border: '1px solid #e9ecef',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div
                                        style={{
                                            background: '#52c41a',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '12px',
                                        }}
                                    >
                                        <BulbOutlined />
                                    </div>
                                    <strong style={{ color: '#495057', fontSize: '14px' }}>
                                        {getTranslation('Intenção detectada:')}
                                    </strong>
                                </div>
                                <Tag
                                    style={{
                                        marginLeft: 12,
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        background: '#52c41a',
                                        color: 'white',
                                        border: 'none',
                                    }}
                                >
                                    {debugResult.intent?.name || getTranslation('Nenhuma intenção detectada')}
                                </Tag>
                            </div>

                            {debugResult.actions && debugResult.actions.length > 0 && (
                                <div
                                    style={{
                                        padding: '14px',
                                        background: '#f8f9fa',
                                        borderRadius: '6px',
                                        border: '1px solid #e9ecef',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                background: '#1890ff',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px',
                                            }}
                                        >
                                            <ThunderboltOutlined />
                                        </div>
                                        <strong style={{ color: '#495057', fontSize: '14px' }}>
                                            {getTranslation('Ações:')}
                                        </strong>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {debugResult.actions?.map((action, index) => (
                                            <Tag
                                                key={index}
                                                style={{
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    background: action.actionType === 'TREE' || action.actionType === 'tree' 
                                                        ? '#1890ff' : '#722ed1',
                                                    color: 'white',
                                                    border: 'none',
                                                }}
                                            >
                                                <strong>{getActionTypeLabel(action.actionType)}:</strong> {getDebugActionDisplayName(action, debugResult)}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </Modal>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                            }}
                        >
                            <SettingOutlined />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 500 }}>
                            {currentAction ? getTranslation('Editar Ação') : getTranslation('Configurar Ações')} - {selectedIntentForActions?.name}
                        </span>
                    </div>
                }
                visible={actionsModalVisible}
                onCancel={() => {
                    setActionsModalVisible(false);
                    setSelectedIntentForActions(null);
                    setCurrentAction(null);
                    actionsForm.resetForm();
                }}
                footer={[
                    <Button
                        key='cancel'
                        onClick={() => {
                            setActionsModalVisible(false);
                            setSelectedIntentForActions(null);
                            setCurrentAction(null);
                            actionsForm.resetForm();
                        }}
                        style={{ marginRight: 8 }}
                    >
                        {getTranslation('Cancelar')}
                    </Button>,
                    ...(currentAction ? [
                        <Button
                            key='remove'
                            danger
                            onClick={handleRemoveAction}
                            style={{ marginRight: 8 }}
                        >
                            {getTranslation('Remover Ação')}
                        </Button>
                    ] : []),
                    <Button
                        key='save'
                        type='primary'
                        onClick={() => actionsForm.handleSubmit()}
                        className='antd-span-default-color'
                    >
                        {currentAction ? getTranslation('Atualizar') : getTranslation('Salvar')}
                    </Button>,
                ]}
                width={600}
            >
                <form onSubmit={actionsForm.handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Tipo de Ação')}</span>
                        </LabelWrapper>
                        <Select
                            style={{ width: '100%' }}
                            value={actionsForm.values.actionType}
                            onChange={(value) => {
                                actionsForm.setFieldValue('actionType', value);
                                actionsForm.setFieldValue('targetValue', '');
                            }}
                            placeholder={getTranslation('Selecione o tipo de ação')}
                        >
                            <Select.Option value={ActionType.TREE}>
                                {getTranslation('Redirecionar para árvore')}
                            </Select.Option>
                            <Select.Option value={ActionType.AGENT}>
                                {getTranslation('Redirecionar para outro agente')}
                            </Select.Option>
                            <Select.Option value={ActionType.TREE_IMMEDIATELY}>
                                {getTranslation('Redirecionar imediatamente para árvore')}
                            </Select.Option>
                        </Select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>
                                {(actionsForm.values.actionType === ActionType.TREE || actionsForm.values.actionType === ActionType.TREE_IMMEDIATELY)
                                    ? getTranslation('Selecionar Interação')
                                    : getTranslation('Selecionar Agente RAG')}
                            </span>
                        </LabelWrapper>
                        
                        {(actionsForm.values.actionType === ActionType.TREE || actionsForm.values.actionType === ActionType.TREE_IMMEDIATELY) ? (
                            <InteractionSelect
                                options={interactions}
                                defaultValue={actionsForm.values.targetValue}
                                placeholder={getTranslation('Selecione uma interação')}
                                onChange={(option) => actionsForm.setFieldValue('targetValue', option?.value || '')}
                                name='interaction'
                                interactionTypeToShow={[
                                    'interaction',
                                    'welcome',
                                    'fallback',
                                    'container',
                                    'context-fallback',
                                ]}
                            />
                        ) : (
                            <Select
                                style={{ width: '100%' }}
                                value={actionsForm.values.targetValue}
                                onChange={(value) => actionsForm.setFieldValue('targetValue', value)}
                                placeholder={getTranslation('Selecione um agente RAG')}
                                showSearch
                                optionFilterProp="children"
                            >
                                {ragAgents.map((agent) => (
                                    <Select.Option key={agent.id} value={agent.id}>
                                        {agent.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default IntentionsTab;
