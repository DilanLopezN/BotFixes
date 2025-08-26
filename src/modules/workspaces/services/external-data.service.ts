import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HealthIntegrationStatusService } from '../../integrations/services/health/health-integration.status.service';
import { ChannelConfigService } from '../../channel-config/channel-config.service';
import { ConversationTemplateService } from '../../analytics/dashboard-template/services/conversation-template.service';
import { TemplateGroupService } from '../../analytics/dashboard-template/services/template-group.service';
import {
    ChartType,
    Operator,
    TemplateGroupField,
    TemplateMetrics,
} from '../../analytics/dashboard-template/interfaces/conversation-template.interface';
import { AnalyticsInterval } from '../../analytics/conversation-analytics/interfaces/analytics.interface';
import { CreateConversationTemplateData } from '../../analytics/dashboard-template/interfaces/create-conversation-template-data.interface';
import { WorkspaceService } from '../../billing/services/workspace.service';
import { ChannelIdConfig } from 'kissbot-core';
import { ActiveMessageSettingService } from '../../active-message/services/active-message-setting.service';
import { ObjectiveType, TimeType } from '../../active-message/models/active-message-setting.entity';
import { ConversationObjectiveService } from '../../conversation-objective-v2/services/conversation-objective.service';
import { ConversationOutcomeService } from '../../conversation-outcome-v2/services/conversation-outcome.service';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { FixedResponsesWelcome } from '../../interactions/interfaces/response.interface';
import { BreakSettingService } from '../../agent-status/services/break-setting.service';

@Injectable()
export class ExternalDataService {
    private workspaceService: WorkspaceService;
    private channelConfigService: ChannelConfigService;
    private healthIntegrationStatusService: HealthIntegrationStatusService;
    private templateGroupService: TemplateGroupService;
    private conversationTemplateService: ConversationTemplateService;
    private activeMessageSettingService: ActiveMessageSettingService;
    private conversationObjectiveService: ConversationObjectiveService;
    private conversationOutcomeService: ConversationOutcomeService;
    private interactionsService: InteractionsService;
    private breakSettingService: BreakSettingService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        this.healthIntegrationStatusService = this.moduleRef.get<HealthIntegrationStatusService>(
            HealthIntegrationStatusService,
            {
                strict: false,
            },
        );
        this.workspaceService = this.moduleRef.get<WorkspaceService>(WorkspaceService, { strict: false });
        this.templateGroupService = this.moduleRef.get<TemplateGroupService>(TemplateGroupService, { strict: false });
        this.conversationTemplateService = this.moduleRef.get<ConversationTemplateService>(
            ConversationTemplateService,
            { strict: false },
        );
        this.activeMessageSettingService = this.moduleRef.get<ActiveMessageSettingService>(
            ActiveMessageSettingService,
            { strict: false },
        );
        this.conversationObjectiveService = this.moduleRef.get<ConversationObjectiveService>(
            ConversationObjectiveService,
            { strict: false },
        );
        this.conversationOutcomeService = this.moduleRef.get<ConversationOutcomeService>(ConversationOutcomeService, {
            strict: false,
        });
        this.interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
        this.breakSettingService = this.moduleRef.get<BreakSettingService>(BreakSettingService, { strict: false });
    }

    async updateWorkspaceName(workspaceId: string, name: string) {
        return await this.workspaceService.updateWorkspaceName(workspaceId, name);
    }

    async updateWorkspaceCustomerXSettings(
        workspaceId: string,
        customerSettings: { customerXId: string; customerXEmail: string },
    ) {
        return await this.workspaceService.updateWorkspaceCustomerXSettings(workspaceId, customerSettings);
    }

    async getStatus() {
        return await this.healthIntegrationStatusService.getStatus();
    }

    async disableWorkspaceChannelConfigs(workspaceId: string) {
        return await this.channelConfigService.disableWorkspaceChannelConfigs(workspaceId);
    }

    async createDefaultConversationTemplates(workspaceId: string) {
        const existingTemplates = await this.conversationTemplateService.find({ workspaceId });
        if (existingTemplates.length > 0) return;
        const templateGroups = await this.templateGroupService.create([
            {
                name: 'Atendimentos Default',
                globalEditable: true,
                shared: true,
                workspaceId,
                ownerId: null,
            },
            {
                name: 'Agentes Default',
                globalEditable: true,
                shared: true,
                workspaceId,
                ownerId: null,
            },
            {
                name: 'Times Default',
                globalEditable: true,
                shared: true,
                workspaceId,
                ownerId: null,
            },
            {
                name: 'Avaliações Default',
                globalEditable: true,
                shared: true,
                workspaceId,
                ownerId: null,
            },
        ]);
        await this.conversationTemplateService.create([
            {
                workspaceId,
                name: 'Total Atendimentos (Geral)',
                groupId: templateGroups[0]._id,
                groupField: TemplateGroupField.no_field,
                metric: TemplateMetrics.total,
                chartType: ChartType.line,
                conditions: [],
                interval: AnalyticsInterval['1M'],
                position: [0, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'Atendimentos Receptivos (Bot)',
                groupId: templateGroups[0]._id,
                groupField: TemplateGroupField.created_by_channel,
                metric: TemplateMetrics.total,
                chartType: ChartType.line,
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['whatsapp-gupshup'],
                        operator: Operator.in,
                    },
                ],
                interval: AnalyticsInterval['1M'],
                position: [6, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'Agendamentos Feitos Pelo Bot',
                groupId: templateGroups[0]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.tags,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.tags,
                        values: ['@bot.agendamento'],
                        operator: Operator.in,
                    },
                ],
                position: [0, 21, 6, 21],
            },
            {
                workspaceId,
                name: 'Número De Atendimentos Finalizados Pelo Bot',
                groupId: templateGroups[0]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.no_field,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.closed_by,
                        values: ['bot'],
                        operator: Operator.in,
                    },
                ],
                position: [6, 21, 6, 21],
            },
            {
                workspaceId,
                name: 'TMA (Geral)',
                groupId: templateGroups[0]._id,
                metric: TemplateMetrics.time_to_close,
                groupField: TemplateGroupField.no_field,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [],
                position: [0, 42, 6, 21],
            },
            {
                workspaceId,
                name: 'TME (Geral)',
                groupId: templateGroups[0]._id,
                metric: TemplateMetrics.awaiting_working_time_avg,
                groupField: TemplateGroupField.no_field,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [],
                position: [6, 42, 6, 21],
            },
            {
                workspaceId,
                name: 'Total de Atendimentos Iniciados Pela Lista de Transmissão',
                groupId: templateGroups[0]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.created_by_channel,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['campaign'],
                        operator: Operator.in,
                    },
                ],
                position: [0, 63, 6, 21],
            },
            {
                workspaceId,
                name: 'Total de Atendimentos Por Agente',
                groupId: templateGroups[1]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.closed_by,
                chartType: ChartType.bar,
                interval: AnalyticsInterval['1C'],
                conditions: [],
                position: [0, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'Atendimentos Receptivos (Bot) Por Agente',
                groupId: templateGroups[1]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.closed_by,
                chartType: ChartType.bar,
                interval: AnalyticsInterval['1C'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['whatsapp-gupshup'],
                        operator: Operator.in,
                    },
                ],
                position: [6, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'TME 1ª Resposta Receptivos (Bot) Por Agente',
                groupId: templateGroups[1]._id,
                metric: TemplateMetrics.awaiting_working_time_avg,
                groupField: TemplateGroupField.closed_by,
                chartType: ChartType.table,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['whatsapp-gupshup'],
                        operator: Operator.in,
                    },
                ],
                position: [0, 21, 6, 21],
            },
            {
                workspaceId,
                name: 'TMA Receptivos (Bot) Por Agente',
                groupId: templateGroups[1]._id,
                metric: TemplateMetrics.time_to_close,
                groupField: TemplateGroupField.closed_by,
                chartType: ChartType.table,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['whatsapp-gupshup'],
                        operator: Operator.in,
                    },
                ],
                position: [6, 21, 6, 21],
            },
            {
                workspaceId,
                name: 'Número de Atendimentos Iniciados Pelos Agentes',
                groupId: templateGroups[1]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.no_field,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['live-agent'],
                        operator: Operator.in,
                    },
                ],
                position: [0, 42, 6, 21],
            },
            {
                workspaceId,
                name: 'Número De Atendimentos  Finalizados Por Agente',
                groupId: templateGroups[1]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.closed_by,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.closed_by,
                        values: ['bot'],
                        operator: Operator.not_in,
                    },
                ],
                position: [6, 42, 6, 21],
            },
            {
                workspaceId,
                name: 'Total de Atendimentos Por Time',
                groupId: templateGroups[2]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.assigned_to_team_id,
                chartType: ChartType.bar,
                interval: AnalyticsInterval['1M'],
                conditions: [],
                position: [0, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'Atendimentos Receptivos (Bot) Por Time',
                groupId: templateGroups[2]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.assigned_to_team_id,
                chartType: ChartType.bar,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['whatsapp-gupshup'],
                        operator: Operator.in,
                    },
                ],
                position: [6, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'TME 1ª Resposta Receptivos (Bot) Por Time',
                groupId: templateGroups[2]._id,
                metric: TemplateMetrics.awaiting_working_time_avg,
                groupField: TemplateGroupField.assigned_to_team_id,
                chartType: ChartType.table,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['whatsapp-gupshup'],
                        operator: Operator.in,
                    },
                ],
                position: [0, 21, 6, 21],
            },
            {
                workspaceId,
                name: 'TMA Receptivos (Bot) Por Time',
                groupId: templateGroups[2]._id,
                metric: TemplateMetrics.time_to_close,
                groupField: TemplateGroupField.assigned_to_team_id,
                chartType: ChartType.table,
                interval: AnalyticsInterval['1M'],
                conditions: [
                    {
                        field: TemplateGroupField.created_by_channel,
                        values: ['whatsapp-gupshup'],
                        operator: Operator.in,
                    },
                ],
                position: [6, 21, 6, 21],
            },
            {
                workspaceId,
                name: 'Média (Geral)',
                groupId: templateGroups[3]._id,
                metric: TemplateMetrics.rating_avg,
                groupField: TemplateGroupField.no_field,
                chartType: ChartType.line,
                interval: AnalyticsInterval['1M'],
                conditions: [],
                position: [0, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'Avaliações por Notas',
                groupId: templateGroups[3]._id,
                metric: TemplateMetrics.total,
                groupField: TemplateGroupField.rating,
                chartType: ChartType.bar,
                interval: AnalyticsInterval['1M'],
                conditions: [],
                position: [6, 0, 6, 21],
            },
            {
                workspaceId,
                name: 'Média por Agente',
                groupId: templateGroups[3]._id,
                metric: TemplateMetrics.rating_avg,
                groupField: TemplateGroupField.closed_by,
                chartType: ChartType.bar,
                interval: AnalyticsInterval['1M'],
                conditions: [],
                position: [0, 21, 6, 21],
            },
            {
                workspaceId,
                name: 'Média por Time',
                groupId: templateGroups[3]._id,
                metric: TemplateMetrics.rating_avg,
                groupField: TemplateGroupField.assigned_to_team_id,
                chartType: ChartType.bar,
                interval: AnalyticsInterval['1M'],
                conditions: [],
                position: [6, 21, 6, 21],
            },
        ] as CreateConversationTemplateData[]);
    }

    async createDefaultActiveMessages(workspaceId: string) {
        const activeMessages = await this.activeMessageSettingService.listEnabledByWorkspaceId(
            workspaceId,
            ObjectiveType.campaign,
        );
        if (activeMessages.length > 0) return;
        const channelConfigs = await this.channelConfigService.getChannelConfigByWorkspaceAndChannelId(
            workspaceId,
            ChannelIdConfig.gupshup,
        );
        for (const channelConfig of channelConfigs) {
            await this.activeMessageSettingService.create({
                workspaceId,
                channelConfigToken: channelConfig.token,
                enabled: true,
                settingName: `Lista de transmissão ${channelConfig.name}`,
                callbackUrl: '',
                expirationTimeType: TimeType.hours,
                expirationTime: 6,
                suspendConversationUntilType: null,
                suspendConversationUntilTime: null,
                objective: ObjectiveType.campaign,
            });
        }
    }

    async hasConversationObjectiveAndOutcome(workspaceId: string): Promise<Boolean> {
        const { metadata: objectivesMetadata } = await this.conversationObjectiveService.getConversationObjectives(
            workspaceId,
        );
        const { metadata: outcomesMetadata } = await this.conversationOutcomeService.getConversationOutcomes(
            workspaceId,
        );
        if (objectivesMetadata.count === 0 || outcomesMetadata.count === 0) {
            return false;
        }
        return true;
    }

    async hasActiveBreakSettingByWorkspace(workspaceId: string): Promise<Boolean> {
        const { data } = await this.breakSettingService.findAll({ workspaceId: workspaceId, enabled: true });
        if (data?.length === 0) {
            return false;
        }
        return true;
    }

    async updateInteractionWelcome(workspaceId: string) {
        return await this.interactionsService.updateWelcomeInteractionWithFixedResponse(
            workspaceId,
            FixedResponsesWelcome.REASSIGN_CONVERSATION,
        );
    }
}
