import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '../interfaces/tool.interface';
import { IAgent } from '../../agent/interfaces/agent.interface';
import { AgentSkillsService } from '../../agent-skills/agent-skills.service';
import { IntentDetectionService } from '../../intent-detection/services/intent-detection.service';
import { Skill } from '../../agent-skills/skills/core/interfaces';
import { IIntentDetection } from '../../intent-detection/interfaces/intent-detection.interface';
import { ActionType } from '../../intent-detection/enums/action-type.enum';

@Injectable()
export class ToolRegistry {
    private readonly logger = new Logger(ToolRegistry.name);

    constructor(
        private readonly agentSkillsService: AgentSkillsService,
        private readonly intentDetectionService: IntentDetectionService,
    ) {}

    async getToolsForAgent(agent: IAgent): Promise<Tool[]> {
        const tools: Tool[] = [];

        try {
            const skills = await this.agentSkillsService.getSkillsForAgent(agent);
            const actionTools = skills.map((skill) => this.skillToTool(skill));
            tools.push(...actionTools);
        } catch (error) {
            this.logger.error(`[ToolRegistry] Erro ao carregar action tools:`, error);
        }

        try {
            const intents = await this.intentDetectionService.list({
                workspaceId: agent.workspaceId,
                agentId: agent.id,
            });
            const intentTools = intents.map((intent) => this.intentToTool(intent));
            tools.push(...intentTools);
        } catch (error) {
            this.logger.error(`[ToolRegistry] Erro ao carregar intent tools:`, error);
        }

        return tools;
    }

    private skillToTool(skill: Skill): Tool {
        return {
            id: `tool_${skill.name}`,
            name: skill.name,
            type: 'action',
            description: skill.description,
            examples: skill.examples,
            execute: skill.execute.bind(skill),
            generatePrompt: skill.generatePrompt?.bind(skill),
        };
    }

    private intentToTool(intent: IIntentDetection): Tool {
        const hasTreeImmediately = intent.actions?.some((action) => action.actionType === ActionType.TREE_IMMEDIATELY);

        return {
            id: intent.id,
            name: intent.name,
            type: 'intent',
            description: intent.description,
            examples: {
                positive: intent.examples || [],
                negative: [],
            },
            execute: async (_agent: IAgent, context?: Record<string, any>) => {
                if (hasTreeImmediately) {
                    return {
                        message: null,
                        nextStep: {
                            intent: intent.id,
                            confidence: 1.0,
                            reason: `Intenção detectada com TREE_IMMEDIATELY: ${intent.name}`,
                            entities: context?.metadata || {},
                            treeImmediately: true,
                        },
                        isComplete: true,
                    };
                }

                return {
                    nextStep: {
                        intent: intent.id,
                        confidence: 1.0,
                        reason: `Intenção detectada: ${intent.name}`,
                        entities: context?.metadata || {},
                    },
                    isComplete: false,
                };
            },
        };
    }
}
