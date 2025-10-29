export enum CallbackModes {
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    DELETED = 'DELETED',
    OTHERS = 'OTHERS',
    FAILED = 'FAILED',
    MESSAGE = 'MESSAGE',
    TEMPLATE = 'TEMPLATE',
    ACCOUNT = 'ACCOUNT',
    BILLING = 'BILLING',
    ENQUEUED = 'ENQUEUED',
    FLOWS_MESSAGE = 'FLOWS_MESSAGE',
    PAYMENTS = 'PAYMENTS',
    ALL = 'ALL',
}

export const DEFAULT_MODES_V2 = [
    CallbackModes.SENT,
    CallbackModes.DELIVERED,
    CallbackModes.READ,
    CallbackModes.OTHERS,
    CallbackModes.FAILED,
    CallbackModes.MESSAGE,
    CallbackModes.TEMPLATE,
    CallbackModes.ACCOUNT,
    CallbackModes.ENQUEUED,
    CallbackModes.ALL,
];

export const DEFAULT_MODES_V3 = [
    CallbackModes.SENT,
    CallbackModes.DELIVERED,
    CallbackModes.READ,
    CallbackModes.OTHERS,
    CallbackModes.FAILED,
    CallbackModes.MESSAGE,
    CallbackModes.TEMPLATE,
    CallbackModes.ACCOUNT,
    CallbackModes.ENQUEUED,
    CallbackModes.FLOWS_MESSAGE,
    CallbackModes.PAYMENTS,
    CallbackModes.ALL,
];

export interface DataSetSubscription {
    tag: string;
    url: string;
    version: 2 | 3;
    modes: CallbackModes[];
    active: boolean;
}

export interface Subscription {
    active: boolean;
    appId: string;
    createdOn: number;
    id: string;
    latencyBucket: string;
    mode: number;
    modes: CallbackModes[];
    modifiedOn: number;
    showOnUI: boolean;
    tag: string;
    url: string;
    version: 2 | 3;
}

export interface DataUpdateSubscription extends DataSetSubscription {
    active: boolean;
}

export interface ResponseSetSubscription {
    status: 'success' | 'error';
    subscription?: Subscription;
    message?: string;
}

export interface ResponseUpdateSubscription extends ResponseSetSubscription {}

export interface ResponseGetAllSubscriptions {
    status: 'success' | 'error';
    subscriptions?: Subscription[];
    message?: string;
}
