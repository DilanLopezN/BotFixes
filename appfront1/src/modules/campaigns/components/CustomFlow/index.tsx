import { FC, useEffect, useState } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { CustomFlowProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { ScrollView } from '../../../settings/components/ScrollView';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { timeout } from '../../../../utils/Timer';
import { Empty, Form, Input, Popconfirm, Skeleton, Table } from 'antd';
import { ModalConfirm } from '../../../../shared/ModalConfirm/ModalConfirm';
import styled from 'styled-components';
import { MdCancel, MdDelete, MdDone, MdEdit } from 'react-icons/md';
import Header from '../../../../shared-v2/Header/Header';
import { CampaignsActionService } from '../../service/CampaignsActionService';
import { addNotification } from '../../../../utils/AddNotification';
import { CampaignAction } from '../../interfaces/campaign';

const EditIcon = styled(MdEdit)`
    color: #777;
    font-size: 17px;
    cursor: pointer;

    &:hover {
        color: #1890ff;
    }
`;

const SaveIcon = styled(MdDone)`
    color: #777;
    font-size: 19px;
    cursor: pointer;
    margin: 0 0 0 5px;

    &:hover {
        color: #444;
    }
`;

const CancelIcon = styled(MdCancel)`
    color: #777;
    font-size: 18px;
    cursor: pointer;

    &:hover {
        color: #444;
    }
`;

const DeleteIcon = styled(MdDelete)`
    color: #777;
    font-size: 17px;
    cursor: pointer;
    margin: 0 0 0 5px;

    &:hover {
        color: #1890ff;
    }
`;

const EditableCell: FC<any> = (props) => {
    const { editing, dataIndex, title, inputType, record, index, children, ...restProps } = props;

    return (
        <td {...restProps}>
            {editing && record ? (
                <Form.Item className='formStatus' style={{ margin: '0' }} name={dataIndex} initialValue={record.name}>
                    <Input onChange={() => {}} value={record.name} />
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

const CustomFlow: FC<CustomFlowProps & I18nProps> = ({ getTranslation, workspaceId, menuSelected }) => {
    const [workspaceCustomFlow, setWorkspaceCustomFlow] = useState<CampaignAction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<any[]>([]);
    const [editingKey, setEditingKey] = useState('');
    const [modalDelete, setModalDelete] = useState<string | undefined>(undefined);

    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };

    const [form] = Form.useForm();

    useEffect(() => {
        getWorkspaceCustomFlow();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId]);

    const getWorkspaceCustomFlow = async () => {
        const response = await CampaignsActionService.getActionMessagesFlow(workspaceId);
        if (response) {
            setWorkspaceCustomFlow(response);

            const dataSource = response.map((status, index) => {
                return {
                    key: index,
                    name: status.name,
                    action: status.action,
                    operation: status,
                };
            });
            setData(dataSource);
        }

        timeout(() => setLoading(false), 200);
    };

    const isEditing = (record) => record.key === editingKey;

    const cancel = () => {
        const newData = data.filter((element) => element.operation);
        setData(newData);
        setEditingKey('');
    };

    const columns: any[] = [
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Name')}</Wrapper>,
            dataIndex: 'name',
            width: '47%',
            editable: true,
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Action')}</Wrapper>,
            dataIndex: 'action',
            width: '47%',
            editable: false,
        },
        {
            width: '40px',
            dataIndex: 'operation',
            render: (_, record) => {
                const editable = isEditing(record);

                return editable ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <Popconfirm title={getTranslation('Confirm cancellation')} onConfirm={() => cancel()}>
                            <CancelIcon title={getTranslation('cancel')} onClick={() => {}} />
                        </Popconfirm>
                        <SaveIcon title={getTranslation('Save')} onClick={() => onUpdate(record.key)} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <EditIcon title={getTranslation('Edit')} onClick={() => setEditingKey(record.key)} />
                        <DeleteIcon
                            title={getTranslation('Delete')}
                            onClick={() => setModalDelete(record.operation?.id)}
                        />
                    </div>
                );
            },
        },
    ];

    const onUpdate = async (key) => {
        const row = await form.getFieldsValue();
        if (workspaceCustomFlow.length && workspaceCustomFlow[key]?.id) {
            const statusId: string = (workspaceCustomFlow[key].id).toString();
            const actionName = {
                name: row.name,
            };
            await CampaignsActionService.updateCustomFlow(workspaceId, statusId, actionName);

            await getWorkspaceCustomFlow();
        }
        setEditingKey('');
    };

    const handleDelete = async (key: string) => {
        try {
            await CampaignsActionService.deleteCustomFlow(workspaceId, key, (e: any) => {
                if (e.error === 'ERROR_ACTION_USED_ON_INTERACTION') {
                    setModalDelete(undefined);
                    throw new Error(e.message);
                }
            });
            setData((prevState) => [...prevState.filter((item) => item.operation.id !== key)]);
            setModalDelete(undefined);
        } catch (error) {
            return addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('The custom flow is being used in some integration.'),
            });
        }
    };

    const components = {
        body: {
            cell: EditableCell,
        },
    };

    const renderedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }

        return {
            ...col,
            onCell: (record) => {
                return {
                    record,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: isEditing(record),
                };
            },
        };
    });

    return (
        <>
            <Wrapper>
                <Header title={menuSelected.title} />
            </Wrapper>
            <ScrollView padding='16px 24px' minWidth='900px'>
                {loading ? (
                    <div style={{ background: '#fff', padding: '10px' }}>
                        <Skeleton paragraph={{ width: '100%' }} active />
                    </div>
                ) : (
                    <Form form={form} component={false}>
                        <ModalConfirm
                            isOpened={modalDelete ? true : false}
                            ssssssssssss
                            onAction={(action: any) => {
                                if (action) {
                                    return handleDelete(modalDelete as string);
                                }
                                setModalDelete(undefined);
                            }}
                        >
                            <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                            <p style={{ margin: '10px 0px 17px' }}>
                                {getTranslation(
                                    'Are you sure you want to delete the custom flow? It might be in use in the tree or broadcast list.'
                                )}
                            </p>
                        </ModalConfirm>
                        <Table
                            locale={locale}
                            components={components}
                            bordered
                            style={{
                                background: '#fff',
                                borderRadius: '3px',
                            }}
                            dataSource={data}
                            columns={renderedColumns}
                            pagination={false}
                        />
                    </Form>
                )}
            </ScrollView>
        </>
    );
};

export default I18n(CustomFlow) as FC<CustomFlowProps>;
