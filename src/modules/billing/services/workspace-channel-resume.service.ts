import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository } from "typeorm";
import { CatchError } from "../../auth/exceptions";
import { WorkspaceChannelResume } from "../models/worksapce-channel-resume.entity";
import { BILLING_CONNECTION } from "../ormconfig";
import * as moment from 'moment';
import { InjectConnection } from "@nestjs/mongoose";
import { ChannelIdConfig } from "kissbot-core";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WorkspaceService } from "./workspace.service";
import * as Sentry from '@sentry/node';
import { shouldRunCron } from "../../../common/utils/bootstrapOptions";

@Injectable()
export class WorkspaceChannelResumeService {
    private readonly logger = new Logger(WorkspaceChannelResumeService.name);
    constructor(
        @InjectConnection(BILLING_CONNECTION)
        private connection: Connection,
        @InjectRepository(WorkspaceChannelResume, BILLING_CONNECTION)
        private workspaceChannelResumeRepository: Repository<WorkspaceChannelResume>,
        private readonly workspaceService: WorkspaceService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_5AM)
    async syncMonthCron() {
        if (!shouldRunCron()) return;
        await this.syncMonth();
    }

    async syncMonth() {
        const workspaces = await this.workspaceService.getActiveWorkspaces();
        const channelIds: ChannelIdConfig[] = [
            ChannelIdConfig.gupshup,
            ChannelIdConfig.liveagent,
            ChannelIdConfig.webchat,
            ChannelIdConfig.api,
            ChannelIdConfig.campaign,
            ChannelIdConfig.confirmation,
            ChannelIdConfig.reminder,
            ChannelIdConfig.nps,
            ChannelIdConfig.medical_report,
            ChannelIdConfig.ads,
            ChannelIdConfig.api_ivr,
            ChannelIdConfig.schedule_notification,
            ChannelIdConfig.recover_lost_schedule,
            ChannelIdConfig.nps_score,
            ChannelIdConfig.documents_request,
        ];
        const month = moment().startOf('month').toDate();
        const lastMonth = moment().subtract(1, 'month').startOf('month').toDate();
        for (const workspace of workspaces) {
            try {
                const promises = []
                channelIds.forEach((channelId) => {
                    //Calcula do mês atual
                    promises.push(this.generateChannelResume(workspace.id, month, channelId));
                    //Calcula do mês anterior para calcular o ultimo dia tb
                    promises.push(this.generateChannelResume(workspace.id, lastMonth, channelId));
                });
                await Promise.all(promises);
            } catch (e) {
                Sentry.captureEvent({
                    message: `${WorkspaceChannelResumeService.name}.syncMonth`, extra: {
                        error: e,
                    }
                });
            }
        }
    }

    @CatchError()
    async generateChannelResume(
        workspaceId: string,
        billingMonth: Date,
        channel: ChannelIdConfig,
    ): Promise<void> {
        const startDate = moment(billingMonth).startOf('month');
        const endDate = moment(billingMonth).endOf('month');

        let result = await this.connection.query(`
            SELECT 
                ww.id workspace_id,
                (
                    SELECT
                        COUNT(cc.id) 
                    FROM analytics.conversation_view AS cc
                    WHERE cc.workspace_id = ww.id
                    AND cc.created_by_channel = '${channel}'
                    AND cc.created_at >= ${startDate.valueOf()}
                    AND cc.created_at < ${endDate.valueOf()}
                    AND cc.invalid_number = false
                ) AS conversations_sum,
                CASE WHEN ww.id = '60462f051e8fbe0007be6718' THEN (
                    SELECT
                        sum(agg.count)
                    FROM analytics.activity_aggregate agg
                    INNER JOIN analytics.conversation c ON c.id = agg.conversation_id
                    INNER JOIN billing.workspace w ON w.id = agg.workspace_id
                    WHERE agg.timestamp >= '${startDate.format('YYYY-MM-DD HH:mm:ss')}'::timestamp
                    AND agg.timestamp <= '${endDate.format('YYYY-MM-DD HH:mm:ss')}'::timestamp
                    AND (agg.type IN ('rating_message', 'message', 'member_upload_attachment') OR (agg.type = 'event' AND agg.name = 'start'))
                    AND c.created_by_channel = '${channel}'
                    AND agg.workspace_id = ww.id
                    LIMIT 1
                ) ELSE 0 END AS messages_sum
            FROM billing.workspace AS ww WHERE ww.id = '${workspaceId}'
            LIMIT 1;
        `);

        await this.deleteByWorkspaceIdAndMonthReferenceAndCreatedByChannel(
            workspaceId,
            billingMonth,
            channel,
        )

        await this.create({
            conversationsSum: result[0].conversations_sum,
            messagesSum: result[0].messages_sum,
            createdByChannel: channel,
            monthReference: billingMonth,
            workspaceId,
        });
    }

    @CatchError()
    async create(data: Partial<WorkspaceChannelResume>) {
        return await this.workspaceChannelResumeRepository.save({
            ...data,
            createdAt: moment().valueOf(),
        });
    }

    @CatchError()
    async deleteByWorkspaceIdAndMonthReferenceAndCreatedByChannel(workspaceId: string, monthReference: Date, createdByChannel: string) {
        const month = moment(monthReference).startOf('month').toDate();

        return await this.workspaceChannelResumeRepository.delete({
            workspaceId,
            monthReference: month,
            createdByChannel
        });
    }

    @CatchError()
    async getChannelsResume(workspaceId: string, month: Date): Promise<WorkspaceChannelResume[]> {
        const monthReference = moment(month).startOf('month').toDate();

        return await this.workspaceChannelResumeRepository
            .createQueryBuilder()
            .where('workspace_id = :workspaceId', { workspaceId })
            .andWhere('month_reference = :monthReference', { monthReference })
            .getMany();
    }

    @CatchError()
    async getChannelsSumByWorkspace(workspaceId: string, month: Date): Promise<number> {
        
        const monthReference = moment(month).startOf('month');

        const result = await this.workspaceChannelResumeRepository
            .createQueryBuilder('res')
            .select('SUM(res.conversations_sum)', 'sum')
            .where('res.workspace_id = :workspaceId', { workspaceId })
            .andWhere('res.month_reference = :monthReference', { monthReference: monthReference.format('YYYY-MM-DD HH:mm:ss') })
            .getRawOne();

        return Number(result?.sum || 0)
    }

    @CatchError()
    async getChannelsSumByWorkspaceAndChannel(workspaceId: string, channel: ChannelIdConfig, month: Date): Promise<number> {
        
        const monthReference = moment(month).startOf('month');

        const result = await this.workspaceChannelResumeRepository
            .createQueryBuilder('res')
            .select('SUM(res.conversations_sum)', 'sum')
            .where('res.workspace_id = :workspaceId', { workspaceId })
            .andWhere('res.month_reference = :monthReference', { monthReference: monthReference.format('YYYY-MM-DD HH:mm:ss') })
            .andWhere('res.created_by_channel = :channel', { channel })
            .getRawOne();

        return Number(result?.sum || 0)
    }
}
