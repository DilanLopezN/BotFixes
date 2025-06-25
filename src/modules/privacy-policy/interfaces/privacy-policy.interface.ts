export interface PrivacyPolicyInterface {
    id: number;
    text: string;
    channelConfigIds: string[];
    workspaceId: string;
    createdAt: Date;
    createdBy: string;
    deletedAt?: Date;
    updateAcceptanceAt?: Date;
    acceptButtonText?: string;
    rejectButtonText?: string;
}

export interface CreatePrivacyPolicy extends Omit<PrivacyPolicyInterface, 'id'> {}

export interface UpdatePrivacyPolicy extends PrivacyPolicyInterface {}
