export interface FallbackTabProps {
    agentId: string;
    workspaceId: string;
    getTranslation: (key: string) => string;
}