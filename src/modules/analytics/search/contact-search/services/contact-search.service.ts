import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../../../../modules/analytics/ormconfig';
import { Brackets, Repository } from 'typeorm';
import { ContactSearch } from 'kissbot-entities';
import { PaginatedModel } from '../../../../../common/interfaces/paginated';
import { getNumberWith9, getNumberWithout9 } from 'kissbot-core';
import { SearchContacts } from '../interfaces/search-contacts.interface';

@Injectable()
export class ContactSearchService {
    constructor(
        @InjectRepository(ContactSearch, ANALYTICS_READ_CONNECTION)
        private contactSearchRepository: Repository<ContactSearch>,
    ) {}

    public async getAll({
        limit,
        skip,
        workspaceId,
        blocked,
        term,
    }: SearchContacts): Promise<PaginatedModel<ContactSearch>> {
        const query = this.contactSearchRepository.createQueryBuilder().where('1 = 1');

        if (term) {
            const termOnlyNumbers = term.replace(/\D/g, '');

            if (!termOnlyNumbers.length) {
                query.where('name ilike :term', { term: `%${term}%` });
            } else {
                const termLength = termOnlyNumbers.length;

                if (termLength >= 8 && termLength <= 13) {
                    const originalterm = term;
                    let places = 2;

                    const terms = new Set<string>();

                    if (termLength === 8 || termLength === 9) {
                        places = 4;
                        term = `5500${term}`;
                    } else if (termLength === 10 || termLength === 11) {
                        places = 2;
                        term = `55${term}`;
                    }

                    terms.add(term);
                    terms.add(getNumberWithout9(term));
                    terms.add(getNumberWith9(term));

                    query.where(
                        new Brackets((qb) => {
                            const cond = qb.where(`name ilike :originalterm`, { originalterm: `%${originalterm}%` });

                            Array.from(terms).forEach((term, index) => {
                                const fieldName = `term${index}`;
                                cond.orWhere(`phone like :${fieldName}`, { [fieldName]: `%${term.slice(places)}%` });
                            });

                            return cond;
                        }),
                    );
                } else {
                    query.where('(phone like :term OR name ilike :term)', { term: `%${term}%` });
                }
            }
        }

        if (blocked) {
            query.andWhere('blocked_at IS NOT NULL');
        }

        const results = await query
            .andWhere('workspace_id = :workspaceId', { workspaceId })
            .orderBy('timestamp', 'DESC')
            .offset(skip ?? 0)
            .limit(limit > 20 ? 20 : limit ?? 20)
            .orderBy('name', 'ASC')
            .getMany();

        const currentPage = (skip ?? 0) / limit + 1;

        return {
            count: -1,
            data: results,
            currentPage: currentPage,
            nextPage: currentPage + 1,
        };
    }
}
