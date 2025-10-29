import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AGENT_STATUS_CONNECTION } from '../ormconfig';
import { GeneralBreakSetting } from '../models/general-break-setting.entity';
import {
    CreateGeneralBreakSettingData,
    UpdateGeneralBreakSettingData,
} from '../interfaces/general-break-setting.interface';
import { Exceptions } from '../../auth/exceptions';
import { CacheService } from '../../_core/cache/cache.service';
import { ZSetEventManagerService, EventType } from './zset-event-manager.service';

@Injectable()
export class GeneralBreakSettingService {
    constructor(
        @InjectRepository(GeneralBreakSetting, AGENT_STATUS_CONNECTION)
        private readonly generalBreakSettingRepository: Repository<GeneralBreakSetting>,
        public cacheService: CacheService,
        private readonly zsetEventManager: ZSetEventManagerService,
    ) {}

    private async getFromCache(workspaceId: string): Promise<GeneralBreakSetting | null> {
        const cacheKey = this.getCacheKey(workspaceId);

        const cachedGeneralBreakSetting = await this.cacheService.get(cacheKey);
        if (cachedGeneralBreakSetting) return JSON.parse(cachedGeneralBreakSetting) as GeneralBreakSetting;

        return null;
    }

    private async saveToCache(generalBreakSetting: GeneralBreakSetting, workspaceId: string): Promise<void> {
        const cacheKey = this.getCacheKey(workspaceId);
        await this.cacheService.set(JSON.stringify(generalBreakSetting), cacheKey, 60 * 60 * 2); //expiração de 2 horas
    }

    private getCacheKey(workspaceId: string): string {
        return `GENERAL_BREAK_SETTING:${workspaceId}`;
    }

    private async deleteFromCache(workspaceId: string): Promise<void> {
        const cacheKey = this.getCacheKey(workspaceId);
        await this.cacheService.remove(cacheKey);
    }

    async create(data: CreateGeneralBreakSettingData): Promise<GeneralBreakSetting> {
        const existing = await this.findByWorkspaceId(data.workspaceId);

        if (existing) {
            throw Exceptions.ALREADY_EXIST_GENERAL_BREAK_SETTING;
        }

        const generalBreakSetting = this.generalBreakSettingRepository.create({
            workspaceId: data.workspaceId,
            enabled: data.enabled !== undefined ? data.enabled : true,
            notificationIntervalSeconds: data.notificationIntervalSeconds || 10,
            breakStartDelaySeconds: data.breakStartDelaySeconds || 10,
            maxInactiveDurationSeconds: data.maxInactiveDurationSeconds || 120,
            excludedUserIds: data.excludedUserIds || [],
        });

        return this.generalBreakSettingRepository.save(generalBreakSetting);
    }

    async update(workspaceId: string, data: UpdateGeneralBreakSettingData): Promise<GeneralBreakSetting> {
        const setting = await this.findByWorkspaceId(workspaceId);

        if (!setting) {
            throw Exceptions.NOT_FOUND;
        }

        this.deleteFromCache(workspaceId);

        if (data.enabled !== undefined) {
            setting.enabled = data.enabled;
        }

        if (data.notificationIntervalSeconds !== undefined) {
            setting.notificationIntervalSeconds = data.notificationIntervalSeconds;
        }

        if (data.breakStartDelaySeconds !== undefined) {
            setting.breakStartDelaySeconds = data.breakStartDelaySeconds;
        }

        if (data.maxInactiveDurationSeconds !== undefined) {
            setting.maxInactiveDurationSeconds = data.maxInactiveDurationSeconds;
        }

        if (data.excludedUserIds !== undefined) {
            // Identifica novos usuários adicionados à lista de exclusão
            const previousExcludedUserIds = setting.excludedUserIds || [];
            const newExcludedUserIds = data.excludedUserIds.filter(
                (userId) => !previousExcludedUserIds.includes(userId),
            );

            // Remove eventos do Redis para os novos usuários excluídos
            for (const userId of newExcludedUserIds) {
                await this.zsetEventManager.removeEvent(EventType.LAST_ACCESS, workspaceId, userId);
                await this.zsetEventManager.removeEvent(EventType.BREAK_EXPIRATION, workspaceId, userId);
            }

            setting.excludedUserIds = data.excludedUserIds;
        }

        return this.generalBreakSettingRepository.save(setting);
    }

    async findByWorkspaceId(workspaceId: string): Promise<GeneralBreakSetting> {
        return await this.generalBreakSettingRepository.findOne({ where: { workspaceId } });
    }

    async getByWorkspaceId(workspaceId: string): Promise<GeneralBreakSetting> {
        let generalBreakSetting = await this.getFromCache(workspaceId);

        if (generalBreakSetting) {
            return generalBreakSetting;
        }

        generalBreakSetting = await this.generalBreakSettingRepository.findOne({ where: { workspaceId } });

        if (generalBreakSetting) {
            this.saveToCache(generalBreakSetting, workspaceId);
        }

        return generalBreakSetting;
    }
}
