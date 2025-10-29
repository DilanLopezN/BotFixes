import { Space, Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import moment from 'moment';
import { FC, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { CustomersService } from '../../service/BillingService';
import { CustomerListProps, WorkspaceBilling } from './props';
import { InputSearch, NoteIcon, Redirect, Select } from './styled';
import { UserFilterType } from './workspace-filter-type';

const { Option } = Select;
export const normalizeSearchValue = (value) => {
    if (typeof value !== 'string') return '';
    return value.toLowerCase().trim();
};

const CustomerList: FC<CustomerListProps & I18nProps> = ({ getTranslation, loading, addNotification, setLoading }) => {
    const [dataSource, setDataSource] = useState<WorkspaceBilling[]>([]);

    const [selectedFilter, setSelectedFilter] = useState(UserFilterType.Active);
    const [searchInputValue, setSearchInputValue] = useState<string>('');

    useEffect(() => {
        const generateData = async () => {
            try {
                let response: WorkspaceBilling[];
                if (selectedFilter === UserFilterType.Inactive) {
                    response = await CustomersService.getWorkspacesWithPayment({ active: false });
                } else {
                    response = await CustomersService.getWorkspacesWithPayment();
                }
                if (response) {
                    const formattedData = formatData(response);
                    setDataSource(formattedData);
                } else {
                    console.error('Empty response received from server');
                }
            } catch (error) {
                addNotification({
                    title: getTranslation('Error'),
                    message: getTranslation('Failed to fetch data'),
                    type: 'error',
                    duration: 3000,
                });
            }
        };

        const formatData = (workspaces) => {
            return workspaces.map((w, index) => ({
                key: index,
                active: w.active,
                name: {
                    name: w.name,
                    id: w.id,
                    accountId: w.accountId,
                    overDueId: w.overDueId,
                },
                value: w?.value || 0,
                status: w?.status ? getTranslation(w?.status[0]?.toUpperCase() + w?.status?.substr(1)) : '-',
                date: w?.billingEndDate,
                actions: {
                    gatewayPaymentId: w?.gatewayPaymentId || null,
                    gatewayInvoiceId: w?.gatewayInvoiceId || null,
                    paymentId: w?.paymentId,
                },
            }));
        };

        generateData();
    }, [selectedFilter]);

    const createPaymentInvoice = async (paymentId) => {
        if (!paymentId) return;

        setLoading(true);
        let error;
        await CustomersService.createPaymentInvoice(paymentId, (err) => {
            error = err;
        });

        setLoading(false);
        if (error) {
            return addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Error'),
                type: 'warning',
                duration: 3000,
            });
        }

        addNotification({
            title: getTranslation('Success'),
            message: getTranslation('Success'),
            type: 'success',
            duration: 3000,
        });
    };

    const filteredResults = useMemo(() => {
        const lowerCaseQuery = normalizeSearchValue(searchInputValue);

        const isSearchValueIncluded = (workspace) =>
            workspace.name?.name && normalizeSearchValue(workspace.name.name).includes(lowerCaseQuery);

        let filteredData = dataSource;
        if (selectedFilter === UserFilterType.Active) {
            filteredData = dataSource.filter((workspace) => workspace.active === true);
        } else if (selectedFilter === UserFilterType.Inactive) {
            filteredData = dataSource.filter((workspace) => workspace.active === false);
        }

        return filteredData.filter((workspace) => isSearchValueIncluded(workspace));
    }, [dataSource, searchInputValue, selectedFilter]);

    const handleFilterChange = (value) => {
        setSelectedFilter(value);
    };

    const columns: ColumnProps<any>[] = [
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Name')}</Wrapper>,
            dataIndex: 'name',
            key: 'name',
            width: '40%',
            sorter: (a, b) => a.name.name.localeCompare(b.name.name),
            sortDirections: ['descend', 'ascend'],
            defaultSortOrder: 'ascend',
            render: (customer) => (
                <NavLink to={'/customers/workspaceId/' + customer.id + '/accountId/' + customer.accountId}>
                    <Redirect
                        color={customer.overDueId !== null ? 'red !important' : ''}
                        title={customer.overDueId !== null ? getTranslation('Contains overdue invoices') : ''}
                    >
                        {customer.name}
                    </Redirect>
                </NavLink>
            ),
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Status')}</Wrapper>,
            dataIndex: 'status',
            align: 'center',
            key: 'status',
            width: '20%',
            sorter: (a, b) => a.status.localeCompare(b.status),
            sortDirections: ['descend', 'ascend'],
            defaultSortOrder: 'ascend',
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Last payment')}</Wrapper>,
            dataIndex: 'date',
            align: 'center',
            key: 'date',
            width: '30%',
            render: (text) => <div>{text ? moment(parseFloat(text)).format('DD/MM/YYYY') : '-'}</div>,
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Value')}</Wrapper>,
            dataIndex: 'value',
            align: 'center',
            key: 'value',
            width: '100px',
            render: (value) => (
                <Wrapper>{`${parseFloat(value).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 3,
                })}`}</Wrapper>
            ),
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Actions')}</Wrapper>,
            dataIndex: 'actions',
            align: 'center',
            key: 'actions',
            width: '80px',
            render: (actions) => (
                <>
                    {actions.gatewayPaymentId !== null && actions.gatewayInvoiceId === null && (
                        <NoteIcon
                            title={getTranslation('Generate grade')}
                            onClick={() => createPaymentInvoice(actions.paymentId)}
                        />
                    )}
                </>
            ),
        },
    ];

    return (
        <>
            <Wrapper width='70%' minWidth='800px' margin='0 auto' flexBox flexDirection='column'>
                <Wrapper flexBox justifyContent='flex-end' margin='0 0 20px'>
                    <Space>
                        <Select value={selectedFilter} onChange={handleFilterChange}>
                            <Option value={UserFilterType.Active}>{getTranslation('Active')}</Option>
                            <Option value={UserFilterType.Inactive}>{getTranslation('Inactive')}</Option>
                        </Select>
                        <InputSearch
                            disabled={loading}
                            autoFocus
                            placeholder={getTranslation('Search')}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            allowClear
                        />
                    </Space>
                </Wrapper>
                <Table
                    loading={loading}
                    style={{
                        background: '#fff',
                        border: '1px solid #e8e8e8',
                        borderBottom: 'none',
                        borderRadius: '3px',
                        width: '100%',
                    }}
                    columns={columns}
                    showSorterTooltip={false}
                    dataSource={filteredResults}
                    pagination={false}
                />
            </Wrapper>
        </>
    );
};

export default i18n(CustomerList);
