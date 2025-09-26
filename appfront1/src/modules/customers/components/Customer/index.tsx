import { FC, useEffect, useState } from 'react'
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import { ColorType } from '../../../../ui-kissbot-v2/theme';
import i18n from '../../../i18n/components/i18n'
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import CustomerPaymentList from '../CustomerPaymentList';
import LastPaymentCustomer from '../LastPaymentCustomer';
import { CustomerSummaryProps } from './props';
import { Payment } from '../../page/Customers/interfaces';
import { CustomersService } from '../../service/BillingService';
import { NavLink, useParams } from 'react-router-dom';
import { BiSync } from 'react-icons/bi';
import Header from '../../../newChannelConfig/components/Header';
import styled from 'styled-components';

const ScrollView = styled(Wrapper)`
    width: 100%;
    height: calc(100vh - 100px);
    overflow-y: auto;
`

const CustomerSummary: FC<CustomerSummaryProps & I18nProps> = ({
    getTranslation,
    addNotification,
    match,
    menuSelected,
}) => {
    const [customer, setCustomer] = useState<any>()
    const [payment, setPayment] = useState<any>()
    const params: any = useParams();

    useEffect(() => {
        const workspaceId = params.workspaceId
        const accountId = params.accountId
        if (workspaceId && accountId) {
            setCustomer({ id: workspaceId, accountId: Number(accountId) })
        }

    }, [match])

    const generateBilling = async (payment: Payment) => {
        let error
        const response = await CustomersService.createPayment(payment, (err) => {
            error = err
        })

        if (error) {
            return addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Error'),
                type: 'warning',
                duration: 3000
            })
        }
        setPayment(response)
    }

    return <>
        {
            customer &&
            <Wrapper>
                <Header
                    title={menuSelected.title}
                    action={
                        <Wrapper flexBox alignItems='center'>
                            <PrimaryButton
                                style={{ marginRight: '10px' }}
                                onClick={() => generateBilling({ accountId: customer.accountId, workspaceId: customer.id })}>
                                {getTranslation('Generate next charge')}
                            </PrimaryButton>
                            <NavLink to={'/customers/billing'}>
                                <PrimaryButton colorType={ColorType.text} >{getTranslation('Back')}</PrimaryButton>
                            </NavLink>
                        </Wrapper>
                    }
                />
                <ScrollView>
                    <Wrapper flexBox justifyContent='center'>
                        <h4>{`${getTranslation('Payment summary')}`}</h4>
                    </Wrapper>

                    <LastPaymentCustomer
                        customer={customer}
                    />
                    <CustomerPaymentList
                        newPayment={payment}
                        addNotification={addNotification}
                        customer={customer}
                    />
                </ScrollView>
            </Wrapper>
        }
    </>
}

export default i18n(CustomerSummary)
