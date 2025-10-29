import { FC, useState } from 'react'
import i18n from '../../../i18n/components/i18n'
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { useEffect } from 'react';
import { CustomersService } from '../../service/BillingService';
import { ClientResumeLastPayment } from '../../page/Customers/interfaces';
import { LastPaymentCustomerProps } from './props';
import moment from 'moment';

const renderDate = (value: any) => (value ? moment(value).format('DD/MM/YYYY') : '')

const LastPaymentCustomer: FC<LastPaymentCustomerProps & I18nProps> = ({
    getTranslation,
    customer
}) => {
    const [resume, setResume] = useState<ClientResumeLastPayment | undefined>(undefined)

    useEffect(() => {
        getLastPayment(customer.id)

    }, [customer])

    const getLastPayment = async (id) => {
        const response = await CustomersService.getClientResume(id)

        if (!response) return;

        setResume(response)
    }

    return <>
        <Wrapper
            bgcolor='#fff'
            width='70%'
            minWidth='800px'
            margin='0 auto 20px auto'
            borderRadius='10px'
            flexBox
            padding='10px 20px'
            fontSize='15px'
        >
            <Wrapper
                flexBox
                flexDirection='column'
                alignItems='flex-start'
                width='33%'
            >
                <h3>{getTranslation('Total')}</h3>
                <Wrapper>
                    {`${(resume?.currentPaymentResume?.sum?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) || '-'}`}
                </Wrapper>
            </Wrapper>
            <Wrapper
                flexBox
                flexDirection='column'
                alignItems='center'
                width='33%'
            >
                <h3>{getTranslation('Period')}</h3>
                <Wrapper>{
                    `
                        ${renderDate(resume?.currentPaymentResume?.billingStartDate)}
                        ~
                        ${renderDate(resume?.currentPaymentResume?.billingEndDate)}
                    `
                }</Wrapper>
            </Wrapper>
            <Wrapper
                flexBox
                flexDirection='column'
                alignItems='flex-end'
                width='34%'
            >
                <h3>{getTranslation('Last charge')}</h3>
                <Wrapper>
                    {
                        resume?.lastPaymentResume?.billingStartDate !== 0 ?
                            `${moment(resume?.lastPaymentResume?.billingStartDate).format('DD/MM/YYYY')} - 
                    ${(resume?.lastPaymentResume?.sum?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) || '-'}`
                            :
                            '-'
                    }
                </Wrapper>
            </Wrapper>
        </Wrapper>
    </>
}

export default i18n(LastPaymentCustomer)
