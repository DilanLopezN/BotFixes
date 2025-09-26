import { FC, useEffect, useState } from 'react';
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import { ActiveMessageStatusProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { ScrollView } from '../../../settings/components/ScrollView';
import Header from '../../../../shared-v2/Header/Header';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { ActiveMessageStatusData } from '../../interfaces/active-message-setting-dto';
import { CampaignsService } from '../../service/CampaignsService';
import { timeout } from '../../../../utils/Timer';
import { Empty, Form, Input, InputNumber, Popconfirm, Skeleton, Table } from 'antd';
import { ModalConfirm } from '../../../../shared/ModalConfirm/ModalConfirm';
import styled from 'styled-components';
import { MdCancel, MdDelete, MdDone, MdEdit } from 'react-icons/md';
import { v4 } from 'uuid';

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
                dataIndex === 'statusCode' ? (
                    <Form.Item
                        className='formStatus'
                        style={{ margin: '0' }}
                        name={dataIndex}
                        initialValue={record.statusCode}
                    >
                        <InputNumber onChange={() => {}} value={record.statusCode} />
                    </Form.Item>
                ) : (
                    <Form.Item
                        className='formStatus'
                        style={{ margin: '0' }}
                        name={dataIndex}
                        initialValue={record.statusName}
                    >
                        <Input onChange={() => {}} value={record.statusName} />
                    </Form.Item>
                )
            ) : (
                children
            )}
        </td>
    );
};

const ActiveMessageStatus: FC<ActiveMessageStatusProps & I18nProps> = ({
    getTranslation,
    workspaceId,
    menuSelected,
}) => {
    const [workspaceActiveMessageStatus, setWorkspaceActiveMessageStatus] = useState<ActiveMessageStatusData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<any[]>([]);
    const [editingKey, setEditingKey] = useState('');
    const [modalDelete, setModalDelete] = useState<string | undefined>(undefined);

    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };

    const [form] = Form.useForm();

    useEffect(() => {
        getWorkspaceActiveMessageStatus();
    }, [workspaceId]);

    const getWorkspaceActiveMessageStatus = async () => {
        const response = await CampaignsService.getStatusActiveMessages(workspaceId);

        if (response) {
            setWorkspaceActiveMessageStatus(response);

            const dataSource = response.map((status, index) => {
                return {
                    key: index,
                    statusName: status.statusName,
                    statusCode: status.statusCode,
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
            dataIndex: 'statusName',
            width: '47%',
            editable: true,
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Code')}</Wrapper>,
            dataIndex: 'statusCode',
            width: '47%',
            editable: true,
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
                        <SaveIcon title={getTranslation('Save')} onClick={() => save(record.key)} />
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

    const save = async (key) => {
        const row = await form.getFieldsValue();

        let newData = data;
        newData[key] = {
            ...newData[key],
            statusName: row.statusName,
            statusCode: row.statusCode,
        };

        if (workspaceActiveMessageStatus.length && workspaceActiveMessageStatus[key]?.id) {
            const statusId = workspaceActiveMessageStatus[key].id;
            const statusEdited = {
                ...workspaceActiveMessageStatus[key],
                statusName: row.statusName,
                statusCode: row.statusCode,
            };

            await CampaignsService.updateActiveMessageStatus(workspaceId, statusId as string, statusEdited);
        } else {
            const response = await CampaignsService.createActiveMessageStatus(workspaceId, {
                statusCode: row.statusCode,
                statusName: row.statusName,
            });
            if (response) {
                let newActiveStatus = workspaceActiveMessageStatus;
                newActiveStatus.unshift({
                    statusCode: response.statusCode,
                    statusName: response.statusName,
                    id: response?.id,
                });
                setWorkspaceActiveMessageStatus(newActiveStatus);
                newData = newActiveStatus.map((status, index) => {
                    return {
                        key: index,
                        statusName: status.statusName,
                        statusCode: status.statusCode,
                        operation: status,
                    };
                });
            }
        }
        setData([...newData]);
        setEditingKey('');
    };

    const handleAdd = () => {
        const tempKey = v4();

        setData((prevState) => [
            {
                key: tempKey,
                statusName: '',
                statusCode: 0,
            },
            ...prevState,
        ]);
        setEditingKey(tempKey);
    };

    const handleDelete = async (key: string) => {
        await CampaignsService.deleteActiveMessageStatus(workspaceId, key);

        setData((prevState) => [...prevState.filter((item) => item.operation.id !== key)]);
        setModalDelete(undefined);
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
                <Header
                    title={menuSelected.title}
                    action={<PrimaryButton onClick={() => handleAdd()}>{getTranslation('Add')}</PrimaryButton>}
                />
            </Wrapper>
            <ScrollView padding='16px 24px' minWidth='900px' id='content-active-message-status'>
                {loading ? (
                    <div style={{ background: '#fff', padding: '10px' }}>
                        <Skeleton paragraph={{ width: '100%' }} active />
                    </div>
                ) : (
                    <Form form={form} component={false}>
                        <ModalConfirm
                            isOpened={modalDelete ? true : false}
                            onAction={(action: any) => {
                                if (action) {
                                    return handleDelete(modalDelete as string);
                                }
                                setModalDelete(undefined);
                            }}
                        >
                            <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                            <p style={{ margin: '10px 0px 17px' }}>
                                {getTranslation('Are you sure you want to delete the status?')}
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

export default I18n(ActiveMessageStatus) as FC<ActiveMessageStatusProps>;
