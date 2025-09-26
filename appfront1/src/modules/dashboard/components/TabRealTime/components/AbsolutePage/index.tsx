import { FC } from 'react'
import i18n from '../../../../../i18n/components/i18n';
import { Icon, Wrapper } from '../../../../../../ui-kissbot-v2/common'
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { AbsolutePageProps } from './props';

const TabRealTime: FC<AbsolutePageProps & I18nProps> = ({ expanded, close, getTranslation, children }) => {
    return (
        <>
            {
                expanded ?
                    <Wrapper
                        position='fixed'
                        bgcolor='#ffffff'
                        width='100%'
                        height='100%'
                        top='0'
                        left='0'
                        padding='20px'
                        overflowY='auto'
                    >
                        <Wrapper position='absolute' top='16px' right='16px'>
                            <Icon
                                className='closeExpanded'
                                size='fas fa-2x'
                                name='close-circle'
                                title={getTranslation('Exit')}
                                onClick={close}
                            />
                        </Wrapper>
                        {children}
                    </Wrapper>
                    :
                    <>
                        {children}
                    </>
            }
        </>
    );
}

export default i18n(TabRealTime) as FC<AbsolutePageProps>
