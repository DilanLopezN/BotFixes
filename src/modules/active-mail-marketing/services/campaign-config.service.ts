import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignConfig } from '../models/campaign-config.entity';
import { CreateCampaignConfigDto } from '../dto/create-campaign-config.dto';
import { UpdateCampaignConfigDto } from '../dto/update-campaign-config.dto';
import { ACTIVE_MAIL_MARKETING_CONNECTION } from '../ormconfig';

@Injectable()
export class CampaignConfigService {
    constructor(
        @InjectRepository(CampaignConfig, ACTIVE_MAIL_MARKETING_CONNECTION)
        private readonly campaignConfigRepository: Repository<CampaignConfig>,
    ) {}

    async create(data: CreateCampaignConfigDto): Promise<CampaignConfig> {
        if (new Date(data.startAt) >= new Date(data.endAt)) {
            throw new BadRequestException('startAt must be before endAt');
        }

        const existingConfig = await this.campaignConfigRepository.findOne({
            where: { name: data.name, workspaceId: data.workspaceId },
        });

        if (existingConfig) {
            throw new ConflictException('A configuration with this name already exists in this workspace');
        }

        const campaignConfig = this.campaignConfigRepository.create({
            ...data,
            startAt: new Date(data.startAt),
            endAt: new Date(data.endAt),
            linkTtlMinutes: data.linkTtlMinutes || 60,
            isActive: data.isActive !== undefined ? data.isActive : true,
        });

        return await this.campaignConfigRepository.save(campaignConfig);
    }

    async listByWorkspaceId(workspaceId: string): Promise<CampaignConfig[]> {
        return await this.campaignConfigRepository.find({
            where: { workspaceId },
            order: { createdAt: 'DESC' },
        });
    }

    async listActiveByWorkspaceId(workspaceId: string): Promise<CampaignConfig[]> {
        return await this.campaignConfigRepository.find({
            where: { workspaceId, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }

    async getById(id: string, workspaceId: string): Promise<CampaignConfig> {
        const config = await this.campaignConfigRepository.findOne({
            where: { id, workspaceId },
        });

        if (!config) {
            throw new NotFoundException('Campaign configuration not found');
        }

        return config;
    }

    async findById(id: string): Promise<CampaignConfig> {
        const config = await this.campaignConfigRepository.findOne({
            where: { id },
        });

        if (!config) {
            throw new NotFoundException('Campaign configuration not found');
        }

        return config;
    }

    async getByIdAndWorkspace(id: string, workspaceId: string): Promise<CampaignConfig> {
        const config = await this.campaignConfigRepository.findOne({
            where: { id, workspaceId },
        });

        if (!config) {
            throw new NotFoundException('Campaign configuration not found');
        }

        return config;
    }

    async update(data: UpdateCampaignConfigDto, id: string, workspaceId: string): Promise<CampaignConfig> {
        const config = await this.getById(id, workspaceId);

        if (data.startAt && data.endAt && new Date(data.startAt) >= new Date(data.endAt)) {
            throw new BadRequestException('startAt must be before endAt');
        }

        if (data.name && data.name !== config.name) {
            const existingConfig = await this.campaignConfigRepository.findOne({
                where: { name: data.name, workspaceId: config.workspaceId },
            });

            if (existingConfig) {
                throw new ConflictException('A configuration with this name already exists in this workspace');
            }
        }

        const updateData: Partial<CampaignConfig> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
        if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
        if (data.apiToken !== undefined) updateData.apiToken = data.apiToken;
        if (data.linkMessage !== undefined) updateData.linkMessage = data.linkMessage;
        if (data.linkTtlMinutes !== undefined) updateData.linkTtlMinutes = data.linkTtlMinutes;
        if (data.emailTemplateId !== undefined) updateData.emailTemplateId = data.emailTemplateId;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        Object.assign(config, updateData);

        return await this.campaignConfigRepository.save(config);
    }

    async delete(id: string, workspaceId: string): Promise<void> {
        const config = await this.getById(id, workspaceId);
        await this.campaignConfigRepository.remove(config);
    }

    async isCampaignActive(id: string, workspaceId: string): Promise<boolean> {
        const config = await this.getById(id, workspaceId);

        if (!config.isActive) {
            return false;
        }

        const now = new Date();
        const startAt = new Date(config.startAt);
        const endAt = new Date(config.endAt);

        return now >= startAt && now <= endAt;
    }

    async findByApiToken(apiToken: string): Promise<CampaignConfig | null> {
        return await this.campaignConfigRepository.findOne({
            where: { apiToken },
        });
    }

    async findByEmailTemplateId(emailTemplateId: string, workspaceId: string): Promise<CampaignConfig[]> {
        return await this.campaignConfigRepository.find({
            where: { emailTemplateId, workspaceId },
        });
    }
}
