import { BillingType } from '../../../settings/components/Billing/components/WorkspaceBillingSpecification/interface';

export interface Customer {
    id?: number;
    addressLine1: string;
    addressLine2: string;
    addressLine3?: string;
    city: string;
    company: string;
    countryCode: string;
    districtOrCounty: string;
    ibge: string;
    phoneNumber: string;
    postalCode: string;
    email?: string;
    state: string;
    website?: string;
    taxRegistrationType: string;
    registrationId: string;
    legalName: string;
    gatewayClientId?: string;
    vinculeToWorkspaceIds?: string[];
}

export interface Payment {
    workspaceId: string;
    accountId: number;
}

export interface ClientResumeLastPayment {
    currentPaymentResume: {
        billingEndDate: number;
        billingStartDate: number;
        sum: number;
    };
    lastPaymentResume: {
        billingEndDate: number;
        billingStartDate: number;
        sum: number;
    };
}

export interface BillingSpecificationData {
    dueDate: number;
    name: string;
    invoiceDescription?: string;
    paymentDescription?: string;
    plan: string;
    planExceededMessagePrice: number;
    planHsmExceedMessagePrice: number;
    planHsmMessageLimit: number;
    planMessageLimit: number;
    planPrice: number;
    planUserExceedPrice: number;
    planUserLimit: number;
    startAt: number;
    planConversationExceedPrice: number;
    planConversationLimit: number;
    active?: boolean;
    hasIntegration?: boolean;
    segment?: string;
    observations?: string;
    billingType?: BillingType;
}

export interface CreateInitialSetup {
    workspaceName: string;
    accountData: Customer;
    billingSpecificationData: BillingSpecificationData;
}
