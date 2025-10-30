export interface SavedView {
    id: string;
    key: string;
    label: string; // nome da visão
    value: string; // base64 encoded config
    createdAt: string;
    updatedAt: string;
}

export interface SavedViewsProps {
    currentViewConfig: string | null;
    onLoadView: (config: string) => void;
    onResetFilters?: () => void;
    workspaceId?: string;
    generateConfig?: () => string | null;
}
