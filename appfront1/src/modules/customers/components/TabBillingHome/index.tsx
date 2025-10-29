import { DatePicker, Dropdown, MenuProps, Popover } from 'antd';
import moment from 'moment';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import Header from '../../../newChannelConfig/components/Header';
import { CustomersService } from '../../service/BillingService';
import CustomerList from '../CustomerList';
import { TabBillingHomeProps } from './props';

const { MonthPicker } = DatePicker;

const ButtonSelect = styled(Dropdown.Button)``;

const ScrollView = styled(Wrapper)`
    width: 100%;
    height: calc(100vh - 100px);
    overflow-y: auto;
`;

const TabBillingHome: FC<TabBillingHomeProps & I18nProps> = ({ getTranslation, menuSelected, addNotification }) => {
    const [loading, setLoading] = useState(false);
    const [visiblePopover, setVisiblePopover] = useState<string | undefined>(undefined);
    const [date, setDate] = useState<any>(moment());
    const [key, setKey] = useState(moment().valueOf());

    const generateAllPayment = async () => {
        if (!date) return;
        setVisiblePopover(undefined);

        setLoading(true);
        let error;
        const previousMonthDate = moment(date.valueOf()).subtract(1, 'months');
        await CustomersService.createAllPayment(previousMonthDate.format('MM/YY'), (err) => {
            error = err;
        });

        setLoading(false);
        setKey(moment().valueOf());
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

    const generateAllBillet = async () => {
        if (!date) return;
        setVisiblePopover(undefined);

        setLoading(true);
        let error;
        await CustomersService.createAllBillet(moment(date.valueOf()).format('MM/YY'), (err) => {
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

    const syncPaymentInvoices = async () => {
        if (!date) return;
        setVisiblePopover(undefined);
        setLoading(true);
        let error;
        await CustomersService.syncPaymentInvoices(moment(date.valueOf()).format('MM/YY'), (err) => {
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

    const generateCreateAllInvoice = async () => {
        if (!date) return;
        setVisiblePopover(undefined);

        setLoading(true);
        let error;
        const response = await CustomersService.createAllInvoice(moment(date.valueOf()).format('MM/YY'), (err) => {
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

        if (response.total === 0) {
            return addNotification({
                message: `${getTranslation('There is no grade to generate for the selected month!')}`,
                type: 'warning',
                duration: 5000,
            });
        }

        addNotification({
            title: getTranslation('Success'),
            message: `
            ${getTranslation('Total: ')}${response.total}, 
            ${getTranslation('Success')}: ${response.total - response.error}, 
            ${getTranslation('Error')}: ${response.error}
            `,
            type: 'success',
            duration: 10000,
        });
    };

    const syncPayment = async () => {
        let error;
        await CustomersService.syncronizePayment((err) => {
            error = err;
        });

        if (!error) {
            return addNotification({
                title: getTranslation('Success'),
                message: getTranslation('Success'),
                type: 'success',
                duration: 3000,
            });
        }
    };

    const content = (
        <Wrapper>
            <Wrapper maxWidth={'200px'}>
                {visiblePopover === 'generateAllBillet'
                    ? getTranslation('Select for which month the slips should be generated:')
                    : visiblePopover === 'generateAllPayment'
                    ? getTranslation('Select which month the charges should be generated:')
                    : visiblePopover === 'syncPaymentInvoices'
                    ? getTranslation('Select in which month the notes should be synced:')
                    : visiblePopover === 'generateCreateAllInvoice'
                    ? getTranslation('Select for which month the notes should be generated:')
                    : null}
            </Wrapper>
            <MonthPicker
                style={{
                    width: '100%',
                    margin: '10px 0',
                }}
                value={visiblePopover === 'generateAllPayment' ? moment(date).subtract(1, 'months') : moment(date)}
                format={'MM/YY'}
                onChange={(date) => {
                    if (date === null) {
                        date = moment();
                    }

                    return setDate(date);
                }}
            />
            <Wrapper flexBox justifyContent={'space-between'}>
                <PrimaryButton
                    onClick={() => {
                        setDate(moment());
                        return setVisiblePopover(undefined);
                    }}
                >
                    {getTranslation('Cancel')}
                </PrimaryButton>
                <PrimaryButton
                    onClick={() => {
                        if (visiblePopover === 'generateAllBillet') {
                            return generateAllBillet();
                        }
                        if (visiblePopover === 'generateAllPayment') {
                            return generateAllPayment();
                        }
                        if (visiblePopover === 'syncPaymentInvoices') {
                            return syncPaymentInvoices();
                        }
                        if (visiblePopover === 'generateCreateAllInvoice') {
                            return generateCreateAllInvoice();
                        }
                    }}
                >
                    {getTranslation('Ok')}
                </PrimaryButton>
            </Wrapper>
        </Wrapper>
    );

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: getTranslation('Generate next charge for all'),
            onClick: () => {
                setDate(moment());
                setVisiblePopover('generateAllPayment');
            },
        },
        {
            key: '2',
            label: getTranslation('Generate billet for everyone'),
            onClick: () => {
                setDate(moment());
                setVisiblePopover('generateAllBillet');
            },
        },
        {
            key: '3',
            label: getTranslation('Generate grade for everyone'),
            onClick: () => {
                setDate(moment());
                setVisiblePopover('generateCreateAllInvoice');
            },
        },
        {
            key: '4',
            label: getTranslation('Sincronizar pagamentos'),
            onClick: () => syncPayment(),
        },
    ];

    return (
        <Wrapper className='billingHomeTab'>
            <Header
                title={menuSelected.title}
                action={
                    <Wrapper flexBox alignItems='center'>
                        <Popover autoAdjustOverflow open={!!visiblePopover} placement={'bottomLeft'} content={content}>
                            <ButtonSelect
                                onClick={() => {
                                    setDate(moment());
                                    setVisiblePopover('syncPaymentInvoices');
                                }}
                                disabled={loading}
                                type={'primary'}
                                menu={{ items }}
                            >
                                <span style={{ color: !loading ? '#fff' : '' }}>{getTranslation('Sync notes')}</span>
                            </ButtonSelect>
                        </Popover>
                    </Wrapper>
                }
            />
            <ScrollView key={`${key}`}>
                <CustomerList
                    loading={loading}
                    setLoading={(value: boolean) => setLoading(value)}
                    addNotification={addNotification}
                />
            </ScrollView>
        </Wrapper>
    );
};
export default I18n(TabBillingHome) as FC<TabBillingHomeProps>;
