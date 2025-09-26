import { FC } from 'react';
import { useSelector } from 'react-redux';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { isSystemAdmin } from '../../../../utils/UserPermission';
import AckMessage from '../AckMessage';
import { ChatMessageViewedProps } from './props';

const ChatMessageViewed: FC<ChatMessageViewedProps> = ({ activityTimestamp, clientMessage, ack, showAck = true }) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const admin = loggedUser ? isSystemAdmin(loggedUser) : undefined;

    return (
        <Wrapper flexBox alignItems='center'>
            <Wrapper margin='1px 1px 0 0'>
                <span
                    title={
                        admin
                            ? activityTimestamp.format('DD/MM/YYYY HH:mm:ss')
                            : activityTimestamp.format('DD/MM/YYYY HH:mm')
                    }
                    style={{
                        fontSize: '10px',
                    }}
                >
                    {activityTimestamp.format('HH:mm')}
                </span>
            </Wrapper>
            {!clientMessage && showAck && <AckMessage ackType={ack} />}
        </Wrapper>
    );
};

export default ChatMessageViewed;
