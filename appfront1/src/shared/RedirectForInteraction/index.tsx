import { FC } from 'react';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';
import i18n from '../../modules/i18n/components/i18n';
import styled from 'styled-components';

interface RedirectForInteractionProps {
    workspaceId?: string;
    botId?: string;
    interactionId?: string;
    style?: any;
}

const IconGotoInteraction = styled.a`
    color: #696969;
    margin-left: 4px;
    :hover {
        color: #1890ff !important;
    }
`;

const RedirectForInteraction: FC<RedirectForInteractionProps & I18nProps> = ({
    workspaceId,
    botId,
    interactionId,
    getTranslation,
    style,
}) => {
    return (
        <>
            {workspaceId && botId && interactionId && (
                <IconGotoInteraction
                    style={style}
                    title={getTranslation('Navigate to the selected interaction')}
                    className='mdi mdi-share mdi-18px'
                    href={`/workspace/${workspaceId}/bot/${botId}/interaction/${interactionId}`}
                    target='_blank'
                />
            )}
        </>
    );
};

export default i18n(RedirectForInteraction) as FC<RedirectForInteractionProps>;
