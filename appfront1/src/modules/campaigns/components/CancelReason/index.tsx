import { FC, useEffect, useState } from 'react';
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import { CancelReasonProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { ScrollView } from '../../../settings/components/ScrollView';
import Header from '../../../../shared-v2/Header/Header';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { timeout } from '../../../../utils/Timer';
import { Empty, Form, Input, Popconfirm, Skeleton, Table } from 'antd';
import styled from 'styled-components';
import { MdCancel, MdDone, MdEdit } from 'react-icons/md';
import { v4 } from 'uuid';
import { CancelReasonDto } from '../../interfaces/cancel-reason';
import { CancelReasonService } from '../../service/CancelReasonService';

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

const EditableCell: FC<any> = (props) => {
    const { editing, dataIndex, title, inputType, record, index, children, ...restProps } = props;

    return (
        <td {...restProps}>
            {editing && record ? (
                <Form.Item
                    className='formStatus'
                    style={{ margin: '0' }}
                    name={dataIndex}
                    key={record.key}
                    initialValue={record.reasonName}
                >
                    <Input placeholder='Digite um motivo para cancelamento' onChange={() => {}} value={record.reasonName} />
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

const CancelReason: FC<CancelReasonProps & I18nProps> = ({ getTranslation, workspaceId, menuSelected }) => {
    const [cancelReasonList, setCancelReasonList] = useState<CancelReasonDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<any[]>([]);
    const [editingKey, setEditingKey] = useState('');

    const locale = {
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getTranslation('No Data')} />,
    };

    const [form] = Form.useForm();

    useEffect(() => {
        getCancelReasonList();
    }, [workspaceId]);

    const getCancelReasonList = async () => {
        const response = await CancelReasonService.getCancelReasonList(workspaceId);

        if (response) {
            setCancelReasonList(response);

            const dataSource = response.map((reason, index) => {
                return {
                    key: index,
                    reasonId: reason.id,
                    reasonName: reason.reasonName,
                    operation: reason,
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
            title: <Wrapper fontWeight='bold'>{getTranslation('ID')}</Wrapper>,
            dataIndex: 'reasonId',
            width: '10%',
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Motivo de cancelamento')}</Wrapper>,
            dataIndex: 'reasonName',
            width: '85%',
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
            reasonName: row.reasonName,
        };

        if (cancelReasonList.length && cancelReasonList[key]?.id) {
            const reasonId = cancelReasonList[key].id;

            await CancelReasonService.updateCancelReason(workspaceId, reasonId, { reasonName: row.reasonName });
        } else {
            const response = await CancelReasonService.createCancelReason(workspaceId, {
                reasonName: row.reasonName,
            });
            if (response) {
                let newCancelReason = cancelReasonList;
                newCancelReason.unshift({
                    ...response,
                    reasonName: response.reasonName,
                    id: response?.id,
                });
                setCancelReasonList(newCancelReason);
                newData = newCancelReason.map((reason, index) => {
                    return {
                        key: index,
                        reasonId: reason.id,
                        reasonName: reason.reasonName,
                        operation: reason,
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
                reasonName: '',
            },
            ...prevState,
        ]);
        setEditingKey(tempKey);
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
            <ScrollView padding='16px 24px' minWidth='900px' id='content-cancel-reason'>
                {loading ? (
                    <div style={{ background: '#fff', padding: '10px' }}>
                        <Skeleton paragraph={{ width: '100%' }} active />
                    </div>
                ) : (
                    <Form form={form} component={false}>
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

export default I18n(CancelReason) as FC<CancelReasonProps>;
