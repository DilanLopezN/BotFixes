import { FC } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import PrimaryButton from '../../../../../../ui-kissbot-v2/common/PrimaryButton';
import I18n from '../../../../../i18n/components/i18n';
import { NotificationGoToBotProps } from './props';

const NotificationGoToBot: FC<NotificationGoToBotProps> = ({ getTranslation, botId, workspaceId, interactionId }) => {
    
    return (
        <Wrapper bgcolor='#28a745' padding='10px' borderRadius='5px'>
            <Wrapper margin='0 0 10px 0' color='#fff' fontSize='13px'>
                {getTranslation('Go to the bot where the change was made?')}
            </Wrapper>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PrimaryButton outline margin='0 10px 0 0' onClick={() => {}}>
                    {getTranslation('No')}
                </PrimaryButton>
                <PrimaryButton
                    onClick={() => {
                        const baseUrl = window.location.origin;
                        const fullPath = `${baseUrl}/workspace/${workspaceId}/bot/${botId}/interaction/${interactionId}`;
                        window.open(fullPath, '_blank');
                    }}
                >
                    {getTranslation('Yes')}
                </PrimaryButton>
            </div>
        </Wrapper>
    );
};

export default I18n(NotificationGoToBot);
