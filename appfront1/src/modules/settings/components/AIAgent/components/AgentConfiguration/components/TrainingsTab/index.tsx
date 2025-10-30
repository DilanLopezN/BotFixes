import { FC, useEffect, useState, useRef, useMemo } from 'react';
import { Table, Button, Modal, Card, Drawer, Input, Tag, Checkbox, Switch, Upload, Progress, Alert, Select, DatePicker } from 'antd';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    BulbOutlined,
    BookOutlined,
    RocketOutlined,
    UploadOutlined,
    InboxOutlined,
    BugOutlined,
    CalendarOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import { useFormik } from 'formik-latest';
import {
    AIAgentService,
    TrainingEntry,
    CreateTrainingEntry,
    UpdateTrainingEntry,
    TrainingEntryType,
    CreateTrainingEntryType,
    UpdateTrainingEntryType,
} from '../../../../../../service/AIAgentService';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../../../../../shared/InputSample/InputSimple';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import { isSystemAdmin } from '../../../../../../../../utils/UserPermission';
import moment from 'moment';
import TestTrainingModal from '../TestTrainingModal';

const StyledTextArea = styled.textarea`
    background: var(--color8);
    border: 1px solid #d9d9d9;
    color: var(--color7);
    padding: 9px 24px 9px 19px !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    height: 200px;
    min-height: 42px;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    resize: vertical;

    ::placeholder {
        color: #999 !important;
        opacity: 0.7 !important;
    }

    :hover {
        border: 1px solid rgba(3, 102, 214, 0.6);
    }

    :focus {
        border: 1px solid rgba(3, 102, 214, 0.6);
    }
`;

interface TrainingsTabProps {
    agentId: string;
    workspaceId: string;
    getTranslation: (text?: string) => string;
    agent?: any;
}


const TrainingsTab: FC<TrainingsTabProps> = ({ agentId, workspaceId, getTranslation, agent }) => {
    const currentUser = useSelector((state: any) => state.loginReducer.loggedUser);
    const userIsSystemAdmin = isSystemAdmin(currentUser);

    const [trainings, setTrainings] = useState<TrainingEntry[]>([]);
    const [filteredTrainings, setFilteredTrainings] = useState<TrainingEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [trainingEntryTypes, setTrainingEntryTypes] = useState<TrainingEntryType[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [showTypesModal, setShowTypesModal] = useState(false);
    const [editingType, setEditingType] = useState<TrainingEntryType | null>(null);
    const [typeFormVisible, setTypeFormVisible] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<TrainingEntry | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editingTraining, setEditingTraining] = useState<TrainingEntry | null>(null);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [isTraining, setIsTraining] = useState(false);
    const [forceAll, setForceAll] = useState(false);
    const [showOnlyPending, setShowOnlyPending] = useState(false);
    const [showTrainingModal, setShowTrainingModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadConfirmation, setShowUploadConfirmation] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Test Training Modal state
    const [showDebugModal, setShowDebugModal] = useState(false);

    useEffect(() => {
        loadTrainings();
        loadTrainingEntryTypes();
    }, [workspaceId, agentId]);

    // Debounce para o texto de busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 100);

        return () => clearTimeout(timer);
    }, [searchText]);

    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    };

    useEffect(() => {
        let filtered = trainings;

        // Filtro por texto de busca
        if (debouncedSearchText.trim()) {
            const normalizedSearch = normalizeText(debouncedSearchText);
            filtered = filtered.filter(
                (training) =>
                    normalizeText(training.identifier).includes(normalizedSearch) ||
                    normalizeText(training.content).includes(normalizedSearch)
            );
        }

        // Filtro por status pendente
        if (showOnlyPending) {
            filtered = filtered.filter((training) => training.pendingTraining === true);
        }

        setFilteredTrainings(filtered);
        // Reset para primeira página quando filtros mudam
        setCurrentPage(1);
    }, [debouncedSearchText, trainings, showOnlyPending]);

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const pendingCount = trainings.filter((training) => training.pendingTraining === true).length;

    const loadTrainings = async () => {
        if (!workspaceId) return;

        setLoading(true);
        try {
            const response = await AIAgentService.listTrainingEntries(workspaceId, agentId, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao carregar treinamentos'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            const data = response || [];
            setTrainings(data);
            setFilteredTrainings(data);
            if (data.length > 0 && !selectedTraining) {
                setSelectedTraining(data[0]);
            }
        } catch (error) {
            console.error('Error loading trainings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTrainingEntryTypes = async () => {
        if (!workspaceId) return;

        setLoadingTypes(true);
        try {
            const response = await AIAgentService.listTrainingEntryTypes(workspaceId, (err) => {
                addNotification({
                    title: getTranslation('Erro'),
                    message: getTranslation('Erro ao carregar tipos de treinamento'),
                    type: 'danger',
                    duration: 3000,
                });
            });
            const data = response || [];
            setTrainingEntryTypes(data);
        } catch (error) {
            console.error('Error loading training entry types:', error);
        } finally {
            setLoadingTypes(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            identifier: '',
            content: '',
            trainingEntryTypeId: '',
            expiresAt: null as string | null,
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!workspaceId) return;

            try {
                if (editingTraining) {
                    // Verificar se houve alterações
                    const hasChanges = 
                        values.identifier !== editingTraining.identifier ||
                        values.content !== editingTraining.content ||
                        values.trainingEntryTypeId !== (editingTraining.trainingEntryTypeId || '') ||
                        values.expiresAt !== (editingTraining.expiresAt || null);
                    
                    if (!hasChanges) {
                        addNotification({
                            title: getTranslation('Atenção'),
                            message: getTranslation('Nenhuma alteração foi feita para salvar'),
                            type: 'warning',
                            duration: 3000,
                        });
                        return;
                    }

                    const updateData: UpdateTrainingEntry = {
                        ...values,
                        agentId: agentId!,
                    };
                    const response = await AIAgentService.updateTrainingEntry(
                        workspaceId,
                        editingTraining.id,
                        updateData,
                        (err) => {
                            addNotification({
                                title: getTranslation('Erro'),
                                message: getTranslation('Erro ao atualizar treinamento'),
                                type: 'danger',
                                duration: 3000,
                            });
                        }
                    );

                    if (response?.id) {
                        addNotification({
                            title: getTranslation('Sucesso'),
                            message: getTranslation('Treinamento atualizado com sucesso'),
                            type: 'success',
                            duration: 3000,
                        });
                        setIsDrawerVisible(false);
                        setEditingTraining(null);
                        formik.resetForm();
                        loadTrainings();
                    }
                } else {
                    const createData: CreateTrainingEntry = {
                        ...values,
                        agentId: agentId!,
                    };
                    const response = await AIAgentService.createTrainingEntry(workspaceId, createData, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao criar treinamento'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });

                    if (response?.id) {
                        addNotification({
                            title: getTranslation('Sucesso'),
                            message: getTranslation('Treinamento criado com sucesso'),
                            type: 'success',
                            duration: 3000,
                        });
                        setIsDrawerVisible(false);
                        setEditingTraining(null);
                        formik.resetForm();
                        loadTrainings();
                    }
                }
            } catch (error) {
                console.error('Error saving training:', error);
            }
        },
    });

    // Verificar se há alterações no formulário quando editando
    const hasFormChanges = useMemo(() => {
        if (!editingTraining) return true; // Para criação, sempre permitir salvar
        return (
            formik.values.identifier !== editingTraining.identifier ||
            formik.values.content !== editingTraining.content ||
            formik.values.trainingEntryTypeId !== (editingTraining.trainingEntryTypeId || '') ||
            formik.values.expiresAt !== (editingTraining.expiresAt || null)
        );
    }, [editingTraining, formik.values.identifier, formik.values.content, formik.values.trainingEntryTypeId]);

    // Form for training entry types
    const typeFormik = useFormik({
        initialValues: {
            name: '',
        },
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!workspaceId) return;

            try {
                if (editingType) {
                    const updateData: UpdateTrainingEntryType = {
                        id: editingType.id,
                        name: values.name,
                    };
                    await AIAgentService.updateTrainingEntryType(workspaceId, updateData, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao atualizar tipo de treinamento'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Tipo de treinamento atualizado com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                } else {
                    const createData: CreateTrainingEntryType = {
                        name: values.name,
                    };
                    await AIAgentService.createTrainingEntryType(workspaceId, createData, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao criar tipo de treinamento'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Tipo de treinamento criado com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                }
                setTypeFormVisible(false);
                setEditingType(null);
                typeFormik.resetForm();
                loadTrainingEntryTypes();
            } catch (error) {
                console.error('Error saving training entry type:', error);
            }
        },
    });

    const handleCreateTraining = () => {
        setEditingTraining(null);
        setSelectedTraining(null);
        formik.resetForm();
        setIsDrawerVisible(true);
    };

    // Training Entry Type handlers
    const handleManageTypes = () => {
        setShowTypesModal(true);
    };

    const handleCreateType = () => {
        setEditingType(null);
        typeFormik.resetForm();
        setTypeFormVisible(true);
    };

    const handleEditType = (type: TrainingEntryType) => {
        setEditingType(type);
        typeFormik.setValues({
            name: type.name,
        });
        setTypeFormVisible(true);
    };

    const handleDeleteType = async (typeId: string) => {
        if (!workspaceId) return;

        Modal.confirm({
            title: getTranslation('Confirmar exclusão'),
            content: getTranslation('Tem certeza que deseja excluir este tipo de treinamento?'),
            okText: getTranslation('Sim, Excluir'),
            cancelText: getTranslation('Cancelar'),
            okButtonProps: {
                className: 'antd-span-default-color'
            },
            onOk: async () => {
                try {
                    await AIAgentService.deleteTrainingEntryType(workspaceId, typeId, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao excluir tipo de treinamento'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Tipo de treinamento excluído com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                    loadTrainingEntryTypes();
                } catch (error) {
                    console.error('Error deleting training entry type:', error);
                }
            },
        });
    };

    const handleEditTraining = (training: TrainingEntry) => {
        setEditingTraining(training);
        setSelectedTraining(training);
        formik.setValues({
            identifier: training.identifier,
            content: training.content,
            trainingEntryTypeId: training.trainingEntryTypeId || '',
            expiresAt: training.expiresAt as string | null,
        });
        setIsDrawerVisible(true);
    };

    const handleDeleteTraining = async (trainingId: string) => {
        if (!workspaceId) return;

        Modal.confirm({
            title: getTranslation('Confirmar exclusão'),
            content: getTranslation('Tem certeza que deseja excluir este treinamento?'),
            okText: getTranslation('Sim, Excluir'),
            cancelText: getTranslation('Cancelar'),
            okButtonProps: {
                className: 'antd-span-default-color'
            },
            onOk: async () => {
                try {
                    await AIAgentService.deleteTrainingEntry(workspaceId, trainingId, agentId!, (err) => {
                        addNotification({
                            title: getTranslation('Erro'),
                            message: getTranslation('Erro ao excluir treinamento'),
                            type: 'danger',
                            duration: 3000,
                        });
                    });
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Treinamento excluído com sucesso'),
                        type: 'success',
                        duration: 3000,
                    });
                    if (selectedTraining && selectedTraining.id === trainingId) {
                        setSelectedTraining(null);
                    }
                    loadTrainings();
                } catch (error) {
                    console.error('Error deleting training:', error);
                }
            },
        });
    };

    const handleTrainAgent = async () => {
        if (!workspaceId || !agentId) return;
        setShowTrainingModal(true);
    };

    const handleConfirmTraining = async () => {
        if (!workspaceId || !agentId) return;

        setIsTraining(true);
        setShowTrainingModal(false);

        try {
            await AIAgentService.doTraining(
                workspaceId,
                {
                    forceAll: forceAll,
                    agentId: agentId!,
                },
                (err) => {
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao iniciar treinamento'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );

            addNotification({
                title: getTranslation('Sucesso'),
                message: getTranslation('Treinamento iniciado com sucesso'),
                type: 'success',
                duration: 3000,
            });

            // Recarregar lista para atualizar status
            loadTrainings();
        } catch (error) {
            console.error('Error training agent:', error);
            addNotification({
                title: getTranslation('Erro'),
                message: getTranslation('Erro ao treinar agente'),
                type: 'danger',
                duration: 3000,
            });
        } finally {
            setIsTraining(false);
        }
    };

    const handleCancelTraining = () => {
        setShowTrainingModal(false);
        setForceAll(false);
    };

    const handleImportFile = () => {
        setShowImportModal(true);
    };

    const handleFileSelection = (file: File) => {
        setSelectedFile(file);
        setShowImportModal(false);
        setShowUploadConfirmation(true);
    };

    const handleConfirmUpload = async () => {
        if (!workspaceId || !agentId || !selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);
        setShowUploadConfirmation(false);

        try {
            const response = await AIAgentService.bulkUploadTrainingEntries(
                workspaceId,
                agentId,
                selectedFile,
                (err) => {
                    setIsUploading(false);
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao importar arquivo'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );

            if (response) {
                setIsUploading(false);
                setSelectedFile(null);

                if (response.errors && response.errors.length > 0) {
                    addNotification({
                        title: getTranslation('Importação concluída com avisos'),
                        message: `${getTranslation('Criados')}: ${response.created} | ${getTranslation('Erros')}: ${
                            response.errors.length
                        }`,
                        type: 'warning',
                        duration: 5000,
                    });
                } else {
                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: `${response.created} ${getTranslation('treinamentos importados com sucesso')}`,
                        type: 'success',
                        duration: 3000,
                    });
                }

                loadTrainings();
            }
        } catch (error) {
            setIsUploading(false);
            console.error('Error uploading file:', error);
        }
    };

    const handleCancelUpload = () => {
        setShowUploadConfirmation(false);
        setSelectedFile(null);
    };

    const handleCancelImport = () => {
        setShowImportModal(false);
        setUploadProgress(0);
    };

    const handleOpenDebugModal = () => {
        setShowDebugModal(true);
    };

    const handleCloseDebugModal = () => {
        setShowDebugModal(false);
    };

    const handleViewTraining = (training: TrainingEntry) => {
        setSelectedTraining(training);
        setIsDrawerVisible(true);
    };

    const columns = [
        {
            title: getTranslation('Pergunta'),
            dataIndex: 'identifier',
            key: 'identifier',
            width: 200,
        },
        {
            title: getTranslation('Prévia do Conteúdo'),
            dataIndex: 'content',
            key: 'content',
            render: (content: string) => (
                <div
                    style={{
                        maxWidth: 400,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                        maxHeight: '2.8em',
                    }}
                >
                    {content}
                </div>
            ),
        },
        {
            title: getTranslation('Tipo'),
            key: 'type',
            width: 150,
            render: (_, record: TrainingEntry) => {
                if (record.trainingEntryType) {
                    return (
                        <Tag color='blue' style={{ fontSize: '12px' }}>
                            {record.trainingEntryType.name}
                        </Tag>
                    );
                } else {
                    return (
                        <Tag color='default' style={{ fontSize: '12px' }}>
                            {getTranslation('Sem tipo')}
                        </Tag>
                    );
                }
            },
        },
        {
            title: getTranslation('Status'),
            key: 'status',
            width: 120,
            render: (_, record: TrainingEntry) => {
                if (record.pendingTraining) {
                    return (
                        <Tag icon={<ClockCircleOutlined />} color='orange'>
                            {getTranslation('Pendente')}
                        </Tag>
                    );
                } else if (record.executedTrainingAt) {
                    return (
                        <Tag icon={<CheckCircleOutlined />} color='green'>
                            {getTranslation('Executado')}
                        </Tag>
                    );
                } else {
                    return <Tag color='default'>{getTranslation('Inativo')}</Tag>;
                }
            },
        },
        {
            title: getTranslation('Expira em'),
            key: 'expiresAt',
            width: 130,
            render: (_, record: TrainingEntry) => {
                if (!record.expiresAt) {
                    return (
                        <Tag color='default' style={{ fontSize: '12px' }}>
                            {getTranslation('Sem expiração')}
                        </Tag>
                    );
                }

                const expiresDate = moment(record.expiresAt);
                const now = moment();
                const isExpired = expiresDate.isBefore(now);

                return (
                    <div>
                        <Tag
                            color={isExpired ? 'red' : 'orange'}
                            style={{ fontSize: '12px' }}
                        >
                            {isExpired ? getTranslation('Expirado') : getTranslation('Expira em')} {expiresDate.format('DD/MM/YYYY')}
                        </Tag>
                    </div>
                );
            },
        },
        {
            title: getTranslation('Ações'),
            key: 'actions',
            width: 150,
            render: (_, record: TrainingEntry) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => handleViewTraining(record)}
                        title={getTranslation('Visualizar')}
                    />
                    <Button
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEditTraining(record)}
                        title={getTranslation('Editar')}
                    />
                    <Button
                        size='small'
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteTraining(record.id)}
                        title={getTranslation('Excluir')}
                    />
                </div>
            ),
        },
    ];

    return (
        <div style={{ position: 'relative' }}>
            <div 
                style={{ 
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'white',
                    zIndex: 10,
                    padding: '16px 20px',
                    marginBottom: 16,
                    borderBottom: '1px solid #f0f0f0'
                }}
            >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                            <BulbOutlined />
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
                            {getTranslation('Entradas de Treinamento')}
                        </h4>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Button icon={<ReloadOutlined />} onClick={loadTrainings} loading={loading}>
                            {getTranslation('Atualizar')}
                        </Button>
                        <Button
                            icon={<UploadOutlined />}
                            onClick={handleImportFile}
                            style={{
                                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                border: 'none',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
                            }}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Importar')}
                        </Button>
                        <Button
                            icon={<RocketOutlined />}
                            onClick={handleTrainAgent}
                            loading={isTraining}
                            disabled={isTraining}
                            type='primary'
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                            }}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Treinar')}
                        </Button>
                        <Button
                            icon={<BugOutlined />}
                            onClick={handleOpenDebugModal}
                            style={{
                                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                                border: 'none',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)',
                            }}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Testar')}
                        </Button>
                        <Button
                            icon={<BookOutlined />}
                            onClick={handleManageTypes}
                            style={{
                                background: 'linear-gradient(135deg, #fa541c 0%, #d4380d 100%)',
                                border: 'none',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(250, 84, 28, 0.3)',
                            }}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Tipos')}
                        </Button>
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={handleCreateTraining}
                            className='antd-span-default-color'
                        >
                            {getTranslation('Criar')}
                        </Button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Input.Search
                        placeholder={getTranslation('Buscar por identificador ou conteúdo...')}
                        allowClear
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ maxWidth: 400 }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Switch checked={showOnlyPending} onChange={setShowOnlyPending} size='small' />
                        <span style={{ fontSize: '14px', color: '#666' }}>{getTranslation('Apenas pendentes')}</span>
                    </div>

                    {pendingCount > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                backgroundColor: '#fff7e6',
                                border: '1px solid #ffd591',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#d46b08',
                            }}
                        >
                            <ClockCircleOutlined />
                            <span>
                                {pendingCount}{' '}
                                {getTranslation(pendingCount === 1 ? 'treinamento pendente' : 'treinamentos pendentes')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '0 20px' }}>
                <Table
                columns={columns}
                dataSource={filteredTrainings}
                loading={loading}
                rowKey={(record) => record.id || ''}
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
                        `${range[0]}-${range[1]} de ${total} ${getTranslation('itens')}${
                            debouncedSearchText ? ` (${getTranslation('filtrados de')} ${trainings.length})` : ''
                        }`,
                }}
            />
            </div>

            <Modal
                title={editingTraining ? getTranslation('Editar Treinamento') : getTranslation('Criar Treinamento')}
                open={isModalVisible}
                onOk={formik.submitForm}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingTraining(null);
                    formik.resetForm();
                }}
                confirmLoading={formik.isSubmitting}
                width={800}
            >
                <form>
                    <LabelWrapper
                        label={getTranslation('Pergunta')}
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'identifier',
                        }}
                    >
                        <InputSimple
                            value={formik.values.identifier}
                            placeholder={getTranslation('Ex: Quais as especialidades atendidas pelo Doutor Mauricio?')}
                            onChange={(e) => formik.setFieldValue('identifier', e.target.value)}
                        />
                    </LabelWrapper>

                    <LabelWrapper
                        label={getTranslation('Tipo de Treinamento')}
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'trainingEntryTypeId',
                        }}
                    >
                        <Select
                            value={formik.values.trainingEntryTypeId}
                            onChange={(value) => formik.setFieldValue('trainingEntryTypeId', value)}
                            placeholder={getTranslation('Selecione um tipo (opcional)')}
                            loading={loadingTypes}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {trainingEntryTypes.map((type) => (
                                <Select.Option key={type.id} value={type.id}>
                                    {type.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </LabelWrapper>

                    <LabelWrapper
                        label={getTranslation('Conteúdo')}
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'content',
                        }}
                    >
                        <StyledTextArea
                            value={formik.values.content}
                            placeholder={getTranslation(
                                'Ex: O Dr. Mauricio atende na clinica desde 2020 e atende ginecologista e obstetra, realiza o ultrassom obstétrico e o ultrassom transvaginal como parte do atendimento.'
                            )}
                            onChange={(e) => formik.setFieldValue('content', e.target.value)}
                        />
                    </LabelWrapper>

                    <LabelWrapper
                        label={getTranslation('Data de Expiração')}
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: 'expiresAt',
                        }}
                    >
                        <DatePicker
                            value={formik.values.expiresAt ? moment(formik.values.expiresAt) : null}
                            onChange={(date) => formik.setFieldValue('expiresAt', date ? date.toISOString() : null)}
                            placeholder={getTranslation('Selecione uma data de expiração (opcional)')}
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            style={{ width: '100%' }}
                        />
                    </LabelWrapper>
                </form>
            </Modal>

            <Drawer
                title={
                    editingTraining
                        ? getTranslation('Editar Treinamento')
                        : selectedTraining
                        ? getTranslation('Conteúdo do Treinamento')
                        : getTranslation('Criar Treinamento')
                }
                placement='right'
                onClose={() => {
                    setIsDrawerVisible(false);
                    setEditingTraining(null);
                    setSelectedTraining(null);
                    formik.resetForm();
                }}
                open={isDrawerVisible}
                width={600}
                extra={
                    selectedTraining &&
                    !editingTraining && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button icon={<EditOutlined />} onClick={() => handleEditTraining(selectedTraining)}>
                                {getTranslation('Editar')}
                            </Button>
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    handleDeleteTraining(selectedTraining.id);
                                    setIsDrawerVisible(false);
                                }}
                            >
                                {getTranslation('Excluir')}
                            </Button>
                        </div>
                    )
                }
                footer={
                    (editingTraining || (!selectedTraining && !editingTraining)) && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button
                                onClick={() => {
                                    setEditingTraining(null);
                                    setSelectedTraining(null);
                                    setIsDrawerVisible(false);
                                    formik.resetForm();
                                }}
                            >
                                {getTranslation('Cancelar')}
                            </Button>
                            <Button
                                type='primary'
                                onClick={formik.submitForm}
                                loading={formik.isSubmitting}
                                disabled={formik.isSubmitting || (!!editingTraining && !hasFormChanges)}
                                className='antd-span-default-color'
                            >
                                {editingTraining ? getTranslation('Salvar') : getTranslation('Criar')}
                            </Button>
                        </div>
                    )
                }
            >
                {selectedTraining || (!selectedTraining && !editingTraining) ? (
                    editingTraining || (!selectedTraining && !editingTraining) ? (
                        // Modo de edição/criação
                        <div style={{ padding: '0 0 60px 0' }}>
                            <LabelWrapper
                                label={getTranslation('Pergunta')}
                                validate={{
                                    touched: formik.touched,
                                    errors: formik.errors,
                                    isSubmitted: formik.isSubmitting,
                                    fieldName: 'identifier',
                                }}
                            >
                                <InputSimple
                                    value={formik.values.identifier}
                                    placeholder={getTranslation(
                                        'Ex: Quais as especialidades atendidas pelo Doutor Mauricio?'
                                    )}
                                    onChange={(e) => formik.setFieldValue('identifier', e.target.value)}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                label={getTranslation('Tipo de Treinamento')}
                                validate={{
                                    touched: formik.touched,
                                    errors: formik.errors,
                                    isSubmitted: formik.isSubmitting,
                                    fieldName: 'trainingEntryTypeId',
                                }}
                            >
                                <Select
                                    value={formik.values.trainingEntryTypeId}
                                    onChange={(value) => formik.setFieldValue('trainingEntryTypeId', value)}
                                    placeholder={getTranslation('Selecione um tipo (opcional)')}
                                    loading={loadingTypes}
                                    allowClear
                                    style={{ width: '100%' }}
                                >
                                    {trainingEntryTypes.map((type) => (
                                        <Select.Option key={type.id} value={type.id}>
                                            {type.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </LabelWrapper>

                            <LabelWrapper
                                label={getTranslation('Conteúdo')}
                                validate={{
                                    touched: formik.touched,
                                    errors: formik.errors,
                                    isSubmitted: formik.isSubmitting,
                                    fieldName: 'content',
                                }}
                            >
                                <StyledTextArea
                                    value={formik.values.content}
                                    placeholder={getTranslation(
                                        'Ex: O Dr. Mauricio atende na clinica desde 2020 e atende ginecologista e obstetra, realiza o ultrassom obstétrico e o ultrassom transvaginal como parte do atendimento.'
                                    )}
                                    onChange={(e) => formik.setFieldValue('content', e.target.value)}
                                    style={{ height: '260px' }}
                                />
                            </LabelWrapper>

                            <LabelWrapper
                                label={getTranslation('Data de Expiração')}
                                validate={{
                                    touched: formik.touched,
                                    errors: formik.errors,
                                    isSubmitted: formik.isSubmitting,
                                    fieldName: 'expiresAt',
                                }}
                            >
                                <DatePicker
                                    value={formik.values.expiresAt ? moment(formik.values.expiresAt) : null}
                                    onChange={(date) => formik.setFieldValue('expiresAt', date ? date.toISOString() : null)}
                                    placeholder={getTranslation('Selecione uma data de expiração (opcional)')}
                                    showTime
                                    format="DD/MM/YYYY HH:mm"
                                    style={{ width: '100%' }}
                                />
                            </LabelWrapper>

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
                                style={{ marginTop: '16px' }}
                            />
                        </div>
                    ) : selectedTraining ? (
                        // Modo de visualização
                        <div>
                            <Card style={{ marginBottom: 16 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <BookOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                        <strong style={{ color: '#1890ff' }}>{getTranslation('Pergunta')}:</strong>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 4,
                                            fontSize: '16px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {selectedTraining.identifier}
                                    </div>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <BookOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                        <strong style={{ color: '#1890ff' }}>{getTranslation('Tipo')}:</strong>
                                    </div>
                                    <div style={{ marginTop: 4 }}>
                                        {selectedTraining.trainingEntryType ? (
                                            <Tag color='blue' style={{ fontSize: '14px' }}>
                                                {selectedTraining.trainingEntryType.name}
                                            </Tag>
                                        ) : (
                                            <Tag color='default' style={{ fontSize: '14px' }}>
                                                {getTranslation('Sem tipo')}
                                            </Tag>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <RocketOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                        <strong style={{ color: '#1890ff' }}>{getTranslation('Status')}:</strong>
                                    </div>
                                    <div style={{ marginTop: 4 }}>
                                        {selectedTraining.pendingTraining ? (
                                            <Tag icon={<ClockCircleOutlined />} color='orange'>
                                                {getTranslation('Pendente')}
                                            </Tag>
                                        ) : selectedTraining.executedTrainingAt ? (
                                            <Tag icon={<CheckCircleOutlined />} color='green'>
                                                {getTranslation('Executado')}
                                            </Tag>
                                        ) : (
                                            <Tag color='default'>{getTranslation('Inativo')}</Tag>
                                        )}
                                    </div>
                                </div>

                                {selectedTraining.executedTrainingAt && (
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                            <strong style={{ color: '#1890ff' }}>
                                                {getTranslation('Executado em')}:
                                            </strong>
                                        </div>
                                        <div style={{ marginTop: 4, fontSize: '14px', color: '#666' }}>
                                            {new Date(selectedTraining.executedTrainingAt).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                {selectedTraining.expiresAt && (
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <CalendarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                            <strong style={{ color: '#1890ff' }}>
                                                {getTranslation('Expira em')}:
                                            </strong>
                                        </div>
                                        <div style={{ marginTop: 4 }}>
                                            {(() => {
                                                const expiresDate = moment(selectedTraining.expiresAt);
                                                const now = moment();
                                                const isExpired = expiresDate.isBefore(now);
                                                return (
                                                    <div>
                                                        <Tag
                                                            color={isExpired ? 'red' : 'orange'}
                                                            style={{ fontSize: '14px' }}
                                                        >
                                                            {isExpired ? getTranslation('Expirado em') : getTranslation('Expira em')} {expiresDate.format('DD/MM/YYYY HH:mm')}
                                                        </Tag>
                                                        {isExpired && (
                                                            <div style={{ marginTop: 4, fontSize: '12px', color: '#ff4d4f' }}>
                                                                {getTranslation('Este treinamento está expirado')}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </Card>

                            <Card>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <BulbOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                                        <strong style={{ color: '#1890ff' }}>{getTranslation('Conteúdo')}:</strong>
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
                                    {selectedTraining.content}
                                </div>
                            </Card>
                        </div>
                    ) : null
                ) : (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: '100px' }}>
                        {getTranslation('Nenhum treinamento selecionado')}
                    </div>
                )}
            </Drawer>

            {/* Training Confirmation Modal */}
            <Modal
                title={getTranslation('Confirmar Treinamento')}
                open={showTrainingModal}
                onOk={handleConfirmTraining}
                onCancel={handleCancelTraining}
                okText={getTranslation('Sim, Treinar')}
                cancelText={getTranslation('Cancelar')}
                width={500}
                confirmLoading={isTraining}
                okButtonProps={{
                    className: 'antd-span-default-color',
                }}
            >
                <div>
                    <p>
                        {getTranslation(
                            'Tem certeza que deseja iniciar o treinamento do agente? Este processo pode levar alguns minutos.'
                        )}
                    </p>
                    {userIsSystemAdmin && (
                        <div style={{ marginTop: 16 }}>
                            <Checkbox checked={forceAll} onChange={(e) => setForceAll(e.target.checked)}>
                                {getTranslation('Forçar treinamento completo (Force All)')}
                            </Checkbox>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                {getTranslation(
                                    'Opção avançada para administradores: retreina todos os dados independente do status'
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Import File Modal */}
            <Modal
                title={getTranslation('Importar Arquivo de Treinamento')}
                open={showImportModal}
                onCancel={handleCancelImport}
                footer={null}
                width={600}
            >
                <div style={{ padding: '20px 0' }}>
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ marginBottom: 8 }}>{getTranslation('Formatos suportados:')}</h4>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <Tag color='blue'>CSV</Tag>
                            <Tag color='green'>XLSX</Tag>
                            <Tag color='orange'>XLS</Tag>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: 16 }}>
                            <p>{getTranslation('O arquivo deve conter duas colunas:')}</p>
                            <ul style={{ paddingLeft: 20, margin: 0 }}>
                                <li>
                                    <strong>{getTranslation('Coluna 1')}:</strong>{' '}
                                    {getTranslation('Pergunta (cenário)')}
                                </li>
                                <li>
                                    <strong>{getTranslation('Coluna 2')}:</strong>{' '}
                                    {getTranslation('Conteúdo (resposta/conhecimento)')}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <Upload.Dragger
                        accept='.csv,.xlsx,.xls'
                        beforeUpload={(file) => {
                            handleFileSelection(file);
                            return false;
                        }}
                        multiple={false}
                        showUploadList={false}
                        disabled={isUploading}
                    >
                        <p className='ant-upload-drag-icon'>
                            <InboxOutlined />
                        </p>
                        <p className='ant-upload-text'>
                            {isUploading
                                ? getTranslation('Processando arquivo...')
                                : getTranslation('Clique ou arraste o arquivo para esta área')}
                        </p>
                        <p className='ant-upload-hint'>{getTranslation('Tamanho máximo: 10MB')}</p>
                    </Upload.Dragger>

                    {isUploading && (
                        <div style={{ marginTop: 16 }}>
                            <Progress
                                percent={uploadProgress}
                                status='active'
                                strokeColor={{
                                    '0%': '#52c41a',
                                    '100%': '#389e0d',
                                }}
                            />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Upload Confirmation Modal */}
            <Modal
                title={getTranslation('Confirmar Upload de Arquivo')}
                open={showUploadConfirmation}
                onOk={handleConfirmUpload}
                onCancel={handleCancelUpload}
                okText={getTranslation('Sim, Importar')}
                cancelText={getTranslation('Cancelar')}
                confirmLoading={isUploading}
                width={500}
                okButtonProps={{
                    className: 'antd-span-default-color',
                }}
            >
                <div>
                    <p>{getTranslation('Tem certeza que deseja importar o arquivo selecionado?')}</p>
                    {selectedFile && (
                        <div
                            style={{
                                marginTop: 16,
                                padding: 12,
                                backgroundColor: '#f9f9f9',
                                borderRadius: 6,
                                border: '1px solid #e8e8e8',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UploadOutlined style={{ color: '#1890ff' }} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>{selectedFile.name}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{ marginTop: 16, fontSize: '13px', color: '#666' }}>
                        <p>{getTranslation('⚠️ Esta ação irá:')}</p>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                            <li>{getTranslation('Processar e validar todas as linhas do arquivo')}</li>
                            <li>{getTranslation('Criar novos treinamentos válidos')}</li>
                            <li>{getTranslation('Reportar erros encontrados durante o processamento')}</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            {/* Test Training Modal */}
            <TestTrainingModal
                visible={showDebugModal}
                onClose={handleCloseDebugModal}
                agent={agent}
                agentId={agentId}
                workspaceId={workspaceId}
                getTranslation={getTranslation}
            />

            {/* Training Entry Types Management Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: '40px' }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #fa541c 0%, #d4380d 100%)',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <BookOutlined style={{ fontSize: '16px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                {getTranslation('Gerenciar Tipos de Treinamento')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                                {getTranslation('Organize seus treinamentos por categorias')}
                            </div>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateType}
                            className="antd-span-default-color"
                            size="small"
                            style={{
                                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                border: 'none',
                                boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
                            }}
                        >
                            {getTranslation('Novo Tipo')}
                        </Button>
                    </div>
                }
                open={showTypesModal}
                onCancel={() => setShowTypesModal(false)}
                footer={null}
                width={800}
                style={{ top: 50 }}
            >
                <div style={{ padding: '8px 0 20px 0' }}>

                    {/* Lista de tipos */}
                    {trainingEntryTypes.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            background: '#fafafa',
                            borderRadius: '8px',
                            border: '2px dashed #e8e8e8'
                        }}>
                            <BookOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                            <div style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '8px' }}>
                                {getTranslation('Nenhum tipo cadastrado')}
                            </div>
                            <div style={{ fontSize: '14px', color: '#bfbfbf', marginBottom: '20px' }}>
                                {getTranslation('Crie tipos para organizar seus treinamentos por categorias')}
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreateType}
                                className="antd-span-default-color"
                            >
                                {getTranslation('Criar Primeiro Tipo')}
                            </Button>
                        </div>
                    ) : (
                        <div style={{ 
                            maxHeight: '400px', 
                            overflowY: 'auto',
                            paddingRight: '4px',
                            marginRight: '-4px'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {trainingEntryTypes.map((type, index) => (
                                    <Card 
                                        key={type.id}
                                        size="small"
                                        style={{
                                            borderRadius: '8px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        bodyStyle={{ padding: '12px' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    background: `hsl(${(index * 137.5) % 360}, 70%, 95%)`,
                                                    border: `2px solid hsl(${(index * 137.5) % 360}, 70%, 85%)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: `hsl(${(index * 137.5) % 360}, 70%, 45%)`
                                                }}>
                                                    {type.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ 
                                                        fontSize: '14px', 
                                                        fontWeight: '500',
                                                        color: '#262626',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {type.name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#8c8c8c'
                                                    }}>
                                                        {getTranslation('Tipo de treinamento')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Button
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleEditType(type)}
                                                    title={getTranslation('Editar')}
                                                    style={{
                                                        borderColor: '#1890ff',
                                                        color: '#1890ff'
                                                    }}
                                                />
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDeleteType(type.id)}
                                                    title={getTranslation('Excluir')}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {loadingTypes && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                                {getTranslation('Carregando tipos...')}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Training Entry Type Form Modal */}
            <Modal
                title={editingType ? getTranslation('Editar Tipo') : getTranslation('Novo Tipo')}
                open={typeFormVisible}
                onOk={typeFormik.submitForm}
                onCancel={() => {
                    setTypeFormVisible(false);
                    setEditingType(null);
                    typeFormik.resetForm();
                }}
                confirmLoading={typeFormik.isSubmitting}
                okText={editingType ? getTranslation('Salvar') : getTranslation('Criar')}
                cancelText={getTranslation('Cancelar')}
                okButtonProps={{
                    className: 'antd-span-default-color',
                }}
                width={400}
            >
                <div style={{ paddingTop: '16px' }}>
                    <LabelWrapper
                        label={getTranslation('Nome do Tipo')}
                        validate={{
                            touched: typeFormik.touched,
                            errors: typeFormik.errors,
                            isSubmitted: typeFormik.isSubmitting,
                            fieldName: 'name',
                        }}
                    >
                        <InputSimple
                            value={typeFormik.values.name}
                            placeholder={getTranslation('Ex: Valores de procedimento')}
                            onChange={(e) => typeFormik.setFieldValue('name', e.target.value)}
                        />
                    </LabelWrapper>
                </div>
            </Modal>
        </div>
    );
};

export default TrainingsTab;
