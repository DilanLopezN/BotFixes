export class CreateAccountDto {
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
    vinculeToWorkspaceIds?: string[];
}