import { CreateWorkspaceChannelSpecification } from '../../billing/dto/workspace-channel-specification.dto';
import { BillingType } from '../../billing/models/workspace.entity';

export class AccountData {
    gatewayClientId?: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    city: string;
    company: string;
    countryCode: string;
    districtOrCounty: string;
    ibge: string;
    phoneNumber: string;
    postalCode: string;
    email: string;
    state: string;
    website: string;
    taxRegistrationType: string;
    registrationId: string;
    legalName: string;
    // dueDate: number;
    // plan: string;
    // planCountMessage: number;
}

export class BillingSpecificationData {
    dueDate: number;
    name?: string;
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
export class CreateInitialSetup {
    workspaceName: string;
    accountData: AccountData;
    billingSpecificationData: BillingSpecificationData;
    workspaceChannelSpecifications?: CreateWorkspaceChannelSpecification[];
}
