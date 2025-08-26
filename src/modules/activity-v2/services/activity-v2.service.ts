import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityAck, ConversationActivity } from 'kissbot-entities';
import { Repository } from 'typeorm';
import { transformArrayIntoPostgresInClause } from '../../../common/utils/utils';
import { CatchError } from '../../auth/exceptions';
import { CreateActivityData } from '../interfaces/create-activity.interface';
import { CONVERSATION_CONNECTION } from '../ormconfig';
import * as Sentry from '@sentry/node';

@Injectable()
export class ActivityV2Service {
    private readonly logger = new Logger(ActivityV2Service.name);
    constructor(
        @InjectRepository(ConversationActivity, CONVERSATION_CONNECTION)
        public conversationActivityRepository: Repository<ConversationActivity>,
    ) {}

    private async replaceInvalidChars(data: CreateActivityData): Promise<CreateActivityData> {
        try {
            data.text = ((data.text || '') as string).replace(/\0/g, '');
            if (data?.fromName && typeof data.fromName == 'string') {
                data.fromName = ((data.fromName || '') as string).replace(/\0/g, '');
            }

            let a = JSON.stringify(data);
            a = a.replace(/\0/g, '');
            data = JSON.parse(a);
            return data;
        } catch (e) {
            let errorJson = '';
            try {
                errorJson = JSON.stringify(e);
            } catch (e) {}
            this.logger.error(e);
            Sentry.captureEvent({
                message: 'ERROR SAVING ACTIVITY ActivityV2Service.replaceInvalidChars',
                extra: {
                    errorJson,
                    data: data,
                },
            });
        }
        return data;
    }

    @CatchError()
    async createActivity(data: CreateActivityData) {
        try {
            data = await this.replaceInvalidChars(data);
            return await this.conversationActivityRepository.insert({
                id: data._id,
                ack: data.ack,
                attachmentFile: data.attachmentFile,
                attachments: data.attachments,
                conversationId: data.conversationId,
                createdAt: data.createdAt,
                fromChannel: data.fromChannel,
                fromId: data.fromId,
                fromName: data.fromName,
                fromType: data.fromType,
                hash: data.hash,
                isHsm: data.isHsm,
                name: data.name,
                recognizerResult: data.recognizerResult,
                text: data.text,
                timestamp: data.timestamp,
                type: data.type,
                workspaceId: data.workspaceId,
                data: data.data,
                quoted: data.quoted,
                templateId: data.templateId,
                referralSourceId: data.referralSourceId,
            });
        } catch (e) {
            let errorJson = '';
            try {
                errorJson = JSON.stringify(e);
            } catch (e) {}
            this.logger.error(e);
            Sentry.captureEvent({
                message: 'ERROR SAVING ACTIVITY ActivityV2Service.createActivity',
                extra: {
                    errorJson,
                    data: data,
                },
            });
        }
    }

    @CatchError()
    async getAcitvitiesByConversationId_(conversationId: string, workspaceId: string) {
        return (await this.conversationActivityRepository
            .createQueryBuilder('ac')
            .select(
                `
            (
              CASE
                WHEN ac.ack <> 0
                AND ac.type IN ('message')
                AND ac.from_type <> 'user' THEN ac.ack
                ELSE (
                  SELECT
                    ack
                  FROM
                    conversation.activity_ack ack
                  WHERE
                    ack.hash = ac.hash
                  ORDER BY
                    (
                      CASE
                        WHEN "ack"."ack" < 0 THEN 9999
                        ELSE "ack"."ack"
                      END
                    ) DESC
                  LIMIT
                    1
                )
              END
            )`,
                'subAck',
            )
            .addSelect('ac.ack', 'ack')
            .addSelect('ac.id', 'id')
            .addSelect('ac.conversation_id', 'conversationId')
            .addSelect('ac.workspace_id', 'workspaceId')
            .addSelect('ac.is_hsm', 'isHsm')
            .addSelect('ac.name', 'name')
            .addSelect('ac.type', 'type')
            .addSelect('ac.hash', 'hash')
            .addSelect('ac.from_id', 'fromId')
            .addSelect('ac.from_type', 'fromType')
            .addSelect('ac.from_channel', 'fromChannel')
            .addSelect('ac.from_name', 'fromName')
            .addSelect('ac.text', 'text')
            .addSelect('ac.timestamp', 'timestamp')
            .addSelect('ac.created_at', 'createdAt')
            .addSelect('ac.attachments', 'attachments')
            .addSelect('ac.attachment_file', 'attachmentFile')
            .addSelect('ac.recognizer_result', 'recognizerResult')
            .addSelect('ac.data', 'data')
            .addSelect('ac.quoted', 'quoted')
            .addSelect('ac.referral_source_id', 'referralSourceId')
            .where('ac.conversation_id = :conversationId', { conversationId })
            .andWhere('ac.workspace_id = :workspaceId', { workspaceId })
            .getRawMany()) as Array<Partial<ConversationActivity>>;
    }

    @CatchError()
    async getAcitvitiesByConversationId(conversationId: string, workspaceId: string) {
        //Em produção estamos usando herança
        let table = `activity.activity_child_${workspaceId}`;
        if (process.env.NODE_ENV != 'production') {
            table = `conversation.conversation_activity`;
        }
        const query = `
        SELECT
          ac.ack as "ack",
          ac.id as "id",
          ac.conversation_id as "conversationId",
          ac.workspace_id as "workspaceId",
          ac.is_hsm as "isHsm",
          ac.name as "name",
          ac.type as "type",
          ac.hash as "hash",
          ac.from_id as "fromId",
          ac.from_type as "fromType",
          ac.from_channel as "fromChannel",
          ac.from_name as "fromName",
          ac.text as "text",
          ac.timestamp as "timestamp",
          ac.created_at as "createdAt",
          ac.attachments as "attachments",
          ac.attachment_file as "attachmentFile",
          ac.recognizer_result as "recognizerResult",
          ac.data as "data",
          ac.quoted as "quoted",
          ac.referral_source_id as "referralSourceId",
          (
            CASE
              WHEN ac.ack <> 0
              AND ac.type IN ('message')
              AND ac.from_type <> 'user' THEN ac.ack
              ELSE (
                SELECT
                  ack
                FROM
                  conversation.activity_ack ack
                WHERE
                  ack.hash = ac.hash
                ORDER BY
                  (
                    CASE
                      WHEN "ack"."ack" < 0 THEN 9999
                      ELSE "ack"."ack"
                    END
                  ) DESC
                LIMIT
                  1
              )
            END
          ) as "subAck"
          FROM
            ${table} as ac
          WHERE
            ac.conversation_id = '${conversationId}' AND
            ac.workspace_id = '${workspaceId}'
        `;
        const result = (await this.conversationActivityRepository.query(query)) as Array<Partial<ConversationActivity>>;
        return result;
    }

    @CatchError()
    async getActivitiesByIdList(idList: string[]) {
        const stringValues = transformArrayIntoPostgresInClause(idList);
        return await this.conversationActivityRepository
            .createQueryBuilder('ac')
            .where(`ac.id IN (${stringValues})`)
            .getMany();
    }

    @CatchError()
    async getActivitiesById(workspaceId: string, id: string) {
        return await this.conversationActivityRepository
            .createQueryBuilder('ac')
            .where(`ac.workspaceId = :workspaceId`, { workspaceId })
            .andWhere(`ac.id = :id`, { id })
            .getOne();
    }
}
