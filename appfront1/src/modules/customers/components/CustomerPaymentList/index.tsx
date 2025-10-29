import { FC, useEffect, useState } from 'react';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { Popconfirm, Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { CustomersService } from '../../service/BillingService';
import { CustomerPaymentListProps } from './props';
import moment from 'moment';
import { TicketIcon, DeleteIcon, AddItemIcon, SyncIcon, EditIcon } from './styled';
import { Payment } from '../../page/Customers/interfaces';
import PaymentItemForm, { initialFormPaymentItem } from './components/PaymentItemForm';
import { PaymentItem } from '../../interfaces/payment-item.interface';

export interface FiltersCustomerPayments {
    skip: number;
    total: number;
    limit: number;
}

const CustomerPaymentList: FC<CustomerPaymentListProps & I18nProps> = ({
    getTranslation,
    customer,
    addNotification,
    newPayment,
}) => {
    const [dataSource, setDataSource] = useState<any>([]);
    const [payments, setPayments] = useState<any>([]);
    const [filters, setFilters] = useState<FiltersCustomerPayments>({ total: 0, skip: 0, limit: 10 });
    const [selectedItem, setSelectedItem] = useState<PaymentItem | undefined>(undefined);

    useEffect(() => {
        generateData(filters);
    }, [customer]);

    useEffect(() => {
        if (newPayment && newPayment.id) {
            let newData = [...payments];
            newData.unshift(newPayment);
            formData(newData);
        }
    }, [newPayment]);

    const generateData = async (applyFilters: FiltersCustomerPayments) => {
        const { data, count } = await CustomersService.getPayments(customer.id, applyFilters);

        if (!data) return;
        setFilters((prev) => ({ ...prev, total: count }));

        formData(data);
    };

    const deletePayment = async (paymentId, index) => {
        let error;

        await CustomersService.deletePayment(paymentId, (err) => {
            error = err;
        });

        if (error) return;

        const newData = dataSource.filter((data) => data.key !== index);
        const newPayments = payments.filter((payment) => payment.id !== paymentId);

        setPayments(newPayments);
        setDataSource(newData);
    };

    const columns: ColumnProps<any>[] = [
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Status')}</Wrapper>,
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Date')}</Wrapper>,
            dataIndex: 'date',
            align: 'center',
            key: 'date',
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('dueDate')}</Wrapper>,
            dataIndex: 'dueDate',
            align: 'center',
            key: 'dueDate',
            render: (dueDate) => <div>{`${dueDate ? moment(parseFloat(dueDate)).format('DD/MM') : '-'}`}</div>,
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Period')}</Wrapper>,
            dataIndex: 'period',
            align: 'center',
            key: 'period',
            render: (period) => (
                <div>{`${moment(parseFloat(period.billingStartDate)).format('DD/MM/YYYY')} - 
                ${moment(parseFloat(period.billingEndDate)).format('DD/MM/YYYY')}`}</div>
            ),
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Total')}</Wrapper>,
            dataIndex: 'total',
            align: 'center',
            key: 'total',
            render: (total) => {
                return (
                    <Wrapper>{`${parseFloat(total).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 3,
                    })}`}</Wrapper>
                );
            },
        },
        {
            title: <Wrapper fontWeight='bold'>{getTranslation('Actions')}</Wrapper>,
            dataIndex: 'actions',
            key: 'actions',
            width: '150px',
            render: (actions) => (
                <>
                    {!actions.gateway && actions.status === 'opened' && (
                        <>
                            <AddItemIcon
                                title={getTranslation('Adicionar novo item na cobrança')}
                                onClick={() => {
                                    setSelectedItem({
                                        ...initialFormPaymentItem,
                                        paymentId: actions.paymentId,
                                        workspaceId: actions.payment.workspaceId,
                                    });
                                }}
                            />
                            <Popconfirm
                                title={getTranslation('Do you really want to generate the billet?')}
                                placement={'top'}
                                cancelButtonProps={{
                                    className: 'antd-span-default-color'
                                }}
                                okButtonProps={{
                                    className: 'antd-span-default-color'
                                }}
                                onConfirm={() => generateBillet(actions.payment, actions.paymentId, actions.index)}
                            >
                                <TicketIcon title={getTranslation('Generate billet')} />
                            </Popconfirm>
                        </>
                    )}
                    <SyncIcon
                        title={getTranslation('Sincronizar pagamentos')}
                        onClick={() => syncPayment(actions.paymentId)}
                    />
                    {actions.status === 'opened' || actions.status === 'deleted' ? (
                        <Popconfirm
                            title={
                                <Wrapper maxWidth='170px'>
                                    {getTranslation(
                                        'Are you sure you want to delete the payment? The action cannot be undone'
                                    )}
                                </Wrapper>
                            }
                            cancelButtonProps={{
                                className: 'antd-span-default-color'
                            }}
                            okButtonProps={{
                                className: 'antd-span-default-color'
                            }}
                            placement={'top'}
                            onConfirm={() => deletePayment(actions.paymentId, actions.index)}
                        >
                            <DeleteIcon title={getTranslation('Delete')} />
                        </Popconfirm>
                    ) : null}
                </>
            ),
        },
    ];

    const generateBillet = async (payment: Payment, paymentId, index) => {
        const response = await CustomersService.createBillet(paymentId, payment);

        if (response) {
            let newData = [...payments];
            newData[index] = { ...response };
            formData(newData);
            return addNotification({
                title: getTranslation('Success'),
                message: getTranslation('Success'),
                type: 'success',
                duration: 3000,
            });
        }
    };

    const syncPayment = async (paymentId: number) => {
        let error;
        await CustomersService.syncronizePaymentById(paymentId, (err) => {
            error = err;
        });

        if (!error) {
            generateData(filters);
            return addNotification({
                title: getTranslation('Success'),
                message: getTranslation('Successfully synced'),
                type: 'success',
                duration: 3000,
            });
        }
    };

    const expandedRowRender = (record) => {
        const columns: ColumnProps<any>[] = [
            {
                title: <Wrapper fontWeight='bold'>{getTranslation('Item')}</Wrapper>,
                dataIndex: 'item',
                key: 'item',
                render: (text) => {
                    if (text === 'Total:') {
                        return <Wrapper fontWeight='bold'>{text}</Wrapper>;
                    }
                    return <Wrapper>{text}</Wrapper>;
                },
            },
            {
                title: <Wrapper fontWeight='bold'>{getTranslation('Value')}</Wrapper>,
                dataIndex: 'value',
                key: 'value',
                render: (value) => {
                    if (value === '') {
                        return <Wrapper />;
                    }
                    return (
                        <Wrapper>{`${parseFloat(value).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 3,
                        })}`}</Wrapper>
                    );
                },
            },
            {
                title: <Wrapper fontWeight='bold'>{getTranslation('Quantity')}</Wrapper>,
                dataIndex: 'qtd',
                align: 'center',
                key: 'qtd',
                render: (text) => {
                    if (text === '') {
                        return <Wrapper />;
                    }
                    return <Wrapper>{text}</Wrapper>;
                },
            },
            {
                title: <Wrapper fontWeight='bold'>{getTranslation('Total')}</Wrapper>,
                dataIndex: 'total',
                key: 'total',
                render: (total) => {
                    return (
                        <Wrapper>{`${parseFloat(total).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 3,
                        })}`}</Wrapper>
                    );
                },
            },
            {
                title: <Wrapper fontWeight='bold'>{getTranslation('Actions')}</Wrapper>,
                dataIndex: 'action',
                key: 'action',
                render: (item, record) => {
                    if (!item?.id || record.status !== 'opened') {
                        return null;
                    }
                    return (
                        <Wrapper flexBox>
                            <Popconfirm
                            title={
                                <Wrapper maxWidth='170px'>
                                    {getTranslation(
                                        'Tem certeza que deseja excluir este item da cobrança?'
                                    )}
                                </Wrapper>
                            }
                            cancelButtonProps={{
                                className: 'antd-span-default-color'
                            }}
                            okButtonProps={{
                                className: 'antd-span-default-color'
                            }}
                            placement={'top'}
                            onConfirm={() => deletePaymentItem(item.workspaceId, item.paymentId, item.id)}
                        >
                            <DeleteIcon title={getTranslation('Delete')} />
                        </Popconfirm>
                        <EditIcon title={getTranslation('Edit')} onClick={() => {
                            setSelectedItem(item)
                        }} />
                        </Wrapper>
                    );
                },
            },
        ];

        const payment = record;
        const itemTotal = record.items.find((i) => i.itemDescription === 'Total:');

        if (!itemTotal) {
            payment.items.push({ itemDescription: 'Total:', quantity: '', totalPrice: record.total, unitPrice: '' });
        }

        const data = payment.items?.map((item, index) => {
            return {
                key: index,
                item: item?.itemDescription,
                value: item?.unitPrice,
                total: item?.totalPrice,
                qtd: item?.quantity,
                status: payment.actions.status,
                gateway: payment.actions.gateway,
                action: {
                    ...item,
                    workspaceId: payment.workspaceId,
                    paymentId: payment.paymentId,
                }
            };
        });

        return <Table columns={columns} dataSource={data} pagination={false} />;
    };

    const deletePaymentItem = async (workspaceId: string, paymentId: number, paymentItemId: number  ) => {
        if (!workspaceId || !paymentId || !paymentItemId) {
            return;
        }
        let error;
        await CustomersService.deletePaymentItem(
            workspaceId,
            paymentId,
            paymentItemId,
            (erro) => {
                error = erro;
            }
        );

        if (!error) {
            addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Item excluido com sucesso!'),
            });
            generateData(filters)
            return;
        }

        addNotification({
            type: 'warning',
            title: getTranslation('Error'),
            message: getTranslation('Erro ao excluir item, tente novamente!'),
        });
    };

    const formData = (payments) => {
        setPayments(payments);

        const data = payments.map((i, index) => {
            const total = (items) => {
                let value = 0;
                let sum = items?.reduce((accum, curr) => accum + Number(curr?.totalPrice || 0), value);

                return sum;
            };

            return {
                key: index,
                status: getTranslation(i.status[0].toUpperCase() + i.status.substr(1)),
                date: i.billingMonth,
                dueDate: i.gatewayDueDate,
                period: {
                    billingStartDate: i.billingStartDate,
                    billingEndDate: i.billingEndDate,
                },
                total: total(i.items),
                items: i.items,
                workspaceId: i.workspaceId,
                paymentId: i.id,
                actions: {
                    index: index,
                    status: i.status,
                    gateway: i.gatewayPaymentId,
                    paymentId: i.id,
                    payment: {
                        accountId: i.accountId,
                        workspaceId: i.workspaceId,
                    },
                },
            };
        });

        return setDataSource(data);
    };

    return (
        <>
            <Wrapper bgcolor='#fff' width='70%' minWidth='800px' margin='0 auto' flexBox>
                <PaymentItemForm
                    cancel={() => setSelectedItem(undefined)}
                    onClose={() => {
                        setSelectedItem(undefined)
                        generateData(filters);
                    }}
                    paymentItem={selectedItem}
                />
                <Table
                    style={{
                        background: '#fff',
                        border: '1px solid #e8e8e8',
                        borderBottom: 'none',
                        borderRadius: '3px',
                        width: '100%',
                    }}
                    columns={columns}
                    dataSource={dataSource}
                    expandable={{
                        expandedRowRender: (record) => expandedRowRender(record),
                    }}
                    pagination={{
                        total: filters?.total,
                        onChange: (page) => {
                            const newFilter = {
                                total: filters?.total as number,
                                skip: (page - 1) * (filters?.limit || 10),
                                limit: filters?.limit || 10,
                            };
                            setFilters(newFilter);
                            generateData(newFilter);
                        },
                    }}
                />
            </Wrapper>
        </>
    );
};

export default i18n(CustomerPaymentList);
