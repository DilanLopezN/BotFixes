export interface CreateCampaignActionData {
    workspaceId: string;
    name: string;
    action: string;
}

export interface UpdateCampaignActionData {
    workspaceId: string;
    id: number;
    name: string;
}
