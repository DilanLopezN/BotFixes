import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AGENT_STATUS_CONNECTION } from '../ormconfig';
import { WorkingTime } from '../models/working-time.entity';
import { WorkingTimeType } from '../interfaces/working-time.interface';
import { BreakSettingService } from './break-setting.service';
import { Exceptions } from '../../auth/exceptions';
import { GeneralBreakSettingService } from './general-break-setting.service';
import {
    DEFAULT_BREAK_START_DELAY_SECONDS,
    DEFAULT_MAX_INACTIVE_DURATION_SECONDS,
    DEFAULT_NOTIFICATION_INTERVAL_SECONDS,
} from '../models/general-break-setting.entity';
import { BulkBreakChangeByAdminDto } from '../dto/bulk-break-change-by-admin.dto';
import { User } from '../../users/interfaces/user.interface';
import { castObjectIdToString } from '../../../common/utils/utils';
import { isValidObjectId } from 'mongoose';
import { ExternalDataAgentStatusService } from './external-data.service';
import { ZSetEventManagerService, EventType } from './zset-event-manager.service';
import * as Sentry from '@sentry/node';

@Injectable()
export class WorkingTimeService {
    private readonly logger = new Logger(WorkingTimeService.name);

    constructor(
        @InjectRepository(WorkingTime, AGENT_STATUS_CONNECTION)
        private readonly workingTimeRepository: Repository<WorkingTime>,
        private readonly breakSettingService: BreakSettingService,
        private readonly generalBreakSettingService: GeneralBreakSettingService,
        private readonly externalDataService: ExternalDataAgentStatusService,
        private readonly zsetEventManager: ZSetEventManagerService,
    ) {}

    // vai servir para que expire um intervalo/pausa criado para que não fique aberto mais do que o tempo maximo de inatividade.
    // quando expirar este evento ele sera consumido para finalizar a pausa
    private async saveMaxExpirationBreakToCache(
        workspaceId: string,
        userId: string,
        expirationInSeconds: number,
    ): Promise<void> {
        // Adiciona evento no ZSet para expiração da pausa
        const expirationTimestamp = Date.now() + expirationInSeconds * 1000;
        await this.zsetEventManager.addBreakExpirationEvent(workspaceId, userId, expirationTimestamp);
    }

    // Seta o ultimo acesso com o tempo para começar a inatividade se tiver setado no generalBreakSetting
    // pois quando este tempo expirar o cron vai iniciar a pausa por inatividade.
    private async setLastAcessInStatusAgent(workspaceId: string, userId: string) {
        const generalBreakSettingByworkspace = await this.generalBreakSettingService.getByWorkspaceId(workspaceId);

        if (generalBreakSettingByworkspace?.enabled) {
            let expirationInSeconds = DEFAULT_NOTIFICATION_INTERVAL_SECONDS + DEFAULT_BREAK_START_DELAY_SECONDS;
            if (
                generalBreakSettingByworkspace?.notificationIntervalSeconds &&
                generalBreakSettingByworkspace?.breakStartDelaySeconds
            ) {
                expirationInSeconds =
                    generalBreakSettingByworkspace?.notificationIntervalSeconds +
                    generalBreakSettingByworkspace?.breakStartDelaySeconds;
            }
            const now = Date.now();
            const expirationTimestamp = now + expirationInSeconds * 1000;
            await this.zsetEventManager.addLastAccessEvent(workspaceId, userId, expirationTimestamp, now);
        }
    }

    private async getLastAcessInStatusAgent(workspaceId: string, userId: string): Promise<number | null> {
        // Agora usa o ZSet para buscar o último acesso
        return await this.zsetEventManager.getLastAccessTimestamp(workspaceId, userId);
    }

    private async deleteMaxExpirationBreakFromCache(workspaceId: string, userId: string): Promise<void> {
        // Remove eventos do ZSet relacionados a este usuário
        await this.zsetEventManager.removeEvent(EventType.BREAK_EXPIRATION, workspaceId, userId);
    }

    private async deleteStartInactiveBreakFromCache(workspaceId: string, userId: string): Promise<void> {
        // Remove eventos do ZSet relacionados ao último acesso
        await this.zsetEventManager.removeEvent(EventType.LAST_ACCESS, workspaceId, userId);
    }

    private calculateDurationInSeconds(endedAt: number, startedAt: number): number {
        if (!endedAt || !startedAt) {
            return 0;
        }
        const diffInMs = endedAt - startedAt;
        return Math.round(diffInMs / 1000);
    }

    private calculateBreakOvertimeSeconds(
        endedAt: number,
        startedAt: number,
        type: WorkingTimeType,
        contextDurationSeconds?: number,
    ): number {
        // caso não tenha um startedAt ou endedAt não da para calcular a duração de tempo excedida
        // caso seja um workingTime do tipo online não tem tempo excedido
        // caso seja do tipo BREAK e não possua por algum motivo o tempo maximo de duração da pausa não da para calcular se excedeu o tempo
        if (
            !endedAt ||
            !startedAt ||
            (type === WorkingTimeType.BREAK && !contextDurationSeconds) ||
            type === WorkingTimeType.ONLINE
        ) {
            return 0;
        }

        const durationInSeconds = this.calculateDurationInSeconds(endedAt, startedAt);

        // caso seja do tipo INACTIVE sempre tera o tempo excedido como a duração do intervalo
        if (type === WorkingTimeType.INACTIVE) {
            return durationInSeconds;
        }

        // caso o tempo de duração da pausa seja menor que a duração maxima então não tera tempo excedido, sera igual a zero
        if (type === WorkingTimeType.BREAK && durationInSeconds <= contextDurationSeconds) {
            return 0;
        }

        return durationInSeconds - contextDurationSeconds;
    }

    async connect(workspaceId: string, userId: string): Promise<WorkingTime> {
        try {
            const activeRecord = await this.findActiveByUserAndWorkspaceId(workspaceId, userId);
            if (activeRecord && activeRecord.type === WorkingTimeType.ONLINE) {
                await this.setLastAcessInStatusAgent(workspaceId, userId);

                return activeRecord;
            }

            if (activeRecord && activeRecord.type !== WorkingTimeType.ONLINE) {
                // finaliza o intervalo anterior para iniciar um novo
                await this.endBreak(workspaceId, userId);
            }

            const teamIds = await this.externalDataService.getTeamIdsByWorkspaceAndUser(workspaceId, userId);

            const workingTime = this.workingTimeRepository.create({
                workspaceId,
                userId: userId,
                type: WorkingTimeType.ONLINE,
                startedAt: Date.now(),
                teamIds,
            });

            await this.setLastAcessInStatusAgent(workspaceId, userId);

            return await this.workingTimeRepository.save(workingTime);
        } catch (error) {
            this.logger.log(`ERROR on connect: ${JSON.stringify(error)}`);

            Sentry.captureEvent({
                message: `${WorkingTimeService.name}.connect`,
                extra: {
                    workspaceId,
                    userId,
                    error: error,
                },
            });
        }
    }

    async disconnect(workspaceId: string, userId: string): Promise<WorkingTime> {
        return await this.endBreak(workspaceId, userId);
    }

    async endBreakAndConnect(workspaceId: string, userId: string, justification: string = null) {
        await this.endBreak(workspaceId, userId, justification);

        return await this.connect(workspaceId, userId);
    }

    async startBreak(workspaceId: string, userId: string, breakSettingId: number): Promise<WorkingTime> {
        try {
            const activeRecord = await this.findActiveByUserAndWorkspaceId(workspaceId, userId);

            // caso tenha algum intervalo ativo que não seja online então já esta em pausa
            if (activeRecord && activeRecord.type !== WorkingTimeType.ONLINE) {
                return activeRecord;
            }

            // finaliza o intervalo anterior para iniciar um novo
            await this.endBreak(workspaceId, userId);

            const breakSetting = (await this.breakSettingService.findByIdAndWorkspaceId(workspaceId, breakSettingId))
                .data;

            if (!breakSetting) {
                throw Exceptions.NOT_FOUND_BREAK_SETTING;
            }

            // pega o tempo de duração da pausa mais o tempo maximo que pode ficar inativo, para que a pausa não fique sempre aberta
            // desta forma ela vai expirar e ser finalizada quando consumir o evento do redis.
            let maxInactiveDurationSeconds = DEFAULT_MAX_INACTIVE_DURATION_SECONDS + breakSetting.durationSeconds;

            const teamIds = await this.externalDataService.getTeamIdsByWorkspaceAndUser(workspaceId, userId);

            const workingTime = this.workingTimeRepository.create({
                workspaceId,
                userId: userId,
                type: WorkingTimeType.BREAK,
                startedAt: Date.now(),
                contextDurationSeconds: breakSetting.durationSeconds,
                breakSettingId: breakSetting.id,
                teamIds,
            });
            await this.saveMaxExpirationBreakToCache(workspaceId, userId, maxInactiveDurationSeconds);
            return await this.workingTimeRepository.save(workingTime);
        } catch (error) {
            this.logger.log(`ERROR on startBreak: ${JSON.stringify(error)}`);

            Sentry.captureEvent({
                message: `${WorkingTimeService.name}.startBreak`,
                extra: {
                    workspaceId,
                    userId,
                    breakSettingId,
                    error: error,
                },
            });

            throw error;
        }
    }

    async endBreak(
        workspaceId: string,
        userId: string,
        justification: string = null,
        breakChangedByUserId?: string,
        breakChangedByUserName?: string,
    ): Promise<WorkingTime> {
        try {
            await this.deleteMaxExpirationBreakFromCache(workspaceId, userId);
            await this.deleteStartInactiveBreakFromCache(workspaceId, userId);
            const activeRecord = await this.findActiveByUserAndWorkspaceId(workspaceId, userId);
            if (!activeRecord) {
                return null;
            }

            const endedAt = Date.now();
            const workingTime: WorkingTime = {
                ...activeRecord,
                endedAt,
                durationInSeconds: this.calculateDurationInSeconds(endedAt, activeRecord.startedAt),
                breakOvertimeSeconds: this.calculateBreakOvertimeSeconds(
                    endedAt,
                    activeRecord.startedAt,
                    activeRecord.type,
                    activeRecord?.contextDurationSeconds,
                ),
                breakChangedByUserId,
                breakChangedByUserName,
                justification,
            };
            return await this.workingTimeRepository.save(workingTime);
        } catch (error) {
            this.logger.log(`ERROR on endBreak: ${JSON.stringify(error)}`);

            Sentry.captureEvent({
                message: `${WorkingTimeService.name}.endBreak`,
                extra: {
                    workspaceId,
                    userId,
                    error: error,
                },
            });
        }
    }

    async startBreakInactive(workspaceId: string, userId: string): Promise<WorkingTime> {
        try {
            const activeRecord = await this.findActiveByUserAndWorkspaceId(workspaceId, userId);

            if (activeRecord && activeRecord.type !== WorkingTimeType.ONLINE) {
                return activeRecord;
            }
            const generalBreakSetting = await this.generalBreakSettingService.findByWorkspaceId(workspaceId);

            // Caso esteja desabilitado a configuração geral então não pode setar intervalo por inatividade
            if (!generalBreakSetting?.enabled) return;

            // finaliza o intervalo anterior para iniciar um novo
            await this.endBreak(workspaceId, userId);

            const maxInactiveDurationSeconds =
                generalBreakSetting?.maxInactiveDurationSeconds || DEFAULT_MAX_INACTIVE_DURATION_SECONDS;

            const teamIds = await this.externalDataService.getTeamIdsByWorkspaceAndUser(workspaceId, userId);

            const workingTime = this.workingTimeRepository.create({
                workspaceId,
                userId: userId,
                type: WorkingTimeType.INACTIVE,
                startedAt: Date.now(),
                contextMaxInactiveDurationSeconds: maxInactiveDurationSeconds,
                breakSettingId: null,
                teamIds,
            });
            await this.saveMaxExpirationBreakToCache(workspaceId, userId, maxInactiveDurationSeconds);
            return await this.workingTimeRepository.save(workingTime);
        } catch (error) {
            this.logger.log(`ERROR on startBreakInactive: ${JSON.stringify(error)}`);

            Sentry.captureEvent({
                message: `${WorkingTimeService.name}.startBreakInactive`,
                extra: {
                    workspaceId,
                    userId,
                    error: error,
                },
            });
        }
    }

    async bulkBreakChangeByAdmin(
        workspaceId: string,
        data: BulkBreakChangeByAdminDto,
        userAdmin: User,
    ): Promise<{ success: boolean }> {
        if (!data.userIds.length) {
            return { success: true };
        }

        let breakSetting = null;
        let maxInactiveDurationSeconds = DEFAULT_MAX_INACTIVE_DURATION_SECONDS;
        if (data?.breakSettingId) {
            breakSetting = (await this.breakSettingService.findByIdAndWorkspaceId(workspaceId, data.breakSettingId))
                .data;

            if (!breakSetting) {
                throw Exceptions.NOT_FOUND_BREAK_SETTING;
            }

            // pega o tempo de duração da pausa mais o tempo maximo que pode ficar inativo, para que a pausa não fique sempre aberta
            // desta forma ela vai expirar e ser finalizada quando consumir o evento do redis.
            maxInactiveDurationSeconds = DEFAULT_MAX_INACTIVE_DURATION_SECONDS + breakSetting.durationSeconds;
        }

        const breakChangedByUser = {
            id: castObjectIdToString(userAdmin._id),
            name: userAdmin.name,
        };
        for (const userId of data.userIds) {
            try {
                if (!isValidObjectId(userId)) {
                    continue;
                }
                if (!!data?.changeToOffline) {
                    await this.endBreak(workspaceId, userId, null, breakChangedByUser.id, breakChangedByUser.name);
                } else {
                    const activeRecord = await this.findActiveByUserAndWorkspaceId(workspaceId, userId);

                    // caso tenha algum intervalo ativo que não seja online então já esta em pausa
                    if (activeRecord && activeRecord.type !== WorkingTimeType.ONLINE) {
                        continue;
                    }

                    // finaliza o intervalo anterior para iniciar um novo
                    await this.endBreak(workspaceId, userId);

                    const teamIds = await this.externalDataService.getTeamIdsByWorkspaceAndUser(workspaceId, userId);

                    const workingTime = this.workingTimeRepository.create({
                        workspaceId,
                        userId: userId,
                        type: WorkingTimeType.BREAK,
                        startedAt: Date.now(),
                        contextDurationSeconds: breakSetting.durationSeconds,
                        breakChangedByUserId: breakChangedByUser.id,
                        breakChangedByUserName: breakChangedByUser.name,
                        breakSettingId: breakSetting.id,
                        teamIds,
                    });
                    await this.saveMaxExpirationBreakToCache(workspaceId, userId, maxInactiveDurationSeconds);
                    await this.workingTimeRepository.save(workingTime);
                }
            } catch (error) {
                console.error(error);
            }
        }

        return { success: true };
    }

    async findById(id: number): Promise<WorkingTime> {
        return this.workingTimeRepository.findOne({ where: { id } });
    }

    async findActiveByUserAndWorkspaceId(workspaceId: string, userId: string): Promise<WorkingTime> {
        let result = await this.workingTimeRepository.findOne({
            where: {
                workspaceId,
                userId,
                endedAt: IsNull(),
            },
            order: { startedAt: 'DESC' },
        });

        if (result?.type === WorkingTimeType.ONLINE) {
            const generalBreakSetting = await this.generalBreakSettingService.findByWorkspaceId(workspaceId);
            const lastAcess = await this.getLastAcessInStatusAgent(workspaceId, userId);

            result['contextLastAcess'] = {
                generalBreakSetting,
                lastAcess,
            };
        }

        return result as WorkingTime;
    }

    async findActiveByUser(userId: string): Promise<WorkingTime> {
        return await this.workingTimeRepository.findOne({
            where: {
                userId,
                endedAt: IsNull(),
            },
            order: { startedAt: 'DESC' },
        });
    }

    async getRepository() {
        return this.workingTimeRepository;
    }
}
