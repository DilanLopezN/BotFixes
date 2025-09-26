import { FC, useEffect } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import Header from '../../../../../newChannelConfig/components/Header';
import { BillingsProps } from './props';
import I18n from '../../../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { useState } from 'react';
import moment from 'moment';
import { SettingsService } from '../../../../service/SettingsService';
import { Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';

const Billings: FC<BillingsProps> = (props) => {
    const { menuSelected, selectedWorkspace, getTranslation } = props;
    const [dataSource, setDataSource] = useState<any>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPayments();

    }, [selectedWorkspace]);

    const getPayments = async () => {
        setLoading(true);
        if (selectedWorkspace) {
            const response = await SettingsService.getCustomerPayments(selectedWorkspace._id);

            if (!response) return;
            data(response);
        }
        setLoading(false);
    }

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
    ];

    const data = (payments) => {
        const data = payments.map((i, index) => {
            const total = (items) => {
                let value = 0;
                let sum = items?.reduce((accum, curr) => accum + curr.totalPrice, value);

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
            };
        });

        return setDataSource(data);
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
            };
        });

        return <Table columns={columns} dataSource={data} pagination={false} />;
    };

    return (
        <>
            <Wrapper>
                <Header title={menuSelected.title}></Header>
            </Wrapper>
            <Wrapper flexBox justifyContent='center' height='calc(100vh - 70px)' overflowY='auto' padding={'30px'}>
                <Table
                    style={{
                        background: '#fff',
                        border: '1px solid #e8e8e8',
                        borderBottom: 'none',
                        borderRadius: '3px',
                        minWidth: '800px',
                        maxWidth: '1100px',
                        height: 'max-content',
                        width: '100%',
                    }}
                    columns={columns}
                    dataSource={dataSource}
                    loading={loading}
                    expandedRowRender={(record) => expandedRowRender(record)}
                    pagination={false}
                />
            </Wrapper>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default I18n(withRouter(connect(mapStateToProps, null)(Billings)));
