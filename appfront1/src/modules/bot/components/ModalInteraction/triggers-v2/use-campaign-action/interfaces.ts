export interface UseCampaignActionProps {
    workspaceId: string;
    action: string;
}

export interface UseCampaignActionResult {
    executeAction: (name: string) => Promise<void>;
    loading: boolean;
}

export interface DataActionProps {
    action: string;
    name: string;
}
