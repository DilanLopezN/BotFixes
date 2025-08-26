import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from '../ormconfig';
import { ConversationAutomaticDistribution } from '../models/conversation-automatic-distribution.entity';
import { ConversationAutomaticDistributionLog } from '../models/conversation-automatic-distribution-log.entity';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';
import { ActivityType, IdentityType } from 'kissbot-core';
import { systemMemberId } from '../../../common/utils/utils';
import { ExternalDataService } from './external-data.service';
import { DistributionRuleService } from './distribution-rule.service';
import { AssignmentResult } from '../interfaces/assignment-resut.interface';
import { Agent } from '../interfaces/assignment-resut.interface';
import { AgentDistributionContext, AgentWorkload } from '../interfaces/agent-workload.interface';
import * as Sentry from '@sentry/node';
import { ConversationAutomaticDistributionService } from './conversation-automatic-distribution.service';
import { ConversationAutomaticDistributionLogService } from './conversation-automatic-distribution-log.service';
import { DistributionType } from '../enums/distribution-type.enum';

@Injectable()
export class DistributorCronService {
    private readonly logger = new Logger(DistributorCronService.name);
    private readonly BATCH_SIZE = parseInt(process.env.CONVERSATION_AUTOMATIC_DISTRIBUTION_BATCH_SIZE) || 50;

    constructor(
        private readonly conversationAutomaticDistributionLogService: ConversationAutomaticDistributionLogService,
        private readonly externalDataService: ExternalDataService,
        private readonly distributionRuleService: DistributionRuleService,
        private readonly conversationAutomaticDistributionService: ConversationAutomaticDistributionService,
    ) {}

    @Cron(CronExpression.EVERY_30_SECONDS)
    async processAutomaticDistribution(): Promise<void> {
        if (!shouldRunCron()) return;

        try {
            const workspaces = await this.getWorkspacesWithPendingConversations();

            if (workspaces.length === 0) {
                return;
            }

            this.logger.log(`Starting automatic distribution for ${workspaces.length} workspaces`);

            for (const workspaceId of workspaces) {
                await this.processWorkspaceConversations(workspaceId);
            }
        } catch (error) {
            this.logger.error('Error in automatic distribution process:', error);
        }
    }

    private async getWorkspacesWithPendingConversations(): Promise<string[]> {
        const activeRules = await this.distributionRuleService.getActiveDistributionRules();
        const activeWorkspaceIds = activeRules.map((rule) => rule.workspaceId);
        return activeWorkspaceIds;
    }

    private async processWorkspaceConversations(workspaceId: string): Promise<void> {
        try {
            const conversations = await this.conversationAutomaticDistributionService.getConversationsByWorkspaceId(
                workspaceId,
            );

            for (let i = 0; i < conversations.length; i += this.BATCH_SIZE) {
                const batch = conversations.slice(i, i + this.BATCH_SIZE);
                for (const conversation of batch) {
                    await this.processConversation(conversation);
                }
            }
        } catch (error) {
            this.logger.error(`Error processing workspace ${workspaceId}:`, error);
        }
    }

    private async processConversation(conversation: ConversationAutomaticDistribution): Promise<void> {
        const assignmentResult = await this.validateRulesAndGetAgent(conversation);

        if (!assignmentResult.agent) {
            this.logger.warn(
                `[ASSIGNMENT FAILED] No agent found for conversation: ${conversation.conversationId} in workspace ${conversation.workspaceId} for team ${conversation.teamId}`,
            );
            return;
        }

        await this.createAutomaticDistributionActivity(conversation, assignmentResult);

        await this.transferConversationToAgent(conversation, assignmentResult.agent);

        await this.logAssignment(conversation, assignmentResult);
    }

    private async validateRulesAndGetAgent(conversation: ConversationAutomaticDistribution): Promise<AssignmentResult> {
        try {
            const context: AgentDistributionContext = {
                workspaceId: conversation.workspaceId,
                teamId: conversation.teamId,
                conversationId: conversation.conversationId,
                lastAssignedAgentId: await this.getLastAssignedAgent(conversation.teamId),
            };

            return await this.getNextAgent(context);
        } catch (error) {
            this.logger.error(`Error in validateRulesAndGetAgent: ${error.message}`, error.stack);
            return {
                agent: null,
                executedRules: [],
            };
        }
    }

    private async getLastAssignedAgent(teamId: string): Promise<string | null> {
        try {
            const lastAssignment = await this.conversationAutomaticDistributionLogService.getLastAssignmentByTeamId(
                teamId,
            );

            return lastAssignment?.assignedAgentId || null;
        } catch (error) {
            this.logger.error(`Error getting last assigned agent: ${error.message}`);
            return null;
        }
    }

    private async logAssignment(
        conversation: ConversationAutomaticDistribution,
        assignmentResult: AssignmentResult,
    ): Promise<void> {
        const logEntry = new ConversationAutomaticDistributionLog();
        logEntry.conversationId = conversation.conversationId;
        logEntry.workspaceId = conversation.workspaceId;
        logEntry.teamId = conversation.teamId;
        logEntry.assignedAgentId = assignmentResult.agent.id;
        logEntry.assignedAgentName = assignmentResult.agent.name;
        logEntry.executedRules = assignmentResult.executedRules;
        logEntry.priority = conversation.priority;
        logEntry.order = conversation.order;
        logEntry.assignmentData = {
            agentDetails: assignmentResult.agent,
            conversationState: conversation.state,
            timestamp: new Date(),
        };

        await this.conversationAutomaticDistributionLogService.save(logEntry);
    }

    private async createAutomaticDistributionActivity(
        conversation: ConversationAutomaticDistribution,
        assignmentResult: AssignmentResult,
    ): Promise<void> {
        try {
            const fullConversation = await this.externalDataService.getConversationById(conversation.conversationId);

            let sysMember = fullConversation.members.find((member) => member.type === IdentityType.system);
            if (!sysMember) {
                sysMember = {
                    channelId: 'system',
                    id: systemMemberId,
                    name: 'system',
                    type: IdentityType.system,
                };
                await this.externalDataService.addMember(fullConversation._id, sysMember);
            }

            const activity: any = {
                type: ActivityType.automatic_distribution,
                from: sysMember,
                conversationId: conversation.conversationId,
                data: {
                    memberId: assignmentResult?.agent?.id,
                    memberName: assignmentResult?.agent?.name,
                },
            };

            await this.externalDataService.dispatchMessageActivity(fullConversation, activity);
        } catch (error) {
            this.logger.error(
                `Error creating automatic distribution activity for conversation ${conversation.conversationId}:`,
                error,
            );
        }
    }

    private async transferConversationToAgent(
        conversation: ConversationAutomaticDistribution,
        agent: Agent,
    ): Promise<void> {
        try {
            await this.externalDataService.transferConversationToAgent(conversation.conversationId, agent.id);

            this.logger.log(
                `[TRANSFER COMPLETE] Transfered conversation ${conversation.conversationId} to agent ${agent.id} (${agent.name})`,
            );
        } catch (error) {
            this.logger.error(
                `[TRANSFER ERROR] Failed to transfer conversation ${conversation.conversationId} to agent ${agent.id}: ${error.message}`,
            );
            throw error;
        }
    }

    private async getNextAgent(context: AgentDistributionContext): Promise<AssignmentResult> {
        const executedRules: DistributionType[] = [];

        try {
            const distributionRule = await this.distributionRuleService.getDistributionRuleByWorkspace(
                context.workspaceId,
            );

            if (!distributionRule) {
                this.logger.warn(
                    `[DISTRIBUTION RULE] No distribution rule found for workspace: ${context.workspaceId}`,
                );
                return { agent: null, executedRules: [] };
            }

            if (!distributionRule.active) {
                this.logger.warn(`Distribution rule is not active for workspace: ${context.workspaceId}`);
                return { agent: null, executedRules: [] };
            }

            let availableAgents = await this.getAvailableAgents(context.teamId, context.workspaceId);

            if (availableAgents.length === 0) {
                this.logger.warn(`[AVAILABLE AGENTS] No available agents found for team: ${context.teamId}`);
                return { agent: null, executedRules: [] };
            }

            if (distributionRule.checkUserWasOnConversation) {
                const conversation = await this.externalDataService.getConversationById(context.conversationId);
                const members = conversation.members || [];
                const disabledUsers = members.filter((member) => member.disabled).map((member) => member.id);
                const enabledUsers = availableAgents.filter((agent) => !disabledUsers.includes(agent.id));

                if (enabledUsers.length === 0) {
                    executedRules.push(DistributionType.GET_OUT_OF_CONVERSATION);
                    return { agent: null, executedRules };
                }

                availableAgents = enabledUsers;
            }

            if (distributionRule.checkTeamWorkingTimeConversation) {
                const team = await this.externalDataService.getTeamById(context.teamId);
                const teamJson = team?.toJSON ? team.toJSON() : team;

                const attendancePeriods = teamJson?.attendancePeriods;

                const currentTime = new Date();
                const isWorkingTime = this.isWorkingTime(currentTime, attendancePeriods);

                if (!isWorkingTime) {
                    this.logger.warn(`[TEAM NOT IN WORKING TIME] Team ${context.teamId} is not in working time`);
                    executedRules.push(DistributionType.NOT_IN_WORKING_TIME);
                    return { agent: null, executedRules };
                }
            }

            const agentsWithinLimit = this.filterAgentsByConversationLimit(
                availableAgents,
                distributionRule.maxConversationsPerAgent,
            );

            if (agentsWithinLimit.length === 0) {
                this.logger.warn(
                    `[CONVERSATION LIMIT] No agents within conversation limit (${distributionRule.maxConversationsPerAgent}) for team: ${context.teamId}`,
                );
                return { agent: null, executedRules: [] };
            }

            executedRules.push(DistributionType.CONVERSATION_LIMIT);

            const selectedAgent = this.selectAgentByLoadBalancer(agentsWithinLimit, context.lastAssignedAgentId);

            if (!selectedAgent) {
                this.logger.warn(`[LOAD BALANCER] Failed to select agent for team: ${context.teamId}`);
                return { agent: null, executedRules };
            }

            executedRules.push(DistributionType.LOAD_BALANCER);

            const agent: Agent = {
                id: selectedAgent.id,
                name: selectedAgent.name,
                email: selectedAgent.email,
                teamId: selectedAgent.teamId,
            };

            return {
                agent,
                executedRules,
            };
        } catch (error) {
            this.logger.error(`[DISTRIBUTION ERROR] Error in agent distribution: ${error.message}`, error.stack);
            return { agent: null, executedRules };
        }
    }

    private isWorkingTime(currentTime: Date, attendancePeriods: any): boolean {
        if (!attendancePeriods || Object.keys(attendancePeriods).length === 0) {
            return false;
        }

        const currentTime_GMT3 = new Date(currentTime.getTime() - 3 * 60 * 60 * 1000);

        const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const currentDay = daysOfWeek[currentTime_GMT3.getDay()];

        const currentMilliseconds =
            currentTime_GMT3.getHours() * 3600000 +
            currentTime_GMT3.getMinutes() * 60000 +
            currentTime_GMT3.getSeconds() * 1000;

        const dayPeriods = attendancePeriods[currentDay];

        if (!dayPeriods || !Array.isArray(dayPeriods) || dayPeriods.length === 0) {
            return false;
        }

        const isWithinWorkingHours = dayPeriods.some((period, index) => {
            if (!period || typeof period.start !== 'number' || typeof period.end !== 'number') {
                this.logger.debug(`[WORKING TIME] Invalid period ${index}:`, period);
                return false;
            }

            const isInPeriod = currentMilliseconds >= period.start && currentMilliseconds < period.end;

            return isInPeriod;
        });

        return isWithinWorkingHours;
    }

    private async getAvailableAgents(teamId: string, workspaceId: string): Promise<AgentWorkload[]> {
        try {
            const teamDoc = await this.externalDataService.getTeamById(teamId);
            const team = teamDoc?.toJSON ? teamDoc.toJSON() : teamDoc;

            if (!team || !team.roleUsers || team.roleUsers.length === 0) {
                this.logger.warn(`Team not found or has no members: ${teamId}`);
                return [];
            }

            const agentMembers = team.roleUsers.filter(
                (roleUser) => !roleUser?.permission?.canViewHistoricConversation,
            );

            if (agentMembers.length === 0) {
                this.logger.warn(`No agent members found in team: ${teamId}`);
                return [];
            }

            const userIds = agentMembers.map((roleUser) => roleUser.userId.toString());
            const users = await this.externalDataService.getUsersByQuery({ _id: { $in: userIds } });

            const validUserIds = users.map((user) => user._id.toString());
            const [conversationCounts, lastAssignments] = await Promise.all([
                this.externalDataService.getUserConversationCounts(validUserIds, workspaceId),
                this.getBatchLastAssignmentDates(validUserIds),
            ]);

            const agentWorkloads: AgentWorkload[] = users.map((user) => {
                const userId = user._id.toString();
                return {
                    id: userId,
                    name: user.name,
                    email: user.email,
                    teamId: teamId,
                    currentConversations: conversationCounts.get(userId) || 0,
                    lastAssignedAt: lastAssignments.get(userId),
                };
            });

            return agentWorkloads;
        } catch (error) {
            this.logger.error(`Error fetching available agents for team ${teamId}: ${error.message}`);
            return [];
        }
    }

    private async getBatchLastAssignmentDates(agentIds: string[]): Promise<Map<string, Date | undefined>> {
        try {
            const assignments = await this.conversationAutomaticDistributionLogService.getAssignmentsByAgentIdList(
                agentIds,
            );

            const assignmentsMap = new Map<string, Date | undefined>();

            agentIds.forEach((id) => assignmentsMap.set(id, undefined));

            assignments.forEach((assignment) => {
                if (assignment.log_assignedAgentId && assignment.lastAssignedAt) {
                    assignmentsMap.set(assignment.log_assignedAgentId, new Date(assignment.lastAssignedAt));
                }
            });

            return assignmentsMap;
        } catch (error) {
            this.logger.error(`Error getting batch last assignment dates: ${error.message}`);
            const assignmentsMap = new Map<string, Date | undefined>();
            agentIds.forEach((id) => assignmentsMap.set(id, undefined));
            return assignmentsMap;
        }
    }

    private selectAgentByLoadBalancer(agents: AgentWorkload[], lastAssignedAgentId?: string): AgentWorkload | null {
        if (agents.length === 0) {
            this.logger.warn(`[LOAD BALANCER] No agents to select from`);
            return null;
        }

        if (agents.length === 1) {
            return agents[0];
        }

        const sortedAgents = [...agents].sort((a, b) => {
            if (a.currentConversations !== b.currentConversations) {
                return a.currentConversations - b.currentConversations;
            }

            if (a.lastAssignedAt && b.lastAssignedAt) {
                return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
            }

            if (!a.lastAssignedAt) return -1;
            if (!b.lastAssignedAt) return 1;

            return 0;
        });

        if (lastAssignedAgentId) {
            const otherAgents = sortedAgents.filter((agent) => agent.id !== lastAssignedAgentId);

            if (otherAgents.length > 0) {
                const selectedAgent = otherAgents[0];
                return selectedAgent;
            } else {
                return sortedAgents[0];
            }
        }

        const selectedAgent = sortedAgents[0];
        return selectedAgent;
    }

    private filterAgentsByConversationLimit(agents: AgentWorkload[], maxConversations: number): AgentWorkload[] {
        const filtered = agents.filter((agent) => agent.currentConversations < maxConversations);

        return filtered;
    }
}
