import { WorkspaceChannels } from '../models/workspace-channel-specification.entity';

export class CreateWorkspaceChannelSpecification {
    workspaceId: string;
    channelId: WorkspaceChannels;
    conversationLimit: number;
    conversationExcededPrice: number;
    messageLimit: number;
    messageExcededPrice: number;
}

export class WorkspaceChannelSpecification {
    id: number;
    workspaceId: string;
    channelId: WorkspaceChannels;
    conversationLimit: number;
    conversationExcededPrice: number;
    messageLimit: number;
    messageExcededPrice: number;
}
