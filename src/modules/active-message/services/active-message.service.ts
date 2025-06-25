import { InjectRepository } from '@nestjs/typeorm';
import { CatchError, Exceptions } from './../../auth/exceptions';
import { In, IsNull, Repository } from 'typeorm';
import { ACTIVE_MESSAGE_CONNECTION } from '../ormconfig';
import { CreateActiveMessage } from '../interfaces/create-active-message.interface';
import { ActiveMessage } from '../models/active-message.entity';
import * as moment from 'moment';
import { CacheService } from './../../_core/cache/cache.service';
import Redis from 'ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { ActiveMessageSettingService } from './active-message-setting.service';
import { ListMessageslId } from '../interfaces/get-active-message-external-id.interface';
import { ActiveMessageStatus } from '../models/active-message-status.entity';
import { ActiveMessageStatusService } from './active-message-status.service';
import { EventsService } from '../../events/events.service';
import {
    IActiveMessageStatusChangedEvent,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
} from 'kissbot-core';
import { ActiveMessageSetting } from '../models/active-message-setting.entity';
import { apiSendMessageIncomingCounter } from '../../../common/utils/prom-metrics';
import { getWithAndWithout9PhoneNumber } from 'kissbot-core';
import * as Sentry from '@sentry/node';
import axios from 'axios';
import { KafkaService } from '../../_core/kafka/kafka.service';
import * as https from 'https';
import { ExternalDataWorkspaceService } from './external-data-workspace.service';

export const activeMessageCreatedTopic = 'active_message_created';
@Injectable()
export class ActiveMessageService {
    private readonly logger = new Logger(ActiveMessageService.name);

    constructor(
        @InjectRepository(ActiveMessage, ACTIVE_MESSAGE_CONNECTION)
        public activeMessageRepository: Repository<ActiveMessage>,
        public cacheService: CacheService,
        private readonly activeMessageSettingService: ActiveMessageSettingService,
        private readonly eventsService: EventsService,
        private readonly activeMessageStatusService: ActiveMessageStatusService,
        private kafkaService: KafkaService,
        private readonly externalDataWorkspaceService: ExternalDataWorkspaceService,
    ) {}

    @CatchError()
    async create(data: CreateActiveMessage) {
        const result = await this.activeMessageRepository.save({
            ...data,
            timestamp: data.timestamp || moment().valueOf(),
        });

        if (result.isCreatedConversation) {
            await this.saveMissingReceived(result);
            await this.saveMissingResponse(result);
            await this.saveMissingRead(result);
        }
        apiSendMessageIncomingCounter.labels(`${data.activeMessageSettingId}`).inc();
        this.enqueueScheduleMessageKafka(result);
        return result;
    }

    private enqueueScheduleMessageKafka(data: ActiveMessage) {
        const { workspaceId, conversationId, externalId } = data;
        if (conversationId && externalId) {
            this.kafkaService.sendEvent(
                {
                    workspaceId,
                    conversationId,
                    externalId,
                },
                workspaceId,
                activeMessageCreatedTopic,
            );
        }
    }

    @CatchError()
    async updateStatusToInvalid(conversationId: string) {
        const status = await this.activeMessageStatusService.getGlobalStatus(-1);
        if (status) {
            await this.activeMessageRepository.update(
                {
                    conversationId,
                },
                {
                    statusId: status.id,
                },
            );
            this.sendActiveMessageStatusChanged(status, conversationId);
        }
    }

    @CatchError()
    private async saveMissingResponse(activeMessage: ActiveMessage) {
        const client: Redis = this.cacheService.getClient();
        const phoneList = getWithAndWithout9PhoneNumber(activeMessage.memberPhone);
        const key1 = this.getMissingResponseCacheKey(phoneList[0], activeMessage.channelConfigId);
        const key2 = this.getMissingResponseCacheKey(phoneList[1], activeMessage.channelConfigId);
        await client.set(key1, activeMessage.conversationId);
        await client.expire(key1, 86400 * 2);
        await client.set(key2, activeMessage.conversationId);
        await client.expire(key2, 86400 * 2);
    }

    @CatchError()
    private async saveMissingReceived(activeMessage: ActiveMessage) {
        const client: Redis = this.cacheService.getClient();
        const phoneList = getWithAndWithout9PhoneNumber(activeMessage.memberPhone);
        const key1 = this.getMissingReceivedCacheKey(phoneList[0], activeMessage.channelConfigId);
        const key2 = this.getMissingReceivedCacheKey(phoneList[1], activeMessage.channelConfigId);
        await client.set(key1, activeMessage.conversationId);
        await client.expire(key1, 86400 * 2);
        await client.set(key2, activeMessage.conversationId);
        await client.expire(key2, 86400 * 2);
    }

    @CatchError()
    private async saveMissingRead(activeMessage: ActiveMessage) {
        const client: Redis = this.cacheService.getClient();
        const phoneList = getWithAndWithout9PhoneNumber(activeMessage.memberPhone);
        const key1 = this.getMissingReadCacheKey(phoneList[0], activeMessage.channelConfigId);
        const key2 = this.getMissingReadCacheKey(phoneList[1], activeMessage.channelConfigId);
        await client.set(key1, activeMessage.conversationId);
        await client.expire(key1, 86400 * 2);
        await client.set(key2, activeMessage.conversationId);
        await client.expire(key2, 86400 * 2);
    }

    private getMissingResponseCacheKey = (memberPhone: string, channelConfigId: string) => {
        return `ACTV-MSG-RSP:${memberPhone}:${channelConfigId}`;
    };

    private getMissingReceivedCacheKey = (memberPhone: string, channelConfigId: string) => {
        return `ACTV-MSG-RCVD:${memberPhone}:${channelConfigId}`;
    };

    private getMissingReadCacheKey = (memberPhone: string, channelConfigId: string) => {
        return `ACTV-MSG-READ:${memberPhone}:${channelConfigId}`;
    };

    async checkMissingReceived(phoneNumber: string, channelConfigId: string, error?: string) {
        const client: Redis = this.cacheService.getClient();
        const key = this.getMissingReceivedCacheKey(phoneNumber, channelConfigId);
        const conversationId = await client.get(key);
        if (conversationId) {
            await this.activeMessageRepository.update(
                {
                    conversationId,
                    isCreatedConversation: true,
                    receivedAt: IsNull(),
                    channelConfigId,
                },
                {
                    receivedAt: moment().valueOf(),
                    messageError: error,
                },
            );
            await client.del(key);
            try {
                const activeMessage = await this.activeMessageRepository.findOne({
                    conversationId,
                    isCreatedConversation: true,
                    channelConfigId,
                });
                if (activeMessage) {
                    await this.eventsService.sendEvent({
                        data: {
                            ...activeMessage,
                            receivedAt: Number(activeMessage.receivedAt),
                        } as ActiveMessage,
                        dataType: KissbotEventDataType.ANY,
                        source: KissbotEventSource.KISSBOT_API,
                        type: KissbotEventType.ACTIVE_MESSAGE_USER_RECEIVED,
                    });
                }
            } catch (e) {
                Sentry.captureEvent({
                    message: `${ActiveMessageService.name}.checkMissingReceived`,
                    extra: {
                        error: e,
                    },
                });
            }
        }
    }

    async checkMissingResponse(phoneNumber: string, channelConfigId: string) {
        const client: Redis = this.cacheService.getClient();
        const key = this.getMissingResponseCacheKey(phoneNumber, channelConfigId);
        const conversationId = await client.get(key);
        if (conversationId) {
            await this.activeMessageRepository.update(
                {
                    conversationId,
                    isCreatedConversation: true,
                    answeredAt: IsNull(),
                    channelConfigId,
                },
                {
                    answeredAt: moment().valueOf(),
                },
            );
            await client.del(key);
            try {
                const activeMessage = await this.activeMessageRepository.findOne({
                    conversationId,
                    isCreatedConversation: true,
                    channelConfigId,
                });
                if (activeMessage) {
                    await this.eventsService.sendEvent({
                        data: {
                            ...activeMessage,
                            answeredAt: Number(activeMessage.answeredAt),
                        } as ActiveMessage,
                        dataType: KissbotEventDataType.ANY,
                        source: KissbotEventSource.KISSBOT_API,
                        type: KissbotEventType.ACTIVE_MESSAGE_USER_ANSWERED,
                    });
                }
            } catch (e) {
                Sentry.captureEvent({
                    message: `${ActiveMessageService.name}.checkMissingResponse`,
                    extra: {
                        error: e,
                    },
                });
            }
        }
    }

    async checkMissingRead(phoneNumber: string, channelConfigId: string) {
        const client: Redis = this.cacheService.getClient();
        const key = this.getMissingReadCacheKey(phoneNumber, channelConfigId);
        const conversationId = await client.get(key);
        if (conversationId) {
            await this.activeMessageRepository.update(
                {
                    conversationId,
                    isCreatedConversation: true,
                    readAt: IsNull(),
                    channelConfigId,
                },
                {
                    readAt: moment().valueOf(),
                },
            );
            await client.del(key);
            try {
                const activeMessage = await this.activeMessageRepository.findOne({
                    conversationId,
                    isCreatedConversation: true,
                    channelConfigId,
                });
                if (activeMessage) {
                    await this.eventsService.sendEvent({
                        data: {
                            ...activeMessage,
                            readAt: Number(activeMessage.readAt),
                        } as ActiveMessage,
                        dataType: KissbotEventDataType.ANY,
                        source: KissbotEventSource.KISSBOT_API,
                        type: KissbotEventType.ACTIVE_MESSAGE_USER_READ,
                    });
                }
            } catch (e) {
                Sentry.captureEvent({
                    message: `${ActiveMessageService.name}.checkMissingRead`,
                    extra: {
                        error: e,
                    },
                });
            }
        }
    }

    @CatchError()
    async listMessages(data: ListMessageslId) {
        const setting = await this.activeMessageSettingService.findByApiToken(data.apiToken);
        if (!setting) {
            throw Exceptions.CANNOT_GET_MESSAGE_BY_EXTERNAL_ID_API_TOKEN;
        }

        const workspaceIsDisable = await this.externalDataWorkspaceService.isWorkspaceDisabled(setting.workspaceId);
        if (workspaceIsDisable) throw Exceptions.WORKSPACE_IS_INACTIVE;

        let statusChangedAfter: moment.Moment;

        if (data.statusChangedAfter) {
            try {
                statusChangedAfter = moment(data.statusChangedAfter);
            } catch (e) {}
        }

        if (process.env.NODE_ENV != 'production') {
            this.logger.debug(`listMessages: ${JSON.stringify(data)}`);
        }

        let query = this.activeMessageRepository
            .createQueryBuilder('ac')
            .leftJoinAndMapOne('ac.status', ActiveMessageStatus, 'status', `status.id = ac.status_id`)
            .where('ac.workspace_id = :workspaceId and ac.active_message_setting_id = :activeMessageSettingId', {
                workspaceId: setting.workspaceId,
                activeMessageSettingId: setting.id,
            });

        if (data.externalId) {
            query = query.andWhere('ac.external_id = :externalId', { externalId: data.externalId });
        }

        if (statusChangedAfter && statusChangedAfter.isValid()) {
            query = query.andWhere('ac.status_changed_at >= :statusChangedAfter', {
                statusChangedAfter: statusChangedAfter.valueOf(),
            });
        }

        if (data.endDate && data.startDate) {
            const startDate = moment(data.startDate);
            const endDate = moment(data.endDate);
            var duration = moment.duration(endDate.diff(startDate));
            var monthDiff = duration.asMonths();
            if (monthDiff > 6) {
                throw Exceptions.CANNOT_GET_ACTIVE_MESSAGES_INVALID_PERIOD;
            }
            query = query
                .andWhere('ac.timestamp >= :startDate', { startDate: startDate.valueOf() })
                .andWhere('ac.timestamp <= :endDate', { endDate: endDate.valueOf() });
        } else {
            const startDate = moment().subtract(30, 'days').valueOf();
            const endDate = moment().valueOf();
            query = query
                .andWhere('ac.timestamp >= :startDate', { startDate })
                .andWhere('ac.timestamp <= :endDate', { endDate });
        }

        const result = await query.getMany();

        return result.map((msg) => {
            let status;
            if (msg.status) {
                status = {
                    statusName: msg.status.statusName,
                    statusCode: msg.status.statusCode,
                };
            }
            return {
                id: msg.id,
                conversationId: msg.conversationId,
                timestamp: msg.timestamp,
                contactId: msg.contactId,
                externalId: msg.externalId,
                campaignId: msg.campaignId,
                messageError: msg.messageError,
                answeredAt: msg.answeredAt,
                receivedAt: msg.receivedAt,
                phone: msg.memberPhone,
                status,
            };
        });
    }

    async updateActiveMessageStatusByConversationId(conversationId: string, workspaceId: string, statusCode: number) {
        const now = moment().valueOf();
        let status;
        if (statusCode < 0) {
            status = await this.activeMessageStatusService.getGlobalStatus(statusCode);
        } else {
            status = await this.activeMessageStatusService.findStatusByWorkspaceId(workspaceId, statusCode);
        }
        if (status) {
            await this.activeMessageRepository.update(
                {
                    conversationId,
                    messageError: IsNull(),
                },
                {
                    statusId: status.id,
                    statusChangedAt: now,
                },
            );
            this.sendActiveMessageStatusChanged(status, conversationId);
        }
    }

    private async sendActiveMessageStatusChanged(status: ActiveMessageStatus, conversationId: string) {
        const activeMessage = await this.activeMessageRepository
            .createQueryBuilder('ac')
            .where('ac.conversation_id = :conversationId', { conversationId })
            .andWhere('ac.message_error IS NULL')
            .andWhere('ac.status_id = :statusId', { statusId: status.id })
            .innerJoinAndMapOne(
                'ac.setting',
                ActiveMessageSetting,
                'setting',
                `setting.id = ac.active_message_setting_id`,
            )
            .getOne();
        if (activeMessage) {
            const data: IActiveMessageStatusChangedEvent = {
                status: status.statusCode,
                message: status.statusName,
                externalId: activeMessage.externalId,
                token: activeMessage.setting?.apiToken,
                conversationId,
            } as IActiveMessageStatusChangedEvent;
            await this.eventsService.sendEvent({
                data,
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.ACTIVE_MESSAGE_STATUS_CHANGED,
            });
            try {
                if (activeMessage?.setting && activeMessage?.setting?.callbackUrl) {
                    const httpsAgent = new https.Agent({
                        rejectUnauthorized: false,
                    });

                    await axios.post(activeMessage?.setting?.callbackUrl, data, {
                        headers: {
                            'Content-Type': 'application/json',
                            authorization: activeMessage?.setting?.authorizationHeader,
                        },
                        httpsAgent,
                    });
                    this.logger.debug(
                        `Sended activeMessage response to callback: ${activeMessage?.setting?.callbackUrl}`,
                    );
                }
            } catch (e) {
                console.log(`${ActiveMessageService.name}.sendActiveMessageStatusChanged send to callbackurl`, e);
                Sentry.captureEvent({
                    message: `${ActiveMessageService.name}.sendActiveMessageStatusChanged send to callbackurl`,
                    extra: {
                        error: e,
                    },
                });
            }
        }
    }

    /**
     * Função que retorna objectos parciais de active message apenas com as propriedade externalId e conversationId e statusId
     * de acordo com um filtro de array do externalId.
     * @param externalIdList
     * @returns
     */
    async getConversationIdByExternalIdList(
        externalIdList: string[],
        workspaceId?: string,
    ): Promise<Pick<ActiveMessage, 'conversationId' | 'externalId' | 'statusId'>[]> {
        const whereCondition = {
            externalId: In(externalIdList),
        };
        if (workspaceId) {
            Object.assign(whereCondition, { workspaceId });
        }
        return (await this.activeMessageRepository.find({
            where: whereCondition,
            select: ['conversationId', 'externalId', 'statusId'],
        })) as Pick<ActiveMessage, 'conversationId' | 'externalId' | 'statusId'>[];
    }
}
