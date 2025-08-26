import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { SmtReSetting } from '../models/smt-re-setting.entity';
import { CONVERSATION_SMT_RE_CONNECTION_NAME } from '../ormconfig';
import { CreateSmtReSettingData } from '../interfaces/create-smt-re-setting-data.interface';
import { UpdateSmtReSettingData } from '../interfaces/update-smt-re-setting-data.interface';

@Injectable()
export class SmtReSettingService {
    constructor(
        @InjectRepository(SmtReSetting, CONVERSATION_SMT_RE_CONNECTION_NAME)
        private readonly smtReSettingRepository: Repository<SmtReSetting>,
    ) {}

    async findByWorkspaceId(workspaceId: string): Promise<SmtReSetting> {
        return this.smtReSettingRepository.findOne({
            where: { workspaceId },
        });
    }

    async create(data: CreateSmtReSettingData): Promise<SmtReSetting> {
        const setting = this.smtReSettingRepository.create(data);
        return this.smtReSettingRepository.save(setting);
    }

    async update(id: string, data: UpdateSmtReSettingData): Promise<SmtReSetting> {
        const setting = await this.findById(id);
        if (!setting) {
            throw new NotFoundException(`SmtReSetting with id ${id} not found`);
        }

        await this.smtReSettingRepository.update(id, data);
        return this.findById(id);
    }

    async findById(id: string): Promise<SmtReSetting> {
        return this.smtReSettingRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
    }
    async findByIds(ids: string[]): Promise<SmtReSetting[]> {
        if (!ids || ids.length === 0) {
            return [];
        }

        return this.smtReSettingRepository.find({
            where: {
                id: In(ids),
                deletedAt: IsNull(),
            },
        });
    }

    async delete(id: string, workspaceId: string): Promise<void> {
        const setting = await this.smtReSettingRepository.findOne({
            where: { id, workspaceId },
        });

        if (!setting) {
            throw new NotFoundException(`SmtReSetting with id ${id} not found in workspace ${workspaceId}`);
        }

        await this.smtReSettingRepository.update(
            {
                id,
            },
            {
                deletedAt: new Date(),
            },
        );
    }

    async findAllByWorkspaceId(workspaceId: string): Promise<SmtReSetting[]> {
        return this.smtReSettingRepository.find({
            where: { workspaceId, deletedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
    }

    async findByTeamId(workspaceId: string, teamId: string): Promise<SmtReSetting[]> {
        return this.smtReSettingRepository
            .createQueryBuilder('setting')
            .where('setting.workspaceId = :workspaceId', { workspaceId })
            .andWhere(':teamId = ANY(setting.teamIds)', { teamId })
            .andWhere('setting.deleted_at IS NULL')
            .orderBy('setting.createdAt', 'DESC')
            .getMany();
    }
}
