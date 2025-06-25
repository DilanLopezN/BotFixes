import { IdentityType } from 'kissbot-core';

export interface Identity {
    id: string;
    name?: string;
    data?: any;
    avatar?: any;
    channelId: string;
    type: IdentityType;
    createdAt?: Date;
    removedAt?: Date;
    phone?: string;
    email?: string;
    disabled?: boolean;
    contactId?: string;
    track?: any;
    ddi?: string;
}
