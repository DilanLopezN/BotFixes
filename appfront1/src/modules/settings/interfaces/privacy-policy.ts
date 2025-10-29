export interface PrivacyPolicyInterface {
    id?: number;
    text: string;
    channelConfigIds: string[];
    workspaceId: string;
    createdBy: string;
    createdAt: Date;
    deletedAt?: Date;
    updateAcceptanceAt?: Date;
    acceptButtonText?: string;
    rejectButtonText?: string;
}

export interface UpdatePrivacyPolicy
    extends Pick<PrivacyPolicyInterface, 'text' | 'channelConfigIds' | 'acceptButtonText' | 'rejectButtonText'> {
    id: number;
}

export interface CreatePrivacyPolicy
    extends Omit<PrivacyPolicyInterface, 'id' | 'workspaceId' | 'createdAt' | 'deletedAt' | 'updateAcceptanceAt'> {}
