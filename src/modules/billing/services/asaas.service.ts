import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CatchError, Exceptions } from './../../auth/exceptions';

interface CreateCustomer extends BaseCustomer{}

interface BaseCustomer {
    name: string;
    email: string;
    phone: string;
    mobilePhone: string;
    cpfCnpj: string;
    postalCode: string;
    address: string;
    addressNumber: string;
    complement: string;
    province: string;
    externalReference?: string;
    notificationDisabled: boolean;
    additionalEmails?: string;
    municipalInscription?: string;
    stateInscription?: string;
    observations?: string;
}
interface CreatePayment {
    customer: string;
    billingType: string;
    dueDate: string;
    value: number;
    description: string;
    externalReference: string;
    discount: {
        value: number;
        dueDateLimitDays: number;
    };
    fine: {
        value: number;
    };
    interest: {
        value: number;
    };
    postalService: boolean;
}

interface CreateInvoice {
    payment: string;
    installment: string;
    serviceDescription: string;
    observations: string;
    value: number
    deductions: number
    effectiveDate: string; //"2018-07-03"
    externalReference: string
    taxes: {
        retainIss: boolean;
        iss:number;
        cofins:number;
        csll:number;
        inss:number;
        ir:number;
        pis:number;
    },
    municipalServiceId: string;
    municipalServiceCode: string;
    municipalServiceName: string;
}
@Injectable()
export class AsaasService {
    private accessKey = '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwMDk4MTY6OiRhYWNoX2I1YjI3ZmZiLWFjODMtNDM5Mi1iMzgyLWU4NjdiNjJiOTdhYw==';
    private url = 'https://sandbox.asaas.com';

    @CatchError()
    async createPayment(body: CreatePayment) {
        try {
            const r = await axios.post(`${process.env.ASAAS_URI || this.url}/api/v3/payments`, body, {
                headers: {
                    access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
                },
            });
            return r.data;
        } catch (e) {
            console.log(e.response);
            console.log(e.response);
            console.log(e.response?.data);
            console.log(e.toJSON ? e.toJSON() : e);
        }
    }

    @CatchError()
    async createCustomer(body: CreateCustomer) {
        try {
            const r = await axios.post(`${process.env.ASAAS_URI || this.url}/api/v3/customers`, body, {
                headers: {
                    access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
                },
            });
            return r.data;
        } catch (e) {
            console.log(e.toJSON ? e.toJSON() : e);
        }
    }

    @CatchError()
    async getPayment(id: string) {
        if (!id) {
            throw Exceptions.ASAAS_GET_PAYMENT_ID_INVALID;
        }
        const r = await axios.get(`${process.env.ASAAS_URI || this.url}/api/v3/payments/${id}`, {
            headers: {
                access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
            },
        });
        return r.data;
    }

    @CatchError()
    async findInvoiceByPaymentId(paymentId: string) {
        try {
            const r = await axios.get(`${process.env.ASAAS_URI || this.url}/api/v3/invoices?payment=${paymentId}`, {
                headers: {
                    access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
                },
            });
            return r.data?.data?.[0];
        } catch (e) {
            if (e.response?.status == 404) {
                return undefined
            }
            throw e;
        }
    }

    @CatchError()
    async getPaymentByExternalReference(externalReference: string) {
        const r = await axios.get(
            `${process.env.ASAAS_URI || this.url}/api/v3/payments?externalReference=${externalReference}`,
            {
                headers: {
                    access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
                },
            },
        );
        return r.data;
    }

    @CatchError()
    async getCustomerByCnpj(cnpj: string) {
        const r = await axios.get(`${process.env.ASAAS_URI || this.url}/api/v3/customers?cpfCnpj=${cnpj}`, {
            headers: {
                access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
            },
        });
        return r.data;
    }

    @CatchError()
    async updateCustomer(id: string, body: CreateCustomer) {
        try {
            const r = await axios.post(`${process.env.ASAAS_URI || this.url}/api/v3/customers/${id}`, body, {
                headers: {
                    access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
                },
            });
            return r.data;
        } catch (e) {
            console.log(e.toJSON ? e.toJSON() : e);
        }
    }

    @CatchError()
    async cnpj(cnpj: string) {
        const r = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
        return r.data
    }

    @CatchError()
    async createPaymentInvoice(body: CreateInvoice) {
        try {
            const r = await axios.post(`${process.env.ASAAS_URI || this.url}/api/v3/invoices`, body, {
                headers: {
                    access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
                },
            });
            return r.data;
        } catch (e) {
            console.log('AsaasService.createPaymentInvoice', e.response?.data || e);
        }
    }

    @CatchError()
    async authorizeInvoice(invoiceId: string) {
        try {
            const r = await axios.post(`${process.env.ASAAS_URI || this.url}/api/v3/invoices/${invoiceId}/authorize`, {}, {
                headers: {
                    access_token: process.env.ASAAS_ACCESS_KEY || this.accessKey,
                },
            });
            return r.data;
        } catch (e) {
            console.log('AsaasService.authorizeInvoice', e.response?.data || e);
        }
    }
}
