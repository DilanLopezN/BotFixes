import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../../../../modules/analytics/ormconfig';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { ConversationSearch } from 'kissbot-entities';
import { CatchError } from '../../../../../modules/auth/exceptions';
import { ConversationQueryFilters } from '../conversation-search.interface';
import { PaginatedModel } from '../../../../../common/interfaces/paginated';
import { Conversation } from 'kissbot-entities';
import { ChannelIdConfig } from '../../../../../modules/channel-config/interfaces/channel-config.interface';
import { isCPF } from '../../../../../common/utils/is-cpf';
import { ConversationStatus } from 'kissbot-core';
import * as moment from 'moment';
import { conversationSearchLatency } from '../../../../../common/utils/prom-metrics';

@Injectable()
export class ConversationSearchService {
    constructor(
        @InjectRepository(ConversationSearch, ANALYTICS_READ_CONNECTION)
        private conversationSearchRepository: Repository<ConversationSearch>,
    ) {}

    private getQuerySearch(term: string): SelectQueryBuilder<ConversationSearch> {

        const query = this.conversationSearchRepository.createQueryBuilder('search');
        const onlyNumbersTerm = term.replace(/\D/g, '');
        const isStringValue = !onlyNumbersTerm?.length;

        if (onlyNumbersTerm?.length === 11 && isCPF(onlyNumbersTerm)) {
            const replacedTermCpf = onlyNumbersTerm?.replace(/[/.-]/g, '');
            return query
                .where('(search.attr_value like :term2 OR search.attr_value like :term1)', {
                    term1: `${term}%`,
                    term2: `${replacedTermCpf}%`,
                })
                .andWhere('search.data_type = :type', { type: 1 });
        }

        if (onlyNumbersTerm) {
            try {
                if (term.length === 10 && term.split('/').length === 3 && moment(term).isValid()) {
                    return query
                        .where('search.attr_value = :term', {
                            term: `${term}`,
                        })
                        .andWhere('search.data_type = :type', { type: 1 });
                }
            } catch (error) {}

            return query.where('(search.attr_value like :term OR search.contact_phone like :term)', {
                term: `%${term}%`,
            });
        }

        if (isStringValue) {
            return query.where('(search.attr_value like :term OR search.contact_name like :term)', {
                term: `%${term}%`,
            });
        }

        return query.where(
            '(search.attr_value like :term OR search.contact_name like :term OR search.contact_phone like :term)',
            {
                term: `%${term}%`,
            },
        );
    }

    @CatchError()
    public async getAll(
        term: string,
        workspaceId: string,
        limit: number,
        skip?: number,
        filters?: ConversationQueryFilters,
    ): Promise<PaginatedModel<ConversationSearch>> {
        const timer = conversationSearchLatency.labels(workspaceId).startTimer();

        const query = this.getQuerySearch(term)
            .andWhere('conv.workspace_id = :workspaceId', {
                workspaceId,
            })
            .andWhere('search.workspace_id = :workspaceId', {
                workspaceId,
            })
            .innerJoin('conversation', 'conv', 'search.conversation_id = conv.id');

        const { teams = [], historicConversationTeams = [], channels = [], state } = filters;

        if (filters.startDate && filters.endDate) {
            query.andWhere('conv.created_at >= :startDate AND conv.created_at <= :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });
        }

        if (channels?.length) {
            query.andWhere(`conv.created_by_channel IN(:...channels)`, { channels: channels });
        } else {
            query.andWhere(`conv.created_by_channel NOT IN('${ChannelIdConfig.webemulator}')`);
        }

        if (state) {
            query.andWhere('conv.state = :state', { state });
        }

        if (teams?.length && !historicConversationTeams?.length) {
            query.andWhere(`conv.assigned_to_team_id IN(:...teams)`, {
                teams,
            });
        } else if (historicConversationTeams?.length && !teams?.length) {
            query.andWhere(
                `(conv.assigned_to_team_id IN(:...historicTeams) AND conv.state = '${ConversationStatus.closed}')`,
                {
                    historicTeams: historicConversationTeams,
                },
            );
        } else if (historicConversationTeams?.length && teams?.length) {
            if (state) {
                query.andWhere('conv.state = :state', { state });
            }

            query.andWhere(
                new Brackets((qb) => {
                    qb.where(`conv.assigned_to_team_id IN(:...teams)`, { teams }).orWhere(
                        `(conv.assigned_to_team_id IN(:...historicTeams) AND conv.state = '${ConversationStatus.closed}')`,
                        { historicTeams: historicConversationTeams },
                    );
                }),
            );
        }

        if (filters.tags?.length) {
            const truthyTags: string[] = filters.tags.map((tag) => tag.trim());
            query.andWhere(`conv.tags @> :tags`, {
                tags: `{${truthyTags.toString()}}`,
            });
        }

        const results = await query
            .offset(skip ?? 0)
            .limit(limit > 20 ? 20 : limit ?? 20)
            .orderBy(`search.timestamp`, 'DESC')
            .getMany();

        const currentPage = (skip ?? 0) / limit + 1;

        timer();

        return {
            count: -1,
            data: results,
            currentPage: currentPage,
            nextPage: currentPage + 1,
        };
    }
}
