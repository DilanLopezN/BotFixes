import { FC, useEffect, useState } from 'react';
import { Table, Button, Modal, Select, Alert, Slider } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SettingOutlined,
    CodeOutlined,
    ApiOutlined,
    ThunderboltOutlined,
    BranchesOutlined,
    DatabaseOutlined,
} from '@ant-design/icons';
import { useFormik } from 'formik-latest';
import {
    AIAgentService,
    ContextVariable,
    ContextVariableType,
    CreateContextVariable,
    InteractionVariableName,
} from '../../../../../../service/AIAgentService';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../../../../../shared/InputSample/InputSimple';
import { TextAreaSimple } from '../../../../../../../../shared/TextAreaSimple/TextAreaSimple';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import { BotService } from '../../../../../../../bot/services/BotService';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { Interaction } from '../../../../../../../../model/Interaction';

const { Option } = Select;

interface VariablesTabProps {
    agentId: string;
    workspaceId: string;
    botId: string;
    getTranslation: (text?: string) => string;
}

const VariablesTab: FC<VariablesTabProps> = ({ agentId, workspaceId, botId, getTranslation }) => {
    const [variables, setVariables] = useState<ContextVariable[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingVariable, setEditingVariable] = useState<ContextVariable | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);

    useEffect(() => {
        loadVariables();
        loadInteractions();
    }, [workspaceId, agentId, botId]);

    const loadVariables = async () => {
        if (!workspaceId) return;

        setLoading(true);
        try {
            const response = await AIAgentService.listContextVariables(workspaceId, agentId, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao carregar variáveis'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            setVariables(response || []);
        } catch (error) {
            console.error('Error loading variables:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadInteractions = async () => {
        if (!workspaceId || !botId) return;

        try {
            const response = await BotService.getInteractions(workspaceId, botId);
            setInteractions(response?.data || []);
        } catch (error) {
            console.error('Error loading interactions:', error);
        }
    };

    const isInteractionSelectType = (type: ContextVariableType) => {
        const interactionTypes = [
            ContextVariableType.action_redirect,
        ];
        return interactionTypes.includes(type);
    };

    const formik = useFormik({
        initialValues: {
            type: ContextVariableType.custom,
            name: '',
            value: '',
        },
        validate: (values) => {
            const errors: any = {};

            if (!values.name.trim()) {
                errors.name = getTranslation('Nome é obrigatório');
            }

            if (!values.value.trim()) {
                errors.value = getTranslation('Valor é obrigatório');
            }

            return errors;
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!workspaceId) return;

            try {
                if (editingVariable) {
                    await AIAgentService.updateContextVariable(
                        workspaceId,
                        editingVariable.id,
                        {
                            contextVariableId: editingVariable.id,
                            value: values.value,
                            agentId: agentId!,
                        },
                        (err) => {
                            addNotification({
                                title: getTranslation('Erro'),
                                message: getTranslation('Erro ao atualizar variável'),
                                type: 'danger',
                                duration: 3000,
                            });
                        }
                    );
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Variável atualizada com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                } else {
                    const createData: CreateContextVariable = {
                        ...values,
                        agentId: agentId!,
                    };
                    await AIAgentService.createContextVariable(workspaceId, createData, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao criar variável'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });

                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Variável criada com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                }

                // Sempre fechar modal e atualizar lista após operação
                console.log('Fechando modal e atualizando lista...');
                setIsModalVisible(false);
                setEditingVariable(null);
                formik.resetForm();
                loadVariables();
                console.log('Modal fechado e lista atualizada');
            } catch (error) {
                console.error('Error saving variable:', error);
            }
        },
    });

    const handleCreateVariable = () => {
        setEditingVariable(null);
        formik.resetForm();
        setIsModalVisible(true);
    };

    const handleEditVariable = (variable: ContextVariable) => {
        setEditingVariable(variable);
        formik.setValues({
            type: variable.type,
            name: variable.name,
            value: variable.value,
        });
        setIsModalVisible(true);
    };

    const handleDeleteVariable = async (variableId: string) => {
        if (!workspaceId) return;

        Modal.confirm({
            title: getTranslation('Confirmar exclusão'),
            content: getTranslation('Tem certeza que deseja excluir esta variável?'),
            onOk: async () => {
                try {
                    await AIAgentService.deleteContextVariable(workspaceId, variableId, agentId!, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao excluir variável'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Variável excluída com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                    loadVariables();
                } catch (error) {
                    console.error('Error deleting variable:', error);
                }
            },
        });
    };

    const columns = [
        {
            title: getTranslation('Nome'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: ContextVariable) => {
                const getNameLabel = (name: string, type: string) => {
                    if (type === 'context_config') {
                        switch (name) {
                            case 'clientName':
                                return getTranslation('Nome do Cliente');
                            case 'botName':
                                return getTranslation('Nome do Bot');
                            case 'maxCharacters':
                                return getTranslation('Máximo de Caracteres');
                            case 'temperature':
                                return getTranslation('Criatividade');
                            case 'historicMessagesLength':
                                return getTranslation('Tamanho do Histórico');
                            default:
                                return name;
                        }
                    }
                    if (type === 'action_redirect') {
                        switch (name) {
                            case 'action_after_response':
                                return getTranslation('Ação Após Resposta');
                            case 'action_after_fallback':
                                return getTranslation('Ação Após Fallback');
                            default:
                                return name;
                        }
                    }
                    return name;
                };
                
                return (
                    <span style={{ fontWeight: '500' }}>
                        {getNameLabel(name, record.type)}
                    </span>
                );
            },
        },
        {
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <SettingOutlined style={{ color: '#1890ff' }} />
                    <span>{getTranslation('Tipo')}</span>
                </div>
            ),
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
                const getTypeIcon = (type: string) => {
                    switch (type) {
                        case 'custom':
                            return <CodeOutlined style={{ color: '#52c41a' }} />;
                        case 'context_config':
                            return <SettingOutlined style={{ color: '#1890ff' }} />;
                        case 'action_fallback':
                            return <ThunderboltOutlined style={{ color: '#fa8c16' }} />;
                        case 'action_button':
                            return <ApiOutlined style={{ color: '#722ed1' }} />;
                        case 'action_redirect':
                            return <BranchesOutlined style={{ color: '#eb2f96' }} />;
                        default:
                            return <DatabaseOutlined style={{ color: '#666' }} />;
                    }
                };

                const getTypeLabel = (type: string) => {
                    switch (type) {
                        case 'custom':
                            return getTranslation('Personalizado');
                        case 'context_config':
                            return getTranslation('Configuração de Contexto');
                        case 'action_fallback':
                            return getTranslation('Ação de Fallback');
                        case 'action_button':
                            return getTranslation('Ação de Botão');
                        case 'action_redirect':
                            return getTranslation('Ação de Redirecionamento');
                        default:
                            return type;
                    }
                };
                
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getTypeIcon(type)}
                        <span>{getTypeLabel(type)}</span>
                    </div>
                );
            },
        },
        {
            title: getTranslation('Valor'),
            dataIndex: 'value',
            key: 'value',
            render: (value: string, record: ContextVariable) => {
                const getDisplayValue = (value: string, record: ContextVariable) => {
                    // For temperature variable, show label instead of numeric value
                    if (record.name === 'temperature') {
                        const temperatureLabels: { [key: string]: string } = {
                            '0.3': 'Preciso',
                            '0.5': 'Equilibrado',
                            '0.8': 'Criativo',
                            '1.1': 'Muito Criativo'
                        };
                        return temperatureLabels[value] || value;
                    }
                    
                    // For action_redirect and action_fallback type variables, show interaction name instead of ID
                    if ((record.type === 'action_redirect' || record.type === 'action_fallback') && interactions.length > 0) {
                        const interaction = interactions.find(int => int._id === value);
                        return interaction ? interaction.name : value;
                    }
                    return value;
                };

                return (
                    <div
                        style={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            padding: '4px 8px',
                            background: '#f6f8ff',
                            border: '1px solid #e6f0ff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                        }}
                        title={getDisplayValue(value, record)}
                    >
                        {getDisplayValue(value, record)}
                    </div>
                );
            },
        },
        {
            title: getTranslation('Ações'),
            key: 'actions',
            width: 120,
            render: (_, record: ContextVariable) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEditVariable(record)}
                        title={getTranslation('Editar')}
                    />
                    <Button
                        size='small'
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteVariable(record.id)}
                        title={getTranslation('Excluir')}
                    />
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                        <DatabaseOutlined />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
                        {getTranslation('Variáveis de Contexto')}
                    </h4>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button icon={<ReloadOutlined />} onClick={loadVariables} loading={loading}>
                        {getTranslation('Atualizar')}
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleCreateVariable} className='antd-span-default-color'>
                        {getTranslation('Criar Variável')}
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={variables}
                loading={loading}
                rowKey={(record) => record.id || ''}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                }}
            />

            <Modal
                title={editingVariable ? getTranslation('Editar Variável') : getTranslation('Criar Variável')}
                open={isModalVisible}
                onOk={formik.submitForm}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingVariable(null);
                    formik.resetForm();
                }}
                confirmLoading={formik.isSubmitting}
                width={600}
                okButtonProps={{
                    className: 'antd-span-default-color',
                }}
            >
                <form>
                    <LabelWrapper
                        label={getTranslation('Tipo')}
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'type',
                        }}
                    >
                        <Select
                            value={formik.values.type}
                            onChange={(value) => {
                                formik.setFieldValue('type', value);
                                // Reset name when changing type
                                if (value === ContextVariableType.context_config || isInteractionSelectType(value)) {
                                    formik.setFieldValue('name', '');
                                }
                            }}
                            style={{ width: '100%' }}
                            disabled={!!editingVariable}
                        >
                            <Option value={ContextVariableType.custom}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CodeOutlined style={{ color: '#52c41a' }} />
                                    {getTranslation('Personalizado')}
                                </div>
                            </Option>
                            <Option value={ContextVariableType.context_config}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <SettingOutlined style={{ color: '#1890ff' }} />
                                    {getTranslation('Configuração de Contexto')}
                                </div>
                            </Option>
                            <Option value={ContextVariableType.action_redirect}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BranchesOutlined style={{ color: '#eb2f96' }} />
                                    {getTranslation('Ação de Redirecionamento')}
                                </div>
                            </Option>
                        </Select>
                    </LabelWrapper>

                    <LabelWrapper
                        label={getTranslation('Nome')}
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'name',
                        }}
                    >
                        {formik.values.type === ContextVariableType.context_config ? (
                            <Select
                                value={formik.values.name}
                                onChange={(value) => formik.setFieldValue('name', value)}
                                style={{ width: '100%' }}
                                placeholder={getTranslation('Selecione uma configuração')}
                                disabled={!!editingVariable}
                            >
                                <Option value='clientName'>{getTranslation('Nome do Cliente')}</Option>
                                <Option value='botName'>{getTranslation('Nome do Bot')}</Option>
                                <Option value='maxCharacters'>{getTranslation('Máximo de Caracteres')}</Option>
                                <Option value='temperature'>{getTranslation('Criatividade')}</Option>
                                <Option value='historicMessagesLength'>{getTranslation('Tamanho do Histórico')}</Option>
                            </Select>
                        ) : formik.values.type === ContextVariableType.action_redirect ? (
                            <Select
                                value={formik.values.name}
                                onChange={(value) => formik.setFieldValue('name', value)}
                                style={{ width: '100%' }}
                                placeholder={getTranslation('Selecione uma configuração de redirecionamento')}
                                disabled={!!editingVariable}
                            >
                                <Option value={InteractionVariableName.actionAfterResponse}>
                                    {getTranslation('Ação Após Resposta')}
                                </Option>
                                <Option value={InteractionVariableName.actionAfterFallback}>
                                    {getTranslation('Ação Após Fallback')}
                                </Option>
                            </Select>
                        ) : (
                            <InputSimple
                                value={formik.values.name}
                                placeholder={getTranslation('Nome da variável')}
                                onChange={(e) => formik.setFieldValue('name', e.target.value)}
                                disabled={!!editingVariable}
                            />
                        )}
                    </LabelWrapper>

                    {/* Helper Alert */}
                    <div style={{ margin: '16px 0' }}>
                        {formik.values.type === ContextVariableType.custom && (
                            <Alert
                                message={getTranslation('Variáveis livres para dados específicos do agente')}
                                type='info'
                                showIcon
                                style={{ fontSize: '12px' }}
                            />
                        )}

                        {formik.values.type === ContextVariableType.context_config && (
                            <Alert
                                message={getTranslation('Controla comportamento da IA (criatividade, histórico, etc.)')}
                                type='info'
                                showIcon
                                style={{ fontSize: '12px' }}
                            />
                        )}


                        {formik.values.type === ContextVariableType.action_redirect && (
                            <Alert
                                message={getTranslation(
                                    'Redirecionamentos imediato para algum lugar da árvore após resposta da IA'
                                )}
                                type='info'
                                showIcon
                                style={{ fontSize: '12px' }}
                            />
                        )}
                    </div>

                    <LabelWrapper
                        label={getTranslation('Valor')}
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'value',
                        }}
                    >
                        {isInteractionSelectType(formik.values.type) ? (
                            <InteractionSelect
                                options={interactions}
                                defaultValue={formik.values.value}
                                placeholder={getTranslation('Selecionar interação')}
                                onChange={(option) => formik.setFieldValue('value', option?.value || '')}
                                name='interaction'
                                interactionTypeToShow={[
                                    'interaction',
                                    'welcome',
                                    'fallback',
                                    'container',
                                    'context-fallback',
                                ]}
                            />
                        ) : formik.values.name === 'temperature' ? (
                            <div style={{ padding: '10px 0' }}>
                                <Slider
                                    min={0}
                                    max={3}
                                    step={1}
                                    value={formik.values.value ? [0.3, 0.5, 0.8, 1.1].indexOf(parseFloat(formik.values.value)) : 0}
                                    onChange={(value) => {
                                        const temperatureValues = [0.3, 0.5, 0.8, 1.1];
                                        formik.setFieldValue('value', temperatureValues[value].toString());
                                    }}
                                    marks={{
                                        0: { style: { fontSize: '11px', whiteSpace: 'nowrap' }, label: 'Preciso' },
                                        1: { style: { fontSize: '11px', whiteSpace: 'nowrap' }, label: 'Equilibrado' },
                                        2: { style: { fontSize: '11px', whiteSpace: 'nowrap' }, label: 'Criativo' },
                                        3: { style: { fontSize: '11px', whiteSpace: 'nowrap' }, label: 'Muito Criativo' }
                                    }}
                                    tooltip={{
                                        formatter: (value) => {
                                            const labels = ['Preciso', 'Equilibrado', 'Criativo', 'Muito Criativo'];
                                            const values = [0.3, 0.5, 0.8, 1.1];
                                            return `${labels[value!]} (${values[value!]})`;
                                        }
                                    }}
                                    style={{ margin: '30px 10px 20px 10px' }}
                                />
                            </div>
                        ) : (
                            <TextAreaSimple
                                value={formik.values.value}
                                placeholder={getTranslation('Valor da variável')}
                                onChange={(e) => formik.setFieldValue('value', e.target.value)}
                                style={{ height: '120px', resize: 'none' }}
                            />
                        )}
                    </LabelWrapper>
                </form>
            </Modal>
        </div>
    );
};

export default VariablesTab;
