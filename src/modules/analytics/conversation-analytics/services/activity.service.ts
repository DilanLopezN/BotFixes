import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityType, AnalyticsActivityTotal, AnalyticsActivityUser } from 'kissbot-core';
import * as moment from 'moment';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { ActivityQueryFilter } from '../interfaces/analytics.interface';
import { ActivityAggregate } from 'kissbot-entities';
import { AnalyticsUtilService } from './analytics-util.service';
@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(ActivityAggregate, ANALYTICS_READ_CONNECTION)
        private activityViewReadRepository: Repository<ActivityAggregate>,
        private readonly utils: AnalyticsUtilService,
    ) {}

    async getActivitiesData(queryFilter: ActivityQueryFilter) {
        switch (queryFilter.groupBy) {
            case 'user': {
                return await this.getGroupedByUser(queryFilter);
            }
            case 'total': {
                return await this.getTotal(queryFilter);
            }
        }
    }

    private async getGroupedByUser(filter: ActivityQueryFilter): Promise<AnalyticsActivityUser[]> {
        const interval = this.utils.getInterval(filter.interval);

        const query = await this.getQuery(filter)
            .select(`date_trunc('${interval}', activity.timestamp) "date"`)
            .addSelect(`sum(count) "count"`)
            .groupBy('date')
            .orderBy('1');

        const result: { date: string; count: string; fromId: string; fromName: string }[] = await query.execute();
        return result.map((data) => ({ ...data, count: parseInt(data.count, 10) }));
    }

    private async getTotal(filter: ActivityQueryFilter): Promise<AnalyticsActivityTotal[]> {
        const interval = this.utils.getInterval(filter.interval);

        let query = await this.getQuery(filter)
            .select(`date_trunc('${interval}', activity.timestamp) "date"`)
            .addSelect(`sum(count) "count"`)
            .groupBy('date')
            .orderBy('1');

        if (filter.isHsm) {
            query = query.andWhere('activity."isHsm" = 1')  
        }

        const result: { date: string; count: string }[] = await query.execute();
        return result.map((data) => ({ ...data, count: parseInt(data.count, 10) }));
    }

    private getQuery(query: ActivityQueryFilter): SelectQueryBuilder<ActivityAggregate> {
        let queryBuilder: SelectQueryBuilder<ActivityAggregate> =
            this.activityViewReadRepository.createQueryBuilder('activity');
        if (query.botId) {
            queryBuilder = queryBuilder.andWhere(`activity.bot_id = :botId`, { botId: query.botId });
        }

        queryBuilder = queryBuilder.innerJoin('conversation', 'conv', 'activity.conversation_id = conv.id');
        if (query.channelId) {
            queryBuilder = queryBuilder.andWhere(`conv.created_by_channel = :channelId`, {
                channelId: query.channelId,
            });
        } else {
            queryBuilder = queryBuilder.andWhere(`conv.created_by_channel <> 'webemulator'`);
        }

        if (query.endDate && query.startDate) {
            const startDate = moment.utc(query.startDate).valueOf() / 1000;
            const endDate = moment.utc(query.endDate).valueOf() / 1000;

            queryBuilder = queryBuilder.andWhere(`activity.timestamp >= to_timestamp(:startDate)`, {
                startDate: startDate,
            });
            queryBuilder = queryBuilder.andWhere(`activity.timestamp <= to_timestamp(:endDate)`, { endDate: endDate });
        }

        if (query?.teamIds && !query.teamIds?.length) {
            queryBuilder = queryBuilder.andWhere(`conv.assigned_to_team_id IN (${query.teamIds.toString()})`);
        } else if (query.teamIds) {
            queryBuilder = queryBuilder.andWhere(`conv.assigned_to_team_id = :teamId`, { teamId: query.teamId });
        }

        if (query.tags && query.tags.length > 0) {
            const truthyTags: string[] = query.tags.map((tag) => tag.trim()).filter((tag) => !!tag);
            if (truthyTags.length > 0) {
                queryBuilder = queryBuilder.andWhere(`conv.tags && :tags`, { tags: `{${truthyTags + ''}}` });
            }
        }

        queryBuilder = queryBuilder.andWhere(
            `
                (activity.type IN ('${ActivityType.message}', '${ActivityType.member_upload_attachment}', '${ActivityType.rating_message}')
                OR (activity.type = '${ActivityType.event}' AND activity.name = 'start'))
            `,
        );

        queryBuilder = queryBuilder.andWhere(`activity.workspace_id = :workspaceId`, {
            workspaceId: query.workspaceId,
        });

        return queryBuilder;
    }
}
