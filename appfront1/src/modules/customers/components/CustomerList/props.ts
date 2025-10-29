
export interface CustomerListProps {
    loading: boolean;
    setLoading: Function;
    addNotification: Function;
}

export interface WorkspaceBilling {
    key: number;
    active: boolean;
    name: {
        name: string;
        id: string;
        accountId: number;
        overDueId: string | null;
    };
    value: number;
    status: string;
    date: string | null;
    actions: {
        gatewayPaymentId: string | null;
        gatewayInvoiceId: string | null;
        paymentId: string | null;
    };
}
