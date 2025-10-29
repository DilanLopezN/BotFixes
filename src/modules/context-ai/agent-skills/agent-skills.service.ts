import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentSkills, IAgentSkills } from './entities/agent-skills.entity';
import { CONTEXT_AI } from '../ormconfig';
import { CreateAgentSkillDto, UpdateAgentSkillDto } from './dto/agent-skills.dto';
import { Skill } from './skills/core/interfaces';
import { IAgent } from '../agent/interfaces/agent.interface';
import { SkillEnum } from './skills/implementations';
import { SkillRegistry } from './skills/registry/skill-registry.service';

@Injectable()
export class AgentSkillsService {
    constructor(
        @InjectRepository(AgentSkills, CONTEXT_AI)
        private readonly agentSkillsRepository: Repository<AgentSkills>,
        private readonly skillRegistry: SkillRegistry,
    ) {}

    public async create(data: CreateAgentSkillDto & { workspaceId: string }): Promise<IAgentSkills> {
        const agentSkill = this.agentSkillsRepository.create(data);
        return this.agentSkillsRepository.save(agentSkill);
    }

    public async update(skillId: string, data: Partial<UpdateAgentSkillDto>): Promise<IAgentSkills> {
        const agentSkill = await this.agentSkillsRepository.findOne({ where: { id: skillId } });

        if (!agentSkill) {
            throw new NotFoundException(`Agent skill with ID ${skillId} not found`);
        }

        Object.assign(agentSkill, data);
        return this.agentSkillsRepository.save(agentSkill);
    }

    public async delete(skillId: string): Promise<{ ok: boolean }> {
        const result = await this.agentSkillsRepository.delete(skillId);

        if (!result.affected) {
            throw new NotFoundException(`Agent skill with ID ${skillId} not found`);
        }

        return { ok: !!result.affected };
    }

    public async findOne(filter: { id?: string; _id?: string }): Promise<IAgentSkills | null> {
        const id = filter.id || filter._id;
        return this.agentSkillsRepository.findOne({ where: { id } });
    }

    public async getAgentSkills(workspaceId: string, agentId: string): Promise<IAgentSkills[]> {
        const whereClause: any = { workspaceId, agentId };

        return this.agentSkillsRepository.find({
            where: whereClause,
            order: {
                name: 'ASC',
            },
        });
    }

    public async findByWorkspaceAndAgent(workspaceId: string, agentId: string): Promise<IAgentSkills[]> {
        return this.agentSkillsRepository.find({
            where: { workspaceId, agentId, isActive: true },
            order: {
                name: 'ASC',
            },
        });
    }

    public async getSkillsForAgent(agent: IAgent): Promise<Skill[]> {
        const skillConfigs = await this.findByWorkspaceAndAgent(agent.workspaceId, agent.id);
        const activeSkillNames = skillConfigs.map((config) => config.name as SkillEnum);

        return this.skillRegistry.getImplementations(activeSkillNames);
    }
}
