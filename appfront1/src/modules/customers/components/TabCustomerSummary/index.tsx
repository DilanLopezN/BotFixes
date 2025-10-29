import { FC, useState } from 'react'
import { TabCustomerSummaryProps } from './props'
import i18n from '../../../i18n/components/i18n'
import { I18nProps } from '../../../i18n/interface/i18n.interface'
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common';
import Header from '../../../newChannelConfig/components/Header';
import { DatePicker, Popover } from 'antd';
import moment from 'moment';
import { CustomersService } from '../../service/BillingService';

const { MonthPicker } = DatePicker

const TabCustomersSummary: FC<TabCustomerSummaryProps & I18nProps> = ({ getTranslation, menuSelected }) => {
    const [visiblePopover, setVisiblePopover] = useState(false)
    const [customersResumeMonth, setCustomersResumeMonth] = useState<any>(moment())

    const generateCustomersResume = () => {
        if (!customersResumeMonth) return;
        setVisiblePopover(false)
        
        CustomersService.getResumeCustomersCsv(moment(customersResumeMonth.valueOf()).format('MM/YY'))
    }

    const content = (
        <Wrapper>
            <Wrapper
                maxWidth={'200px'}
            >{getTranslation('Select for which month the report should be generated:')}</Wrapper>
            <MonthPicker
                style={{
                    width: '100%',
                    margin: '10px 0'
                }}
                value={moment(customersResumeMonth)}
                format={'MM/YY'}
                onChange={date => {
                    if (date === null) {
                        date = moment()
                    }
                    setCustomersResumeMonth(date)
                }}
            />
            <Wrapper
                flexBox
                justifyContent={'space-between'}
            >
                <PrimaryButton
                    onClick={() => setVisiblePopover(false)}
                >{getTranslation('Cancel')}</PrimaryButton>
                <PrimaryButton
                    onClick={() => generateCustomersResume()}
                >{getTranslation('Ok')}</PrimaryButton>
            </Wrapper>
        </Wrapper>
    )

    return <Wrapper className="customersResumeTab">
        <Header
            title={menuSelected.title}
            action={
                <Wrapper flexBox alignItems='center'>
                    <Popover
                        autoAdjustOverflow
                        open={visiblePopover}
                        placement={'bottomLeft'}
                        content={content}
                    >
                        <PrimaryButton
                            onClick={() => setVisiblePopover(true)}>
                            {getTranslation('Generate customer report')}
                        </PrimaryButton>
                    </Popover>
                </Wrapper>
            }
        />
    </Wrapper>
};


export default i18n(TabCustomersSummary) as FC<TabCustomerSummaryProps>;
