import { FC, useEffect, useState } from 'react';
import { Table, Button, Modal, Typography, DatePicker, Space, Input, Tooltip, Avatar, Divider } from 'antd';
import { CommentOutlined, EyeOutlined, ReloadOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { MessagesTabProps } from './props';
import { ContextMessage, ContextMessageListParams } from '../../../../../../interfaces/fallback-message.interface';
import { AIAgentService } from '../../../../../../service/AIAgentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import moment from 'moment';

const { Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const MessagesTab: FC<MessagesTabProps> = ({
    agentId,
    workspaceId,
    getTranslation,
}) => {
    const [messages, setMessages] = useState<ContextMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ContextMessage | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
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
        loadMessages();
    }, [workspaceId, agentId, pagination.current, pagination.pageSize, dateRange, debouncedSearchText]);

    const loadMessages = async () => {
        if (!workspaceId || !agentId) return;

        setLoading(true);
        try {
            const params: ContextMessageListParams = {
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
                agentId: agentId,
                limit: pagination.pageSize,
                skip: (pagination.current - 1) * pagination.pageSize,
                ...(debouncedSearchText.trim() && { search: debouncedSearchText.trim() }),
            };

            const response = await AIAgentService.listContextMessages(workspaceId, params);
            setMessages(response.data);
            setPagination(prev => ({
                ...prev,
                total: response.metadata.count,
            }));
        } catch (error) {
            console.error('Error loading messages:', error);
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


    const handleViewMessage = (message: ContextMessage) => {
        setSelectedMessage(message);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedMessage(null);
    };

    const columns = [
        {
            title: getTranslation('Pergunta'),
            dataIndex: ['userMessage', 'content'],
            key: 'userMessage',
            render: (text: string) => (
                <div style={{ maxWidth: 300 }}>
                    <Tooltip title={text} placement="topLeft">
                        <Paragraph
                            ellipsis={{ rows: 2, expandable: false }}
                            style={{ marginBottom: 0 }}
                        >
                            {text}
                        </Paragraph>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: getTranslation('Resposta'),
            dataIndex: ['systemMessage', 'content'],
            key: 'systemMessage',
            render: (text: string) => (
                <div style={{ maxWidth: 300 }}>
                    <Tooltip title={text} placement="topLeft">
                        <Paragraph
                            ellipsis={{ rows: 2, expandable: false }}
                            style={{ marginBottom: 0 }}
                        >
                            {text}
                        </Paragraph>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: getTranslation('Data'),
            dataIndex: ['userMessage', 'createdAt'],
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
            width: 100,
            render: (_, record: ContextMessage) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewMessage(record)}
                    title={getTranslation('Ver detalhes')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                    {getTranslation('Ver')}
                </Button>
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
                        <CommentOutlined />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{getTranslation('Mensagens de Contexto')}</h4>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={loadMessages}
                        loading={loading}
                    >
                        {getTranslation('Atualizar')}
                    </Button>
                </div>
            </div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input.Search
                    placeholder={getTranslation('Buscar por pergunta ou resposta...')}
                    allowClear
                    value={searchText}
                    onChange={handleSearchChange}
                    style={{ maxWidth: 350 }}
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
                dataSource={messages}
                rowKey="referenceId"
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
                            <CommentOutlined />
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                {getTranslation('Conversa com o Agente')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                {selectedMessage && format(new Date(selectedMessage.userMessage.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                        </div>
                    </div>
                }
                open={modalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" type="primary" onClick={handleCloseModal} className='antd-span-default-color'>
                        {getTranslation('Fechar')}
                    </Button>,
                ]}
                width={900}
                style={{ top: 20 }}
                bodyStyle={{ 
                    padding: '24px',
                    background: 'linear-gradient(to bottom, #f8f9ff, #ffffff)',
                    minHeight: '400px'
                }}
            >
                {selectedMessage && (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '20px',
                        maxHeight: '500px',
                        overflowY: 'auto',
                        padding: '8px'
                    }}>
                        {/* User Message - Right aligned */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{ 
                                maxWidth: '70%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end'
                            }}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                    color: 'white',
                                    padding: '12px 18px',
                                    borderRadius: '18px 18px 4px 18px',
                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                                    position: 'relative'
                                }}>
                                    <Text style={{ 
                                        color: 'white', 
                                        fontSize: '14px', 
                                        lineHeight: '1.5',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedMessage.userMessage.content}
                                    </Text>
                                </div>
                                <Text style={{ 
                                    fontSize: '11px', 
                                    color: '#999', 
                                    marginTop: '4px',
                                    textAlign: 'right'
                                }}>
                                    {format(new Date(selectedMessage.userMessage.createdAt), 'HH:mm', { locale: ptBR })}
                                </Text>
                            </div>
                            <Avatar 
                                size={36} 
                                style={{ 
                                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                    flexShrink: 0
                                }}
                                icon={<UserOutlined />}
                            />
                        </div>

                        {/* AI Agent Response - Left aligned */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-start', 
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <Avatar 
                                size={36} 
                                style={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    flexShrink: 0
                                }}
                                icon={<RobotOutlined />}
                            />
                            <div style={{ 
                                maxWidth: '70%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }}>
                                <div style={{ 
                                    background: '#ffffff',
                                    color: '#333',
                                    padding: '12px 18px',
                                    borderRadius: '18px 18px 18px 4px',
                                    border: '1px solid #e8e8e8',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                    position: 'relative'
                                }}>
                                    <Text style={{ 
                                        color: '#333', 
                                        fontSize: '14px', 
                                        lineHeight: '1.5',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedMessage.systemMessage.content}
                                    </Text>
                                </div>
                                <Text style={{ 
                                    fontSize: '11px', 
                                    color: '#999', 
                                    marginTop: '4px',
                                    textAlign: 'left'
                                }}>
                                    {format(new Date(selectedMessage.systemMessage.createdAt), 'HH:mm', { locale: ptBR })}
                                </Text>
                            </div>
                        </div>

                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MessagesTab;