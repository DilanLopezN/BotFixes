export interface ContactResume {
    processedContactCount: number;
    contactCount: number;
}
export interface CampaignResume {
    contactResume: ContactResume;
    invalidContacts: InvalidContact[];
    unsentCount?: number;
}

export interface InvalidContact {
    total: number;
    contactTotal: number;
    contactId: number;
}
