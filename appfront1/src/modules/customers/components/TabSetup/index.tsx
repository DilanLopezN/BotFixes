import { FC } from 'react'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import { I18nProps } from '../../../i18n/interface/i18n.interface'
import { TabSetupProps } from './props'
import I18n from '../../../i18n/components/i18n'
import Header from '../../../newChannelConfig/components/Header';
import styled from 'styled-components'
import SetupForm from '../SetupForm'

const ScrollView = styled(Wrapper)`
    width: 100%;
    height: calc(100vh - 100px);
    overflow-y: auto;
`

const TabSetup: FC<TabSetupProps & I18nProps> = ({ getTranslation, addNotification, menuSelected }) => {

    return <Wrapper className="setupTab">
        <Header
            title={menuSelected.title}
        />
        <ScrollView>
            <SetupForm addNotification={addNotification} />
        </ScrollView>
    </Wrapper>
}
export default I18n(TabSetup) as FC<TabSetupProps>
