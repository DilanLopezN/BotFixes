import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ActivitySearch } from './activity-search.entity';
import { formatCpf } from '../../../../common/utils/utils';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { isCPF } from '../../../../common/utils/is-cpf';
import { ConversationStatus } from 'kissbot-core';

const LIMIT_MATCH = 200;

interface FullMatchParams {
    fullMatch: boolean;
    params?: {
        q1: string;
        q2: string;
    };
}

@Injectable()
export class ActivitySearchV2Service {
    constructor(
        @InjectRepository(ActivitySearch, ANALYTICS_READ_CONNECTION)
        private activitySearchRepository: Repository<ActivitySearch>,
    ) {}

    private getQuerySearch(
        q: string,
        query: SelectQueryBuilder<ActivitySearch>,
        { fullMatch, params }: FullMatchParams,
    ): SelectQueryBuilder<ActivitySearch> {
        if (fullMatch) {
            query.where(`act.text @@ to_tsquery('portuguese', '${params.q1} | ${params.q2}')`);
        } else {
            query
                .where(`act.text @@ plainto_tsquery('portuguese', unaccent(:q))`, {
                    q,
                })
                .limit(LIMIT_MATCH);
        }

        return query;
    }

    private isFullMatch(q: string): FullMatchParams {
        const onlyNumbersTerm = q.replace(/\D/g, '');

        if (onlyNumbersTerm?.length === 11 && isCPF(onlyNumbersTerm)) {
            const q1 = onlyNumbersTerm;
            const q2 = formatCpf(onlyNumbersTerm);

            return {
                fullMatch: true,
                params: {
                    q1,
                    q2,
                },
            };
        }

        return {
            fullMatch: false,
        };
    }

    private getQuerySelect({ fullMatch, params }: FullMatchParams): string {
        if (fullMatch) {
            return `ts_rank(actg.text, to_tsquery('portuguese', '${params.q1} | ${params.q2}'))`;
        }
        return `ts_rank(actg.text, plainto_tsquery('portuguese', unaccent(:q)))`;
    }

    async searchActivities(q: string, workspaceId: string, limit: number, skip: number): Promise<string[]> {
        try {
            const data = this.isFullMatch(q);
            const results = await this.activitySearchRepository
                .createQueryBuilder('act')
                .createQueryBuilder()
                .select(['actg.id', `${this.getQuerySelect(data)} AS ts_rank`])
                .from(
                    (subQuery) =>
                        this.getQuerySearch(q, subQuery.clone(), data)
                            .select('act.*')
                            .from(ActivitySearch, 'act')
                            .innerJoin('conversation', 'conv', 'act.conversation_id = conv.id')
                            .andWhere('act.workspace_id = :workspaceId', {
                                workspaceId,
                            })
                            .andWhere('conv.workspace_id = :workspaceId', {
                                workspaceId,
                            })
                            .orderBy('conv.created_at', 'DESC')
                            .offset(skip),
                    'actg',
                )
                .orderBy('ts_rank', 'DESC')
                .limit(limit)
                .getRawMany();

            return results.map((doc) => doc.id);
        } catch (error) {
            console.error('ActivitySearchService.searchActivities', error);
            throw error;
        }
    }

    async searchActivitiesByTeams(
        q: string,
        workspaceId: string,
        teamIds: string[],
        limit: number,
        skip: number,
        historicConversationTeamIds?: string[],
    ): Promise<string[]> {
        try {
            if (!teamIds.length && !historicConversationTeamIds.length) {
                return [];
            }
            const data = this.isFullMatch(q);
            const teamsSet = new Set(teamIds ?? []);
            const teamsHistoricSet = new Set(historicConversationTeamIds ?? []);

            historicConversationTeamIds.forEach((id) => {
                if (teamsSet.has(id)) {
                    teamsHistoricSet.delete(id);
                }
            });

            const teamIdsAll = Array.from(teamsSet);
            const teamIdsHistoric = Array.from(teamsHistoricSet);

            const results = await this.activitySearchRepository
                .createQueryBuilder('act')
                .createQueryBuilder()
                .select(['actg.id', `${this.getQuerySelect(data)} AS ts_rank`])
                .from((subQuery) => {
                    const query = this.getQuerySearch(q, subQuery.clone(), data)
                        .select('act.*')
                        .from(ActivitySearch, 'act')
                        .andWhere('act.workspace_id = :workspaceId', {
                            workspaceId,
                        })
                        .andWhere('conv.workspace_id = :workspaceId', {
                            workspaceId,
                        })
                        .orderBy('conv.created_at', 'DESC')
                        .offset(skip);

                    if (teamIdsAll.length && !teamIdsHistoric.length) {
                        query.innerJoin(
                            'conversation',
                            'conv',
                            'act.conversation_id = conv.id AND conv.assigned_to_team_id IN(:...teams)',
                            { teams: teamIdsAll },
                        );
                    } else if (teamIdsHistoric.length && !teamIdsAll.length) {
                        query.innerJoin(
                            'conversation',
                            'conv',
                            `
                                    act.conversation_id = conv.id 
                                    AND (conv.assigned_to_team_id IN(:...historicConversationTeams) AND conv.state = '${ConversationStatus.closed}')                        
                             `,
                            { historicConversationTeams: teamIdsHistoric },
                        );
                    } else {
                        query.innerJoin(
                            'conversation',
                            'conv',
                            `
                                    act.conversation_id = conv.id 
                                    AND (conv.assigned_to_team_id IN(:...teams)
                                    OR (conv.assigned_to_team_id IN(:...historicConversationTeams) AND conv.state = '${ConversationStatus.closed}') )                       
                             `,
                            { historicConversationTeams: teamIdsHistoric, teams: teamIdsAll },
                        );
                    }

                    return query;
                }, 'actg')
                .orderBy('ts_rank', 'DESC')
                .limit(limit)
                .getRawMany();

            return results.map((doc) => doc.id);
        } catch (error) {
            console.error('ActivitySearchService.searchActivitiesByTeams', error);
            throw error;
        }
    }
}
