import React, { FC } from 'react'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import i18n from '../../../i18n/components/i18n'
import { I18nProps } from '../../../i18n/interface/i18n.interface'

const ChatContainerWithoutConversation: FC<I18nProps> = ({
    getTranslation,
}) => {
    return (
        <Wrapper
            height="100%"
            width="100%"
            flexBox
            bgcolor='#f9fbfd'
            justifyContent="flex-end"
            alignItems="center"
        >
            <Wrapper
                margin='0 auto'
                maxWidth="50%"
                fontWeight="500"
                color="#000"
            >
                <Wrapper
                    flexBox
                    justifyContent='center'>
                    <img
                        src={`assets/img/chat_draw.svg`}
                        style={{ height: '170px' }}
                    />
                </Wrapper>
                <Wrapper
                    color='#555'
                    flexBox
                    justifyContent='center'
                    margin='30px 0'
                >
                    {getTranslation('Select a conversation')}
                </Wrapper>
            </Wrapper>
        </Wrapper>
    )
}

export default i18n(ChatContainerWithoutConversation)
