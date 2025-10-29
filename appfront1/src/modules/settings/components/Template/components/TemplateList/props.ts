import { TemplateMessage } from '../../../../../liveAgent/components/TemplateMessageList/interface';

export interface TemplateListProps {
    templates: TemplateMessage[];
    workspaceId: string;
    onEditTemplate: Function;
    editingTemplateId: string | undefined;
    loading: boolean;
    loadingMore: boolean;
    user: any;
}