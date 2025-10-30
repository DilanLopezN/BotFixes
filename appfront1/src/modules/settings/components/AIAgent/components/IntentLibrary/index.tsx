import { FC, useCallback, useEffect, useState } from 'react';
import { Button, Drawer, Modal, Space, Table, Tag, Dropdown, Menu } from 'antd';
import { PlusOutlined, DeleteOutlined, BookOutlined, MenuOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useFormik } from 'formik-latest';
import {
    AIAgentService,
    CreateIntentLibraryPayload,
    IntentLibraryItem,
    UpdateIntentLibraryPayload,
} from '../../../../service/AIAgentService';
import { Card } from '../../../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../../../shared/InputSample/InputSimple';
import { addNotification } from '../../../../../../utils/AddNotification';

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

interface IntentLibraryManagerProps {
    workspaceId?: string;
    getTranslation: (key: string) => string;
    onRegisterCreateAction?: (handler: (() => void) | null) => void;
}

const MIN_EXAMPLES = 1;
const MAX_EXAMPLES = 4;

const IntentLibraryManager: FC<IntentLibraryManagerProps> = ({
    workspaceId,
    getTranslation,
    onRegisterCreateAction,
}) => {
    const [library, setLibrary] = useState<IntentLibraryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<IntentLibraryItem | null>(null);

    const hasWorkspace = Boolean(workspaceId);

    const loadIntentLibrary = useCallback(async () => {
        if (!workspaceId) return;

        setLoading(true);
        try {
            const response = await AIAgentService.listIntentLibrary(
                workspaceId,
                undefined,
                (err) => {
                    console.error('Error loading intent library:', err);
                    addNotification({
                        title: getTranslation('Erro'),
                        message: getTranslation('Erro ao carregar biblioteca de intenções'),
                        type: 'danger',
                        duration: 3000,
                    });
                }
            );

            setLibrary(response || []);
        } catch (error) {
            console.error('Error loading intent library:', error);
        } finally {
            setLoading(false);
        }
    }, [workspaceId, getTranslation]);

    useEffect(() => {
        loadIntentLibrary();
    }, [loadIntentLibrary]);

    const closeDrawer = () => {
        setDrawerVisible(false);
        setEditingItem(null);
        formik.resetForm();
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            examples: [''],
        },
        enableReinitialize: true,
        validate: (values) => {
            const errors: Record<string, string> = {};
            if (!values.name.trim()) {
                errors.name = getTranslation('Nome é obrigatório');
            }
            if (!values.description.trim()) {
                errors.description = getTranslation('Descrição é obrigatória');
            }

            const validExamples = values.examples.filter((example) => example.trim() !== '');
            if (validExamples.length < MIN_EXAMPLES) {
                errors.examples = getTranslation('Informe pelo menos um exemplo');
            }

            return errors;
        },
        onSubmit: async (values) => {
            if (!workspaceId) return;

            const payload: CreateIntentLibraryPayload | UpdateIntentLibraryPayload = {
                name: values.name.trim(),
                description: values.description.trim(),
                examples: values.examples
                    .map((example) => example.trim())
                    .filter((example) => example !== ''),
            };

            try {
                if (editingItem) {
                    await AIAgentService.updateIntentLibrary(
                        workspaceId,
                        {
                            ...(payload as UpdateIntentLibraryPayload),
                            intentLibraryId: editingItem.id,
                        },
                        (err) => {
                            console.error('Error updating intent library item:', err);
                            addNotification({
                                title: getTranslation('Erro'),
                                message: getTranslation('Erro ao atualizar intenção na biblioteca'),
                                type: 'danger',
                                duration: 3000,
                            });
                        }
                    );

                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Intenção atualizada na biblioteca'),
                        type: 'success',
                        duration: 3000,
                    });
                } else {
                    await AIAgentService.createIntentLibrary(
                        workspaceId,
                        payload as CreateIntentLibraryPayload,
                        (err) => {
                            console.error('Error creating intent library item:', err);
                            addNotification({
                                title: getTranslation('Erro'),
                                message: getTranslation('Erro ao criar intenção na biblioteca'),
                                type: 'danger',
                                duration: 3000,
                            });
                        }
                    );

                    addNotification({
                        title: getTranslation('Sucesso'),
                        message: getTranslation('Intenção adicionada à biblioteca'),
                        type: 'success',
                        duration: 3000,
                    });
                }

                closeDrawer();
                await loadIntentLibrary();
            } catch (error) {
                console.error('Error saving intent library item:', error);
            }
        },
    });

    const handleCreate = useCallback(() => {
        setEditingItem(null);
        formik.resetForm();
        setDrawerVisible(true);
    }, [formik]);

    const handleEdit = useCallback((item: IntentLibraryItem) => {
        setEditingItem(item);
        formik.setValues({
            name: item.name,
            description: item.description,
            examples: item.examples.length ? item.examples : [''],
        });
        setDrawerVisible(true);
    }, [formik]);

    useEffect(() => {
        if (!onRegisterCreateAction) return;
        onRegisterCreateAction(handleCreate);
        return () => onRegisterCreateAction(null);
    }, [onRegisterCreateAction, handleCreate]);

    const handleDelete = (item: IntentLibraryItem) => {
        if (!workspaceId) return;

        Modal.confirm({
            title: getTranslation('Confirmar exclusão'),
            content: getTranslation('Deseja remover esta intenção da biblioteca?'),
            okText: getTranslation('Remover'),
            cancelText: getTranslation('Cancelar'),
            okButtonProps: { danger: true },
            onOk: async () => {
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

                    await loadIntentLibrary();
                } catch (error) {
                    console.error('Error deleting intent library item:', error);
                }
            },
        });
    };

    const addExample = () => {
        if (formik.values.examples.length >= MAX_EXAMPLES) return;
        formik.setFieldValue('examples', [...formik.values.examples, '']);
    };

    const removeExample = (index: number) => {
        const nextExamples = formik.values.examples.filter((_, i) => i !== index);
        formik.setFieldValue('examples', nextExamples.length ? nextExamples : ['']);
    };

    const updateExample = (index: number, value: string) => {
        const nextExamples = [...formik.values.examples];
        nextExamples[index] = value;
        formik.setFieldValue('examples', nextExamples);
    };

    const columns = [
        {
            title: getTranslation('Nome'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #2f54eb 0%, #722ed1 100%)',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}
                    >
                        <BookOutlined />
                    </div>
                    <strong>{text}</strong>
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
                            key='edit'
                            onClick={(info) => {
                                info.domEvent.stopPropagation();
                                handleEdit(record);
                            }}
                        >
                            {getTranslation('Editar')}
                        </Menu.Item>
                        <Menu.Item
                            key='delete'
                            onClick={(info) => {
                                info.domEvent.stopPropagation();
                                handleDelete(record);
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

    return (
        <Card border='none'>
            {!onRegisterCreateAction && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        disabled={!hasWorkspace}
                        className='antd-span-default-color'
                    >
                        {getTranslation('Nova intenção na biblioteca')}
                    </Button>
                </div>
            )}
            <Table
                columns={columns}
                dataSource={library}
                loading={loading}
                rowKey={(record) => record.id}
                pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
                locale={{ emptyText: getTranslation('Nenhuma intenção cadastrada na biblioteca') }}
            />

            <Drawer
                title={
                    editingItem
                        ? getTranslation('Editar intenção da biblioteca')
                        : getTranslation('Nova intenção na biblioteca')
                }
                width={540}
                visible={drawerVisible}
                onClose={closeDrawer}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={closeDrawer} style={{ marginRight: 8 }}>
                            {getTranslation('Cancelar')}
                        </Button>
                        <Button
                            type='primary'
                            onClick={() => formik.handleSubmit()}
                            className='antd-span-default-color'
                        >
                            {editingItem ? getTranslation('Salvar alterações') : getTranslation('Salvar')}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={formik.handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Nome')}</span>
                        </LabelWrapper>
                        <InputSimple
                            name='name'
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            placeholder={getTranslation('Digite o nome da intenção')}
                        />
                        {formik.errors.name && (
                            <span style={{ color: '#ff4d4f', fontSize: 12 }}>{formik.errors.name}</span>
                        )}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Descrição')}</span>
                        </LabelWrapper>
                        <StyledTextArea
                            name='description'
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            placeholder={getTranslation('Descreva quando esta intenção deve ser usada')}
                        />
                        {formik.errors.description && (
                            <span style={{ color: '#ff4d4f', fontSize: 12 }}>{formik.errors.description}</span>
                        )}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <LabelWrapper>
                            <span>{getTranslation('Exemplos')}</span>
                        </LabelWrapper>

                        {formik.values.examples.map((example, index) => (
                            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <InputSimple
                                    value={example}
                                    onChange={(event) => updateExample(index, event.target.value)}
                                    placeholder={getTranslation('Escreva uma frase de exemplo')}
                                />
                                {formik.values.examples.length > MIN_EXAMPLES && (
                                    <Button
                                        danger
                                        type='text'
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeExample(index)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        title={getTranslation('Remover')}
                                    />
                                )}
                            </div>
                        ))}

                        {formik.errors.examples && (
                            <span style={{ color: '#ff4d4f', fontSize: 12 }}>{formik.errors.examples}</span>
                        )}

                        <Button
                            type='dashed'
                            onClick={addExample}
                            icon={<PlusOutlined />}
                            disabled={formik.values.examples.length >= MAX_EXAMPLES}
                            style={{ width: '100%', marginTop: 8 }}
                        >
                            {getTranslation('Adicionar exemplo')}
                        </Button>
                    </div>
                </form>
            </Drawer>
        </Card>
    );
};

export default IntentLibraryManager;
