import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError, Exceptions } from './../../auth/exceptions';
import { Repository } from 'typeorm';
import { Rating } from '../models/rating.entity';
import * as moment from 'moment';
import { CreateRatingData, feedbackEnum, QueryRatingDataFilter } from '../interfaces/rating.interface';
import { EventsService } from './../../events/events.service';
import { RatingSetting } from '../models/rating-setting.entity';
import { RATING_CONNECTION, RATING_READ_CONNECTION } from '../ormconfig';
import { RatingSettingService } from './rating-setting.service';
import * as jwt from 'jsonwebtoken';
import { TeamService } from '../../team/services/team.service';
import { WorkspaceUserService } from '../../workspace-user/workspace-user.service';
import { DefaultTimezone } from '../../../common/utils/defaultTimezone';
import { IRatingReceivedEvent, KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';

const crypto = require('crypto');
@Injectable()
export class RatingService {
    constructor(
        @InjectRepository(Rating, RATING_CONNECTION)
        private ratingRepository: Repository<Rating>,
        @InjectRepository(Rating, RATING_READ_CONNECTION)
        private ratingReadRepository: Repository<Rating>,
        public readonly eventsService: EventsService,
        private readonly rattingSettingService: RatingSettingService,
        private readonly teamService: TeamService,
        private readonly workspaceUserService: WorkspaceUserService,
    ) {}

    @CatchError()
    async createRating(data: CreateRatingData): Promise<void> {
        const ratingSetting = await this.rattingSettingService.findOneByWorkspaceId(data.workspaceId);
        const rating: Omit<Rating, 'id'> = {
            ...data,
            createdAt: moment().valueOf(),
            settingId: ratingSetting.id,
            urlIdentifier: crypto.randomBytes(4).toString('hex') as string,
        };

        if (ratingSetting.expiresIn > 0) {
            rating.expiresAt = moment().add(ratingSetting.expiresIn, 'seconds').valueOf();
        }
        await this.ratingRepository.insert(rating);
    }

    @CatchError()
    async updateRatingValue(value: number, conversationId: string): Promise<void> {
        if (value > 5 || value < 1) {
            throw Exceptions.INVALID_RATING_RANGE;
        }

        await this.ratingRepository.update(
            {
                conversationId,
            },
            {
                value,
                ratingAt: moment().valueOf(),
            },
        );
    }

    @CatchError()
    async updateRating(ratingFeedback: string, value: number, conversationId: string): Promise<void> {
        if (value > 5 || value < 1) {
            throw Exceptions.INVALID_RATING_RANGE;
        }

        if (!ratingFeedback?.trim?.()) {
            ratingFeedback = undefined;
        } else {
            ratingFeedback = ratingFeedback.trim();
            ratingFeedback = ratingFeedback.substr(0, 400);
        }
        await this.ratingRepository.update(
            {
                conversationId,
            },
            {
                ratingFeedback,
                value,
                ratingSendedAt: moment().valueOf(),
            },
        );

        const rating = await this.ratingRepository
            .createQueryBuilder('rat')
            .where('rat.conversation_id = :conversationId', { conversationId })
            .getOne();
        if (rating) {
            this.eventsService.sendEvent({
                data: rating as IRatingReceivedEvent,
                dataType: KissbotEventDataType.CONVERSATION,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.RATING_RECEIVED,
            });
        }
    }

    @CatchError()
    async updateRatingAccessed(conversationId: string): Promise<void> {
        await this.ratingRepository.update(
            {
                conversationId,
            },
            {
                accessedAt: moment().valueOf(),
            },
        );
    }

    @CatchError()
    async updateRatingExit(conversationId: string): Promise<void> {
        await this.ratingRepository.update(
            {
                conversationId,
            },
            {
                exitAt: moment().valueOf(),
            },
        );
    }

    @CatchError()
    async getRatingWithSetting(conversationId: string): Promise<Rating> {
        return this.ratingRepository
            .createQueryBuilder('rat')
            .innerJoinAndMapOne('rat.setting', RatingSetting, 'set', `set.workspace_id = rat.workspace_id`)
            .where('rat.conversation_id = :conversationId', { conversationId })
            .getOne();
    }

    @CatchError()
    async getRatingsByWorkspace(
        workspaceId: string,
        filter: QueryRatingDataFilter,
    ): Promise<{
        count: number;
        data: Rating[];
        avg: number;
        values: {
            note1: number;
            note2: number;
            note3: number;
            note4: number;
            note5: number;
        };
    }> {
        let count = null;
        let avg = null;

        if (filter.limit > 20) {
            filter.limit = 20;
        }
        let query = this.ratingReadRepository
            .createQueryBuilder('rat')
            .where('rat.workspace_id = :workspaceId', { workspaceId });

        if (filter.startDate && filter.endDate) {
            const startDate = moment(filter.startDate)
                .tz(filter?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment(filter.endDate)
                .tz(filter?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();
            query = query.andWhere('rat.rating_at > :startDate', { startDate: startDate.valueOf() });
            query = query.andWhere('rat.rating_at < :endDate', { endDate: endDate.valueOf() });
        }

        if (filter?.teamIds && !!filter?.teamIds?.length) {
            query = query.andWhere(`rat.team_id IN (:...teamIds)`, {
                teamIds: filter.teamIds,
            });
        } else if (filter.teamId) {
            query = query.andWhere('rat.team_id = :teamId', { teamId: filter.teamId });
        }

        if (filter.memberId) {
            query = query.andWhere('rat.closed_id = :memberId', { memberId: filter.memberId });
        }

        if (filter.tags?.length) {
            const truthyTags: string[] = filter.tags.map((tag) => tag.trim()).filter((tag) => !!tag);
            if (truthyTags.length > 0) {
                // o formato dessa query é -> where activity_analytics."tags" && '{tag 1, tag2, tag n}'
                // por isso a formatação em javascript de ['tag 1', 'tag 2', 'tag n'] para string
                query = query.andWhere(`rat.tags @> :tags`, { tags: `{${truthyTags + ''}}` });
            }
        }

        if (filter.feedback === feedbackEnum.withFeedback) {
            query = query.andWhere(`rat.rating_feedback IS NOT NULL`);
            query = query.andWhere(`char_length(rat.rating_feedback) > 0`);
        } else if (filter.feedback === feedbackEnum.noFeedback) {
            query = query.andWhere(`(rat.rating_feedback IS NULL OR rat.rating_feedback = '')`);
        }

        if (filter.value) {
            query = query.andWhere('rat.value = :value', { value: filter.value });
        } else {
            query = query.andWhere('rat.value IS NOT NULL');
        }
        const queryCount = query;

        const data = await query
            .offset(filter.offset || 0)
            .limit(filter.limit || 10)
            .orderBy('rat.ratingAt', 'DESC')
            .getMany();

        count = await queryCount.getCount();
        avg = await this.getAvgRatingsByWorkspace(workspaceId, filter);

        return {
            data: data,
            count: count,
            avg: Number(avg.avg || '0'),
            values: {
                note1: filter.value === 1 ? count : avg.values.note1,
                note2: filter.value === 2 ? count : avg.values.note2,
                note3: filter.value === 3 ? count : avg.values.note3,
                note4: filter.value === 4 ? count : avg.values.note4,
                note5: filter.value === 5 ? count : avg.values.note5,
            },
        };
    }

    @CatchError()
    async getAvgRatingsByWorkspace(
        workspaceId: string,
        filter: QueryRatingDataFilter,
    ): Promise<{
        avg: number;
        values: {
            note1: number;
            note2: number;
            note3: number;
            note4: number;
            note5: number;
        };
    }> {
        let avg = null;
        let value1 = 0;
        let value2 = 0;
        let value3 = 0;
        let value4 = 0;
        let value5 = 0;

        if (filter.limit > 20) {
            filter.limit = 20;
        }
        let query = this.ratingReadRepository
            .createQueryBuilder('rat')
            .where('rat.workspace_id = :workspaceId', { workspaceId });

        if (filter.startDate && filter.endDate) {
            const startDate = moment(filter.startDate)
                .tz(filter?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment(filter.endDate)
                .tz(filter?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();
            query = query.andWhere('rat.rating_at > :startDate', { startDate: startDate.valueOf() });
            query = query.andWhere('rat.rating_at < :endDate', { endDate: endDate.valueOf() });
        }

        if (filter?.teamIds && !!filter?.teamIds?.length) {
            query = query.andWhere(`rat.team_id IN (:...teamIds)`, {
                teamIds: filter.teamIds,
            });
        } else if (filter.teamId) {
            query = query.andWhere('rat.team_id = :teamId', { teamId: filter.teamId });
        }

        if (filter.memberId) {
            query = query.andWhere('rat.closed_id = :memberId', { memberId: filter.memberId });
        }

        if (filter.tags?.length) {
            const truthyTags: string[] = filter.tags.map((tag) => tag.trim()).filter((tag) => !!tag);
            if (truthyTags.length > 0) {
                // o formato dessa query é -> where activity_analytics."tags" && '{tag 1, tag2, tag n}'
                // por isso a formatação em javascript de ['tag 1', 'tag 2', 'tag n'] para string
                query = query.andWhere(`rat.tags @> :tags`, { tags: `{${truthyTags + ''}}` });
            }
        }

        if (filter.feedback === feedbackEnum.withFeedback) {
            query = query.andWhere(`rat.rating_feedback IS NOT NULL`);
            query = query.andWhere(`char_length(rat.rating_feedback) > 0`);
        } else if (filter.feedback === feedbackEnum.noFeedback) {
            query = query.andWhere(`(rat.rating_feedback IS NULL OR rat.rating_feedback = '')`);
        }

        if (filter.value) {
            query = query.andWhere('rat.value = :value', { value: filter.value });
        } else {
            value1 = await query.clone().andWhere('rat.value = :value', { value: 1 }).getCount();
            value2 = await query.clone().andWhere('rat.value = :value', { value: 2 }).getCount();
            value3 = await query.clone().andWhere('rat.value = :value', { value: 3 }).getCount();
            value4 = await query.clone().andWhere('rat.value = :value', { value: 4 }).getCount();
            value5 = await query.clone().andWhere('rat.value = :value', { value: 5 }).getCount();
            query = query.andWhere('rat.value IS NOT NULL');
        }

        query = query.select('avg(rat.value)::numeric(10,1)');
        avg = await query.getRawOne();

        return {
            avg: Number(avg.avg || '0'),
            values: {
                note1: value1,
                note2: value2,
                note3: value3,
                note4: value4,
                note5: value5,
            },
        };
    }

    @CatchError()
    async getOneByShortId(shortId: string): Promise<Rating> {
        return await this.ratingRepository.findOne({ urlIdentifier: shortId });
    }

    @CatchError()
    async registerAccessToken(shortId: string, rating?: Rating): Promise<string> {
        if (!rating) {
            rating = await this.ratingRepository.findOne({ urlIdentifier: shortId });
        }
        return this.generateRatingToken(rating.conversationId, rating.settingId, rating.workspaceId);
    }

    @CatchError()
    private generateRatingToken(conversationId: string, settingId: number, workspaceId: string) {
        return jwt.sign(
            {
                conversationId,
                settingId,
                workspaceId,
                url: process.env.API_URI,
            },
            process.env.JWT_SECRET_KEY,
        );
    }

    @CatchError()
    async getRatingCsv(workspaceId: string, filter: QueryRatingDataFilter): Promise<any[]> {
        let query = this.ratingReadRepository
            .createQueryBuilder('rat')
            .select(
                '(SELECT conv.iid FROM analytics.conversation_view AS conv WHERE rat.conversation_id = conv.id) AS iid',
            )
            .addSelect('rat.id', 'id')
            .addSelect('rat.workspace_id', 'workspaceId')
            .addSelect('rat.conversation_id', 'conversationId')
            .addSelect('rat.team_id', 'teamId')
            .addSelect('rat.rating_at', 'ratingAt')
            .addSelect('rat.closed_id', 'closedId')
            .addSelect('rat.tags', 'tags')
            .addSelect('rat.rating_feedback', 'ratingFeedback')
            .addSelect('rat.value', 'value')
            .where('rat.workspace_id = :workspaceId', { workspaceId });

        if (filter.startDate && filter.endDate) {
            const startDate = moment(filter.startDate)
                .tz(filter?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment(filter.endDate)
                .tz(filter?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();

            const diffInDays = endDate.diff(startDate, 'days');
            if (diffInDays > 93) {
                throw Exceptions.ERROR_MAX_PERIOD;
            }
            query = query.andWhere('rat.rating_at > :startDate', { startDate: startDate.valueOf() });
            query = query.andWhere('rat.rating_at < :endDate', { endDate: endDate.valueOf() });
        } else {
            throw Exceptions.ERROR_MANDATORY_PERIOD_TO_DOWNLOAD;
        }

        if (filter?.teamIds && !!filter?.teamIds?.length) {
            query = query.andWhere(`rat.team_id IN (:...teamIds)`, {
                teamIds: filter.teamIds,
            });
        } else if (filter.teamId) {
            query = query.andWhere('rat.team_id = :teamId', { teamId: filter.teamId });
        }

        if (filter.memberId) {
            query = query.andWhere('rat.closed_id = :memberId', { memberId: filter.memberId });
        }

        if (filter.tags?.length) {
            const truthyTags: string[] = filter.tags.map((tag) => tag.trim()).filter((tag) => !!tag);
            if (truthyTags.length > 0) {
                // o formato dessa query é -> where activity_analytics."tags" && '{tag 1, tag2, tag n}'
                // por isso a formatação em javascript de ['tag 1', 'tag 2', 'tag n'] para string
                query = query.andWhere(`rat.tags @> :tags`, { tags: `{${truthyTags + ''}}` });
            }
        }

        if (filter.feedback === feedbackEnum.withFeedback) {
            query = query.andWhere(`rat.rating_feedback IS NOT NULL`);
            query = query.andWhere(`char_length(rat.rating_feedback) > 0`);
        } else if (filter.feedback === feedbackEnum.noFeedback) {
            query = query.andWhere(`(rat.rating_feedback IS NULL OR rat.rating_feedback = '')`);
        }

        if (filter.value) {
            query = query.andWhere('rat.value = :value', { value: filter.value });
        } else {
            query = query.andWhere('rat.value IS NOT NULL');
        }

        const data = await query.orderBy('rat.ratingAt', 'DESC').getRawMany();

        const users = {};
        const teams = {};

        if (data?.length) {
            try {
                const responseUsers = await this.workspaceUserService.getAllWorkspaceUser(
                    {
                        // projection esta removendo todos estes campos pois no metodo getAllWorkspaceUser
                        // já possui um projection que remove password e no mesmo projection não posso remover um campo e inserir outro,
                        // deve ou remover todos que não precisa ou selecionar os necessarios.
                        // OBS: deve manter o campo "roles", pois esta sendo usado em um filtro no metodo.
                        projection: {
                            email: 0,
                            timezone: 0,
                            loginMethod: 0,
                            language: 0,
                            createdAt: 0,
                            updatedAt: 0,
                            passwordExpires: 0,
                            cognitoUniqueId: 0,
                            liveAgentParams: 0,
                            avatar: 0,
                        },
                        filter: filter.memberId ? { _id: { $in: [filter.memberId] } } : {},
                    },
                    workspaceId,
                );

                responseUsers?.data?.forEach((user) => {
                    users[String(user._id)] = user;
                });
            } catch (error) {
                console.log('Error RatingService.getRatingCsv getAllWorkspaceUser: ', error);
            }

            try {
                const responseTeams = await this.teamService.queryPaginate(
                    {
                        projection: {
                            _id: 1,
                            name: 1,
                        },
                        filter: filter?.teamId
                            ? { _id: { $in: [filter.teamId] }, workspaceId }
                            : !!filter?.teamIds?.length
                            ? { _id: { $in: filter.teamIds }, workspaceId }
                            : { workspaceId },
                    },
                    undefined,
                    true,
                    true,
                );

                responseTeams?.data?.forEach((team) => {
                    teams[String(team._id)] = team;
                });
            } catch (error) {
                console.log('Error RatingService.getRatingCsv getTeams: ', error);
            }
        }

        let resultFormated: any = data?.map((rating) => {
            const user = users[rating.closedId] || { name: '' };
            const team = teams[rating.teamId] || { name: '' };

            let result: any = {
                Data: moment(parseFloat(String(rating.ratingAt)) || 0).format('DD/MM/YYYY'),
                Time: team?.name,
                Agente: user?.name,
                Avaliação: rating.value,
                Feedback: rating.ratingFeedback,
                ID: rating?.iid ? `#${rating.iid}` : null,
                'Link da conversa': rating.conversationId
                    ? `https://app.botdesigner.io/live-agent?workspace=${workspaceId}&conversation=${rating.conversationId}`
                    : '',
            };

            return result;
        });

        return resultFormated;
    }
}
