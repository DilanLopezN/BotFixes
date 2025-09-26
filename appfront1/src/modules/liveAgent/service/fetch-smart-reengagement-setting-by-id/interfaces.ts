export interface SmartReengagementSetting {
    id: string;
    conversationId: string;
    workspaceId: string;
    smtReSettingId: string;
    initialMessageSent: boolean;
    initialMessageSentAt: string | null;
    automaticMessageSent: boolean;
    automaticMessageSentAt: string | null;
    finalizationMessageSent: boolean;
    finalizationMessageSentAt: string | null;
    stopped: boolean;
    stoppedAt: string | null;
    stoppedByMemberId: string | null;
}
