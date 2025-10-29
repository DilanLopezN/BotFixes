import { AckType } from 'kissbot-core';
import { FC } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { SendedIcon } from './icons/Sended';
import { SendedConfirmedIcon } from './icons/SendedConfirmed';
import { SendingIcon } from './icons/Sending';
import { ViewedIcon } from './icons/ViewedIcon';
import { AckMessageProps } from './props';

const AckMessage: FC<AckMessageProps> = ({ ackType }) => {
    const getIconAckType = () => {
        if (ackType === AckType.Read) {
            return (
                <ViewedIcon
                    style={{
                        height: '14px',
                    }}
                />
            );
        }

        if (ackType === AckType.DeliveryAck) {
            return (
                <SendedConfirmedIcon
                    style={{
                        height: '14px',
                    }}
                />
            );
        }

        if (ackType === AckType.ServerAck) {
            return (
                <SendedIcon
                    style={{
                        height: '14px',
                    }}
                />
            );
        }

        return (
            <SendingIcon
                style={{
                    height: '14px',
                }}
            />
        );
    };

    return <Wrapper margin='0 2px'>{getIconAckType()}</Wrapper>;
};

export default AckMessage;
