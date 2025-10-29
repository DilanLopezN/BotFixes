export interface ConversationAnalytics {
    date: string;
    member_id: string;
    member_name: string;
    count: number | null;
    memberFinished: string | null;
    timeAgentReplyAvg: string | null;
    timeUserReplyAvg: string | null;
    timeAgentFirstReplyAvg: string | null;
    timeToCloseAvg: string | null;
    awaitingWorkingTime: string | null;
}
