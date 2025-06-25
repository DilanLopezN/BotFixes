import { Injectable, Logger, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError, Exceptions } from './../../../auth/exceptions';
import { Repository } from 'typeorm';
import { ANALYTICS_CONNECTION } from '../../ormconfig';
import { Fallback } from 'kissbot-entities';
import * as moment from 'moment';

@Injectable()
export class FallbackService {
    private readonly logger = new Logger(FallbackService.name);
    constructor(
        @InjectRepository(Fallback, ANALYTICS_CONNECTION)
        private fallbackRepository: Repository<Fallback>,
    ) {}

    @CatchError()
    async _create(fallback: any): Promise<any> {
        return await this.fallbackRepository.insert(fallback);
    }

    @CatchError()
    async _update(fallbackId: number, fallbackDto: any, workspaceId: string) {
        await this.fallbackRepository.update(
            {
                id: fallbackId,
                workspaceId,
            },
            {
                tags: (fallbackDto.tags || []).filter((tag) => !!tag).map((tag) => (tag as string).trim()),
                status: fallbackDto.status,
            },
        );
    }

    @CatchError()
    async queryPaginate(query) {
        let qb = this.fallbackRepository
            .createQueryBuilder('fb')
            .andWhere('fb.workspace_id = :workspaceId', { workspaceId: query.workspaceId });
        const qbCount = qb;
        if (query.skip) {
            qb = qb.skip(query.skip);
        }
        if (query.limit) {
            qb = qb.take(query.limit);
        }
        if (query.filter) {
            if (query.filter?.status) {
                qb = qb.andWhere('fb.status = :status', { status: query.filter.status });
            }
            if (query.filter?.rangeDate) {
                qb = qb.andWhere(`fb.recognized_timestamp >= :startDate`, {
                    startDate: moment(query.filter.rangeDate[0]).valueOf(),
                });
                qb = qb.andWhere(`fb.recognized_timestamp <= :endDate`, {
                    endDate: moment(query.filter.rangeDate[1]).valueOf(),
                });
            }
            if (query.filter?.tags?.length) {
                const truthyTags: string[] = query.filter.tags.map((tag) => tag.trim()).filter((tag) => !!tag);
                if (truthyTags.length > 0) {
                    // o formato dessa query é -> where activity_analytics."tags" && '{tag 1, tag2, tag n}'
                    // por isso a formatação em javascript de ['tag 1', 'tag 2', 'tag n'] para string
                    qb = qb.andWhere(`fb.tags @> :tags`, { tags: `{${truthyTags + ''}}` });
                }
            }
        }
        qb = qb.andWhere(`fb.channel_id <> 'webemulator'`);

        if (query.filter.search) {
            //fazer busca pelo texto.
            qb = qb.andWhere(`fb.message ~ '${query.filter.search}'`);
        } else {
            qb = qb.andWhere(`fb.message <> ''`);
        }

        qb = qb.addOrderBy('recognized_timestamp', 'DESC');

        let data = await qb.getMany();

        // Para não quebrar o front tem que mandar o _id que vinha antes no mongo.
        // As tags devem ser um array, se vier null deve setar um array vazio.
        data = data.map((fb) => {
            if (!fb.tags) {
                (fb as any).tags = [];
            }
            (fb as any)._id = fb.id;
            return fb;
        });
        const count = await qbCount.getCount();
        return { data, count };
    }

    @CatchError()
    async delete(fallbackId: number, workspaceId: string) {
        return await this.fallbackRepository.delete({
            id: fallbackId,
            workspaceId,
        });
    }

    @CatchError()
    async getFallbackCsv(workspaceId: string, filter: { startDate: number; endDate: number }): Promise<any[]> {
        if (!filter.startDate || !filter.endDate) {
            throw Exceptions.ERROR_MANDATORY_PERIOD_TO_DOWNLOAD;
        }
        const startDate = moment(filter.startDate).valueOf();
        const endDate = moment(filter.endDate).valueOf();
        if (moment(endDate).diff(moment(startDate), 'days') > 93) {
            throw Exceptions.ERROR_MAX_PERIOD;
        }

        let query = this.fallbackRepository
            .createQueryBuilder('fallback')
            .where('fallback.workspace_id = :workspaceId', { workspaceId });

        if (filter.startDate && filter.endDate) {
            query = query.andWhere('fallback.recognized_timestamp >= :startDate', { startDate: startDate });
            query = query.andWhere('fallback.recognized_timestamp <= :endDate', { endDate: endDate });
        }

        const data = await query.orderBy('fallback.recognized_timestamp', 'DESC').getMany();

        let resultFormated: any = data?.map((fallback) => {
            return {
                Data: moment(parseFloat(String(fallback.recognizedTimestamp)) || 0).format('DD/MM/YYYY'),
                Interaction_id: fallback.interactionId,
                Interaction_name: fallback.interactionName,
                Workspace_id: fallback.workspaceId,
                Bot_id: fallback.botId,
                Mensagem_fallback: fallback.message,
                Conversa_id: fallback.conversationId,
                Fallback_id: fallback.id,
            };
        });

        return resultFormated;
    }
}
