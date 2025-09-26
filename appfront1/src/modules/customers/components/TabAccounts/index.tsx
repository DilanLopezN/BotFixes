import { FC, useState } from 'react'
import { PrimaryButton, Wrapper } from '../../../../ui-kissbot-v2/common'
import { I18nProps } from '../../../i18n/interface/i18n.interface'
import { TabAccountsProps } from './props'
import I18n from '../../../i18n/components/i18n'
import CustomerFormWrapper from '../CustomerFormWrapper'
import AccountList from '../AccountList'
import { Customer } from '../../page/Customers/interfaces'
import Header from '../../../newChannelConfig/components/Header';
import styled from 'styled-components'

const ScrollView = styled(Wrapper)`
    width: 100%;
    height: calc(100vh - 100px);
    overflow-y: auto;
`

const TabAccounts: FC<TabAccountsProps & I18nProps> = ({ getTranslation, addNotification }) => {

    const [formVisible, setFormVisible] = useState(false)
    const [customerSelected, setCustomerSelected] = useState<Customer | undefined>(undefined)

    return <Wrapper className="accountsTab">
        {
            formVisible || customerSelected ?
                <CustomerFormWrapper
                    onCancel={() => {
                        setFormVisible(false)
                        setCustomerSelected(undefined)
                    }}
                    addNotification={addNotification}
                    customer={customerSelected}
                />
                :
                <>
                    <Header
                        title={getTranslation('Accounts')}
                        action={
                            <PrimaryButton onClick={() => setFormVisible(true)}>{getTranslation('New customer')}</PrimaryButton>
                        }
                    />
                    <ScrollView>
                        <AccountList selectCustomer={(customer) => setCustomerSelected(customer)} />
                    </ScrollView>
                </>
        }
    </Wrapper>
}
export default I18n(TabAccounts) as FC<TabAccountsProps>
