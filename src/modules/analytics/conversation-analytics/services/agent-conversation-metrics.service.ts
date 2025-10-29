import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import {
    AgentConversationMetricsQueryFilterDto,
    AnalyticsAgentConversationMetricsInterval,
} from '../interfaces/analytics.interface';
import { AgentConversationMetrics } from 'kissbot-entities';
import { AnalyticsUtilService } from './analytics-util.service';
import { DefaultTimezone } from '../../../../common/utils/defaultTimezone';
import { ExternalDataService } from './external-data.service';

export class AgentConversationMetricsService {
    private readonly logger = new Logger(AgentConversationMetricsService.name);
    constructor(
        @InjectRepository(AgentConversationMetrics, ANALYTICS_READ_CONNECTION)
        private agentConversationMetricsReadRepository: Repository<AgentConversationMetrics>,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async getAgentConversationProductivity(
        filter: AgentConversationMetricsQueryFilterDto,
        limitTop?: boolean,
    ): Promise<any> {
        const interval = filter?.interval || AnalyticsAgentConversationMetricsInterval.WEEK;
        let query = this.getQueryAgentConversationMetrics(filter)
            .select(`CAST(count(*) AS INT) as agg_result`)
            .addSelect(`ag.user_id as "agg_field"`)
            .innerJoin(
                'conversation',
                'conv',
                `conv.id = ag.conversation_id 
             AND conv.closed_by = ag.user_id
             AND (TO_TIMESTAMP(ag.metric_assumed_at / 1000)::date = TO_TIMESTAMP(conv.metrics_close_at / 1000)::date)` +
                    (filter?.teamId ? ' AND conv."assigned_to_team_id" = :teamId' : ''),
                filter?.teamId ? { teamId: filter.teamId } : undefined,
            )
            .addSelect(
                `date_trunc('${interval}', TO_TIMESTAMP(ag.metric_assumed_at / 1000)::timestamptz AT TIME ZONE '${
                    filter.timezone || DefaultTimezone
                }')`,
                'date',
            )
            .groupBy('date, ag.user_id');

        if (!!limitTop) {
            query = query.limit(10);
        }

        const result = await query.execute();
        return result;
    }

    async getTopAgentConversationProductivity(filter: AgentConversationMetricsQueryFilterDto): Promise<any> {
        const result = await this.getAgentConversationProductivity(filter, true);

        if (result && result?.length) {
            const userIds = result.map((currData) => currData.agg_field);
            const users = await this.externalDataService.getUsersByIds(userIds);

            return result.map((currData) => {
                const user = users?.find((currUser) => currUser._id === currData.agg_field);
                return {
                    ...currData,
                    userName: user?.name || 'Desconhecido',
                };
            });
        }

        return result;
    }

    async getTeamConversationProductivity(
        filter: AgentConversationMetricsQueryFilterDto,
        limitTop?: boolean,
    ): Promise<any> {
        const interval = filter?.interval || AnalyticsAgentConversationMetricsInterval.WEEK;
        let query = this.getQueryAgentConversationMetrics(filter)
            .select(`CAST(count(*) AS INT) as agg_result`)
            .addSelect(`conv.assigned_to_team_id as "agg_field"`)
            .innerJoin(
                'conversation',
                'conv',
                `conv.id = ag.conversation_id 
             AND conv.closed_by = ag.user_id
             AND (TO_TIMESTAMP(ag.metric_assumed_at / 1000)::date = TO_TIMESTAMP(conv.metrics_close_at / 1000)::date)` +
                    (filter?.teamId ? ' AND conv."assigned_to_team_id" = :teamId' : ''),
                filter?.teamId ? { teamId: filter.teamId } : undefined,
            )
            .addSelect(
                `date_trunc('${interval}', TO_TIMESTAMP(ag.metric_assumed_at / 1000)::timestamptz AT TIME ZONE '${
                    filter.timezone || DefaultTimezone
                }')`,
                'date',
            )
            .groupBy('date, conv.assigned_to_team_id');

        if (!!limitTop) {
            query = query.limit(10);
        }

        const result = await query.execute();
        return result;
    }

    async getTotalAgentConversationProductivity(filter: AgentConversationMetricsQueryFilterDto): Promise<any> {
        let query = this.getQueryAgentConversationMetrics(filter)
            .select(`CAST(count(*) AS INT) as total`)
            .innerJoin(
                'conversation',
                'conv',
                `conv.id = ag.conversation_id 
             AND conv.closed_by = ag.user_id
             AND (TO_TIMESTAMP(ag.metric_assumed_at / 1000)::date = TO_TIMESTAMP(conv.metrics_close_at / 1000)::date)` +
                    (filter?.teamId ? ' AND conv."assigned_to_team_id" = :teamId' : ''),
                filter?.teamId ? { teamId: filter.teamId } : undefined,
            );

        const result = await query.execute();
        return { data: result?.[0] || null };
    }

    private getQueryAgentConversationMetrics(
        query: AgentConversationMetricsQueryFilterDto,
    ): SelectQueryBuilder<AgentConversationMetrics> {
        let queryBuilder: SelectQueryBuilder<AgentConversationMetrics> = this.agentConversationMetricsReadRepository
            .createQueryBuilder('ag')
            .where('ag.workspace_id = :workspaceId', { workspaceId: query.workspaceId });

        if (query.endDate && query.startDate) {
            const startDate = moment
                .tz(query.startDate, query?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment
                .tz(query.endDate, query?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();
            queryBuilder = queryBuilder.andWhere(`ag.metric_assumed_at >= :startDate`, {
                startDate: startDate.valueOf(),
            });
            queryBuilder = queryBuilder.andWhere(`ag.metric_assumed_at <= :endDate`, {
                endDate: endDate.valueOf(),
            });
        }

        if (query.userId) {
            queryBuilder = queryBuilder.andWhere(`ag.user_id = :userId`, {
                userId: query.userId,
            });
        }

        return queryBuilder;
    }
}
