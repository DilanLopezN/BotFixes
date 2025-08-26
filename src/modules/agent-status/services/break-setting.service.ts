import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AGENT_STATUS_CONNECTION } from '../ormconfig';
import { BreakSetting } from '../models/break-setting.entity';
import {
    CreateBreakSettingData,
    EnableDisableBreakSettingBulkData,
    BreakSettingFilter,
    UpdateBreakSettingData,
} from '../interfaces/break-setting.interface';
import { In, Like } from 'typeorm';
import { Exceptions } from '../../auth/exceptions';
import { DefaultResponse } from '../../../common/interfaces/default';

@Injectable()
export class BreakSettingService {
    constructor(
        @InjectRepository(BreakSetting, AGENT_STATUS_CONNECTION)
        private readonly breakSettingRepository: Repository<BreakSetting>,
    ) {}

    async create(data: CreateBreakSettingData): Promise<BreakSetting> {
        const breakSetting = this.breakSettingRepository.create({
            name: data.name,
            durationSeconds: data.durationSeconds,
            workspaceId: data.workspaceId,
            enabled: data.enabled,
        });

        return await this.breakSettingRepository.save(breakSetting);
    }

    async update(id: number, workspaceId: string, data: UpdateBreakSettingData): Promise<BreakSetting> {
        const breakSetting = (await this.findByIdAndWorkspaceId(workspaceId, id)).data;

        if (!breakSetting) {
            throw Exceptions.NOT_FOUND;
        }

        Object.assign(breakSetting, data);
        return this.breakSettingRepository.save(breakSetting);
    }

    async enableDisable(id: number, workspaceId: string, enabled: boolean): Promise<BreakSetting> {
        const breakSetting = (await this.findByIdAndWorkspaceId(workspaceId, id)).data;

        if (!breakSetting) {
            throw Exceptions.NOT_FOUND;
        }

        breakSetting.enabled = enabled;
        return this.breakSettingRepository.save(breakSetting);
    }

    async enableDisableBulk(data: EnableDisableBreakSettingBulkData): Promise<{ success: boolean }> {
        if (!data.ids || data.ids.length === 0) {
            throw new BadRequestException('No pause setting IDs provided');
        }

        await this.breakSettingRepository.update(
            { id: In(data.ids), workspaceId: data.workspaceId },
            { enabled: data.enabled },
        );
        return { success: true };
    }

    async findById(id: number): Promise<BreakSetting> {
        return await this.breakSettingRepository.findOne({ where: { id } });
    }

    async findByIdAndWorkspaceId(workspaceId: string, id: number): Promise<DefaultResponse<BreakSetting>> {
        const result = await this.breakSettingRepository.findOne({ where: { id, workspaceId } });

        return { data: result };
    }

    async findByName(workspaceId: string, name: string): Promise<DefaultResponse<BreakSetting[]>> {
        const q = this.breakSettingRepository
            .createQueryBuilder('breakSetting')
            .where('breakSetting.workspaceId = :workspaceId', { workspaceId });

        if (name) {
            q.andWhere(`unaccent(LOWER(breakSetting.name)) LIKE unaccent(LOWER(:name))`, {
                name: `%${name}%`,
            });
        }
        const result = await q.getMany();

        return { data: result };
    }

    async findAll(filter: BreakSettingFilter): Promise<DefaultResponse<BreakSetting[]>> {
        const qb = this.breakSettingRepository
            .createQueryBuilder('breakSetting')
            .where('breakSetting.workspaceId = :workspaceId', {
                workspaceId: filter.workspaceId,
            });

        if (filter?.name?.trim()) {
            qb.andWhere(`unaccent(LOWER(breakSetting.name)) LIKE unaccent(LOWER(:name))`, {
                name: `%${filter.name?.trim()}%`,
            });
        }

        if (filter?.enabled !== undefined) {
            qb.andWhere('breakSetting.enabled = :enabled', {
                enabled: filter.enabled,
            });
        }

        const result = await qb.orderBy('breakSetting.name', 'ASC').getMany();

        return { data: result };
    }
}
