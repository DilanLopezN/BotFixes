import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelIdConfig } from 'kissbot-core';
import * as moment from 'moment';
import { Exceptions } from './../../../auth/exceptions';
import { Repository, SelectQueryBuilder, LessThanOrEqual } from 'typeorm';
import {
    ConversationTemplate,
    FixedClosedBy,
    Operator,
    TemplateGroupField,
    TemplateMetrics,
} from '../../dashboard-template/interfaces/conversation-template.interface';
import { ConversationTemplateService } from '../../dashboard-template/services/conversation-template.service';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { ConversationQueryFilter } from '../interfaces/analytics.interface';
import {
    ConversationRatingView,
    ConversationView,
    Conversation,
    ConversationCategorizationView,
} from 'kissbot-entities';
import { AnalyticsUtilService } from './analytics-util.service';
import { formatDuration, transformArrayIntoPostgresInClause } from '../../../../common/utils/utils';
import { orderBy } from 'lodash';
import { DefaultTimezone } from '../../../../common/utils/defaultTimezone';

export class ConversationService {
    private readonly logger = new Logger(ConversationService.name);
    constructor(
        @InjectRepository(Conversation, ANALYTICS_CONNECTION)
        private conversationRepository: Repository<Conversation>,
        @InjectRepository(ConversationView, ANALYTICS_READ_CONNECTION)
        private conversationViewReadRepository: Repository<ConversationView>,
        private readonly utils: AnalyticsUtilService,
        private readonly conversationTemplateService: ConversationTemplateService,
    ) {}

    async updateRefreshView(timestamp: number) {
        try {
            await this.conversationRepository.update(
                { refreshOk: 0, createdAt: LessThanOrEqual(timestamp) },
                {
                    refreshOk: 1,
                },
            );
        } catch (e) {
            console.log('ConversationService.updateRefreshView', e);
        }
    }

    async getConversationData(queryFilter: ConversationQueryFilter) {
        switch (queryFilter.groupBy) {
            case 'user': {
                return await this.getGroupedByUser(queryFilter);
            }
            case 'total': {
                return await this.getTotal(queryFilter);
            }
            case 'attendance-date-avg': {
                return await this.getAttendanceDateAvg(queryFilter);
            }
            case 'awaiting-working-time-avg': {
                return await this.getAwaitingWorkingTimeAvg(queryFilter);
            }
            case 'user-resume-avg': {
                return await this.getGroupedByUserAvg(queryFilter);
            }
            default:
                return await this.getByTemplate(queryFilter);
        }
    }

    private async getAttendanceDateAvg(filter: ConversationQueryFilter): Promise<any> {
        const interval = this.utils.getInterval(filter.interval);
        let query = this.getQuery(filter)
            .select(`avg(conv.metrics_time_to_agent_reply) "avg"`)
            .andWhere(`conv.created_by_channel <> 'live-agent'`)
            .innerJoin('member', 'mem', "mem.conversation_id = conv.id AND mem.disabled <> 1 AND mem.type = 'agent'")
            .groupBy('date');
        // .orderBy('date');
        if (interval == 'day' || interval == 'hour' || interval == 'month' || interval == 'week') {
            query = query.addSelect(`date_agg_${interval} "date"`);
        } else {
            query = query.addSelect(
                `date_trunc('${interval}', conv.date_agg::timestamp with time zone at time zone '${
                    filter.timezone || DefaultTimezone
                }') "date"`,
            );
        }
        const timeout = this.timeoutLog(query.getSql(), 'getAttendanceDateAvg', filter);
        const result = await query.execute();
        clearTimeout(timeout);
        return orderBy(result || [], 'date').map((data) => ({ ...data, avg: parseFloat(data.avg) }));
    }

    private timeoutLog(query: string, func: string, filter: ConversationQueryFilter) {
        return setTimeout(() => {
            // this.logger.debug('===================================================');
            // this.logger.debug(`QUERY  ANALYTICS ${func}: ${query}`);
            // this.logger.debug(`FILTER ANALYTICS ${func}: ${JSON.stringify(filter)}`);
        }, 10000);
    }

    private async getAwaitingWorkingTimeAvg(filter: ConversationQueryFilter): Promise<any> {
        const interval = this.utils.getInterval(filter.interval);
        let query = this.getQuery(filter)
            .select(
                `date_trunc('${interval}', conv.date_agg::timestamp with time zone at time zone '${
                    filter.timezone || DefaultTimezone
                }') "date"`,
            )
            .addSelect(`avg(conv.metrics_awaiting_working_time) "avg"`)
            .andWhere('conv.metrics_awaiting_working_time > 0')
            .andWhere('conv.metrics_awaiting_working_time IS NOT NULL')
            .andWhere('conv.metrics_first_agent_reply_at_date_agg IS NOT NULL')
            .andWhere(`conv.created_by_channel <> 'live-agent'`)
            .innerJoin('member', 'mem', "mem.conversation_id = conv.id AND mem.disabled <> 1 AND mem.type = 'agent'")
            .groupBy('date');
        // .orderBy('date');

        const timeout = this.timeoutLog(query.getSql(), 'getAwaitingWorkingTimeAvg', filter);
        const result = await query.execute();
        clearTimeout(timeout);
        return orderBy(result || [], 'date').map((data) => ({ ...data, avg: parseFloat(data.avg) }));
    }

    private async getTotal(filter: ConversationQueryFilter): Promise<any> {
        try {
            const interval = this.utils.getInterval(filter.interval);
            let query = this.getQuery(filter).select(`count(*) "count"`).groupBy('date').orderBy('date');
            if (interval == 'day' || interval == 'hour' || interval == 'month' || interval == 'week') {
                query = query.addSelect(`date_agg_${interval} "date"`);
            } else {
                query = query.addSelect(
                    `date_trunc('${interval}', conv.date_agg::timestamp with time zone at time zone '${
                        filter.timezone || DefaultTimezone
                    }') "date"`,
                );
            }
            if (filter.conversationsWith == 'agent') {
                query = query.andWhere(`conv.state = 'closed'`);
                query = query.andWhere(`conv.closed_type = 'agent'`);
            } else if (filter.conversationsWith == 'bot') {
                query = query.andWhere(`conv.state = 'closed'`);
                query = query.andWhere(`conv.closed_type <> 'agent'`);
            } else if (filter.conversationsWith == 'not_closed') {
                query = query.andWhere(`conv.state = 'open'`);
            }

            const timeout = this.timeoutLog(query.getSql(), 'getTotal', filter);
            const result = await query.execute();
            clearTimeout(timeout);
            return (result || []).map((data) => ({ ...data, count: parseInt(data.count, 10) }));
        } catch (e) {
            this.logger.error(e);
        }
    }

    private async getGroupedByUser(filter: ConversationQueryFilter): Promise<any> {
        try {
            const interval = this.utils.getInterval(filter.interval);
            let query = this.getQuery(filter)
                .select(
                    `date_trunc('${interval}', conv.date_agg::timestamp with time zone at time zone '${
                        filter.timezone || DefaultTimezone
                    }') "date"`,
                )
                .addSelect(`mem.member_id as member_id`)
                .addSelect(`mem.name as member_name`)
                .addSelect(`count(*) "count"`)
                .innerJoin(
                    'member',
                    'mem',
                    `
                    mem.conversation_id = conv.id 
                    AND mem.disabled <> 1
                    AND mem.type = 'agent'
                `,
                )
                .andWhere(`mem."name" <> '' and mem.type = 'agent'`);

            if (filter.conversationsWith == 'agent') {
                query = query.andWhere(`conv.state = 'closed'`);
                query = query.andWhere(`conv.closed_type = 'agent'`);
            } else if (filter.conversationsWith == 'bot') {
                query = query.andWhere(`conv.state = 'closed'`);
                query = query.andWhere(`conv.closed_type <> 'agent'`);
            } else if (filter.conversationsWith == 'not_closed') {
                query = query.andWhere(`conv.state = 'open'`);
            } else {
                query = query.andWhere(`conv.state = 'closed'`);
            }

            if (filter?.closedBy && filter.closedBy?.length > 0) {
                query.andWhere(`conv.closed_by IN (:...closedBy)`, { closedBy: filter.closedBy });
            }

            query = query.groupBy(`"date"`).addGroupBy(`member_id`).addGroupBy(`member_name`);

            const timeout = this.timeoutLog(query.getSql(), 'getGroupedByUser', filter);
            const result = await query.execute();
            clearTimeout(timeout);
            return (result || []).map((data) => ({ ...data, count: parseInt(data.count, 10) }));
        } catch (e) {
            console.log('Error Analytics ConversationService.getGroupedByUser: ', e);
        }
    }

    private async getGroupedByUserAvg(filter: ConversationQueryFilter): Promise<any> {
        try {
            let query = this.getQuery(filter)
                .select(
                    `date_trunc('century', conv.date_agg::timestamp with time zone at time zone '${
                        filter.timezone || DefaultTimezone
                    }') "date"`,
                )
                .addSelect(`mem.member_id as member_id`)
                .addSelect(`mem.name as member_name`)
                .addSelect(`count(*) "count"`)
                .addSelect(`sum(CASE WHEN conv.closed_by = mem.member_id THEN 1 ELSE 0 END) "memberFinished"`)
                .addSelect(`avg(conv.metrics_median_time_to_agent_reply) "timeAgentReplyAvg"`)
                .addSelect(`avg(conv.metrics_median_time_to_user_reply) "timeUserReplyAvg"`)
                .addSelect(
                    `avg(CASE WHEN conv.created_by_channel <> 'live-agent' THEN conv.metrics_time_to_agent_reply ELSE null END) "timeAgentFirstReplyAvg"`,
                )
                .addSelect(
                    `avg(CASE WHEN conv.metrics_awaiting_working_time > 0 AND conv.metrics_awaiting_working_time IS NOT NULL AND conv.metrics_first_agent_reply_at_date_agg IS NOT NULL AND conv.created_by_channel <> 'live-agent' THEN conv.metrics_awaiting_working_time ELSE null END) "awaitingWorkingTime"`,
                )
                .addSelect(`avg(conv.metrics_time_to_close) "timeToCloseAvg"`)
                .innerJoin('member', 'mem', `mem.conversation_id = conv.id AND mem.type = 'agent' AND mem.name <> ''`);

            if (filter.conversationsWith == 'agent') {
                query = query.andWhere(`conv.state = 'closed'`);
                query = query.andWhere(`conv.closed_type = 'agent'`);
            } else if (filter.conversationsWith == 'bot') {
                query = query.andWhere(`conv.state = 'closed'`);
                query = query.andWhere(`conv.closed_type <> 'agent'`);
            } else if (filter.conversationsWith == 'not_closed') {
                query = query.andWhere(`conv.state = 'open'`);
            } else {
                query = query.andWhere(`conv.state = 'closed'`);
            }

            if (filter?.closedBy && filter.closedBy?.length > 0) {
                query.andWhere(`conv.closed_by IN (:...closedBy)`, { closedBy: filter.closedBy });
            }

            query = query.groupBy(`"date"`).addGroupBy(`mem.member_id`).addGroupBy(`mem.name`);

            const timeout = this.timeoutLog(query.getSql(), 'getGroupedByUserResumeAvg', filter);
            const result = await query.execute();
            clearTimeout(timeout);
            return (result || []).map((data) => ({ ...data, count: parseInt(data.count, 10) }));
        } catch (e) {
            console.log('Error Analytics ConversationService.getGroupedByUserAvg: ', e);
        }
    }

    private getQuery(query: ConversationQueryFilter): SelectQueryBuilder<ConversationView> {
        let queryBuilder: SelectQueryBuilder<ConversationView> =
            this.conversationViewReadRepository.createQueryBuilder('conv');
        if (query.botId) {
            queryBuilder = queryBuilder.andWhere(`conv.bot_id = :botId`, { botId: query.botId });
        }

        if (query.omitInvalidNumber) {
            queryBuilder = queryBuilder.andWhere(`conv.invalid_number = false`);
        }

        if (query.channelId) {
            queryBuilder = queryBuilder.andWhere(`conv.created_by_channel = :channelId`, {
                channelId: query.channelId,
            });
        } else {
            // queryBuilder = queryBuilder.andWhere(`conv.created_by_channel <> 'webemulator'`);
        }

        if (query.endDate && query.startDate) {
            const startDate = moment
                .tz(query.startDate, query?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment
                .tz(query.endDate, query?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();
            queryBuilder = queryBuilder.andWhere(`conv.created_at >= :startDate`, {
                startDate: startDate.valueOf(),
            });
            queryBuilder = queryBuilder.andWhere(`conv.created_at <= :endDate`, {
                endDate: endDate.valueOf(),
            });
        }

        if (query?.teamIds && !!query.teamIds?.length) {
            queryBuilder = queryBuilder.andWhere(`conv.assigned_to_team_id IN (:...teamIds)`, {
                teamIds: query.teamIds,
            });
        } else if (query?.teamId) {
            queryBuilder = queryBuilder.andWhere(`conv.assigned_to_team_id = :teamId`, { teamId: query.teamId });
        }

        if (query.tags?.length) {
            const truthyTags: string[] = query.tags.map((tag) => tag.trim()).filter((tag) => !!tag);
            if (truthyTags.length > 0) {
                // o formato dessa query é -> where activity_analytics."tags" && '{tag 1, tag2, tag n}'
                // por isso a formatação em javascript de ['tag 1', 'tag 2', 'tag n'] para string
                queryBuilder = queryBuilder.andWhere(`conv.tags @> :tags`, { tags: `{${truthyTags + ''}}` });
            }
        }

        queryBuilder = queryBuilder.andWhere(`conv.workspace_id = :workspaceId`, { workspaceId: query.workspaceId });
        return queryBuilder;
    }

    // ================================= Lógica analytics com template ======================================

    private async getByTemplate(filter: ConversationQueryFilter) {
        let template: ConversationTemplate;

        if (filter.dashboardTemplateId) {
            template = await this.conversationTemplateService.findOneById(filter.dashboardTemplateId);
        } else if (filter.dashboardConversationTemplate) {
            template = filter.dashboardConversationTemplate;
        }

        if (!template) {
            throw Exceptions.CANNOT_GET_DASHBOARD_DATA_FOR_INVALID_TEMPLATE;
        }
        const interval = this.utils.getInterval(template.interval);
        const metric = this.getMetricsSelect(template);
        let { query, inTags, notInTags } = await this.getTemplateQuery(template, filter);
        query = query
            .select(
                `date_trunc('${interval}', conv.date_agg::timestamp with time zone at time zone '${
                    filter.timezone || DefaultTimezone
                }') "date"`,
            )
            .addSelect(metric)
            .groupBy('date')
            .orderBy('1');
        if (template.groupField !== TemplateGroupField.no_field) {
            if (template.groupField == TemplateGroupField.tags) {
                const inTagsString = transformArrayIntoPostgresInClause(inTags);
                const notInTagsString = transformArrayIntoPostgresInClause(notInTags);
                query = query
                    .addSelect(
                        `
                    (
                    ${
                        !!notInTagsString && !!inTagsString
                            ? `
                        unnest((select array_agg(tags.agg) from (
                                SELECT y.agg FROM (
                                    SELECT x as agg from unnest(conv.tags) as x where x not in (${notInTags})
                                ) as y where y.agg in (${notInTagsString})
                            ) as tags
                        ))
                        `
                            : ''
                    }
                    ${
                        !!notInTagsString && !inTagsString
                            ? `
                        unnest(
                            (select array_agg(tags.agg) from (
                                    SELECT x as agg from unnest(conv.tags) as x
                                ) as tags where tags.agg NOT IN (${notInTagsString})
                            )	
                        )
                        `
                            : ''
                    }
                    ${
                        !!inTagsString && !notInTagsString
                            ? `
                        unnest(
                            (select array_agg(tags.agg) from (
                                    SELECT x as agg from unnest(conv.tags) as x
                                ) as tags where tags.agg IN (${inTagsString})
                            )	
                        )
                        `
                            : ''
                    }
                    ${!inTagsString && !notInTagsString ? `unnest(conv.tags)` : ''}
                    ) as agg_field
                `,
                    )
                    .addGroupBy('agg_field');
            } else if (template.groupField == TemplateGroupField.categorization_objective) {
                query = query.addSelect(`cc.objective_id as agg_field`).addGroupBy('agg_field');
            } else if (template.groupField == TemplateGroupField.categorization_outcome) {
                query = query.addSelect(`cc.outcome_id as agg_field`).addGroupBy('agg_field');
            } else if (template.groupField == TemplateGroupField.closed_by) {
                const hasAllAgentsClosedBy = template?.conditions
                    ?.find((condition) => condition.field == TemplateGroupField.closed_by)
                    ?.values?.find((value) => value == FixedClosedBy.all_agents);
                if (hasAllAgentsClosedBy) {
                    query = query.addSelect(`conv.closed_type as agg_field`).addGroupBy('agg_field');
                } else {
                    query = query
                        .addSelect(
                            `CASE WHEN mem.type = 'bot' OR mem.type = 'system' THEN 'Bot' ELSE mem.name END AS agg_field`,
                        )
                        .addGroupBy('agg_field');
                }
            } else if (template.groupField == TemplateGroupField.rating) {
                query = query.addSelect(`rat.value as agg_field`).addGroupBy('agg_field');
            } else if (template.groupField == TemplateGroupField.agents) {
                query = query
                    .addSelect(
                        `CASE WHEN mem.type = 'bot' OR mem.type = 'system' THEN 'Bot' ELSE mem.name END AS agg_field`,
                    )
                    .addGroupBy('agg_field');
            } else {
                query = query.addSelect(`conv.${template.groupField} as agg_field`).addGroupBy('agg_field');
            }
        }
        // console.log(query.getQueryAndParameters())

        const result = await query.execute();
        return result;
    }

    private async getTemplateQuery(
        template: ConversationTemplate,
        filter: ConversationQueryFilter,
    ): Promise<{ query: SelectQueryBuilder<ConversationView>; inTags: string[]; notInTags: string[] }> {
        let queryBuilder: SelectQueryBuilder<ConversationView> =
            this.conversationViewReadRepository.createQueryBuilder('conv');

        if (filter.endDate && filter.startDate) {
            const startDate = moment
                .tz(filter.startDate, filter?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment
                .tz(filter.endDate, filter?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();
            queryBuilder = queryBuilder.andWhere(`conv.created_at >= :startDate`, {
                startDate: startDate.valueOf(),
            });
            queryBuilder = queryBuilder.andWhere(`conv.created_at <= :endDate`, {
                endDate: endDate.valueOf(),
            });
        }

        if (filter.omitInvalidNumber) {
            queryBuilder = queryBuilder.andWhere(`conv.invalid_number = false`);
        }

        let inTags = [];
        let notInTags = [];

        for (let condition of template.conditions) {
            let field: string;
            switch (condition.field) {
                case TemplateGroupField.assigned_to_team_id: {
                    field = TemplateGroupField.assigned_to_team_id;
                    break;
                }
                case TemplateGroupField.closed_by: {
                    field = TemplateGroupField.closed_by;
                    break;
                }
                case TemplateGroupField.created_by_channel: {
                    field = TemplateGroupField.created_by_channel;
                    break;
                }
                case TemplateGroupField.tags: {
                    field = TemplateGroupField.tags;
                    break;
                }
                case TemplateGroupField.hour_interval: {
                    field = TemplateGroupField.hour_interval;
                    break;
                }
                case TemplateGroupField.rating: {
                    field = TemplateGroupField.rating;
                    break;
                }
                case TemplateGroupField.token: {
                    field = TemplateGroupField.token;
                    break;
                }
                case TemplateGroupField.referral_source_id: {
                    field = TemplateGroupField.referral_source_id;
                    break;
                }
                case TemplateGroupField.categorization_objective: {
                    field = TemplateGroupField.categorization_objective;
                    break;
                }
                case TemplateGroupField.categorization_outcome: {
                    field = TemplateGroupField.categorization_outcome;
                    break;
                }
            }
            if (field && condition.values?.length) {
                const values: string = transformArrayIntoPostgresInClause(condition.values);
                if (field === TemplateGroupField.tags) {
                    const truthyTags: string[] = condition.values.map((tag) => tag.trim()).filter((tag) => !!tag);
                    if (truthyTags.length > 0) {
                        if (condition.operator == Operator.in) {
                            truthyTags.forEach((tag) => {
                                if (!inTags.includes(tag)) inTags.push(tag);
                            });
                            queryBuilder = queryBuilder.andWhere(`conv.tags && :tags`, {
                                tags: `{${truthyTags + ''}}`,
                            });
                            //queryBuilder = queryBuilder.andWhere(`agg_field IN (${values})`);
                        } else {
                            truthyTags.forEach((tag) => {
                                if (!notInTags.includes(tag)) notInTags.push(tag);
                            });
                            queryBuilder = queryBuilder.andWhere(`NOT conv.tags && :tags`, {
                                tags: `{${truthyTags + ''}}`,
                            });
                        }
                    }
                } else if (field === TemplateGroupField.closed_by) {
                    const hasBot = condition.values.find((value) => value == FixedClosedBy.bot);
                    const hasAllAgents = condition.values.find((value) => value == FixedClosedBy.all_agents);
                    const valuesWithoutNotClosedAndNotBot = condition.values.filter(
                        (value) =>
                            value !== FixedClosedBy.not_closed &&
                            value !== FixedClosedBy.bot &&
                            value !== FixedClosedBy.all_agents,
                    );
                    const stringValues = transformArrayIntoPostgresInClause(valuesWithoutNotClosedAndNotBot);
                    const hasNotClosed = condition.values.find((value) => value == FixedClosedBy.not_closed);
                    if (condition.operator == Operator.in) {
                        if (!!stringValues) {
                            queryBuilder = queryBuilder.andWhere(`conv.${field} IN (${stringValues})`);
                        } else if (hasNotClosed) {
                            queryBuilder = queryBuilder.andWhere(`conv.closed_by IS NULL`);
                        } else if (hasBot) {
                            if (hasAllAgents) {
                                queryBuilder = queryBuilder.andWhere(`conv.closed_type IN ('bot', 'system', 'agent')`);
                            } else {
                                queryBuilder = queryBuilder.andWhere(`conv.closed_type IN ('bot', 'system')`);
                            }
                        } else if (hasAllAgents) {
                            queryBuilder = queryBuilder.andWhere(`conv.closed_type = 'agent'`);
                        }
                    } else {
                        if (!!stringValues) {
                            queryBuilder = queryBuilder.andWhere(`conv.${field} NOT IN (${stringValues})`);
                        } else if (hasNotClosed) {
                            queryBuilder = queryBuilder.andWhere(`conv.closed_by IS NOT NULL`);
                        } else if (hasBot) {
                            if (hasAllAgents) {
                                queryBuilder = queryBuilder.andWhere(
                                    `conv.closed_type NOT IN ('bot', 'system', 'agent')`,
                                );
                            } else {
                                queryBuilder = queryBuilder.andWhere(`conv.closed_type NOT IN ('bot', 'system')`);
                            }
                        } else if (hasAllAgents) {
                            queryBuilder = queryBuilder.andWhere(`conv.closed_type <> 'agent'`);
                        }
                    }
                } else if (field === TemplateGroupField.hour_interval) {
                    if (!!condition.values[0] && !!condition.values[1]) {
                        if (condition.operator == Operator.in) {
                            queryBuilder = queryBuilder.andWhere(
                                `CAST(conv.date_agg::timestamp with time zone at time zone '${
                                    filter.timezone || DefaultTimezone
                                }' AS TIME) >= CAST(:startHour AS TIME)`,
                                {
                                    startHour: condition.values[0],
                                },
                            );
                            queryBuilder = queryBuilder.andWhere(
                                `CAST(conv.date_agg::timestamp with time zone at time zone '${
                                    filter.timezone || DefaultTimezone
                                }' AS TIME) <= CAST(:endHour AS TIME)`,
                                {
                                    endHour: condition.values[1],
                                },
                            );
                        } else {
                            queryBuilder = queryBuilder.andWhere(
                                `((
                                    CAST(conv.date_agg::timestamp with time zone at time zone '${
                                        filter.timezone || DefaultTimezone
                                    }' AS TIME) <= CAST(:startHour AS TIME) 
                                )
                                OR (
                                    CAST(conv.date_agg::timestamp with time zone at time zone '${
                                        filter.timezone || DefaultTimezone
                                    }' AS TIME) >= CAST(:endHour AS TIME)
                                ))
                                `,
                                {
                                    startHour: condition.values[0],
                                    endHour: condition.values[1],
                                },
                            );
                        }
                    }
                } else if (field === TemplateGroupField.rating) {
                    if (condition.operator == Operator.in) {
                        queryBuilder = queryBuilder.andWhere(`rat.value IN (${values})`);
                    } else {
                        queryBuilder = queryBuilder.andWhere(`rat.value NOT IN (${values})`);
                    }
                } else if (field === TemplateGroupField.categorization_objective) {
                    if (condition.operator == Operator.in) {
                        queryBuilder = queryBuilder.andWhere(`cc.objective_id IN (${values})`);
                    } else {
                        queryBuilder = queryBuilder.andWhere(`cc.objective_id NOT IN (${values})`);
                    }
                } else if (field === TemplateGroupField.categorization_outcome) {
                    if (condition.operator == Operator.in) {
                        queryBuilder = queryBuilder.andWhere(`cc.outcome_id IN (${values})`);
                    } else {
                        queryBuilder = queryBuilder.andWhere(`cc.outcome_id NOT IN (${values})`);
                    }
                } else {
                    if (condition.operator == Operator.in) {
                        queryBuilder = queryBuilder.andWhere(`conv.${field} IN (${values})`);
                    } else {
                        queryBuilder = queryBuilder.andWhere(`conv.${field} NOT IN (${values})`);
                    }
                }
            }
        }

        if (
            template.groupField === TemplateGroupField.categorization_objective ||
            template.groupField === TemplateGroupField.categorization_outcome
        ) {
            queryBuilder = queryBuilder.leftJoin(ConversationCategorizationView, 'cc', 'cc.conversation_id = conv.id');
        }

        if (template.groupField === TemplateGroupField.closed_by) {
            queryBuilder = queryBuilder.leftJoin(
                'member',
                'mem',
                "mem.conversation_id = conv.id AND mem.type IN ('agent', 'bot', 'system') AND mem.member_id = conv.closed_by",
            );

            // queryBuilder = queryBuilder.andWhere(`mem IS NOT NULL`);
        }

        if (template.groupField === TemplateGroupField.agents) {
            queryBuilder = queryBuilder.innerJoin(
                'member',
                'mem',
                "mem.conversation_id = conv.id AND mem.type = 'agent'",
            );
        }

        const hasRatingFilter = template?.conditions?.find(
            (condition) => condition?.field === TemplateGroupField.rating,
        );

        if (
            template.metric === TemplateMetrics.rating_avg ||
            template.groupField === TemplateGroupField.rating ||
            !!hasRatingFilter
        ) {
            queryBuilder = queryBuilder.innerJoin(ConversationRatingView, 'rat', 'rat.conversation_id = conv.id');
        }

        const hasTokenFilter = template?.conditions?.find((condition) => condition?.field === TemplateGroupField.token);

        if (template.groupField === TemplateGroupField.token || !!hasTokenFilter) {
            queryBuilder = queryBuilder.andWhere(
                `conv.created_by_channel NOT IN ('${ChannelIdConfig.webchat}', '${ChannelIdConfig.webemulator}')`,
            );
        }

        if (template.metric === TemplateMetrics.awaiting_working_time_avg) {
            queryBuilder = queryBuilder
                .andWhere('conv.metrics_awaiting_working_time > 0')
                .andWhere('conv.metrics_awaiting_working_time IS NOT NULL')
                .andWhere('conv.metrics_first_agent_reply_at_date_agg IS NOT NULL')
                .andWhere(`conv.created_by_channel <> 'live-agent'`)
                .innerJoin(
                    'member',
                    'mem_alias',
                    "mem_alias.conversation_id = conv.id AND mem_alias.disabled <> 1 AND mem_alias.type = 'agent'",
                );
        }

        if (template.metric === TemplateMetrics.first_agent_reply_avg) {
            queryBuilder = queryBuilder
                .andWhere(`conv.created_by_channel <> 'live-agent'`)
                .innerJoin(
                    'member',
                    'mem_alias',
                    "mem_alias.conversation_id = conv.id AND mem_alias.disabled <> 1 AND mem_alias.type = 'agent'",
                );
        }

        if (template.metric === TemplateMetrics.total_assumed_by_agent) {
            queryBuilder = queryBuilder.innerJoin(
                'member',
                'mem_alias',
                "mem_alias.conversation_id = conv.id AND mem_alias.type = 'agent'",
            );
        }

        if (template.metric === TemplateMetrics.metrics_median_time_to_agent_reply) {
            queryBuilder = queryBuilder
                .andWhere('conv.metrics_median_time_to_agent_reply > 0')
                .andWhere('conv.metrics_median_time_to_agent_reply IS NOT NULL')
                .andWhere(`conv.state = 'closed'`) // esta pegando apenas conversas fechadas pois as metricas de atendimentos abertos não são atualizadas
                .innerJoin('member', 'mem_alias', "mem_alias.conversation_id = conv.id AND mem_alias.type = 'agent'");
        }

        if (template.metric === TemplateMetrics.metrics_median_time_to_user_reply) {
            queryBuilder = queryBuilder
                .andWhere('conv.metrics_median_time_to_user_reply > 0')
                .andWhere('conv.metrics_median_time_to_user_reply IS NOT NULL')
                .andWhere(`conv.state = 'closed'`) // esta pegando apenas conversas fechadas pois as metricas de atendimentos abertos não são atualizadas
                .innerJoin('member', 'mem_alias', "mem_alias.conversation_id = conv.id AND mem_alias.type = 'agent'");
        }

        queryBuilder = queryBuilder.andWhere(`conv.workspace_id = :workspaceId`, { workspaceId: template.workspaceId });
        //Analisar como permitir montar grafico do emulador
        if (process.env.NODE_ENV === 'production') {
            queryBuilder = queryBuilder.andWhere(`conv.created_by_channel <> 'webemulator'`);
        }

        return { query: queryBuilder, inTags, notInTags };
    }

    private getMetricsSelect(template: ConversationTemplate): string {
        switch (template.metric) {
            case TemplateMetrics.first_agent_reply_avg:
                return `AVG(conv.metrics_time_to_agent_reply) agg_result`;
            case TemplateMetrics.time_to_close:
                return `AVG(conv.metrics_time_to_close) agg_result`;
            case TemplateMetrics.rating_avg:
                return `AVG(rat.value) agg_result`;
            case TemplateMetrics.awaiting_working_time_avg:
                return `AVG(conv.metrics_awaiting_working_time) agg_result`;
            case TemplateMetrics.metrics_median_time_to_agent_reply:
                return `AVG(conv.metrics_median_time_to_agent_reply) agg_result`;
            case TemplateMetrics.metrics_median_time_to_user_reply:
                return `AVG(conv.metrics_median_time_to_user_reply) agg_result`;
            default:
                return `count(*) "agg_result"`;
        }
    }

    async getGroupedByUserAvgCsv(filter: ConversationQueryFilter): Promise<any[]> {
        const data = await this.getGroupedByUserAvg(filter);

        const dataFormated: any = data?.map((conv) => {
            return {
                Agente: conv.member_name,
                'Tempo médio de resposta paciente': formatDuration(conv.timeUserReplyAvg),
                'Tempo médio de resposta agente': formatDuration(conv.timeAgentReplyAvg),
                Assumidos: conv.count,
                'TME Ativo': formatDuration(conv.awaitingWorkingTime),
                'TME 1ª resposta': formatDuration(conv.timeAgentFirstReplyAvg),
                TMA: formatDuration(conv.timeToCloseAvg),
                'Atendimentos Finalizados': conv.memberFinished,
            };
        });

        return dataFormated;
    }
}
