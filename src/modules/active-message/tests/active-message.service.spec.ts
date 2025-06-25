import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import { ACTIVE_MESSAGE_CONNECTION } from './../ormconfig';
import { SendMessageService } from './../services/send-message.service';
import { ActiveMessageSettingService } from './../services/active-message-setting.service';
import { ActiveMessageService } from './../services/active-message.service';
import { ActiveMessageStatusService } from './../services/active-message-status.service';
import { IncomingApiConsumerService } from './../services/incoming-api-consumer.service';
import { ConversationInvalidNumberConsumerService } from './../services/conversation-invalid-number-consumer.service';
import { SendActiveMessageIncomingDataService } from './../services/send-active-message-incoming-data.service';
import { ExternalDataService } from './../services/external-data.service';
import { ActiveMessageSetting, TimeType } from '../models/active-message-setting.entity';
import { ActiveMessageStatus } from '../models/active-message-status.entity';
import { ActiveMessage } from '../models/active-message.entity';
import { Answer } from './../models/answer.entity';
import { SendActiveMessageIncomingData } from '../models/send-active-message-data.entity';
import { EventsService } from '../../events/events.service';
import { CacheModule } from './../../_core/cache/cache.module';
import { CreateActiveMessage } from '../interfaces/create-active-message.interface';
import * as moment from 'moment';
import { orderBy } from 'lodash';
import { getRandomInt } from './test.util'
import { KafkaService } from '../../_core/kafka/kafka.service';

const SECONDS = 1000;
jest.setTimeout(20 * SECONDS)

describe('MODULE: active-message', () => {
    let moduleRef: TestingModule;
    let activeMessageService: ActiveMessageService;
    let activeMessageSettingService: ActiveMessageSettingService;

    const invalidNumberStatusName = 'numero invalido';

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    name: ACTIVE_MESSAGE_CONNECTION,
                    url: process.env.POSTGRESQL_URI_TESTS || 'postgres://postgres:@localhost/tests',
                    entities: [
                        ActiveMessageSetting,
                        ActiveMessageStatus,
                        ActiveMessage,
                        Answer,
                        SendActiveMessageIncomingData,
                    ],
                    synchronize: true,
                    migrationsRun: false,
                    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
                    schema: 'active_message',
                }),
                TypeOrmModule.forFeature(
                    [
                        ActiveMessageSetting,
                        ActiveMessageStatus,
                        ActiveMessage,
                        Answer,
                        SendActiveMessageIncomingData,
                    ],
                    ACTIVE_MESSAGE_CONNECTION,
                ),
                CacheModule,
            ],
            providers: [
                SendMessageService,
                ActiveMessageSettingService,
                ActiveMessageService,
                ActiveMessageStatusService,
                IncomingApiConsumerService,
                ConversationInvalidNumberConsumerService,
                SendActiveMessageIncomingDataService,
                ExternalDataService,
                {
                    useValue: {
                        sendEvent: (data: any) => {
                            return true;
                        },
                    },
                    provide: EventsService,
                },
                {
                    useValue: {
                        sendEvent: (data: any) => {
                            return true;
                        },
                    },
                    provide: KafkaService,
                },
            ],
        }).compile();
        activeMessageService = moduleRef.get<ActiveMessageService>(ActiveMessageService);
        activeMessageSettingService = moduleRef.get<ActiveMessageSettingService>(ActiveMessageSettingService);
        await activeMessageService.activeMessageRepository.manager
            .createQueryBuilder(ActiveMessageStatus, 'st')
            .delete()
            .where('global = 1')
            .andWhere('status_code = -1')
            .execute();
        await activeMessageService.activeMessageRepository.manager.insert(ActiveMessageStatus, {
            global: 1,
            statusName: invalidNumberStatusName,
            statusCode: -1,
        });
    });

    describe('SERVICE: ActiveMessageService', () => {
        it('FUNCTION: create/checkMissingReceived/checkMissingResponse/checkMissingRead DESC:isCreatedConversation true', async () => {
            const workspaceId = v4();
            const channelConfigId = v4();
            const conversationId = v4();
            const phoneNumber = v4();
            const result = await activeMessageService.create({
                activeMessageSettingId: 1,
                isCreatedConversation: true,
                workspaceId: workspaceId,
                channelConfigId: channelConfigId,
                memberPhone: phoneNumber,
                conversationId,
                externalId: '',
            });

            expect(result.answeredAt).toBeNull();
            expect(result.receivedAt).toBeNull();

            await activeMessageService.checkMissingReceived(phoneNumber, channelConfigId);
            await activeMessageService.checkMissingResponse(phoneNumber, channelConfigId);
            await activeMessageService.checkMissingRead(phoneNumber, channelConfigId);

            const updatedActiveMessage = await activeMessageService.activeMessageRepository.findOne(result.id);

            expect(Number(updatedActiveMessage?.answeredAt)).toBeGreaterThanOrEqual(1);
            expect(Number(updatedActiveMessage?.receivedAt)).toBeGreaterThanOrEqual(1);
            expect(Number(updatedActiveMessage?.readAt)).toBeGreaterThanOrEqual(1);
        })
        it('FUNCTION: create/checkMissingReceived/checkMissingResponse/checkMissingRead DESC:isCreatedConversation false', async () => {
            const workspaceId = v4();
            const channelConfigId = v4();
            const conversationId = v4();
            const phoneNumber = v4();
            const result = await activeMessageService.create({
                activeMessageSettingId: 1,
                isCreatedConversation: false,
                workspaceId: workspaceId,
                channelConfigId: channelConfigId,
                memberPhone: phoneNumber,
                conversationId,
                externalId: '',
            });

            expect(result.answeredAt).toBeNull();
            expect(result.receivedAt).toBeNull();

            await activeMessageService.checkMissingReceived(phoneNumber, channelConfigId);
            await activeMessageService.checkMissingResponse(phoneNumber, channelConfigId);
            await activeMessageService.checkMissingRead(phoneNumber, channelConfigId);

            const updatedActiveMessage = await activeMessageService.activeMessageRepository.findOne(result.id);

            expect(updatedActiveMessage?.answeredAt).toBeNull();
            expect(updatedActiveMessage?.receivedAt).toBeNull();
            expect(updatedActiveMessage?.readAt).toBeNull();
        })

        it('FUNCTION: create/updateStatusToInvalid', async () => {
            const workspaceId = v4();
            const channelConfigId = v4();
            const conversationId = v4();
            const phoneNumber = v4();
            const result = await activeMessageService.create({
                activeMessageSettingId: 1,
                isCreatedConversation: false,
                workspaceId: workspaceId,
                channelConfigId: channelConfigId,
                memberPhone: phoneNumber,
                conversationId,
                externalId: '',
            });

            expect(result.statusId).toBeNull();

            await activeMessageService.updateStatusToInvalid(conversationId);

            const updated = await activeMessageService.activeMessageRepository
            .createQueryBuilder('ac')
            .leftJoinAndMapOne(
                'ac.status',
                ActiveMessageStatus,
                'status',
                `status.id = ac.status_id`,
            )
            .where('ac.id = :id', { id: result.id })
            .getOne();

            expect(updated?.status?.statusCode).toBe(-1)
            expect(updated?.status?.statusName).toBe(invalidNumberStatusName);
        })

        it('FUNCTION: create/updateActiveMessageStatusByConversationId', async () => {
            const workspaceId = v4();
            const channelConfigId = v4();
            const conversationId = v4();
            const phoneNumber = v4();
            const statusName = `TEST_${v4()}`
            const statusCode = getRandomInt(100, 110);

            await activeMessageService.activeMessageRepository.manager.createQueryBuilder(ActiveMessageStatus, 'st')
            .delete()
            .andWhere(`status_code = ${statusCode}`)
            .execute();

            await activeMessageService.activeMessageRepository.manager.save(ActiveMessageStatus, {
                statusName: statusName,
                statusCode: statusCode,
                workspaceId,
            })

            const result = await activeMessageService.create({
                activeMessageSettingId: 1,
                isCreatedConversation: false,
                workspaceId: workspaceId,
                channelConfigId: channelConfigId,
                memberPhone: phoneNumber,
                conversationId,
                externalId: '',
            });

            expect(result.statusId).toBeNull();

            await activeMessageService.updateActiveMessageStatusByConversationId(conversationId, workspaceId, statusCode);

            const updated = await activeMessageService.activeMessageRepository
            .createQueryBuilder('ac')
            .leftJoinAndMapOne(
                'ac.status',
                ActiveMessageStatus,
                'status',
                `status.id = ac.status_id`,
            )
            .where('ac.id = :id', { id: result.id })
            .getOne();

            expect(updated?.status?.statusCode).toBe(statusCode)
            expect(updated?.status?.statusName).toBe(statusName);

            await activeMessageService.activeMessageRepository.manager.createQueryBuilder(ActiveMessageStatus, 'st')
            .delete()
            .andWhere(`status_code = ${statusCode}`)
            .execute();
        })

        it('FUNCTION: listMessages', async () => {
            const workspaceId = v4();
            const channelConfigId = v4();
            const conversationId = v4();
            const conversationId2 = v4();
            const conversationId3 = v4();
            const conversationId4 = v4();
            const phoneNumber = v4();
            const apiToken = v4();
            const statusName = `TEST_${v4()}`;
            const statusCode = 1000;

            const data: Partial<ActiveMessageSetting> = {
                workspaceId,
                channelConfigToken: channelConfigId,
                enabled: true,
                callbackUrl: null,
                settingName: 'SETTING_NAME',
                expirationTimeType: TimeType.days,
                expirationTime: 10,
                suspendConversationUntilType: TimeType.days,
                suspendConversationUntilTime: 10,
                sendMessageToOpenConversation: true,
                tags: ['TAG_1', 'TAG_2'],
                apiToken,
            };

            const setting = await activeMessageService.activeMessageRepository.manager.save(ActiveMessageSetting, data);

            await activeMessageService.activeMessageRepository.manager
                .createQueryBuilder(ActiveMessageStatus, 'st')
                .delete()
                .andWhere(`status_code = ${statusCode}`)
                .execute();

            const status = await activeMessageService.activeMessageRepository.manager.save(ActiveMessageStatus, {
                statusName: statusName,
                statusCode: statusCode,
                workspaceId,
            });

            const partialActiveMessageData: CreateActiveMessage = {
                activeMessageSettingId: 1,
                isCreatedConversation: true,
                workspaceId: workspaceId,
                channelConfigId: channelConfigId,
                memberPhone: phoneNumber,
            } as CreateActiveMessage;

            const result = await activeMessageService.create({
                ...partialActiveMessageData,
                conversationId,
                externalId: '',
                timestamp: moment().subtract(2, 'days').valueOf(),
                activeMessageSettingId: setting.id,
            });

            const result2 = await activeMessageService.create({
                ...partialActiveMessageData,
                conversationId: conversationId2,
                externalId: '',
                timestamp: moment().subtract(3, 'days').valueOf(),
                activeMessageSettingId: setting.id,
            });

            const result3 = await activeMessageService.create({
                ...partialActiveMessageData,
                conversationId: conversationId3,
                externalId: '',
                timestamp: moment().subtract(4, 'days').valueOf(),
                activeMessageSettingId: setting.id,
            });

            const r4ExternalId = v4();
            const result4 = await activeMessageService.create({
                ...partialActiveMessageData,
                conversationId: conversationId4,
                externalId: r4ExternalId,
                timestamp: moment().subtract(10, 'days').valueOf(),
                activeMessageSettingId: setting.id,
            });

            await activeMessageService.updateActiveMessageStatusByConversationId(conversationId4, workspaceId, statusCode);

            //Deve retornar apenas o 4 criado pq ele é unico que tem externalId
            const byExternalId = await activeMessageService.listMessages({
                externalId: r4ExternalId,
                apiToken: setting.apiToken,
            });

            expect(byExternalId[0]?.id).toEqual(result4.id);
            expect(byExternalId[0]?.status?.statusName).toEqual(status.statusName);
            expect(byExternalId[0]?.status?.statusCode).toEqual(status.statusCode);

            //Deve retornar apenas os 3 primeiros
            const listByPeriod = await activeMessageService.listMessages({
                startDate: moment().subtract(6, 'days').format(),
                endDate: moment().format(),
                apiToken: setting.apiToken,
            });

            const ordered = orderBy(listByPeriod, 'id', 'asc');

            expect(ordered.length).toBe(3);

            // Testa se os que vieram são os 3 primeiros criados, pois o ultimo fica fora do range de data
            expect(ordered[0]?.id).toBe(result.id);
            expect(ordered[1]?.id).toBe(result2.id);
            expect(ordered[2]?.id).toBe(result3.id);

            try {
                await activeMessageService.listMessages({
                    startDate: moment().subtract(10, 'month').format(),
                    endDate: moment().format(),
                    apiToken: setting.apiToken,
                });
            } catch(e) {
                expect(e.response?.error).toBe('CANNOT_GET_ACTIVE_MESSAGES_INVALID_PERIOD')
            }

        });
    });
});
