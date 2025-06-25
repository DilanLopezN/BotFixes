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
import { ActiveMessageSetting, ObjectiveType, TimeType } from '../models/active-message-setting.entity';
import { ActiveMessageStatus } from '../models/active-message-status.entity';
import { ActiveMessage } from '../models/active-message.entity';
import { Answer } from './../models/answer.entity';
import { SendActiveMessageIncomingData } from '../models/send-active-message-data.entity';
import { EventsService } from '../../events/events.service';
import { CacheModule } from './../../_core/cache/cache.module';
import { ActivityType, IdentityType, KissbotEvent } from 'kissbot-core';
import { ExternalDataServiceMock } from './mocks/external-data-service-mock.service';
import { FindConditions } from 'typeorm';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { ObjectId } from 'bson';

describe('MODULE: active-message', () => {
    let moduleRef: TestingModule;
    let activeMessageSettingService: ActiveMessageSettingService;
    let activeMessageService: ActiveMessageService;
    let sendMessageService: SendMessageService;
    let externalDataService: ExternalDataService;
    let sendActiveMessageIncomingDataService: SendActiveMessageIncomingDataService;

    const globalStatus1 = 'numero invalido';
    const globalStatus2 = 'conversa aberta para o numero';
    const globalStatus3 = 'canas desabilitado';
    const globalStatus4 = 'mensagem enviada';

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const workspaceId = ExternalDataServiceMock.workspaceId;
    const enabledChannelConfigToken = '1';
    const notEnabledChannelConfigToken = '2';
    const templateId = v4();

    const baseSetting = {
        workspaceId: (workspaceId.toString ? workspaceId.toString() : workspaceId) as string,
        channelConfigToken: enabledChannelConfigToken,
        enabled: true,
        callbackUrl: null,
        settingName: 'SETTING_NAME',
        expirationTimeType: TimeType.days,
        expirationTime: 10,
        suspendConversationUntilType: TimeType.days,
        suspendConversationUntilTime: 10,
        sendMessageToOpenConversation: true,
        tags: ['TAG_1', 'TAG_2'],
    }
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
                {
                    useClass: ExternalDataServiceMock,
                    provide: ExternalDataService,
                },
                {
                    useValue: {
                        // events: {},
                        sendEvent: function (data: KissbotEvent) {
                            // this.events[data.type] = data
                            return true;
                        },
                    },
                    provide: EventsService,
                },
                {
                    useValue: {
                        // events: {},
                        sendEvent: function (data: KissbotEvent) {
                            // this.events[data.type] = data
                            return true;
                        },
                    },
                    provide: KafkaService,
                },
            ],
        }).compile();
        sendMessageService = moduleRef.get<SendMessageService>(SendMessageService);
        activeMessageSettingService = moduleRef.get<ActiveMessageSettingService>(ActiveMessageSettingService);
        activeMessageService = moduleRef.get<ActiveMessageService>(ActiveMessageService);
        sendActiveMessageIncomingDataService = moduleRef.get<SendActiveMessageIncomingDataService>(SendActiveMessageIncomingDataService);
        externalDataService = moduleRef.get<ExternalDataService>(ExternalDataService);
        
        await activeMessageService.activeMessageRepository.manager.query(`
            delete from active_message.active_message_status where status_code < 0
        `)
        await activeMessageService.activeMessageRepository.manager.insert(ActiveMessageStatus, [
            {
                global: 1,
                statusName: globalStatus1,
                statusCode: -1,
            },
            {
                global: 1,
                statusName: globalStatus2,
                statusCode: -2,
            },
            {
                global: 1,
                statusName: globalStatus3,
                statusCode: -3,
            },
            {
                global: 1,
                statusName: globalStatus4,
                statusCode: -4,
            },
        ]);
    });

    describe('SERVICE: SendMessageService', () => {
        it('FUNCTION: sendMessageFromValidateNumber DESC:isValid false', async () => {
            const apiToken = v4();
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            const userId = v4();
            const phone = v4();
            await sendMessageService.sendMessageFromValidateNumber(
                {
                    userId: userId,
                    token: userId,
                    phone: phone,
                    phoneId: phone,
                    whatsapp: phone,
                    isValid: false,
                } as any,
                {
                    apiToken: enabledSetting.apiToken,
                    templateId,
                    phoneNumber: phone,
                } as any,
            );
            const invalidCreatedActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .innerJoinAndMapOne(
                    'ac.status',
                    ActiveMessageStatus,
                    'status',
                    'ac.status_id = status.id',
                )
                .getOne();
            expect(invalidCreatedActiveMessage?.id).toBeDefined();
            expect(typeof invalidCreatedActiveMessage?.id).toBe('number');
            expect(invalidCreatedActiveMessage?.status?.statusCode).toBe(-1);
            if (invalidCreatedActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: invalidCreatedActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: sendMessageFromValidateNumber DESC:isValid true channelConfig not enabled', async () => {
            const userId = notEnabledChannelConfigToken;
            const phone = v4();
            const apiToken = v4();
    
            const notEnabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: notEnabledChannelConfigToken,
            });
            try {
                await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: userId,
                        token: userId,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: notEnabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                    } as any,
                );
            } catch (e) {
                expect(e.response?.error).toBe('CANNOT_SEND_MESSAGE_ON_NOT_ENABLED_CHANNEL')
            }
            const invalidCreatedActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: notEnabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .innerJoinAndMapOne(
                    'ac.status',
                    ActiveMessageStatus,
                    'status',
                    'ac.status_id = status.id',
                )
                .getOne();
            expect(invalidCreatedActiveMessage?.id).toBeDefined();
            expect(typeof invalidCreatedActiveMessage?.id).toBe('number');
            expect(invalidCreatedActiveMessage?.status?.statusCode).toBe(-3);
            if (invalidCreatedActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: invalidCreatedActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: sendMessageFromValidateNumber DESC:isValid true sendMessageToOpenConversation = false', async () => {
            const phone = '1';
            const apiToken = v4();
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                sendMessageToOpenConversation: false,
                channelConfigToken: enabledChannelConfigToken,
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                    } as any,
                );
            const invalidCreatedActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .innerJoinAndMapOne(
                    'ac.status',
                    ActiveMessageStatus,
                    'status',
                    'ac.status_id = status.id',
                )
                .getOne();
            expect(invalidCreatedActiveMessage?.id).toBeDefined();
            expect(typeof invalidCreatedActiveMessage?.id).toBe('number');
            expect(invalidCreatedActiveMessage?.status?.statusCode).toBe(-2);
            if (invalidCreatedActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: invalidCreatedActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: sendMessageFromValidateNumber DESC: manda msg na conversa aberta e finaliza conversa', async () => {
            const phone = '2';
            const apiToken = v4();
            const text = v4();
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                        text,
                    } as any,
                );
            const createdActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .getOne();
            expect(createdActiveMessage?.id).toBeDefined();
            expect(typeof createdActiveMessage?.id).toBe('number');

            const conversation = ExternalDataServiceMock.conversations?.[phone];

            expect(createdActiveMessage?.conversationId).toBe(conversation?._id.toString());
            
            const systemMember = (conversation?.members as any[])?.find(mem => mem.name == 'system' && mem.type == 'system')
            expect(systemMember?.name).toBe('system')
            expect(systemMember?.type).toBe('system')
            expect((conversation?.activities?.[0] as any)?.text).toBe(text)
            expect(conversation?.state).toBe('closed')

            if (createdActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: createdActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: sendMessageFromValidateNumber DESC: manda msg na conversa aberta e manda activity com action e deixa aberta', async () => {
            const phone = '3';
            const apiToken = v4();
            const text = v4();
            const action = v4();
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                        text,
                        action,
                    } as any,
                );
            const createdActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .getOne();
            expect(createdActiveMessage?.id).toBeDefined();
            expect(typeof createdActiveMessage?.id).toBe('number');

            const conversation = ExternalDataServiceMock.conversations?.[phone];

            expect(createdActiveMessage?.conversationId).toBe(conversation?._id.toString());
            
            const systemMember = (conversation?.members as any[])?.find(mem => mem.name == 'system' && mem.type == 'system')
            expect(systemMember?.name).toBe('system')
            expect(systemMember?.type).toBe('system')
            expect((conversation?.activities?.[0] as any)?.text).toBe(text)
            expect((conversation?.activities?.[1] as any)?.type).toBe(ActivityType.event)
            expect((conversation?.activities?.[1] as any)?.conversationId).toBe(createdActiveMessage?.conversationId)
            expect(conversation?.state).toBe('open');

            if (createdActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: createdActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: sendMessageFromValidateNumber DESC: manda msg na conversa aberta pelo templateId adiciona attr e finaliza', async () => {
            const phone = '4';
            const apiToken = v4();
            const attr1Name = v4();
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                        attributes: [
                            {name: attr1Name}
                        ]
                    } as any,
                );
            const createdActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .getOne();
            expect(createdActiveMessage?.id).toBeDefined();
            expect(typeof createdActiveMessage?.id).toBe('number');

            const conversation = ExternalDataServiceMock.conversations?.[phone];

            expect(createdActiveMessage?.conversationId).toBe(conversation?._id.toString());
            
            const systemMember = (conversation?.members as any[])?.find(mem => mem.name == 'system' && mem.type == 'system')
            expect(systemMember?.name).toBe('system')
            expect(systemMember?.type).toBe('system')
            expect((conversation?.activities?.[0] as any)?.text).toBe(ExternalDataServiceMock.templateContent)
            expect(conversation?.state).toBe('closed');
            expect((conversation?.attributes?.[0] as any)?.name).toBe(attr1Name);
            expect((conversation?.attributes?.[0] as any)?.type).toBe('@sys.any');

            if (createdActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: createdActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: sendMessageFromValidateNumber DESC: criar conversa,manda activity de action e dexia aberta', async () => {
            const phone = '5';
            const apiToken = v4();
            const attr1Name = v4();
            const action = v4();
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
                tags: [
                    ExternalDataServiceMock.tagNameA,
                ]
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                        attributes: [
                            {name: attr1Name}
                        ],
                        action
                    } as any,
                );
            const createdActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .getOne();
            expect(createdActiveMessage?.id).toBeDefined();
            expect(typeof createdActiveMessage?.id).toBe('number');
            expect(createdActiveMessage?.isCreatedConversation).toBeTruthy();

            const conversation = ExternalDataServiceMock.conversations?.[phone];

            expect(createdActiveMessage?.conversationId).toBe(conversation?._id.toString());
            
            const botMember = (conversation?.members as any[])?.find(mem => mem.name == ExternalDataServiceMock.bot.name && mem.type == IdentityType.bot);
            expect(botMember?.name).toBe(ExternalDataServiceMock.bot.name)
            expect(botMember?.id).toBe(ExternalDataServiceMock.botId)
            
            const systemMember = (conversation?.members as any[])?.find(mem => mem.name == 'system' && mem.type == 'system')
            expect(systemMember?.name).toBe('system')
            expect(systemMember?.type).toBe('system')
            expect((conversation?.activities?.[0] as any)?.text).toBe(ExternalDataServiceMock.templateContent)
            expect(conversation?.state).toBe('open');
            expect((conversation?.attributes?.[0] as any)?.name).toBe(attr1Name);
            expect((conversation?.attributes?.[0] as any)?.type).toBe('@sys.any');
            expect(conversation?.privateData?.data).toBe(ExternalDataServiceMock.privateData.data);
            expect(conversation?.tags?.[0]?.name).toBe(ExternalDataServiceMock.tagNameA);
            expect(conversation?.createdByChannel).toBe('api');

            if (createdActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: createdActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: sendMessageFromValidateNumber DESC: manda msg na conversa aberta e mantém conversa, pois tem agente', async () => {
            const phone = '6';
            const apiToken = v4();
            const text = v4();
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                        text,
                    } as any,
                );
            const createdActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .getOne();
            expect(createdActiveMessage?.id).toBeDefined();
            expect(typeof createdActiveMessage?.id).toBe('number');

            const conversation = ExternalDataServiceMock.conversations?.[phone];

            expect(createdActiveMessage?.conversationId).toBe(conversation?._id.toString());
            
            const systemMember = (conversation?.members as any[])?.find(mem => mem.name == 'system' && mem.type == 'system')
            const agentMember = (conversation?.members as any[])?.find(mem => mem.type == IdentityType.agent && mem.name == IdentityType.agent)
            expect(systemMember?.name).toBe('system')
            expect(systemMember?.type).toBe('system')

            expect(agentMember?.type).toBe(IdentityType.agent)
            expect(agentMember?.type).toBe(IdentityType.agent)
            expect((conversation?.activities?.[0] as any)?.text).toBe(text)
            expect(conversation?.state).toBe('open')

            if (createdActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: createdActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });
        it('FUNCTION: checkConversationExists DESC: Busca em numero que tem e outro que não tem conversa', async () => {
            const apiToken = v4();
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            const exists = await sendMessageService.checkConversationExists({
                apiToken,
                phoneNumber: ExternalDataServiceMock.phoneExistsConversation
            });
            const notExists = await sendMessageService.checkConversationExists({
                apiToken,
                phoneNumber: 'AAA'
            });
            expect(notExists.hasConversation).toBeFalsy();
            expect(exists.hasConversation).toBeTruthy();    
        });
        it('FUNCTION: enqueueMessage DESC: Verifica se registro de incoming foi criado', async () => {
            const phoneNumber = '123456789'
            const apiToken = v4();
            const action = v4();
            const teamId = v4();
            const text = v4();
            const templateId = v4();
            const externalId = v4();
            const campaignId = getRandomInt(10, 1000);
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            const data = {
                apiToken,
                teamId,
                phoneNumber,
                action,
                priority: 1,
                text,
                templateId,
                externalId,
                campaignId,
            }
            await sendMessageService.enqueueMessage({
                ...data,
                attributes: [],
            });
            const incoming = await sendActiveMessageIncomingDataService.repository.findOne({
                where: {
                    apiToken,
                    teamId,
                    phoneNumber,
                    action,
                    text,
                    templateId,
                    externalId,
                    campaignId,
                    activeMessageSettingId: enabledSetting.id,
                }
            });
            expect(incoming?.id).toBeDefined();
            expect(typeof incoming?.id).toBe('number');

            if (incoming) {
                await sendActiveMessageIncomingDataService.repository.delete({
                    id: incoming.id,
                } as FindConditions<ActiveMessage>)
            }
        });
         it('FUNCTION: sendMessageFromValidateNumber DESC: manda msg na conversa aberta e mantém conversa e verifica se adicionou no array de templateVariableValues da activity', async () => {
            const phone = '7';
            const apiToken = v4();
            const attrName = v4();
            const attrName2 = v4();
            const attr = { name: attrName, value: attrName }
            const attr2 = { name: attrName2, value: attrName2 }
    
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                        attributes: [
                            attr,
                            attr2,
                        ]
                    } as any,
                );
            const createdActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .getOne();
            expect(createdActiveMessage?.id).toBeDefined();
            expect(typeof createdActiveMessage?.id).toBe('number');

            const conversation = ExternalDataServiceMock.conversations?.[phone];

            expect(createdActiveMessage?.conversationId).toBe(conversation?._id.toString());
          
            const activies = conversation.activities as any;

            expect(activies[0]?.templateVariableValues[0]).toBe(attrName)
            expect(activies[0]?.templateVariableValues[1]).toBe(attrName2)

            if (createdActiveMessage) {
                await activeMessageService.activeMessageRepository.delete({
                    id: createdActiveMessage.id,
                } as FindConditions<ActiveMessage>)
            }
        });

        it('FUNCTION: sendMessageFromValidateNumber DESC: cria um active message e uma conversa com createdByChannel IVR', async () => {
            const phone = v4();
            const apiToken = v4();
            const attrName = v4();
            const attrName2 = v4();
            const attr = { name: attrName, value: attrName }
            const attr2 = { name: attrName2, value: attrName2 }
            const contactId = new ObjectId();
            const workspaceId = new ObjectId();
            const conversationId = new ObjectId();
            let createConversationResult;
            const enabledSetting = await activeMessageSettingService.activeMessageRepository.save({
                ...baseSetting,
                workspaceId: workspaceId.toHexString(),
                apiToken,
                channelConfigToken: enabledChannelConfigToken,
                objective: ObjectiveType.api_ivr,
            });
            jest.spyOn(externalDataService, 'findOneContact').mockImplementation(() => {
                return {
                    _id: contactId,
                } as any
            });
            jest.spyOn(externalDataService, 'createConversation').mockImplementation((data) => {
                createConversationResult = data;
                data._id = conversationId;
                data.workspace = {_id: workspaceId.toHexString()};
                return data as any
            });
            await sendMessageService.sendMessageFromValidateNumber(
                    {
                        userId: enabledChannelConfigToken,
                        token: enabledChannelConfigToken,
                        phone: phone,
                        phoneId: phone,
                        whatsapp: phone,
                        isValid: true,
                    } as any,
                    {
                        apiToken: enabledSetting.apiToken,
                        templateId,
                        phoneNumber: phone,
                        attributes: [
                            attr,
                            attr2,
                        ]
                    } as any,
                );
            const createdActiveMessage = await activeMessageService.activeMessageRepository.createQueryBuilder('ac')
                .where('ac.active_message_setting_id = :settingId', {settingId: enabledSetting.id})
                .andWhere('ac.member_phone = :phone', {phone})
                .getOne();
            expect(createConversationResult.createdByChannel).toBe(ObjectiveType.api_ivr);
            expect(createdActiveMessage).toBeDefined();
            expect(createdActiveMessage.workspaceId).toBe(workspaceId.toString());
        });
    });
});
