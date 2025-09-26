import { doRequest, apiInstance } from '../../../utils/Http';
import axios from 'axios';
import { CreateInitialSetup, Customer, Payment } from '../page/Customers/interfaces';
import { FiltersCustomerPayments } from '../components/CustomerPaymentList';
import { serialize } from '../../../utils/serializeQuery';
import {
    WorkspaceBilling,
    WorkspaceChannelSpecification,
} from '../../settings/components/Billing/components/WorkspaceBillingSpecification/interface';
import { CreatePaymentItemDto, UpdatePaymentItemDto } from '../interfaces/payment-item.interface';

export const CustomersService = {
    getCNPJAsaas: async (cnpj: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/billing/gateway/account/${cnpj}`));
    },

    getCep: async (cep: number): Promise<any> => {
        return await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    },

    getClientsResume: async (): Promise<any> => {
        return await doRequest(apiInstance.get('/billing/resume/internal/workspaces'));
    },

    getClientResume: async (workspaceId): Promise<any> => {
        return await doRequest(apiInstance.get(`/billing/resume/internal/workspaces/${workspaceId}`));
    },

    createCustomerAccount: async (customer: Customer, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/billing/account`, customer), errCb);
    },

    updateCustomerAccount: async (accountId: number, account: Customer, errCb?): Promise<any> => {
        return await doRequest(apiInstance.put(`/billing/account/${accountId}`, account), errCb);
    },

    createPayment: async (payment: Payment, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/billing/payment`, payment), errCb);
    },

    createAllPayment: async (billingMonth: string, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/billing/all-payment?billingMonth=${billingMonth}`, undefined, { timeout: 120000 }),
            errCb
        );
    },

    createBillet: async (paymentId: number, payment: Payment, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/billing/payment/${paymentId}/create-payment`, payment), errCb);
    },

    createAllBillet: async (competencyMonth: string, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/billing/all-gateway-payment?competencyMonth=${competencyMonth}`),
            errCb
        );
    },

    getWorkspacesWithPayment: async (filters?: { active?: boolean }): Promise<any> => {
        let url = '/billing/workspace';

        if (filters) {
            const queryString = new URLSearchParams(filters as Record<string, string>).toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        return await doRequest(apiInstance.get(url));
    },

    getPayments: async (workspaceId: string, filter: FiltersCustomerPayments, errCb?): Promise<any> => {
        const filters: { [key: string]: any } = {
            limit: String(filter.limit),
            skip: String(filter.skip),
            workspaceId: workspaceId,
        };

        const query = serialize(filters);
        return await doRequest(apiInstance.get(`/billing/payment?${query}`), errCb);
    },

    getAccounts: async (simpleView: boolean, errCb?): Promise<any> => {
        return await doRequest(apiInstance.get(`/billing/account${simpleView ? '?simpleView=true' : ''}`), errCb);
    },

    createWorkspaceBillingSpecification: async (
        workspaceBilling: WorkspaceBilling,
        channelSpecifications?: WorkspaceChannelSpecification[],
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`billing/workspace/`, { workspace: workspaceBilling, channelSpecifications }),
            errCb
        );
    },

    updateWorkspaceBillingSpecification: async (
        workspaceId: string,
        workspaceBilling: WorkspaceBilling,
        channelSpecifications?: WorkspaceChannelSpecification[],
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/billing/workspace/${workspaceId}`, {
                workspace: workspaceBilling,
                channelSpecifications,
            }),
            errCb
        );
    },

    getWorkspaceBillingSpecification: async (workspaceId: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.get(`billing/workspace/${workspaceId}`), errCb);
    },

    syncronizePayment: async (errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`billing/sync-payments`), errCb);
    },

    syncronizePaymentById: async (paymentId: number, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`billing/sync-payment/${paymentId}`), errCb);
    },

    deletePayment: async (paymentId: number, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`billing/payment/${paymentId}`), errCb);
    },

    createInitialSetup: async (setup: CreateInitialSetup, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`setup/initial-setup`, setup), errCb);
    },

    getResumeCustomersCsv: (date: string) => {
        return apiInstance
            .get(`internal-analytics/client-resume?billingMonth=${date}`, { responseType: 'blob', timeout: 60000 })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Resumo-clientes.csv');
                document.body.appendChild(link);
                link.click();
            });
    },

    syncPaymentInvoices: async (billingMonth: string, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/billing/sync-payment-invoices`, { billingMonth: billingMonth }),
            errCb
        );
    },

    createPaymentInvoice: async (paymentId: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/billing/payment/${paymentId}/create-invoice`), errCb);
    },

    createAllInvoice: async (billingMonth: string, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.post(
                `/billing/payment/create-invoice-batch`,
                { billingMonth: billingMonth },
                { timeout: 120000 }
            ),
            errCb
        );
    },

    createPaymentItem: async (
        workspaceId: string,
        paymentId: number,
        data: CreatePaymentItemDto,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/billing/workspace/${workspaceId}/payment/${paymentId}/create-payment-item`, data),
            undefined,
            errCb
        );
    },

    updatePaymentItem: async (
        workspaceId: string,
        paymentId: number,
        paymentItemId: number,
        data: UpdatePaymentItemDto,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(
                `/billing/workspace/${workspaceId}/payment/${paymentId}/payment-item/${paymentItemId}`,
                data
            ),
            undefined,
            errCb
        );
    },

    deletePaymentItem: async (workspaceId: string, paymentId: number, paymentItemId: number, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.delete(`/billing/workspace/${workspaceId}/payment/${paymentId}/payment-item/${paymentItemId}`),
            undefined,
            errCb
        );
    },
};
