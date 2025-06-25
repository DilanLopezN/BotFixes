import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConversationActivity, ActivityAck } from "kissbot-entities";
import { Amqpv2Module } from "../../_core/amqpv2/amqpv2.module";
import { CONVERSATION_CONNECTION } from "../ormconfig";
import { ActivityV2AckService } from "../services/activity-v2-ack.service";
import { ActivityV2Service } from "../services/activity-v2.service";
import { v4 } from 'uuid';
import * as moment from 'moment';
import { ActivityType } from 'kissbot-core';
import { orderBy } from 'lodash';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { CreateActivityData } from '../interfaces/create-activity.interface';


describe('MODULE: activity-v2', () => {
    let moduleRef: TestingModule;
    let activityV2Service: ActivityV2Service;
    let activityV2AckService: ActivityV2AckService;
    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    name: CONVERSATION_CONNECTION,
                    url: process.env.POSTGRESQL_URI_TESTS || 'postgres://postgres:@localhost/tests',
                    entities: [
                        ConversationActivity,
                        ActivityAck,
                    ],
                    synchronize: true,
                    migrationsRun: false,
                    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
                    schema: 'conversation',
                }),
                TypeOrmModule.forFeature([ConversationActivity, ActivityAck], CONVERSATION_CONNECTION),
            ],
            providers: [
                ActivityV2Service,
                ActivityV2AckService,
                {
                    provide: KafkaService,
                    useValue: {
                        getKafkaConsumer: async (data: any) => {
                            return {
                                run: async (data: any) => {

                                }
                            } as any
                        }
                    }
                }
            ],
            exports: [
                ActivityV2Service,
            ]
        }).compile();
        activityV2Service = moduleRef.get<ActivityV2Service>(ActivityV2Service);
        activityV2AckService = moduleRef.get<ActivityV2AckService>(ActivityV2AckService);
    });

    describe('SERVICE: ActivityV2Service', () => {
        it('FUNCTION: createActivity', async () => {
            const idHash = v4();
            const nowDate = moment().toDate();
            const nowTs = moment().valueOf();
            const conversationId = v4();
            const workspaceId = v4();
            const text = v4();
            const activityBody: CreateActivityData = {
                _id: idHash,
                ack: 0,
                conversationId: conversationId,
                createdAt: nowDate,
                fromChannel: 'test',
                fromId: 'test',
                fromName: 'test',
                fromType: 'test',
                hash: idHash,
                isHsm: false,
                name: 'message',
                timestamp: nowTs,
                type: ActivityType.message,
                workspaceId: workspaceId,
                attachmentFile: {attachmentFile: true},
                attachments: {attachments: true},
                recognizerResult: {recognizerResult: true},
                text,
                data: {data: true},
            };
            const r = await activityV2Service.createActivity(activityBody);
            const savedActivity = await activityV2Service.conversationActivityRepository.findOne(idHash)
            expect(savedActivity?.id).toEqual(idHash);
            expect(savedActivity?.ack).toEqual(0);
            expect(savedActivity?.conversationId).toEqual(conversationId);
            expect(savedActivity?.createdAt).toEqual(nowDate);
            expect(savedActivity?.fromChannel).toEqual('test');
            expect(savedActivity?.fromId).toEqual('test');
            expect(savedActivity?.fromName).toEqual('test');
            expect(savedActivity?.fromType).toEqual('test');
            expect(savedActivity?.hash).toEqual(idHash);
            expect(savedActivity?.isHsm).toEqual(false);
            expect(savedActivity?.name).toEqual('message');
            expect(Number(savedActivity?.timestamp)).toEqual(Number(nowTs));
            expect(savedActivity?.type).toEqual(ActivityType.message);
            expect(savedActivity?.workspaceId).toEqual(workspaceId);
            expect(savedActivity?.attachmentFile?.attachmentFile).toEqual(true);
            expect(savedActivity?.attachments?.attachments).toEqual(true);
            expect(savedActivity?.recognizerResult?.recognizerResult).toEqual(true);
            expect(savedActivity?.attachmentFile?.attachmentFile).toEqual(true);
            expect(savedActivity?.text).toEqual(text);
            expect(savedActivity?.data?.data).toEqual(true);
        });
        it('FUNCTION: getAcitvitiesByConversationId - with ActivityV2AckService.processAck function usage tested', async () => {
            const idHash = v4();
            const nowDate = moment().toDate();
            const nowTs = moment().valueOf();
            const conversationId = v4();
            const workspaceId = v4();
            const text = v4();
            const activityBody: CreateActivityData = {
                _id: idHash,
                ack: 0,
                conversationId: conversationId,
                createdAt: nowDate,
                fromChannel: 'test',
                fromId: 'test',
                fromName: 'test',
                fromType: 'message',
                hash: idHash,
                isHsm: false,
                name: 'message',
                timestamp: nowTs,
                type: ActivityType.message,
                workspaceId: workspaceId,
                attachmentFile: {attachmentFile: true},
                attachments: {attachments: true},
                recognizerResult: {recognizerResult: true},
                text,
                data: {data: true},
            };
            await activityV2Service.createActivity(activityBody);
            const savedActivities = await activityV2Service.getAcitvitiesByConversationId(conversationId, workspaceId);
            expect(savedActivities[0]?.id).toEqual(idHash);
            expect(savedActivities[0]?.subAck).toEqual(null);
            await activityV2AckService.processAck({
                data: {
                    ack: 1,
                    hash: [
                        idHash,
                    ],
                }
            });
            const savedWithAckFromTable = await activityV2Service.getAcitvitiesByConversationId(conversationId, workspaceId);
            expect(Number(savedWithAckFromTable[0]?.subAck)).toEqual(1);
        });
        it('FUNCTION: getActivitiesByIdList', async () => {
            const idHash1 = v4();
            const idHash2 = v4();
            const conversationId = v4();
            const workspaceId = v4();
            const text = v4();
            const activityBodyPartial = {
                ack: 0,
                conversationId: conversationId,
                createdAt: moment().toDate(),
                fromChannel: 'test',
                fromId: 'test',
                fromName: 'test',
                fromType: 'test',
                isHsm: false,
                name: 'message',
                timestamp: moment().valueOf(),
                type: ActivityType.message,
                workspaceId: workspaceId,
                attachmentFile: {attachmentFile: true},
                attachments: {attachments: true},
                recognizerResult: {recognizerResult: true},
                text,
                data: {data: true},
            };
            await activityV2Service.createActivity({
                ...activityBodyPartial,
                _id: idHash1,
                hash: idHash1
            });
            await activityV2Service.createActivity({
                ...activityBodyPartial,
                _id: idHash2,
                hash: idHash2
            });
            let savedActivities = await activityV2Service.getActivitiesByIdList([idHash1, idHash2]);
            savedActivities = orderBy(savedActivities, 'timestamp');
            expect(savedActivities[0]?.id).toEqual(idHash1);
            expect(savedActivities[1]?.id).toEqual(idHash2);
        });
    });
});
