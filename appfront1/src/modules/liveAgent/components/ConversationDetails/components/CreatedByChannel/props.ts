import { ChannelConfig } from '../../../../../../model/Bot';
import { Conversation } from '../../../../interfaces/conversation.interface';

export interface CreatedByChannelProps {
    conversation: Conversation;
    channelList: ChannelConfig[];
}
