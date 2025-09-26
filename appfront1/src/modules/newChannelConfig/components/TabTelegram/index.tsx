import React, { FC, useEffect } from 'react'
import { TabTelegramProps } from './props'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import I18n from '../../../i18n/components/i18n'
import DivisorCard from '../DivisorCard';
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import styled from 'styled-components'
import MaskedInput from 'react-text-mask'
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { FormikProps } from 'formik';

export const PhoneInput = styled(MaskedInput)`
    box-shadow: 0 2px 15px 0 rgba(0,0,0,.07);
    background: #FFFFFF;    
    border: 1px solid #e4e9f0 !important;    
    color: #696969;
    padding: 9px 24px 9px 19px !important;
    font-size: 15px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    min-height: 42px;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    ::placeholder {
      color: #d8e4ec;
    }
`

const TabTelegram: FC<TabTelegramProps & I18nProps & FormikProps<any>> = (props) => {

    const {
        getTranslation,
        values,
        setFieldValue,
        onChange,
        channel,
        selectedMenu,
    } = props;

    useEffect(() => {
        if (JSON.stringify(channel) !== JSON.stringify(values.channel))
            onChange(values.channel)
    }, [values.channel])

    return (
        <Wrapper
            flexBox
            flexDirection='column'
            alignItems='center'
            height='100%'>
            {selectedMenu.sections[0].showOnChannelIdEquals.includes(channel.channelId)
                && <DivisorCard
                    title={getTranslation('Configuration')}>
                    <LabelWrapper
                        label={'BotName'}
                    >
                        <StyledFormikField
                            name={`channel.configData.botName`}
                            placeholder={'BotName'}
                        />
                    </LabelWrapper>
                    <LabelWrapper
                        label={'ApiToken'}
                    >
                        <StyledFormikField
                            name={`channel.configData.apiToken`}
                            placeholder={'ApiToken'}
                        />
                    </LabelWrapper>
                </DivisorCard>}
        </Wrapper >
    )
}

export default I18n(TabTelegram) as FC<TabTelegramProps>;
