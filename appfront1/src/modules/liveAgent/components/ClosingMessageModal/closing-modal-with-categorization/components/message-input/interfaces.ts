import { ChannelConfig } from '../../../../../../../model/Bot';
import { I18nProps } from '../../../../../../i18n/interface/i18n.interface';
import { ConversationCardData } from '../../../../ConversationCard/props';
import { TemplateMessage } from '../../../../TemplateMessageList/interface';
import { ClosingConversationSteps } from '../../../constants';

export interface MessageInputProps extends I18nProps {
    isExpired: boolean;
    hasResponse: boolean;
    value: string;
    conversation: ConversationCardData;
    channels: ChannelConfig[];
    onChange: (value: string) => void;
    setCurrentStep: React.Dispatch<React.SetStateAction<ClosingConversationSteps>>;
    setSelectedTemplate: React.Dispatch<React.SetStateAction<TemplateMessage>>;
}

export interface TemplatePopoverProps {
    value: string;
    hasResponse: boolean;
    conversation: ConversationCardData;
    channels: ChannelConfig[];
    onChangeMessage: (value: string) => void;
    setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentStep: React.Dispatch<React.SetStateAction<ClosingConversationSteps>>;
    setSelectedTemplate: React.Dispatch<React.SetStateAction<TemplateMessage>>;
}
