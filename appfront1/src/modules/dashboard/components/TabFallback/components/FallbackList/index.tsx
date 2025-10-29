import { FC, useEffect, useState } from 'react';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import { FallbackListProps } from './props';
import { Icon, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { DashboardService } from '../../../../services/DashboardService';
import { Fallback } from '../../../../../../model/Fallback';
import { Table, Tag, Form, Dropdown, Menu, Input, MenuProps } from 'antd';
import { CreatableSelectTags } from '../../../../../../shared/StyledForms/CreatableSelectTags/CreatableSelectTags';
import { ColumnProps } from 'antd/lib/table';
import '../../style.scss';
import moment from 'moment';
import styled from 'styled-components';
import { TextLink } from '../../../../../../shared/TextLink/styled';
import DownloadModal from '../../../../../../shared/DownloadModal';
import { FallbackExportInterface } from '../FallbackFilter/props';
import { typeDownloadEnum } from '../../../../../../shared/DownloadModal/props';
import { addNotification } from '../../../../../../utils/AddNotification';
const { Search } = Input;

const ButtonSelect = styled(Dropdown.Button)`
    span {
        color: #fff !important;
    }
`;

interface FiltersFallbacks {
    skip: number;
    total: number;
    limit: number;
    search?: string;
}

const EditableCell: FC<any> = (props) => {
    const { editing, dataIndex, title, inputType, record, index, children, ...restProps } = props;

    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item
                    initialValue={record.tags.map((tag) => {
                        return { label: tag, value: tag };
                    })}
                    className='formFallback'
                    style={{ margin: '0' }}
                    name='tags'
                >
                    {dataIndex === 'tags' && (
                        <CreatableSelectTags
                            isDisabled={false}
                            placeholder='Tags'
                            onChange={() => {}}
                            value={record.tags.map((tag) => {
                                return { label: tag, value: tag };
                            })}
                        />
                    )}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

const FallbackList: FC<FallbackListProps & I18nProps> = ({ getTranslation, selectedWorkspace, appliedFilters }) => {
    const [filters, setFilters] = useState<FiltersFallbacks>({ total: 0, skip: 0, limit: 10 });
    const [dataSource, setDataSource] = useState<any[]>([]);
    const [editingKey, setEditingKey] = useState('');
    const [fallBacks, setFallbacks] = useState<Fallback[] | undefined>(undefined);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form] = Form.useForm();

    useEffect(() => {
        getFallbacksWorkspace({ total: 0, skip: 0, limit: 10 }, filters.search);
    }, [appliedFilters]);

    const getFallbacksWorkspace = async (currFilter: FiltersFallbacks, search?: string) => {
        setLoading(true);
        const response = await DashboardService.getFallbacksWorkspace(
            selectedWorkspace._id as string,
            currFilter.skip,
            currFilter.limit,
            search,
            undefined,
            appliedFilters
        );

        setLoading(false);
        if (response) {
            setFallbacks(response.data);
            setFilters({ ...filters, total: response.count, skip: response.currentPage, search: search });
            data(response.data);
        }
    };

    const columns = [
        {
            className: 'columnHeader',
            width: '10px',
            title: '',
            dataIndex: 'status',
            key: 'status',
            render: (obj) => (
                <div
                    title={getTranslation(obj.status)}
                    style={{
                        height: '18px',
                        width: '12px',
                        borderRadius: '0 4px 4px 0',
                        margin: ' auto -16px',
                        background: obj.color,
                    }}
                />
            ),
            editable: false,
        },
        {
            className: 'columnHeader',
            width: '70px',
            title: getTranslation('Date'),
            dataIndex: 'date',
            key: 'date',
            editable: false,
            render: (text) => <div>{moment(text).format('DD/MM/YYYY - HH:mm')}</div>,
        },
        {
            className: 'columnHeader',
            ellipsis: true,
            width: '40%',
            title: getTranslation('Message'),
            dataIndex: 'message',
            key: 'message',
            editable: false,
            render: (text) => (
                <div
                    style={{
                        width: '100%',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                    }}
                    title={text}
                >
                    {text}
                </div>
            ),
        },
        {
            className: 'columnHeader',
            width: '35%',
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (tags) => (
                <>
                    {tags.map((tag) => {
                        return (
                            <Tag
                                style={{
                                    textOverflow: 'ellipsis',
                                    maxWidth: '70px',
                                    overflow: 'hidden',
                                }}
                                title={tag}
                                color='blue'
                                key={tag}
                            >
                                {tag}
                            </Tag>
                        );
                    })}
                </>
            ),
            editable: true,
        },
        {
            className: 'columnHeader',
            width: '40px',
            title: '',
            dataIndex: 'ações',
            align: 'right',
            render: (_: any, record: any) => {
                const editable = isEditing(record);
                return editable ? (
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Icon
                            className='editFallback'
                            size='18px'
                            name='content-save-edit-outline'
                            title={getTranslation('Save')}
                            onClick={() => save(record.key)}
                        />
                        <Icon
                            className='cancelEdit'
                            style={{ marginLeft: '7px' }}
                            size='18px'
                            name='close-circle'
                            title={getTranslation('Cancel')}
                            onClick={() => cancel()}
                        />
                    </span>
                ) : (
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Icon
                            className='editFallback'
                            style={{ marginRight: '7px' }}
                            size='18px'
                            name='pencil'
                            title={getTranslation('Edit')}
                            onClick={() => edit(record)}
                        />
                        <TextLink
                            style={{ color: '#696969' }}
                            title={getTranslation('Go to conversation')}
                            className='mdi mdi-share mdi-18px goToConversation'
                            href={`/live-agent?workspace=${record.actions.workspaceId}&conversation=${record.actions.conversationId}`}
                            target='_blank'
                        />
                    </span>
                );
            },
        },
    ];

    const data = (fallbackList: Fallback[]) => {
        const data = fallbackList.map((fallback, index) => {
            const color = () => {
                if (fallback.status === 'new') {
                    return 'red';
                } else if (fallback.status === 'solved') {
                    return 'green';
                } else if (fallback.status === 'ignored') {
                    return 'orange';
                }
            };

            return {
                key: index,
                status: {
                    status: fallback.status,
                    color: color(),
                },
                message: fallback.message,
                date: Number(fallback.recognizedTimestamp),
                tags: fallback.tags,
                actions: {
                    workspaceId: fallback.workspaceId,
                    conversationId: fallback?.conversationId,
                },
            };
        });

        return setDataSource(data);
    };

    const isEditing = (record) => record.key === editingKey;

    const cancel = () => {
        setEditingKey('');
    };

    const edit = (record) => {
        setEditingKey(record.key);
    };

    const save = async (key) => {
        const row = await form.getFieldsValue();

        let newData = dataSource;
        newData[key] = {
            ...newData[key],
            tags: row.tags.map((tag) => tag.value),
        };
        setDataSource([...newData]);
        setEditingKey('');

        if (fallBacks) {
            const fallbackId: string = fallBacks[key]._id;
            const fallbackEdited = { ...fallBacks[key], tags: row.tags.map((tag) => tag.value) };
            await DashboardService.updateFallback(selectedWorkspace._id as string, fallbackId, fallbackEdited);
        }
    };

    const mergedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record: any) => ({
                record,
                inputType: 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: getTranslation('New'),
            onClick: () => updateStatus('new'),
        },
        {
            key: '2',
            label: getTranslation('Ignored'),
            onClick: () => updateStatus('ignored'),
        },
    ];

    const onSelectChange = (selectedRowKeys) => {
        setSelectedRowKeys(selectedRowKeys);
    };

    const updateStatus = async (value) => {
        const color = (status) => {
            if (status === 'new') {
                return 'red';
            } else if (status === 'solved') {
                return 'green';
            } else if (status === 'ignored') {
                return 'orange';
            }
        };
        if (selectedRowKeys.length > 0 && fallBacks) {
            await selectedRowKeys.forEach((key) => {
                const fallbackId = fallBacks[key]._id;
                const fallbackEdited = { ...fallBacks[key], status: value };

                DashboardService.updateFallback(selectedWorkspace._id as string, fallbackId, fallbackEdited);
                let newData = dataSource;
                newData[key] = {
                    ...newData[key],
                    status: {
                        status: value,
                        color: color(value),
                    },
                };
                setDataSource([...newData]);
            });
            setSelectedRowKeys([]);
        }
        return;
    };

    const downloadFallback = async (downloadType: string) => {
        const filter: FallbackExportInterface = {
            downloadType: downloadType === 'XLSX' ? typeDownloadEnum.XLSX : typeDownloadEnum.CSV,
        };

        if (!appliedFilters.rangeDate?.length) {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Selecione um perído para realizar o download'),
            });
            return;
        }

        if (moment(appliedFilters.rangeDate[1]).diff(moment(appliedFilters.rangeDate[0]), 'days') > 93) {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Perído Máximo de 90 dias para download'),
            });
            return;
        }

        if (appliedFilters.rangeDate) {
            filter.rangeDate = appliedFilters.rangeDate as any;
        }

        await DashboardService.getFallbackCsv(selectedWorkspace._id as string, filter);
    };

    return (
        <Wrapper>
            <Wrapper flexBox margin='0 0 10px 0' justifyContent={'space-between'}>
                <Wrapper flexBox justifyContent='flex-start'>
                    {selectedRowKeys.length > 0 && (
                        <ButtonSelect
                            title={getTranslation('Status')}
                            type={'primary'}
                            style={{ borderRadius: '3px', marginRight: '10px' }}
                            onClick={() => updateStatus('solved')}
                            menu={{ items }}
                        >
                            {getTranslation('Solved')}
                        </ButtonSelect>
                    )}
                    <DownloadModal onDownload={downloadFallback} />
                </Wrapper>
                <Search
                    allowClear
                    placeholder={`${getTranslation('Search message')}..`}
                    style={{ width: '300px' }}
                    value={filters.search}
                    onChange={(event) => {
                        setFilters((prevState) => ({ ...prevState, search: event.target.value }));
                    }}
                    onSearch={(value) => {
                        getFallbacksWorkspace({ total: 0, skip: 0, limit: filters?.limit || 10 }, value);
                    }}
                />
            </Wrapper>
            <Form form={form} component={false}>
                <Table
                    loading={loading}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: onSelectChange,
                        columnWidth: '25px',
                    }}
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    columns={mergedColumns as ColumnProps<any>[]}
                    dataSource={dataSource}
                    style={{
                        marginBottom: '10px',
                        background: '#fff',
                        border: '1px solid #e8e8e8',
                        borderBottom: 'none',
                        borderRadius: '3px',
                    }}
                    className='mb-4'
                    pagination={{
                        showSizeChanger: true,
                        total: filters?.total,
                        onChange: (page, pageSize) => {
                            cancel();
                            getFallbacksWorkspace(
                                {
                                    total: filters?.total as number,
                                    skip: (page - 1) * (pageSize || 10),
                                    limit: pageSize || 10,
                                },
                                filters.search
                            );
                        },
                    }}
                />
            </Form>
        </Wrapper>
    );
};

export default i18n(FallbackList) as FC<FallbackListProps>;
