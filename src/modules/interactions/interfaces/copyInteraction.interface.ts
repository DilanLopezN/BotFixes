export interface CopyInteraction {
    fromWorkspaceId: string;
    fromBotId: string;
    fromInteractionId: string;
    toBotId: string;
    toWorkspaceId: string;
    toInteractionId?: string;
    nested: string;
}
