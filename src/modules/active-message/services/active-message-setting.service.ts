import { Injectable, NotFoundException } from '@nestjs/common';
import { CatchError } from '../../auth/exceptions';
import { CreateActiveMessageSettingData } from '../interfaces/create-active-message-setting-data.interface';
import { v4 } from 'uuid';
import { UpdateActiveMessageSettingData } from '../interfaces/update-active-message-setting-data.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveMessageSetting, ObjectiveType } from '../models/active-message-setting.entity';
import { ACTIVE_MESSAGE_CONNECTION } from '../ormconfig';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DEFAULT_CONTACT_LIST_LIMITS } from '../../campaign/models/campaign.entity';
import { UpdateWorkspaceFlagsDto } from '../../workspaces/dtos/workspace.dto';

import { ExternalDataWorkspaceService } from './external-data-workspace.service';
@Injectable()
export class ActiveMessageSettingService {
    constructor(
        @InjectRepository(ActiveMessageSetting, ACTIVE_MESSAGE_CONNECTION)
        public activeMessageRepository: Repository<ActiveMessageSetting>,
        private readonly externalDataWorkspaceService: ExternalDataWorkspaceService,
    ) {}

    @CatchError()
    async findByApiToken(apiToken: string) {
        return await this.activeMessageRepository.findOne({
            apiToken,
        });
    }

    @CatchError()
    async create(data: CreateActiveMessageSettingData) {
        const dataField = {
            ...(data.data || {}),
        };

        if (data.objective === ObjectiveType.campaign) {
            dataField.contactListLimit = data.data?.contactListLimit || DEFAULT_CONTACT_LIST_LIMITS.NORMAL_LIST_LIMIT;
        }

        const newData: QueryDeepPartialEntity<ActiveMessageSetting> = {
            callbackUrl: data.callbackUrl,
            apiToken: v4(),
            settingName: data.settingName,
            channelConfigToken: data.channelConfigToken,
            enabled: data.enabled,
            expirationTime: data.expirationTime,
            expirationTimeType: data.expirationTimeType,
            suspendConversationUntilTime: data.suspendConversationUntilTime,
            suspendConversationUntilType: data.suspendConversationUntilType,
            sendMessageToOpenConversation: data.sendMessageToOpenConversation,
            workspaceId: data.workspaceId,
            tags: data.tags,
            templateId: data.templateId,
            action: data.action,
            objective: data.objective || ObjectiveType.api,
            authorizationHeader: data.authorizationHeader,
            endMessage: data.endMessage,
            data: dataField,
        };

        return await this.activeMessageRepository.insert(newData);
    }

    @CatchError()
    async createAndUpdateFlags(data: CreateActiveMessageSettingData) {
        const result = await this.create(data);
        try {
            await this.manageWorkspaceFeatureFlags(data.workspaceId, data.objective, data.enabled);
        } catch (error) {
            console.error('[ActiveMessageSetting] Error to updated feature flags', error);
        }
        return result;
    }
    /**
     * Gerencia as feature flags do workspace baseado no objetivo e status da mensagem ativa
     * @param workspaceId - ID do workspace
     * @param objective - Objetivo da mensagem ativa
     * @param isEnabled - Se a configuração está sendo criada como ativa ou não
     */
    private async manageWorkspaceFeatureFlags(
        workspaceId: string,
        objective?: ObjectiveType,
        isEnabled?: boolean,
    ): Promise<void> {
        try {
            // Se enabled for true, ativar as flags correspondentes
            if (isEnabled) {
                await this.activateWorkspaceFeatureFlags(workspaceId, objective);
            } else if (isEnabled === false && objective) {
                // Se enabled for false, verificar se pode desativar a flag
                await this.deactivateWorkspaceFeatureFlagsIfPossible(workspaceId, objective);
            }
        } catch (error) {
            console.error(`[ActiveMessageSetting] Error to manage feature flags at workspace ${workspaceId}:`, error);
        }
    }

    private async activateWorkspaceFeatureFlags(workspaceId: string, objective?: ObjectiveType): Promise<void> {
        const updateDto: UpdateWorkspaceFlagsDto = {
            featureFlag: {},
        };

        //por padrão ativar a flag de activeMessage quando criar uma configuração ativa
        updateDto.featureFlag.activeMessage = true;

        // Ativar flags específicas baseadas no objetivo
        switch (objective) {
            case ObjectiveType.api:
                // Para API, ativar enableChannelApi
                updateDto.featureFlag.enableChannelApi = true;
                break;

            case ObjectiveType.api_ivr:
                // API IVR, ativar enableIVR
                updateDto.featureFlag.enableIVR = true;
                break;
            case ObjectiveType.campaign:
                updateDto.featureFlag.campaign = true;
                break;

            case ObjectiveType.active_mkt:
                // não encontrei essa flag nas configs
                updateDto.featureFlag.enableActiveMkt = true;

                break;

            case ObjectiveType.confirmation:
                // confirmações
                updateDto.featureFlag.enableConfirmation = true;
                break;

            case ObjectiveType.schedule_notification:
                // notificações de agendamento
                updateDto.featureFlag.enableScheduleNotification = true;
                break;

            case ObjectiveType.recover_lost_schedule:
                //  recuperação de agendamentos perdidos
                updateDto.featureFlag.enableRecoverLostSchedule = true;
                break;

            case ObjectiveType.reminder:
                //  lembretes
                updateDto.featureFlag.enableReminder = true;
                break;

            case ObjectiveType.nps_score:
                updateDto.featureFlag.enableNpsScore = true;
                break;

            case ObjectiveType.nps:
                //  NPS, ativar
                updateDto.featureFlag.enableNps = true;

                break;

            case ObjectiveType.medical_report:
                //  relatórios médicos
                updateDto.featureFlag.enableMedicalReport = true;
                break;

            case ObjectiveType.documents_request:
                //  solicitação de documentos - usar enableUploadErpDocuments
                updateDto.featureFlag.enableDocumentsRequest = true;
                break;

            default:
                //  outros objetivos, apenas activeMessage será ativado
                break;
        }

        await this.externalDataWorkspaceService.updateWorkspaceFlagsAndConfigs(workspaceId, updateDto, true);
    }

    private async deactivateWorkspaceFeatureFlagsIfPossible(
        workspaceId: string,
        objective: ObjectiveType,
    ): Promise<void> {
        // Verificar se existe alguma outra configuração ativa com o mesmo objetivo
        const activeConfigsWithSameObjective = await this.activeMessageRepository.count({
            workspaceId,
            objective,
            enabled: true,
        });

        // Se existir outra configuração ativa, manter a flag
        if (activeConfigsWithSameObjective > 0) {
            return;
        }

        // Verificar se existe alguma configuração ativa de qualquer tipo
        const anyActiveConfig = await this.activeMessageRepository.count({
            workspaceId,
            enabled: true,
        });

        const updateDto: UpdateWorkspaceFlagsDto = {
            featureFlag: {},
        };

        // Se não houver nenhuma configuração ativa, desativar também activeMessage
        if (anyActiveConfig === 0) {
            updateDto.featureFlag.activeMessage = false;
        }
        switch (objective) {
            case ObjectiveType.api:
                updateDto.featureFlag.enableChannelApi = false;
                break;

            case ObjectiveType.api_ivr:
                updateDto.featureFlag.enableIVR = false;
                break;

            case ObjectiveType.campaign:
                updateDto.featureFlag.campaign = false;
                break;

            case ObjectiveType.active_mkt:
                // não encontrei essa flag nas configs
                updateDto.featureFlag.enableActiveMkt = false;

                break;

            case ObjectiveType.confirmation:
                updateDto.featureFlag.enableConfirmation = false;
                break;

            case ObjectiveType.schedule_notification:
                updateDto.featureFlag.enableScheduleNotification = false;
                break;

            case ObjectiveType.recover_lost_schedule:
                updateDto.featureFlag.enableRecoverLostSchedule = false;
                break;

            case ObjectiveType.reminder:
                updateDto.featureFlag.enableReminder = false;
                break;

            case ObjectiveType.nps_score:
                updateDto.featureFlag.enableNpsScore = false;
                break;
            case ObjectiveType.nps:
                updateDto.featureFlag.enableNps = false;

                break;

            case ObjectiveType.medical_report:
                updateDto.featureFlag.enableMedicalReport = false;
                break;

            case ObjectiveType.documents_request:
                updateDto.featureFlag.enableDocumentsRequest = false;
                break;

            default:
                break;
        }

        // update se houver alguma flag para desativar
        if (Object.keys(updateDto.featureFlag).length > 0) {
            await this.externalDataWorkspaceService.updateWorkspaceFlagsAndConfigs(workspaceId, updateDto, true);
        }
    }
    @CatchError()
    async listByWorkspaceId(workspaceId: string, query?: { objective: ObjectiveType }) {
        const settingList = await this.activeMessageRepository.find({
            workspaceId,
            ...query,
        });
        return settingList;
    }

    @CatchError()
    async listEnabledByWorkspaceId(workspaceId: string, objective?: ObjectiveType) {
        let query: any = {};

        if (objective) {
            query.objective = objective;
        }
        const settingList = await this.activeMessageRepository.find({
            workspaceId,
            enabled: true,
            ...query,
        });
        return settingList;
    }

    @CatchError()
    async update(data: UpdateActiveMessageSettingData) {
        const currentSetting = await this.getOne(data.id);
        if (!currentSetting) {
            throw new NotFoundException('Workspace configuration not found');
        }

        const updateResult = await this.activeMessageRepository.update(
            {
                id: data.id,
            },
            {
                enabled: data.enabled,
                callbackUrl: data.callbackUrl,
                expirationTime: data.expirationTime,
                expirationTimeType: data.expirationTimeType,
                sendMessageToOpenConversation: data.sendMessageToOpenConversation,
                suspendConversationUntilTime: data.suspendConversationUntilTime,
                suspendConversationUntilType: data.suspendConversationUntilType,
                channelConfigToken: data.channelConfigToken,
                settingName: data.settingName,
                tags: data.tags,
                action: data.action,
                templateId: data.templateId,
                objective: data.objective,
                authorizationHeader: data.authorizationHeader,
                endMessage: data.endMessage,
                data: data.data,
            },
        );

        //envolvi no try para não parar o fluxo do update caso de algum erro
        try {
            // gerenciar flags baseado nas mudanças
            const objectiveChanged = data.objective && data.objective !== currentSetting.objective;
            const enabledChanged = data.enabled !== undefined && data.enabled !== currentSetting.enabled;

            if (objectiveChanged || enabledChanged) {
                // Se o objetivo mudou e a configuração anterior estava ativa, verificar se pode desativar a flag antiga
                if (objectiveChanged && currentSetting.enabled) {
                    await this.deactivateWorkspaceFeatureFlagsIfPossible(
                        currentSetting.workspaceId,
                        currentSetting.objective,
                    );
                }

                // Gerenciar as flags para o novo estado
                const newObjective = data.objective || currentSetting.objective;
                const newEnabled = data.enabled !== undefined ? data.enabled : currentSetting.enabled;
                await this.manageWorkspaceFeatureFlags(currentSetting.workspaceId, newObjective, newEnabled);
            }
        } catch (error) {
            console.log('Error to updated feature flags', error);
        }

        return updateResult;
    }

    @CatchError()
    async getOne(id: number) {
        const setting = await this.activeMessageRepository.findOne({
            id: id,
        });
        return setting;
    }

    @CatchError()
    async delete(id: number) {
        // Buscar a configuração antes de deletar para obter workspaceId e objective
        const currentSetting = await this.getOne(id);

        if (!currentSetting) {
            throw new NotFoundException('Active message setting not found');
        }

        const deleteResult = await this.activeMessageRepository.delete({ id });

        // Gerenciar feature flags após a deleção
        try {
            await this.deactivateWorkspaceFeatureFlagsIfPossible(currentSetting.workspaceId, currentSetting.objective);
        } catch (error) {
            console.error(
                `[ActiveMessageSetting] Error to manage feature flags after delete for workspace ${currentSetting.workspaceId}:`,
                error,
            );
        }

        return deleteResult;
    }

    @CatchError()
    async checkTemplateUsage(workspaceId: string, templateId: string) {
        const activeMessageSetting = await this.activeMessageRepository.findOne({
            workspaceId,
            templateId,
        });

        return !!activeMessageSetting;
    }
}
