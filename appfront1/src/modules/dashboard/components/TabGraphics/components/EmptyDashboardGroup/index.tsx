import { FC } from 'react'
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n'
import { I18nProps } from '../../../../../i18n/interface/i18n.interface'

interface EmptyDashboardGroupProps { 
    text: string;
}

const EmptyDashboardGroup: FC<I18nProps & EmptyDashboardGroupProps> = ({text}) => {

    return (
        <Wrapper flexBox width='100%' height='70%' justifyContent='center' alignItems='center'>
            <Wrapper padding='20px 40px'>
                <Wrapper 
                    flexBox 
                    textAlign='center' 
                    margin='30px 0 -10px' 
                    justifyContent='center'
                    fontSize='16px'
                >
                    {text}
                </Wrapper>
                <Wrapper flexBox margin='30px 0 0 0' justifyContent='center'>
                    <img style={{ height: '180px' }} src='/assets/img/undraw_cancel_re_ctke.svg' />
                </Wrapper>
            </Wrapper>
        </Wrapper>
    )
};


export default i18n(EmptyDashboardGroup);
