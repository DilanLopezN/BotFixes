export interface MetricsInterface {
    metricsAssignmentAt: number;
    metricsCloseAt: number;
    metricsLastAgentReplyAt: number;
    metricsLastUserReplyAt: number;
    metricsMedianTimeToAgentReply: number;
    metricsMedianTimeToUserReply: number;
    metricsTimeToAgentReply: number;
    metricsTimeToAssignment: number;
    metricsTimeToClose: number;
    metricsTimeToUserReply: number;
    metricsAwaitingWorkingTime?: number;
    suspendedUntil: number;
    waitingSince: number;
    order: number;
    priority: number;
    whatsappExpiration: number;
}
