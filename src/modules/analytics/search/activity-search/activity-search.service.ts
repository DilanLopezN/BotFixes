import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ActivitySearch } from '../activity-search/activity-search.entity';
import { formatCpf } from '../../../../common/utils/utils';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { isCPF } from '../../../../common/utils/is-cpf';
import { ConversationStatus } from 'kissbot-core';
import { ActivitySearchV2Service } from './activity-search-v2.service';
import { CacheService } from '../../../_core/cache/cache.service';

@Injectable()
export class ActivitySearchService {
    constructor(
        @InjectRepository(ActivitySearch, ANALYTICS_READ_CONNECTION)
        private activitySearchRepository: Repository<ActivitySearch>,
        private activitySearchV2Service: ActivitySearchV2Service,
        private readonly cacheService: CacheService,
    ) {}

    private getQuerySearch(q: string, query: SelectQueryBuilder<ActivitySearch>): SelectQueryBuilder<ActivitySearch> {
        const onlyNumbersTerm = q.replace(/\D/g, '');

        // custom query for cpf
        if (onlyNumbersTerm?.length === 11 && isCPF(onlyNumbersTerm)) {
            const q1 = onlyNumbersTerm;
            const q2 = formatCpf(onlyNumbersTerm);

            query
                .where(`act.text @@ to_tsquery('portuguese', '${q1} | ${q2}')`)
                .orderBy(`ts_rank(act.text, to_tsquery('portuguese', '${q1} | ${q2}'))`, 'DESC');
        } else {
            query
                .where(`act.text @@ plainto_tsquery('portuguese', unaccent(:query))`, {
                    query: q,
                })
                .orderBy(`ts_rank(act.text, plainto_tsquery('portuguese', unaccent(:query)))`, 'DESC');
        }

        return query;
    }

    async searchVersion() {
        const client = this.cacheService.getClient();
        const value: string | null = await client.get('search_activity_version');
        return value || 'v2';
    }

    async searchActivities(q: string, workspaceId: string, limit: number, skip: number): Promise<string[]> {
        const version = await this.searchVersion();

        if (version === 'v2') {
            return await this.activitySearchV2Service.searchActivities(q, workspaceId, limit, skip);
        }

        try {
            const query = this.activitySearchRepository.createQueryBuilder('act');
            const docs = await this.getQuerySearch(q, query)
                .select('act.id')
                .andWhere('act.workspace_id = :workspaceId', {
                    workspaceId,
                })
                .offset(skip)
                .limit(limit)
                .getMany();

            return docs.map((doc) => doc.id);
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
        const version = await this.searchVersion();

        if (version === 'v2') {
            return await this.activitySearchV2Service.searchActivitiesByTeams(
                q,
                workspaceId,
                teamIds,
                limit,
                skip,
                historicConversationTeamIds,
            );
        }

        try {
            if (!teamIds.length && !historicConversationTeamIds.length) {
                return [];
            }

            const query = this.getQuerySearch(q, this.activitySearchRepository.createQueryBuilder('act'));

            const teamsSet = new Set(teamIds ?? []);
            const teamsHistoricSet = new Set(historicConversationTeamIds ?? []);

            historicConversationTeamIds.forEach((id) => {
                if (teamsSet.has(id)) {
                    teamsHistoricSet.delete(id);
                }
            });

            const teamIdsAll = Array.from(teamsSet);
            const teamIdsHistoric = Array.from(teamsHistoricSet);

            if (teamIdsAll.length && !teamIdsHistoric.length) {
                query.innerJoin(
                    'analytics.conversation',
                    'conv',
                    `
                        act.conversation_id = conv.id 
                        AND conv.assigned_to_team_id IN(:...teams)
                 `,
                    { teams: teamIdsAll },
                );
            } else if (teamIdsHistoric.length && !teamIdsAll.length) {
                query.innerJoin(
                    'analytics.conversation',
                    'conv',
                    `
                        act.conversation_id = conv.id 
                        AND (conv.assigned_to_team_id IN(:...historicConversationTeams) AND conv.state = '${ConversationStatus.closed}')                        
                 `,
                    { historicConversationTeams: teamIdsHistoric },
                );
            } else {
                query.innerJoin(
                    'analytics.conversation',
                    'conv',
                    `
                        act.conversation_id = conv.id 
                        AND (conv.assigned_to_team_id IN(:...teams)
                        OR (conv.assigned_to_team_id IN(:...historicConversationTeams) AND conv.state = '${ConversationStatus.closed}') )                       
                 `,
                    { historicConversationTeams: teamIdsHistoric, teams: teamIdsAll },
                );
            }

            const results = await query
                .andWhere('act.workspace_id = :workspaceId', {
                    workspaceId,
                })
                .andWhere('conv.workspace_id = :workspaceId', {
                    workspaceId,
                })
                .select('act.id')
                .offset(skip)
                .limit(limit)
                .getMany();

            return results.map((doc) => doc.id);
        } catch (error) {
            console.error('ActivitySearchService.searchActivitiesByTeams', error);
            throw error;
        }
    }
}
