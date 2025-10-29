import { Injectable, Logger } from '@nestjs/common';
import { Skill, SkillExamples } from '../../core/interfaces';
import { SkillEnum } from '..';
import { IAgent } from '../../../../agent/interfaces/agent.interface';
import { ListDoctorsApi } from './list-doctors.api';
import { ListDoctorsHelpers } from './list-doctors.helpers';
import { RagSearchService } from '../../../services/rag-search.service';
import { ListDoctorsResult } from './list-doctors.interfaces';

@Injectable()
export class ListDoctorsSkill implements Skill {
    name = SkillEnum.listDoctors;
    description =
        'Lista os médicos disponíveis para consulta no hospital. Use quando o paciente quiser saber quais profissionais estão disponíveis, perguntar médicos específicas, ou buscar por um médico pelo nome.';
    examples: SkillExamples = {
        positive: [
            'Quais médicos trabalham aí?',
            'Preciso saber quais profissionais atendem',
            'Qual médico atende pediatria?',
            'Me mostre os médicos disponíveis',
            'Gostaria de conhecer os profissionais',
            'Tem doutor Silva trabalhando aí?',
        ],
        negative: [],
    };
    private readonly logger = new Logger(ListDoctorsSkill.name);

    constructor(private readonly listDoctorsApi: ListDoctorsApi, private readonly ragSearchService: RagSearchService) {}

    validator(agent: IAgent) {
        if (!agent.integrationId) {
            throw new Error('Required integration to execute Skill');
        }
    }

    async execute(
        agent: IAgent,
        args?: { message?: string; contextId?: string; referenceId?: string; conversationHistory?: any[] },
    ): Promise<ListDoctorsResult> {
        try {
            this.validator(agent);

            const doctors = await this.listDoctorsApi.fetchDoctors(agent);

            const ragContext: string[] = await this.ragSearchService.searchWithHistoryContext(agent, {
                userMessage: args.message,
                conversationHistory: args.conversationHistory,
                maxResults: 10,
                similarityThreshold: 0.35,
            });

            return {
                doctors: ListDoctorsHelpers.transformDoctorsForResponse(doctors),
                ragContext,
            };
        } catch (error) {
            this.logger.error('Error in execute method', error);
            return { doctors: [], ragContext: [] };
        }
    }

    generatePrompt(data: ListDoctorsResult, userMessage: string, conversationHistory?: any[]): string {
        return ListDoctorsHelpers.generatePrompt(data, userMessage, conversationHistory);
    }
}
