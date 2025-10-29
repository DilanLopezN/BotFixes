import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ActiveMessageSettingService } from '../active-message/services/active-message-setting.service';
import { ObjectiveType, TimeType } from '../active-message/models/active-message-setting.entity';
import { ChannelConfig } from './interfaces/channel-config.interface';
import { WorkspacesService } from '../workspaces/services/workspaces.service';
import { InsertResult } from 'typeorm';
import { castObjectIdToString } from '../../common/utils/utils';

@Injectable()
export class ExternalDataService {
    private readonly logger = new Logger(ExternalDataService.name);
    private _activeMessageSettingService: ActiveMessageSettingService;
    private _workspacesService: WorkspacesService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get activeMessageSettingService(): ActiveMessageSettingService {
        if (!this._activeMessageSettingService) {
            this._activeMessageSettingService = this.moduleRef.get<ActiveMessageSettingService>(
                ActiveMessageSettingService,
                { strict: false },
            );
        }
        return this._activeMessageSettingService;
    }
    private get workspacesService(): WorkspacesService {
        if (!this._workspacesService) {
            this._workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        }
        return this._workspacesService;
    }

    /**
     * Verifica se já existe um activeMessageSetting para o canal específico
     */
    private async hasExistingActiveMessageSetting(channelConfigToken: string): Promise<boolean> {
        const existingSettings = await this.activeMessageSettingService.activeMessageRepository.find({
            where: {
                channelConfigToken,
                objective: ObjectiveType.campaign,
            },
        });

        return existingSettings && existingSettings.length > 0;
    }

    private async enableWorkspaceFeatureFlags(workspaceId: string): Promise<void> {
        try {
            let workspace: any = await this.workspacesService.getOne(workspaceId);

            if (!workspace) {
                return;
            }

            workspace = workspace.toJSON ? workspace.toJSON() : workspace;

            const needsUpdate = !workspace.featureFlag?.campaign;

            if (!needsUpdate) {
                return;
            }

            const updateData = {
                featureFlag: {
                    ...(workspace.featureFlag || {}),
                    campaign: true,
                    activeMessage: true,
                },
            };

            await this.workspacesService.updateRaw({ _id: workspaceId }, updateData);
        } catch (error) {
            this.logger.error(`Erro ao atualizar feature flags do workspace ${workspaceId}:`, error?.stack || error);
        }
    }

    /**
     * Cria activeMessageSetting para lista de transmissão se necessário
     */
    async createActiveMessageSettingIfNeeded(channelConfig: ChannelConfig): Promise<InsertResult | null> {
        const channelToken = channelConfig.token;

        try {
            const hasExisting = await this.hasExistingActiveMessageSetting(channelToken);

            const result = hasExisting
                ? null
                : await this.activeMessageSettingService.create({
                      workspaceId: castObjectIdToString(channelConfig.workspaceId),
                      channelConfigToken: channelToken,
                      enabled: true,
                      settingName: `Lista de transmissão ${channelConfig.name}`,
                      callbackUrl: '',
                      expirationTimeType: TimeType.hours,
                      expirationTime: 6,
                      suspendConversationUntilType: null,
                      suspendConversationUntilTime: null,
                      objective: ObjectiveType.campaign,
                  });

            if (result !== null) {
                await this.enableWorkspaceFeatureFlags(channelConfig.workspaceId);

                return result;
            }
        } catch (error) {
            this.logger.error(
                `❌ Erro ao criar activeMessageSetting para canal ${channelConfig.name}:`,
                error?.stack || error,
            );
        }
    }
}
