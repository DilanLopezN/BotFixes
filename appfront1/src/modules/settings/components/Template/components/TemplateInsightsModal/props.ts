import { TemplateMessage } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { InlineStyleType } from '../DraftEditor/props';

export interface TemplateInsightsModalProps {
    activeModal: InlineStyleType.AI_SUGGESTION | InlineStyleType.AI_INSIGHT;
    onClose: () => void;
    workspaceId: string;
    template: TemplateMessage;
}
