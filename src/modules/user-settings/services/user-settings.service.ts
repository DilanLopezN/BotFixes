import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserSettingsDto } from '../dto/create-user-settings.dto';
import { UpdateUserSettingsDto } from '../dto/update-user-settings.dto';
import { UserSettingsEntity } from '../entities/user-settings.entity';

@Injectable()
export class UserSettingsService {
    constructor(
        @InjectRepository(UserSettingsEntity, 'user_settings')
        private readonly userSettingsRepository: Repository<UserSettingsEntity>,
    ) {}

    async findByUserAndType(workspaceId: string, userId: string, type: string): Promise<UserSettingsEntity[]> {
        return this.userSettingsRepository.find({
            where: {
                workspaceId,
                userId,
                type,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async create(workspaceId: string, userId: string, createDto: CreateUserSettingsDto): Promise<UserSettingsEntity> {
        const existing = await this.userSettingsRepository.findOne({
            where: {
                workspaceId,
                userId,
                type: createDto.type,
                key: createDto.key,
            },
        });

        if (existing) {
            throw new ConflictException(
                `Configuração com key '${createDto.key}' e type '${createDto.type}' já existe para este usuário`,
            );
        }

        const userSetting = this.userSettingsRepository.create({
            workspaceId,
            userId,
            ...createDto,
        });

        const savedSetting = await this.userSettingsRepository.save(userSetting);

        return this.userSettingsRepository.findOne({
            where: { id: savedSetting.id },
        });
    }

    async update(
        workspaceId: string,
        userId: string,
        type: string,
        key: string,
        updateDto: UpdateUserSettingsDto,
    ): Promise<UserSettingsEntity> {
        const userSetting = await this.userSettingsRepository.findOne({
            where: {
                workspaceId,
                userId,
                type,
                key,
            },
        });

        if (!userSetting) {
            throw new NotFoundException(`Configuração com key '${key}' e type '${type}' não encontrada`);
        }

        Object.assign(userSetting, updateDto);

        return this.userSettingsRepository.save(userSetting);
    }

    async delete(workspaceId: string, userId: string, type: string, key: string): Promise<void> {
        const result = await this.userSettingsRepository.delete({
            workspaceId,
            userId,
            type,
            key,
        });

        if (result.affected === 0) {
            throw new NotFoundException(`Configuração com key '${key}' e type '${type}' não encontrada`);
        }
    }
}
