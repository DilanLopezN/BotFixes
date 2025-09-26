import { Identity } from '../../../../interfaces/conversation.interface';

export interface MemberListProps {
    members: Identity[];
    conversationState: string;
    workspaceId: string;
    conversationId: string;
}
