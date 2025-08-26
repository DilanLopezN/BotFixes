export interface AgentOnlineStatus {
    userName: string;
    userId: string;
    breakTimeSeconds: number;
}

export interface AgentBreakStatus {
    userName: string;
    userId: string;
    breakType: string;
    breakName: string;
    breakTimeSeconds: number;
    breakDurationSeconds: number;
    breakOvertimeSeconds: number;
}

export interface AgentOfflineStatus {
    userName: string;
    userId: string;
    breakTimeSeconds: number;
}

export interface AgentStatusResponse {
    online: AgentOnlineStatus[];
    break: AgentBreakStatus[];
    offline: AgentOfflineStatus[];
}

export interface AgentTimeAggregation {
    agg_field: string;
    agg_result: number;
    date: string;
}

export interface AgentTimeAggregationTotal {
    total: number;
}
