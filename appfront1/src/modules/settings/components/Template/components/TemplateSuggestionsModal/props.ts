import { TemplateMessage, TemplateButton } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { InlineStyleType } from '../DraftEditor/props';

export interface TemplateSuggestionsModalProps {
    activeModal: InlineStyleType.AI_SUGGESTION | InlineStyleType.AI_INSIGHT;
    onClose: () => void;
    workspaceId: string;
    template: TemplateMessage;
    onSelectSuggestion: (suggestion: { message: string, buttons: TemplateButton[] }) => void;
    disabled: boolean;
    withError?: any;
    onClearError?: () => void;
    setFieldValue?: (field: string, value: any) => void;
    setTextEditor?: (value: string) => void;
}
