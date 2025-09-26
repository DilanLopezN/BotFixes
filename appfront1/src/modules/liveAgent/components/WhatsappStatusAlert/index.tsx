import { useEffect, useState, FC } from 'react';
import { ConversationListAlertProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { Wrapper, Icon } from '../../../../ui-kissbot-v2/common';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import styled from 'styled-components';
import { debounce } from 'lodash';

let disconnectedTimer: any;

const DisconnectedCard = styled(Wrapper)<{ isDisconnected: boolean }>`
    transition: all 500ms;
    display: none;

    ${(props) =>
        props.isDisconnected &&
        `
        background: #eb4034;
        margin-top: 0;
        display: flex;
    `}
`;

const WhatsappStatusAlert = ({
    workspaceId,
    socketConnection,
    getTranslation,
}: ConversationListAlertProps & I18nProps) => {
    const [isDisconnected, setIsDisconnected] = useState(false);

    const initSocket = () => {
        if (socketConnection) {
            socketConnection.on('disconnect', () => handleDisconnected(true));
            socketConnection.on('connect', () => handleDisconnected(false));
            socketConnection.on('connect_failed', () => handleDisconnected(true));
            socketConnection.on('connect_error', () => handleDisconnected(true));
        }
    };

    const handleDisconnected = (disconnected: boolean) => {
        if (!disconnected) {
            setIsDisconnected(disconnected);
            disconnectedTimer?.cancel();
            disconnectedTimer = undefined;
            return;
        } else if (disconnected && !disconnectedTimer) {
            disconnectedTimer = debounce(() => {
                setIsDisconnected(disconnected);
            }, 4000);

            disconnectedTimer();
        }
    };

    useEffect(() => {
        setIsDisconnected(false);
    }, [workspaceId]);

    useEffect(initSocket, [socketConnection]);

    return (
        <div>
            <DisconnectedCard bgcolor='#eb4034' flexBox padding='8px 12px' isDisconnected={isDisconnected}>
                <Wrapper style={{ display: 'flex', alignItems: 'center' }}>
                    <Wrapper
                        borderRadius='50%'
                        bgcolor='#FFFFFF'
                        width='60px'
                        height='60px'
                        textAlign='center'
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Icon name='wifi-off' color='#eb4034' size='36px' />
                    </Wrapper>
                </Wrapper>
                <Wrapper padding='0 0 0 16px'>
                    <h6 style={{ color: '#FFF' }}>{getTranslation("You're not online")}</h6>
                    <p style={{ color: '#FFF' }}>
                        {getTranslation("This computer's internet connection appears to be offline.")}
                    </p>
                </Wrapper>
            </DisconnectedCard>
        </div>
    );
};

export default I18n(WhatsappStatusAlert) as FC<ConversationListAlertProps>;
