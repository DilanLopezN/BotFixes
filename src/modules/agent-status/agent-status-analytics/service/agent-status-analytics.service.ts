import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { WorkingTimeType } from '../../interfaces/working-time.interface';
import { WorkingTime } from '../../models/working-time.entity';
import { WorkingTimeService } from '../../services/working-time.service';
import { GroupBy, GroupDateType } from '../dto/agent-status-analytics-filter.dto';
import { AgentStatusAnalyticsCSVParams } from '../interface/agent-status-analytics-csv.interface';
import {
    AgentBreakStatus,
    AgentOfflineStatus,
    AgentOnlineStatus,
    AgentStatusResponse,
    AgentTimeAggregation,
    AgentTimeAggregationTotal,
    BreakOvertimeCSVItem,
} from '../interface/agent-status-analytics.interface';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class AgentStatusAnalyticsService {
    constructor(
        private readonly workingTimeService: WorkingTimeService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async getAgentStatus(
        workspaceId: string,
        teamId?: string,
        userId?: string,
        breakSettingId?: number,
    ): Promise<AgentStatusResponse> {
        let agentUsers: { _id: string; name: string }[] = [];
        if (!userId) {
            agentUsers = await this.externalDataService.getAllActiveUsersAgentByWorkspaceId(workspaceId);
        } else {
            const result = await this.externalDataService.getUsersByIds([userId]);
            agentUsers = result;
        }

        let filteredAgentUsers = agentUsers;
        if (teamId) {
            const teamUsers = await this.externalDataService.getUsersOnTeam(workspaceId, teamId);
            const teamUserIds = new Set(teamUsers.map((user) => user._id));
            filteredAgentUsers = agentUsers.filter((user) => teamUserIds.has(user._id.toString()));
        }

        if (userId) {
            filteredAgentUsers = filteredAgentUsers.filter((user) => user._id.toString() === userId);
        }

        const userIds = filteredAgentUsers.map((user) => user._id.toString());
        let commonFilter = {
            workspaceId,
            userIds: userIds || [],
        };

        if (breakSettingId) {
            const breakAgents = await this.getBreakAgents(commonFilter, filteredAgentUsers, breakSettingId);
            return {
                online: [],
                break: breakAgents,
                offline: [],
            };
        }

        const onlineAgents = await this.getOnlineAgents(commonFilter, filteredAgentUsers);
        const breakAgents = await this.getBreakAgents(commonFilter, filteredAgentUsers);
        const agentsOffline = filteredAgentUsers.filter((user) => {
            const isOnline = onlineAgents?.find((currAg) => currAg.userId === user._id);
            const isBreak = breakAgents?.find((currAg) => currAg.userId === user._id);
            if (!isOnline && !isBreak) {
                return true;
            }
            return false;
        });
        const offlineAgents = await this.getOfflineAgents(
            { ...commonFilter, userIds: agentsOffline.map((user) => user._id.toString()) },
            agentsOffline,
        );

        return {
            online: onlineAgents,
            break: breakAgents,
            offline: offlineAgents,
        };
    }

    async getBreakOvertimeCsv(workspaceId: string, filterDto: AgentStatusAnalyticsCSVParams): Promise<any[]> {
        const result = await this.getListBreakOvertime(
            workspaceId,
            { limit: 0, skip: 0 },
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
            filterDto.breakSettingId,
        );

        const dataFormatted = result.data.map((item) => {
            const csvItem = item as Partial<WorkingTime> & BreakOvertimeCSVItem;

            return {
                ID: csvItem.id,
                Agente: csvItem.userName || csvItem.userId,
                Data: new Date(csvItem.startedAt).toLocaleString('pt-BR', {
                    timeZone: filterDto?.timezone || 'America/Sao_Paulo',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
                'Nome da pausa': csvItem.breakName || 'Inativo',
                'Tempo excedido': this.formatSecondsToTime(csvItem.overtimeSeconds || 0),
                Justificativa: csvItem.justification || '',
            };
        });

        return dataFormatted;
    }

    async getListBreakOvertime(
        workspaceId: string,
        filter: { skip: number; limit: number },
        startDate?: string,
        endDate?: string,
        teamId?: string,
        userId?: string,
        breakSettingId?: number,
    ): Promise<DefaultResponse<Partial<WorkingTime>[]>> {
        const limit = filter?.limit ?? 10;
        const skip = filter?.skip ?? 0;
        const repository = await this.workingTimeService.getRepository();
        const dateFilter = this.getDateRangeFilter(startDate, endDate);

        const baseQuery = repository
            .createQueryBuilder('wt')
            .leftJoin('break_settings', 'bs', 'bs.id = wt.break_setting_id')
            .select([
                'wt.id as "id"',
                'wt.user_id as "userId"',
                'wt.started_at as "startedAt"',
                'wt.type as "type"',
                'wt.break_setting_id as "breakSettingId"',
                'wt.justification as "justification"',
                'bs.name as "breakName"',
                'wt.break_overtime_seconds as "overtimeSeconds"',
            ])
            .where('wt.workspace_id = :workspaceId', { workspaceId })
            .andWhere('wt.type IN (:...types)', {
                types: [WorkingTimeType.BREAK, WorkingTimeType.INACTIVE],
            })
            .andWhere('wt.started_at >= :startDate AND wt.started_at <= :endDate', {
                startDate: dateFilter.startedAt,
                endDate: dateFilter.endedAt,
            });

        if (userId) {
            baseQuery.andWhere('wt.user_id = :userId', { userId });
        }

        if (teamId) {
            baseQuery.andWhere(
                `EXISTS (
                SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = :teamId
            )`,
                { teamId },
            );
        }

        if (breakSettingId) {
            if (breakSettingId === -1) {
                baseQuery.andWhere('wt.break_setting_id IS NULL');
            } else {
                baseQuery.andWhere('wt.break_setting_id = :breakSettingId', { breakSettingId });
            }
        }

        // traz apenas registros que já foram finalizados e possuem tempo excedido maior que zero
        baseQuery.andWhere('wt.ended_at IS NOT NULL');
        baseQuery.andWhere('wt.break_overtime_seconds IS NOT NULL AND wt.break_overtime_seconds > 0');

        // Total de registros sem paginação
        const countQuery = baseQuery.clone().select('COUNT(*)', 'count');
        const { count } = await countQuery.getRawOne<{ count: string }>();

        // Paginação
        baseQuery.orderBy('wt.started_at', 'DESC');
        if (filter?.limit > 0) {
            baseQuery.limit(limit).offset(skip);
        }
        const rawResults = await baseQuery.getRawMany();

        // Buscar nomes de usuários via serviço externo
        const uniqueUserIds = [...new Set(rawResults.map((r) => r.userId))];
        const users = await this.externalDataService.getUsersByIds(uniqueUserIds);

        const result: any = rawResults.map((row) => {
            const user = users.find((u) => u._id === row.userId);

            const breakName = row.type === WorkingTimeType.INACTIVE ? '' : row.breakName ?? 'Desconhecido';

            return {
                id: Number(row.id),
                userId: row.userId,
                breakSettingId: row.breakSettingId ? Number(row.breakSettingId) : null,
                startedAt: new Date(Number(row.startedAt)).toISOString(),
                justification: row.justification ?? null,
                userName: user?.name ?? row.userId,
                breakName,
                overtimeSeconds: Number(row.overtimeSeconds ?? 0),
            };
        });

        return {
            data: result,
            metadata: {
                count: Number(count),
                limit,
                skip,
            },
        };
    }

    private formatSecondsToTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`;
    }

    async getOnlineTime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        teamId?: string,
        userId?: string,
        groupDateBy?: GroupDateType,
        groupBy?: GroupBy,
    ): Promise<AgentTimeAggregation[]> {
        const queryResult = await this.calculateTotalTimeByTypeAndGrouped(
            workspaceId,
            WorkingTimeType.ONLINE,
            startDate,
            endDate,
            userId ? [userId] : undefined,
            teamId ? [teamId] : undefined,
            groupDateBy,
            groupBy,
        );

        return this.formatAggregationResults(queryResult);
    }

    async getTotalOnlineTime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        teamId?: string,
        userId?: string,
    ): Promise<AgentTimeAggregationTotal> {
        const result = await this.calculateTotalTimeByType(
            workspaceId,
            WorkingTimeType.ONLINE,
            startDate,
            endDate,
            userId ? [userId] : undefined,
            teamId ? [teamId] : undefined,
        );

        return { total: result };
    }

    async getBreakOvertime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        teamId?: string,
        userId?: string,
        groupDateBy?: GroupDateType,
        groupBy?: GroupBy,
        breakSettingId?: number,
    ): Promise<AgentTimeAggregation[]> {
        const queryResult = await this.calculateTotalOvertimeGrouped(
            workspaceId,
            startDate,
            endDate,
            userId ? [userId] : undefined,
            teamId ? [teamId] : undefined,
            groupDateBy,
            groupBy,
            breakSettingId,
        );

        return this.formatAggregationResults(queryResult);
    }

    async getTotalBreakOvertime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        teamId?: string,
        userId?: string,
        breakSettingId?: number,
    ): Promise<AgentTimeAggregationTotal> {
        const result = await this.calculateTotalOvertime(
            workspaceId,
            startDate,
            endDate,
            userId ? [userId] : undefined,
            teamId ? [teamId] : undefined,
            breakSettingId,
        );

        return { total: Math.round(result) };
    }

    async getAverageBreakTime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        teamId?: string,
        userId?: string,
        groupDateBy?: GroupDateType,
        groupBy?: GroupBy,
    ): Promise<AgentTimeAggregation[]> {
        const queryResult = await this.calculateAverageTimeByTypeAndGrouped(
            workspaceId,
            WorkingTimeType.BREAK,
            startDate,
            endDate,
            userId ? [userId] : undefined,
            teamId ? [teamId] : undefined,
            groupDateBy,
            groupBy,
        );

        return this.formatAggregationResults(queryResult);
    }

    async getTotalAverageBreakTime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        teamId?: string,
        userId?: string,
    ): Promise<AgentTimeAggregationTotal> {
        const result = await this.calculateTotalAverageTime(
            workspaceId,
            WorkingTimeType.BREAK,
            startDate,
            endDate,
            userId ? [userId] : undefined,
            teamId ? [teamId] : undefined,
        );

        return { total: result };
    }

    private async getOnlineAgents(
        filter: any,
        agentUsers: { _id: string; name: string }[],
    ): Promise<AgentOnlineStatus[]> {
        // Busca agentes com sessões online ativas
        const repository = await this.workingTimeService.getRepository();
        const query = await repository
            .createQueryBuilder('wt')
            .select([
                'wt.userId as "userId"',
                'SUM(EXTRACT(EPOCH FROM NOW() - TO_TIMESTAMP(wt.startedAt / 1000))) as "breakTimeSeconds"',
            ])
            .where('wt.workspaceId = :workspaceId', { workspaceId: filter.workspaceId });

        if (filter?.userIds?.length) {
            query.andWhere('wt.userId IN (:...userIds)', { userIds: filter.userIds });
        }
        query
            .andWhere('wt.type = :type', { type: WorkingTimeType.ONLINE })
            .andWhere('wt.endedAt IS NULL')
            .groupBy('wt.userId');
        const onlineAgentIds = await query.getRawMany();

        const userMap = new Map(agentUsers?.map((user) => [user._id.toString(), user]));

        return onlineAgentIds.map((agent) => ({
            userId: agent.userId,
            userName: userMap.get(agent.userId)?.name || null,
            breakTimeSeconds: Math.round(agent.breakTimeSeconds) || 0,
        }));
    }

    private async getBreakAgents(
        filter: any,
        agentUsers: { _id: string; name: string }[],
        breakSettingId?: number,
    ): Promise<AgentBreakStatus[]> {
        const repository = await this.workingTimeService.getRepository();

        const query = await repository
            .createQueryBuilder('wt')
            .leftJoin('break_settings', 'bs', 'bs.id = wt.breakSettingId')
            .select([
                'wt.userId as "userId"',
                'wt.type as "breakType"',
                'wt.startedAt as "startedAt"',
                'wt.breakSettingId as "breakSettingId"',
                'bs.name as "breakName"',
                'wt.contextDurationSeconds as "contextDurationSeconds"',
                'wt.contextMaxInactiveDurationSeconds as "contextMaxInactiveDurationSeconds"',
            ])
            .where('wt.workspaceId = :workspaceId', { workspaceId: filter.workspaceId });

        if (filter?.userIds?.length) {
            query.andWhere('wt.userId IN (:...userIds)', { userIds: filter.userIds });
        }

        if (breakSettingId) {
            if (breakSettingId === -1) {
                query.andWhere('wt.breakSettingId IS NULL');
            } else {
                query.andWhere('wt.breakSettingId = :breakSettingId', { breakSettingId });
            }
        }

        query
            .andWhere('wt.type IN (:...types)', { types: [WorkingTimeType.BREAK, WorkingTimeType.INACTIVE] })
            .andWhere('wt.endedAt IS NULL');

        const breakAndInactiveAgents = await query.getRawMany();

        const userMap = new Map(agentUsers.map((user) => [user._id.toString(), user]));

        return breakAndInactiveAgents.map((record) => {
            const startedAt = moment(new Date(Number(record.startedAt)));
            const now = moment();
            const breakTimeSeconds = now.diff(startedAt, 'seconds');

            let breakName: string;
            let durationLimit: number | null = null;
            let breakOvertimeSeconds = 0;

            if (record.breakType === WorkingTimeType.BREAK) {
                breakName = record.breakName || 'break';
                durationLimit = record.contextDurationSeconds ?? null;

                if (durationLimit != null) {
                    breakOvertimeSeconds = Math.max(0, breakTimeSeconds - durationLimit);
                }
            } else {
                breakName = '';
                durationLimit = record.contextMaxInactiveDurationSeconds ?? null;

                if (durationLimit != null) {
                    breakOvertimeSeconds = breakTimeSeconds; // tudo é overtime
                }
            }

            return {
                userId: record.userId,
                userName: userMap.get(record.userId)?.name || null,
                breakType: record.breakType,
                breakDurationSeconds: durationLimit,
                breakName,
                breakTimeSeconds,
                breakOvertimeSeconds,
            };
        });
    }

    private async getOfflineAgents(filter: any, agentUsers?: any[]): Promise<AgentOfflineStatus[]> {
        if (!agentUsers || agentUsers.length === 0) {
            return [];
        }

        if (filter?.userIds?.length === 0) {
            return [];
        }

        // Busca último horário de atividade para cada agente offline
        const repository = await this.workingTimeService.getRepository();
        const query = await repository
            .createQueryBuilder()
            .select(['DISTINCT ON (wt.userId) wt.userId AS "userId"', 'wt.endedAt AS "endedAt"'])
            .from('working_time', 'wt')
            .where('wt.workspaceId = :workspaceId', { workspaceId: filter.workspaceId });
        if (filter?.userIds?.length) {
            query.andWhere('wt.userId IN (:...userIds)', { userIds: filter.userIds });
        }
        query.andWhere('wt.endedAt IS NOT NULL').orderBy({
            'wt.userId': 'ASC',
            'wt.endedAt': 'DESC',
        });
        const lastWorkingTimes = await query.getRawMany();

        const recordMap = new Map(lastWorkingTimes.map((record) => [record.userId, record]));

        return agentUsers
            .filter((curAgent) => !!recordMap.get(curAgent._id)) // Filtra apenas os agentes que possuem registro, omitindo usuarios que nunca logaram e se conectaram no status de agente
            .map((agent) => {
                const record = recordMap.get(agent._id);

                let breakTimeSeconds = 0;
                if (record?.endedAt) {
                    const lastEndTime = record?.endedAt;
                    const endedAt = moment(new Date(Number(lastEndTime)));
                    const now = moment();
                    breakTimeSeconds = now.diff(endedAt, 'seconds');
                }

                return {
                    userId: agent?._id,
                    userName: agent?.name || null,
                    breakTimeSeconds,
                };
            });
    }

    private getDateRangeFilter(startDate?: string, endDate?: string) {
        const dateFilter: { startedAt: number; endedAt: number } = {
            startedAt: moment().startOf('day').valueOf(),
            endedAt: moment().endOf('day').valueOf(),
        };

        if (startDate && moment(startDate).isValid()) {
            dateFilter.startedAt = moment(startDate).startOf('day').valueOf();
        }

        if (endDate && moment(endDate).isValid()) {
            dateFilter.endedAt = moment(endDate).endOf('day').valueOf();
        }

        return dateFilter;
    }

    private async calculateAverageTimeByTypeAndGrouped(
        workspaceId: string,
        type: WorkingTimeType,
        startDate?: string,
        endDate?: string,
        userIds?: string[],
        teamIds?: string[],
        groupDateBy?: GroupDateType,
        groupBy?: GroupBy,
    ) {
        const dateFilter = this.getDateRangeFilter(startDate, endDate);
        const groupByParam = groupDateBy ?? GroupDateType.DAY;
        const dateTrunc = `DATE_TRUNC('${groupByParam}', TO_TIMESTAMP(wt.started_at / 1000))`;

        let filters = `wt.workspace_id = $1 AND wt.type = $2 AND wt.started_at >= $3 AND wt.started_at <= $4`;
        const params: any[] = [workspaceId, type, dateFilter.startedAt, dateFilter.endedAt];
        let paramIndex = 5;

        if (userIds?.length) {
            filters += ` AND wt.user_id = ANY($${paramIndex})`;
            params.push(userIds);
            paramIndex++;
        }

        let rawQuery: string;

        if (groupBy === GroupBy.USER) {
            if (teamIds?.length) {
                filters += ` AND EXISTS (
                    SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = ANY($${paramIndex})
                )`;
                params.push(teamIds);
                paramIndex++;
            }

            rawQuery = `
                SELECT
                    aggregated."agg_field",
                    aggregated."date",
                    AVG(aggregated.total_seconds) as "agg_result"
                FROM (
                    SELECT
                        wt.user_id as "agg_field",
                        ${dateTrunc} as "date",
                        SUM(
                            CASE 
                                WHEN wt.ended_at IS NOT NULL 
                                THEN EXTRACT(EPOCH FROM TO_TIMESTAMP(wt.ended_at / 1000) - TO_TIMESTAMP(wt.started_at / 1000))
                                ELSE EXTRACT(EPOCH FROM NOW() - TO_TIMESTAMP(wt.started_at / 1000))
                            END
                        ) as total_seconds
                    FROM agent_status.working_time wt
                    WHERE ${filters}
                    GROUP BY wt.user_id, ${dateTrunc}
                ) as aggregated
                GROUP BY aggregated."agg_field", aggregated."date"
            `;
        } else {
            let teamFilter = '';
            if (teamIds?.length) {
                teamFilter = `AND team_id = ANY($${paramIndex})`;
                params.push(teamIds);
                paramIndex++;
            } else {
                // Sem filtro de time → incluir team_id null
                teamFilter = '';
            }

            rawQuery = `
                SELECT
                    aggregated."agg_field",
                    aggregated."date",
                    AVG(aggregated.total_seconds) as "agg_result"
                FROM (
                    SELECT
                        team_id as "agg_field",
                        ${dateTrunc} as "date",
                        SUM(
                            CASE 
                                WHEN wt.ended_at IS NOT NULL 
                                THEN EXTRACT(EPOCH FROM TO_TIMESTAMP(wt.ended_at / 1000) - TO_TIMESTAMP(wt.started_at / 1000))
                                ELSE EXTRACT(EPOCH FROM NOW() - TO_TIMESTAMP(wt.started_at / 1000))
                            END
                        ) as total_seconds
                    FROM agent_status.working_time wt
                    LEFT JOIN LATERAL unnest(wt.team_ids) as team_id ON TRUE
                    WHERE ${filters}
                    ${teamFilter}
                    GROUP BY team_id, ${dateTrunc}
                ) as aggregated
                GROUP BY aggregated."agg_field", aggregated."date"
            `;
        }

        return (await this.workingTimeService.getRepository()).manager.query(rawQuery, params);
    }

    private async calculateTotalTimeByTypeAndGrouped(
        workspaceId: string,
        type: WorkingTimeType,
        startDate?: string,
        endDate?: string,
        userIds?: string[],
        teamIds?: string[],
        groupDateBy?: GroupDateType,
        groupBy?: GroupBy,
    ) {
        const dateFilter = this.getDateRangeFilter(startDate, endDate);
        const groupByParam = groupDateBy ?? GroupDateType.DAY;
        const dateTrunc = `DATE_TRUNC('${groupByParam}', TO_TIMESTAMP(wt.started_at / 1000))`;

        let filters = `
        wt.workspace_id = $1 
        AND wt.type = $2 
        AND wt.started_at >= $3 
        AND wt.started_at <= $4
    `;
        const params: any[] = [workspaceId, type, dateFilter.startedAt, dateFilter.endedAt];
        let paramIndex = 5;

        if (userIds?.length) {
            filters += ` AND wt.user_id = ANY($${paramIndex})`;
            params.push(userIds);
            paramIndex++;
        }

        let rawQuery: string;

        if (groupBy === GroupBy.USER) {
            if (teamIds?.length) {
                filters += ` AND EXISTS (
                SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = ANY($${paramIndex})
            )`;
                params.push(teamIds);
                paramIndex++;
            }

            rawQuery = `
            SELECT
                wt.user_id as "agg_field",
                ${dateTrunc} as "date",
                SUM(
                    CASE 
                        WHEN wt.ended_at IS NOT NULL 
                        THEN EXTRACT(EPOCH FROM TO_TIMESTAMP(wt.ended_at / 1000) - TO_TIMESTAMP(wt.started_at / 1000))
                        ELSE EXTRACT(EPOCH FROM NOW() - TO_TIMESTAMP(wt.started_at / 1000))
                    END
                ) as "agg_result"
            FROM agent_status.working_time wt
            WHERE ${filters}
            GROUP BY wt.user_id, ${dateTrunc}
        `;
        } else {
            let teamFilter = '';
            if (teamIds?.length) {
                teamFilter = `AND team_id = ANY($${paramIndex})`;
                params.push(teamIds);
                paramIndex++;
            }

            rawQuery = `
            SELECT
                team_id as "agg_field",
                ${dateTrunc} as "date",
                SUM(
                    CASE 
                        WHEN wt.ended_at IS NOT NULL 
                        THEN EXTRACT(EPOCH FROM TO_TIMESTAMP(wt.ended_at / 1000) - TO_TIMESTAMP(wt.started_at / 1000))
                        ELSE EXTRACT(EPOCH FROM NOW() - TO_TIMESTAMP(wt.started_at / 1000))
                    END
                ) as "agg_result"
            FROM agent_status.working_time wt
            LEFT JOIN LATERAL unnest(wt.team_ids) as team_id ON TRUE
            WHERE ${filters}
            ${teamFilter}
            GROUP BY team_id, ${dateTrunc}
        `;
        }

        return (await this.workingTimeService.getRepository()).manager.query(rawQuery, params);
    }

    private async calculateTotalAverageTime(
        workspaceId: string,
        type: WorkingTimeType,
        startDate?: string,
        endDate?: string,
        userIds?: string[],
        teamIds?: string[],
    ): Promise<number> {
        const dateFilter = this.getDateRangeFilter(startDate, endDate);

        let filters = `wt.workspace_id = $1 AND wt.type = $2 AND wt.started_at >= $3 AND wt.started_at <= $4`;
        const params: any[] = [workspaceId, type, dateFilter.startedAt, dateFilter.endedAt];
        let paramIndex = 5;

        if (userIds?.length) {
            filters += ` AND wt.user_id = ANY($${paramIndex})`;
            params.push(userIds);
            paramIndex++;
        }

        // Se tiver filtro de time, use EXISTS sem fazer unnest para evitar duplicação
        if (teamIds?.length) {
            filters += ` AND EXISTS (
                SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = ANY($${paramIndex})
            )`;
            params.push(teamIds);
            paramIndex++;
        }

        const rawQuery = `
            SELECT
                AVG(total_seconds) as "agg_result"
            FROM (
                SELECT
                    SUM(
                        CASE 
                            WHEN wt.ended_at IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM TO_TIMESTAMP(wt.ended_at / 1000) - TO_TIMESTAMP(wt.started_at / 1000))
                            ELSE EXTRACT(EPOCH FROM NOW() - TO_TIMESTAMP(wt.started_at / 1000))
                        END
                    ) as total_seconds
                FROM agent_status.working_time wt
                WHERE ${filters}
                GROUP BY wt.user_id
            ) as user_totals
        `;

        const result = await (await this.workingTimeService.getRepository()).manager.query(rawQuery, params);

        return result?.[0]?.agg_result ? Math.round(result[0].agg_result) : 0;
    }

    private async calculateTotalTimeByType(
        workspaceId: string,
        type: WorkingTimeType,
        startDate?: string,
        endDate?: string,
        userIds?: string[],
        teamIds?: string[],
    ): Promise<number> {
        const dateFilter = this.getDateRangeFilter(startDate, endDate);

        let filters = `wt.workspace_id = $1 AND wt.type = $2 AND wt.started_at >= $3 AND wt.started_at <= $4`;
        const params: any[] = [workspaceId, type, dateFilter.startedAt, dateFilter.endedAt];
        let paramIndex = 5;

        if (userIds?.length) {
            filters += ` AND wt.user_id = ANY($${paramIndex})`;
            params.push(userIds);
            paramIndex++;
        }

        // Se tiver filtro de time, use EXISTS sem fazer unnest para evitar duplicação
        if (teamIds?.length) {
            filters += ` AND EXISTS (
                SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = ANY($${paramIndex})
            )`;
            params.push(teamIds);
            paramIndex++;
        }

        const rawQuery = `
            SELECT
                SUM(total_seconds) as "agg_result"
            FROM (
                SELECT
                    SUM(
                        CASE 
                            WHEN wt.ended_at IS NOT NULL 
                            THEN EXTRACT(EPOCH FROM TO_TIMESTAMP(wt.ended_at / 1000) - TO_TIMESTAMP(wt.started_at / 1000))
                            ELSE EXTRACT(EPOCH FROM NOW() - TO_TIMESTAMP(wt.started_at / 1000))
                        END
                    ) as total_seconds
                FROM agent_status.working_time wt
                WHERE ${filters}
                GROUP BY wt.user_id
            ) as user_totals
        `;

        const result = await (await this.workingTimeService.getRepository()).manager.query(rawQuery, params);

        return result?.[0]?.agg_result ? Math.round(result[0].agg_result) : 0;
    }

    private async calculateTotalOvertimeGrouped(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        userIds?: string[],
        teamIds?: string[],
        groupDateBy?: GroupDateType,
        groupBy?: GroupBy,
        breakSettingId?: number,
    ) {
        const dateFilter = this.getDateRangeFilter(startDate, endDate);
        const groupByParam = groupDateBy ?? GroupDateType.DAY;
        const dateTrunc = `DATE_TRUNC('${groupByParam}', TO_TIMESTAMP(wt.started_at / 1000))`;

        let filters = `
            wt.workspace_id = $1 
            AND wt.type IN ('break', 'inative')
            AND wt.started_at >= $2 
            AND wt.started_at <= $3
        `;
        const params: any[] = [workspaceId, dateFilter.startedAt, dateFilter.endedAt];
        let paramIndex = 4;

        if (userIds?.length) {
            filters += ` AND wt.user_id = ANY($${paramIndex})`;
            params.push(userIds);
            paramIndex++;
        }

        if (breakSettingId) {
            if (breakSettingId === -1) {
                filters += ` AND wt.break_setting_id IS NULL`;
            } else {
                filters += ` AND wt.break_setting_id = $${paramIndex}`;
                params.push(breakSettingId);
                paramIndex++;
            }
        }

        let rawQuery: string;

        if (groupBy === GroupBy.USER) {
            if (teamIds?.length) {
                filters += ` AND EXISTS (
                    SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = ANY($${paramIndex})
                )`;
                params.push(teamIds);
                paramIndex++;
            }

            rawQuery = `
                SELECT
                    wt.user_id as "agg_field",
                    ${dateTrunc} as "date",
                    SUM(
                        CASE
                            WHEN wt.break_overtime_seconds IS NOT NULL THEN wt.break_overtime_seconds
                            WHEN wt.context_duration_seconds IS NOT NULL THEN 
                                GREATEST(
                                    EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000)))
                                    - wt.context_duration_seconds, 
                                    0
                                )
                            WHEN wt.context_max_inactive_duration_seconds IS NOT NULL THEN 
                                EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000)))
                            ELSE 0
                        END
                    ) as "agg_result"
                FROM agent_status.working_time wt
                WHERE ${filters}
                GROUP BY wt.user_id, ${dateTrunc}
            `;
        } else {
            if (teamIds?.length) {
                filters += ` AND team_id = ANY($${paramIndex})`;
                params.push(teamIds);
                paramIndex++;
            }

            rawQuery = `
                SELECT
                    team_id as "agg_field",
                    ${dateTrunc} as "date",
                    SUM(
                        CASE
                            WHEN wt.break_overtime_seconds IS NOT NULL THEN wt.break_overtime_seconds
                            WHEN wt.context_duration_seconds IS NOT NULL THEN 
                                GREATEST(
                                    EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000)))
                                    - wt.context_duration_seconds, 
                                    0
                                )
                            WHEN wt.context_max_inactive_duration_seconds IS NOT NULL THEN 
                                EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000)))
                            ELSE 0
                        END
                    ) as "agg_result"
                FROM agent_status.working_time wt, unnest(wt.team_ids) as team_id
                WHERE ${filters}
                GROUP BY team_id, ${dateTrunc}
            `;
        }

        return (await this.workingTimeService.getRepository()).manager.query(rawQuery, params);
    }

    private async calculateTotalAverageOvertime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        userIds?: string[],
        teamIds?: string[],
    ): Promise<number> {
        const dateFilter = this.getDateRangeFilter(startDate, endDate);

        let filters = `
            wt.workspace_id = $1 
            AND wt.type IN ('break', 'inative')
            AND wt.started_at >= $2 
            AND wt.started_at <= $3
        `;
        const params: any[] = [workspaceId, dateFilter.startedAt, dateFilter.endedAt];
        let paramIndex = 4;

        if (userIds?.length) {
            filters += ` AND wt.user_id = ANY($${paramIndex})`;
            params.push(userIds);
            paramIndex++;
        }

        let teamFilter = '';
        if (teamIds?.length) {
            teamFilter = `AND EXISTS (
                SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = ANY($${paramIndex})
            )`;
            params.push(teamIds);
            paramIndex++;
        }

        const rawQuery = `
            SELECT 
                AVG(overtime) AS average_overtime
            FROM (
                SELECT
                    wt.user_id,
                    SUM(
                        CASE
                            WHEN wt.break_overtime_seconds IS NOT NULL THEN wt.break_overtime_seconds
                            WHEN wt.context_duration_seconds IS NOT NULL THEN 
                                GREATEST(
                                    EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000))) 
                                    - wt.context_duration_seconds, 
                                    0
                                )
                            WHEN wt.context_max_inactive_duration_seconds IS NOT NULL THEN 
                                EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000)))
                            ELSE 0
                        END
                    ) AS overtime
                FROM agent_status.working_time wt
                WHERE ${filters}
                ${teamFilter}
                GROUP BY wt.user_id
            ) AS overtime_per_user
        `;

        const result = await (await this.workingTimeService.getRepository()).manager.query(rawQuery, params);
        return Number(result?.[0]?.average_overtime ?? 0);
    }

    private async calculateTotalOvertime(
        workspaceId: string,
        startDate?: string,
        endDate?: string,
        userIds?: string[],
        teamIds?: string[],
        breakSettingId?: number,
    ): Promise<number> {
        const dateFilter = this.getDateRangeFilter(startDate, endDate);

        let filters = `
            wt.workspace_id = $1 
            AND wt.type IN ('break', 'inative')
            AND wt.started_at >= $2 
            AND wt.started_at <= $3
        `;
        const params: any[] = [workspaceId, dateFilter.startedAt, dateFilter.endedAt];
        let paramIndex = 4;

        if (userIds?.length) {
            filters += ` AND wt.user_id = ANY($${paramIndex})`;
            params.push(userIds);
            paramIndex++;
        }

        if (breakSettingId) {
            if (breakSettingId === -1) {
                filters += ` AND wt.break_setting_id IS NULL`;
            } else {
                filters += ` AND wt.break_setting_id = $${paramIndex}`;
                params.push(breakSettingId);
                paramIndex++;
            }
        }

        let teamFilter = '';
        if (teamIds?.length) {
            teamFilter = `AND EXISTS (
                SELECT 1 FROM unnest(wt.team_ids) AS tid WHERE tid = ANY($${paramIndex})
            )`;
            params.push(teamIds);
            paramIndex++;
        }

        const rawQuery = `
            SELECT 
                SUM(overtime) AS average_overtime
            FROM (
                SELECT
                    wt.user_id,
                    SUM(
                        CASE
                            WHEN wt.break_overtime_seconds IS NOT NULL THEN wt.break_overtime_seconds
                            WHEN wt.context_duration_seconds IS NOT NULL THEN 
                                GREATEST(
                                    EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000)))
                                    - wt.context_duration_seconds, 
                                    0
                                )
                            WHEN wt.context_max_inactive_duration_seconds IS NOT NULL THEN 
                                EXTRACT(EPOCH FROM (COALESCE(TO_TIMESTAMP(wt.ended_at / 1000), NOW()) - TO_TIMESTAMP(wt.started_at / 1000)))
                            ELSE 0
                        END
                    ) AS overtime
                FROM agent_status.working_time wt
                WHERE ${filters}
                ${teamFilter}
                GROUP BY wt.user_id
            ) AS overtime_per_user
        `;

        const result = await (await this.workingTimeService.getRepository()).manager.query(rawQuery, params);
        return Number(result?.[0]?.average_overtime ?? 0);
    }
    private formatAggregationResults(results: any[]): AgentTimeAggregation[] {
        return results.map((result) => ({
            agg_field: result.agg_field,
            agg_result: Math.round(result.agg_result) || 0,
            date: result.date || null,
        }));
    }
}
