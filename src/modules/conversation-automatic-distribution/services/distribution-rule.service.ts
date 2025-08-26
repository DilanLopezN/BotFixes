import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDistributionRule } from '../interfaces/distribution-rule.interface';
import { DistributionRule } from '../models/distribution-rule.entity';
import { CreateDistributionRuleDto, UpdateDistributionRuleDto } from '../dto/distribution-rule.dto';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from '../ormconfig';

@Injectable()
export class DistributionRuleService {
    constructor(
        @InjectRepository(DistributionRule, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION)
        private readonly distributionRuleRepository: Repository<DistributionRule>,
    ) {}

    async createDistributionRule(
        workspaceId: string,
        createDto: CreateDistributionRuleDto,
    ): Promise<IDistributionRule> {
        const distributionRule = this.distributionRuleRepository.create({
            workspaceId,
            active: createDto.active,
            maxConversationsPerAgent: createDto.maxConversationsPerAgent,
            checkUserWasOnConversation: createDto.checkUserWasOnConversation ?? false,
            checkTeamWorkingTimeConversation: createDto.checkTeamWorkingTimeConversation ?? false,
        });

        try {
            return await this.distributionRuleRepository.save(distributionRule);
        } catch (error) {
            if (error.code === '23505') {
                // PostgreSQL unique constraint violation
                throw new BadRequestException('Distribution rule already exists for this workspace');
            }
            throw error;
        }
    }

    async getDistributionRuleByWorkspaceAndId(workspaceId: string, id: string): Promise<IDistributionRule> {
        return await this.distributionRuleRepository.findOne({
            where: { workspaceId, id },
        });
    }

    async getDistributionRuleByWorkspace(workspaceId: string): Promise<IDistributionRule> {
        return await this.distributionRuleRepository.findOne({
            where: { workspaceId },
        });
    }

    async updateDistributionRule(
        workspaceId: string,
        id: string,
        updateDto: UpdateDistributionRuleDto,
    ): Promise<IDistributionRule> {
        const existingRule = await this.distributionRuleRepository.findOne({
            where: { workspaceId, id },
        });

        if (!existingRule) {
            throw new NotFoundException('Distribution rule not found for this workspace');
        }

        // Update the entity with new values
        Object.assign(existingRule, updateDto);

        return await this.distributionRuleRepository.save(existingRule);
    }

    async deleteDistributionRule(workspaceId: string, id: string): Promise<{ deleted: boolean }> {
        const existingRule = await this.distributionRuleRepository.findOne({
            where: { workspaceId, id },
        });

        if (!existingRule) {
            throw new NotFoundException('Distribution rule not found for this workspace');
        }

        await this.distributionRuleRepository.remove(existingRule);

        return { deleted: true };
    }

    async getAllDistributionRules(skip = 0, limit = 10): Promise<{ data: IDistributionRule[]; total: number }> {
        const [data, total] = await this.distributionRuleRepository.findAndCount({
            skip,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        return { data, total };
    }

    async getActiveDistributionRules(): Promise<IDistributionRule[]> {
        return await this.distributionRuleRepository.find({
            where: { active: true },
        });
    }
}
