import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from "@nestjs/typeorm";
import { v4 } from 'uuid';
import { ACTIVE_MESSAGE_CONNECTION } from './../ormconfig'
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
import { Answer } from  './../models/answer.entity';
import { SendActiveMessageIncomingData } from '../models/send-active-message-data.entity';
import { CreateActiveMessageSettingData } from '../interfaces/create-active-message-setting-data.interface';
import { EventsService } from '../../events/events.service';
import { CacheModule } from './../../_core/cache/cache.module';
import { UpdateActiveMessageSettingData } from '../interfaces/update-active-message-setting-data.interface';
import { KafkaService } from '../../_core/kafka/kafka.service';

describe('MODULE: active-message', () => {
    let moduleRef: TestingModule;
    let activeMessageSettingService: ActiveMessageSettingService;
    const workspaceId = v4();
    const templateId = v4();
    const channelConfigToken = v4();
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
                TypeOrmModule.forFeature([
                    ActiveMessageSetting,
                    ActiveMessageStatus,
                    ActiveMessage,
                    Answer,
                    SendActiveMessageIncomingData,
                ], ACTIVE_MESSAGE_CONNECTION),
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
                        sendEvent: (data: any) => {return true}
                    },
                    provide: EventsService
                },
                {
                    useValue: {
                        sendEvent: (data: any) => {return true}
                    },
                    provide: KafkaService
                }
            ],
        }).compile();
        activeMessageSettingService = moduleRef.get<ActiveMessageSettingService>(ActiveMessageSettingService)

    });

    describe('SERVICE: ActiveMessageSettingService', () => {
        //Está sendo testado todas as funções do service em apenas um teste pra não ter que repetir criação de dados em cada teste
        it('FUNCTION: create/listByWorkspaceId/listEnabledByWorkspaceId/update/delete/getOne', async () => {
            const data: CreateActiveMessageSettingData = {
                workspaceId,
                channelConfigToken,
                enabled: true,
                callbackUrl: null,
                settingName: 'SETTING_NAME',
                expirationTimeType: TimeType.days,
                expirationTime: 10,
                suspendConversationUntilType: TimeType.days,
                suspendConversationUntilTime: 10,
                sendMessageToOpenConversation: true,
                tags: ['TAG_1', 'TAG_2'],
                action: 'fluxo_personalizado_campanha',
                objective: ObjectiveType.campaign,
                templateId: templateId,
                authorizationHeader: 'Bearer 001122',
            }

            const data2 : CreateActiveMessageSettingData = {
                ...data,
                enabled: false
            }

            // Cria 2 registros um enabled = true e outro enabled = false
            const result = await activeMessageSettingService.create(data);
            const result2 = await activeMessageSettingService.create(data2);
            
            //Busca os registros criados
            let createdSetting: ActiveMessageSetting = await activeMessageSettingService.activeMessageRepository.findOne(result?.identifiers[0]?.id) as any;
            let createdSetting2: ActiveMessageSetting = await activeMessageSettingService.activeMessageRepository.findOne(result2?.identifiers[0]?.id) as any;
            
            //Valida se todos campos passados foram criados corretamente
            expect(createdSetting.callbackUrl).toBe(data.callbackUrl);
            expect(createdSetting.channelConfigToken).toBe(data.channelConfigToken);
            expect(createdSetting.enabled).toBe(data.enabled);
            expect(createdSetting.expirationTime).toBe(data.expirationTime);
            expect(createdSetting.expirationTimeType).toBe(data.expirationTimeType);
            expect(createdSetting.sendMessageToOpenConversation).toBe(data.sendMessageToOpenConversation);
            expect(createdSetting.settingName).toBe(data.settingName);
            expect(createdSetting.suspendConversationUntilTime).toBe(data.suspendConversationUntilTime);
            expect(createdSetting.suspendConversationUntilType).toBe(data.suspendConversationUntilType);
            expect(createdSetting.tags?.[0]).toBe(data.tags?.[0]);
            expect(createdSetting.tags?.[1]).toBe(data.tags?.[1]);
            expect(createdSetting.objective).toBe(data.objective);
            expect(createdSetting.action).toBe(data.action);
            expect(createdSetting.templateId).toBe(data.templateId);
            expect(createdSetting.authorizationHeader).toBe(data.authorizationHeader);

            //Busca a lista pelo workspace, deve retornar os 2 registros criados
            const list = await activeMessageSettingService.listByWorkspaceId(workspaceId);

            //Valida se trouxe apenas os 2 registros criados para o workspace 
            expect(list.length).toBe(2);
            expect(list?.[0].id).toBe(result?.identifiers[0]?.id);
            expect(list?.[1].id).toBe(result2?.identifiers[0]?.id);

            //Busca a lista pelo workspace apenas dos enabled = true
            const enabledList = await activeMessageSettingService.listEnabledByWorkspaceId(workspaceId);

            //Valida se retornou apenas o registro enabled dos 2 que foram criados
            expect(enabledList.length).toBe(1);
            expect(enabledList?.[0].id).toBe(result?.identifiers[0]?.id);
            expect(enabledList?.[0].enabled).toBe(true);

            // Atualiza o segundo registro criado para enabled = true
            const updateData: UpdateActiveMessageSettingData = {
                id: result2?.identifiers[0]?.id,
                enabled: true,
                callbackUrl: data2.callbackUrl + 'UPDATED',
                expirationTime: data2.expirationTime + 5,
                expirationTimeType: TimeType.hours,
                sendMessageToOpenConversation: false,
                suspendConversationUntilTime: data2.suspendConversationUntilTime + 5,
                suspendConversationUntilType: TimeType.hours,
                channelConfigToken: data2.channelConfigToken + 'UPDATED',
                settingName: data2.settingName + 'UPDATED',
                tags: ['UPDATED_TAG'],
                objective: ObjectiveType.confirmation,
                templateId: templateId,
                authorizationHeader: 'Bearer 001122',
            }

            await activeMessageSettingService.update(updateData);

            let updatedSetting: ActiveMessageSetting = await activeMessageSettingService.activeMessageRepository.findOne(result2?.identifiers[0]?.id) as any;;

            //Valida se todos campos foram atualizados corretamente
            //Campos workspaceId e apiToken não podem ser atualizadas
            expect(updatedSetting.callbackUrl).toBe(updateData.callbackUrl);
            expect(updatedSetting.channelConfigToken).toBe(updateData.channelConfigToken);
            expect(updatedSetting.enabled).toBe(updateData.enabled);
            expect(updatedSetting.expirationTime).toBe(updateData.expirationTime);
            expect(updatedSetting.expirationTimeType).toBe(updateData.expirationTimeType);
            expect(updatedSetting.sendMessageToOpenConversation).toBe(updateData.sendMessageToOpenConversation);
            expect(updatedSetting.settingName).toBe(updateData.settingName);
            expect(updatedSetting.suspendConversationUntilTime).toBe(updateData.suspendConversationUntilTime);
            expect(updatedSetting.suspendConversationUntilType).toBe(updateData.suspendConversationUntilType);
            expect(updatedSetting.tags?.[0]).toBe(updateData.tags?.[0]);
            expect(updatedSetting.tags?.[1]).toBe(undefined);
            expect(updatedSetting.workspaceId).toBe(workspaceId);
            expect(updatedSetting.apiToken).toBe(createdSetting2.apiToken);
            expect(updatedSetting.authorizationHeader).toBe(updateData.authorizationHeader);
            expect(updatedSetting.objective).toBe(updateData.objective);
            expect(updatedSetting.templateId).toBe(updateData.templateId);

            //Deleta o segundo registro criado
            await activeMessageSettingService.delete(createdSetting2.id);

            const listAfterDelete = await activeMessageSettingService.listByWorkspaceId(workspaceId);

            //Valida se retornou apenas o primeiro registro criado, já que foi deletado o segundo
            expect(listAfterDelete.length).toBe(1);
            expect(listAfterDelete?.[0].id).toBe(createdSetting?.id);
            expect(listAfterDelete?.[0].enabled).toBe(true);

            //Testa a função getOne com o primeiro registro, deve retornar o registro
            const firstCreatedSetting = await activeMessageSettingService.getOne(createdSetting.id);
            expect(firstCreatedSetting?.id).toBe(createdSetting?.id);

            //Testa a função getOne com o segundo registro, não deve retornar o registro pois foi excluido
            const secondCreatedSetting = await activeMessageSettingService.getOne(createdSetting2.id);
            expect(secondCreatedSetting).toBe(undefined);
             
        });
    });
});
