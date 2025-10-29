import { FormInstance } from 'antd';
import { ChannelConfig } from '../../../../../model/Bot';
import { Team } from '../../../../../model/Team';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import { ConversationCardData } from '../../ConversationCard/props';
import { TemplateMessage } from '../../TemplateMessageList/interface';
import { ClosingConversationSteps } from '../constants';

export interface FinishConversationFormValues {
    objectiveId: string;
    outcomeId: string;
    description?: string;
    conversationTags?: string[];
    message: string;
}

export interface CreateCategorizationParams {
    conversationId: string;
    objectiveId: string;
    outcomeId: string;
    userId: string;
    description?: string;
    conversationTags?: string[];
    message?: string;
}

export interface MessageStepProps extends I18nProps {
    conversation: ConversationCardData;
    selectedTemplate: TemplateMessage;
    form: FormInstance<FinishConversationFormValues>;
    channels: ChannelConfig[];
    setCurrentStep: React.Dispatch<React.SetStateAction<ClosingConversationSteps>>;
    setSelectedTemplate: React.Dispatch<React.SetStateAction<TemplateMessage>>;
}

export interface MessageStepFooterProps extends I18nProps {
    handleOk: () => void;
    handleClose: () => void;
}

export interface TemplateVariablesStepProps extends I18nProps {
    selectedTemplate?: TemplateMessage;
}

export interface TemplateVariablesFooterProps extends I18nProps {
    handleClose: () => void;
}

export interface CategorizationStepProps extends I18nProps {
    teams: Team[];
    conversation: ConversationCardData;
    isDescriptionEnabled: boolean;
}

export interface CategorizationStepFooterProps extends I18nProps {
    isFinishing: boolean;
    handleClose: () => void;
}

export interface SelectableOption {
    value: number;
    label: React.ReactNode;
    disabled?: boolean;
    name: string;
    title?: string;
}

export interface ConversationCategorization {
    id: number;
    iid: string;
    conversationId: string;
    objectiveId: number;
    outcomeId: number;
    userId: string;
    description?: string;
    conversationTags?: string[];
    createdAt: number;
    updatedAt?: number;
    deletedAt?: number;
}

export interface ConversationOutcome {
    id: number;
    name: string;
    workspaceId: string;
    createdAt: string;
    updatedAt: string | null;
    deletedAt: string | null;
}
export interface ConversationObjective {
    id: number;
    name: string;
    workspaceId: string;
    createdAt: string;
    updatedAt: string | null;
    deletedAt: string | null;
}

export interface GetConversationCategorizationProps {
    conversationCategorizationId?: number;
    objectiveIds?: string[];
    outcomeIds?: string[];
    conversationTags?: string[];
    userIds?: string[];
    teamIds?: string[];
    description?: string;
    startDate?: number;
    endDate?: number;
}

export type GetConversationCategorizationResponse = (ConversationCategorization & {
    user?: {
        id: string;
        name: string;
    };
    objective?: ConversationObjective;
    outcome?: ConversationOutcome;
})[];
