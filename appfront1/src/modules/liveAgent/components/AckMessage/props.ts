import { AckType } from 'kissbot-core';

export interface AckMessageProps {
    ackType: AckType | number | undefined;
}
