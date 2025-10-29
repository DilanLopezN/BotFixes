import { FC, useEffect, useState } from 'react';
import { Table, Button, Modal, Typography, Row, Col, DatePicker, Space, Input, Avatar, Divider, Tooltip, Form, Alert } from 'antd';
import { ExclamationCircleOutlined, EyeOutlined, ReloadOutlined, UserOutlined, PlusOutlined, ExperimentOutlined, SaveOutlined } from '@ant-design/icons';
import { FallbackTabProps } from './props';
import { FallbackMessage, FallbackMessageListParams } from '../../../../../../interfaces/fallback-message.interface';
import { AIAgentService, CreateTrainingEntry } from '../../../../../../service/AIAgentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import moment from 'moment';
import { addNotification } from '../../../../../../../../utils/AddNotification';

const { Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const FallbacksTab: FC<FallbackTabProps> = ({
    agentId,
    workspaceId,
    getTranslation,
}) => {
    const [fallbacks, setFallbacks] = useState<FallbackMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFallback, setSelectedFallback] = useState<FallbackMessage | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [trainingModalVisible, setTrainingModalVisible] = useState(false);
    const [trainingLoading, setTrainingLoading] = useState(false);
    const [trainingForm] = Form.useForm();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment]>([
        moment().subtract(30, 'days'),
        moment(),
    ]);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    // Debounce search text
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        loadFallbacks();
    }, [workspaceId, agentId, pagination.current, pagination.pageSize, dateRange, debouncedSearchText]);

    const loadFallbacks = async () => {
        if (!workspaceId || !agentId) return;

        setLoading(true);
        try {
            const params: FallbackMessageListParams = {
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
                limit: pagination.pageSize,
                skip: (pagination.current - 1) * pagination.pageSize,
                agentId: agentId,
                ...(debouncedSearchText.trim() && { search: debouncedSearchText.trim() }),
            };

            const response = await AIAgentService.listFallbackMessages(workspaceId, params);
            setFallbacks(response.data);
            setPagination(prev => ({
                ...prev,
                total: response.metadata.count,
            }));
        } catch (error) {
            console.error('Error loading fallbacks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
        if (dates && dates.length === 2) {
            setDateRange([dates[0], dates[1]]);
            setPagination(prev => ({ ...prev, current: 1 }));
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchText(value);
        // Reset pagination when search changes
        setPagination(prev => ({ ...prev, current: 1 }));
    };


    const handleViewFallback = (fallback: FallbackMessage) => {
        setSelectedFallback(fallback);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedFallback(null);
    };

    const handleCreateTraining = (fallback: FallbackMessage) => {
        setSelectedFallback(fallback);
        trainingForm.setFieldsValue({
            identifier: fallback.question,
            content: ''
        });
        setTrainingModalVisible(true);
        setModalVisible(false);
    };

    const handleTrainingSubmit = async (values: any) => {
        if (!selectedFallback || !workspaceId || !agentId) return;

        setTrainingLoading(true);
        try {
            const trainingData: CreateTrainingEntry = {
                identifier: values.identifier,
                content: values.content,
                agentId: agentId
            };

            await AIAgentService.createTrainingEntry(workspaceId, trainingData, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao criar treinamento'),
                    type: 'danger',
                    duration: 3000,
                });
            });

            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Treinamento criado com sucesso'),
                type: 'success',
                duration: 3000,
            });

            setTrainingModalVisible(false);
            setSelectedFallback(null);
            trainingForm.resetFields();
        } catch (error) {
            console.error('Error creating training:', error);
        } finally {
            setTrainingLoading(false);
        }
    };

    const columns = [
        {
            title: getTranslation('Pergunta'),
            dataIndex: 'question',
            key: 'question',
            render: (text: string) => (
                <div style={{ maxWidth: 300 }}>
                    <Paragraph
                        ellipsis={{ rows: 2, expandable: false }}
                        style={{ marginBottom: 0 }}
                    >
                        {text}
                    </Paragraph>
                </div>
            ),
        },
        {
            title: getTranslation('Data'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (date: string) => (
                <Text>
                    {format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </Text>
            ),
        },
        {
            title: getTranslation('Ações'),
            key: 'actions',
            width: 140,
            render: (_, record: FallbackMessage) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewFallback(record)}
                        title={getTranslation('Ver detalhes')}
                        size="small"
                    >
                        {getTranslation('Ver')}
                    </Button>
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => handleCreateTraining(record)}
                        title={getTranslation('Criar treinamento')}
                        size="small"
                        style={{ color: '#52c41a', fontWeight: '500' }}
                    >
                        <span style={{ color: '#52c41a' }}>{getTranslation('Treinar')}</span>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                        <ExclamationCircleOutlined />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{getTranslation('Mensagens de Fallback')}</h4>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={loadFallbacks}
                        loading={loading}
                    >
                        {getTranslation('Atualizar')}
                    </Button>
                </div>
            </div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input.Search
                    placeholder={getTranslation('Buscar por pergunta...')}
                    allowClear
                    value={searchText}
                    onChange={handleSearchChange}
                    style={{ maxWidth: 300 }}
                    enterButton={false}
                />
                <Space>
                    <Text strong>{getTranslation('Período:')}</Text>
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        format="DD/MM/YYYY"
                        allowClear={false}
                    />
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={fallbacks}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '30', '50', '100'],
                    showQuickJumper: true,
                    onChange: (page, size) => {
                        setPagination(prev => ({
                            ...prev,
                            current: page,
                            pageSize: size || prev.pageSize,
                        }));
                    },
                    onShowSizeChange: (current, size) => {
                        setPagination(prev => ({
                            ...prev,
                            current: 1,
                            pageSize: size,
                        }));
                    },
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} de ${total} ${getTranslation('itens')}${
                            debouncedSearchText ? ` (${getTranslation('filtrados')})` : ''
                        }`,
                }}
            />

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px'
                        }}>
                            <ExclamationCircleOutlined />
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                {getTranslation('Pergunta não Compreendida')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                {selectedFallback && format(new Date(selectedFallback.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                        </div>
                    </div>
                }
                open={modalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button 
                        key="training" 
                        type="primary" 
                        icon={<PlusOutlined style={{ color: 'white' }} />}
                        onClick={() => selectedFallback && handleCreateTraining(selectedFallback)}
                        style={{ 
                            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <span style={{ color: 'white' }}>{getTranslation('Criar Treinamento')}</span>
                    </Button>,
                    <Button key="close" onClick={handleCloseModal}>
                        {getTranslation('Fechar')}
                    </Button>,
                ]}
                width={900}
                style={{ top: 20 }}
            >
                {selectedFallback && (
                    <div style={{ padding: '10px 0' }}>
                        <div style={{ marginBottom: 20 }}>
                            <Text strong style={{ fontSize: '14px', color: '#333', marginBottom: '8px', display: 'block' }}>
                                {getTranslation('Pergunta não Compreendida')}:
                            </Text>
                            <div style={{ 
                                padding: '12px 16px', 
                                background: '#fff2f0', 
                                borderRadius: '6px',
                                border: '1px solid #ffccc7',
                                marginBottom: '12px'
                            }}>
                                <Text style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                    {selectedFallback.question}
                                </Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {format(new Date(selectedFallback.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </Text>
                        </div>
                        
                        {selectedFallback.context && (
                            <div style={{ marginBottom: 20 }}>
                                <Text strong style={{ fontSize: '14px', color: '#333', marginBottom: '8px', display: 'block' }}>
                                    {getTranslation('Contexto')}:
                                </Text>
                                <div style={{ 
                                    padding: '12px 16px', 
                                    background: '#f5f5f5', 
                                    borderRadius: '6px',
                                    border: '1px solid #e8e8e8'
                                }}>
                                    <Text style={{ fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                        {selectedFallback.context}
                                    </Text>
                                </div>
                            </div>
                        )}

                        <div style={{
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            borderRadius: '6px',
                            padding: '12px',
                            textAlign: 'center'
                        }}>
                            <ExperimentOutlined style={{ fontSize: '18px', color: '#1890ff', marginBottom: '6px' }} />
                            <div style={{ fontSize: '13px', color: '#1890ff', fontWeight: '500' }}>
                                {getTranslation('Use esta pergunta para criar um treinamento e ensinar o agente a responder adequadamente')}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Training Creation Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px'
                        }}>
                            <ExperimentOutlined />
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                {getTranslation('Criar Treinamento')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                {getTranslation('Ensine ao agente como responder esta pergunta')}
                            </div>
                        </div>
                    </div>
                }
                open={trainingModalVisible}
                onCancel={() => {
                    setTrainingModalVisible(false);
                    setSelectedFallback(null);
                    trainingForm.resetFields();
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setTrainingModalVisible(false);
                        setSelectedFallback(null);
                        trainingForm.resetFields();
                    }}>
                        {getTranslation('Cancelar')}
                    </Button>,
                    <Button 
                        key="save" 
                        type="primary" 
                        icon={<SaveOutlined style={{ color: 'white' }} />}
                        loading={trainingLoading}
                        onClick={() => trainingForm.submit()}
                        style={{ 
                            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <span style={{ color: 'white' }}>{getTranslation('Criar Treinamento')}</span>
                    </Button>,
                ]}
                width={800}
                style={{ top: 50 }}
                destroyOnClose
            >
                <Form
                    form={trainingForm}
                    layout="vertical"
                    onFinish={handleTrainingSubmit}
                    style={{ marginTop: '20px' }}
                >
                    <Form.Item
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserOutlined style={{ color: '#1890ff' }} />
                                <span style={{ fontWeight: '500' }}>{getTranslation('Pergunta do Usuário')}</span>
                            </div>
                        }
                        name="identifier"
                        rules={[{ required: true, message: getTranslation('Pergunta é obrigatória') }]}
                    >
                        <Input.TextArea
                            rows={3}
                            style={{ 
                                resize: 'none',
                                border: '1px solid #d9d9d9'
                            }}
                            placeholder={getTranslation('Digite a pergunta que o usuário fez...')}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ExperimentOutlined style={{ color: '#52c41a' }} />
                                <span style={{ fontWeight: '500' }}>{getTranslation('Resposta Esperada')}</span>
                                <span style={{ color: '#999', fontSize: '12px', fontWeight: 'normal' }}>
                                    ({getTranslation('Como o agente deve responder')})
                                </span>
                            </div>
                        }
                        name="content"
                        rules={[{ required: true, message: getTranslation('Resposta é obrigatória') }]}
                    >
                        <Input.TextArea
                            rows={6}
                            placeholder={getTranslation('Digite como o agente deve responder a esta pergunta...')}
                            style={{ 
                                resize: 'vertical',
                                border: '1px solid #d9d9d9'
                            }}
                            showCount
                            maxLength={1000}
                        />
                    </Form.Item>

                    <Alert
                        message={getTranslation('💡 Dica para melhores resultados')}
                        description={
                            <div style={{ fontSize: '13px' }}>
                                <p style={{ marginBottom: '8px' }}>
                                    {getTranslation('A pergunta e o conteúdo são utilizados para aumentar a performance do agente. No conteúdo, mencione parte da pergunta:')}
                                </p>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '16px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ 
                                        flex: '1',
                                        minWidth: '220px',
                                        padding: '8px',
                                        backgroundColor: '#f6ffed',
                                        border: '1px solid #b7eb8f',
                                        borderRadius: '4px'
                                    }}>
                                        <div style={{ fontWeight: '500', color: '#52c41a', marginBottom: '4px' }}>
                                            ✅ {getTranslation('Correto')}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#595959' }}>
                                            {getTranslation('O doutor Pedro Alvares Cabral atende oftalmologia e realiza cirurgia refrativa.')}
                                        </div>
                                    </div>
                                    <div style={{ 
                                        flex: '1',
                                        minWidth: '220px',
                                        padding: '8px',
                                        backgroundColor: '#fff1f0',
                                        border: '1px solid #ffccc7',
                                        borderRadius: '4px'
                                    }}>
                                        <div style={{ fontWeight: '500', color: '#f5222d', marginBottom: '4px' }}>
                                            ❌ {getTranslation('Incorreto')}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#595959' }}>
                                            {getTranslation('Ele atende oftalmologia e realiza cirurgia refrativa.')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                        type="info"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                </Form>
            </Modal>
        </div>
    );
};

export default FallbacksTab;