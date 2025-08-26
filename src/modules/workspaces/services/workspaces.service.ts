import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { omit } from 'lodash';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { isAnySystemAdmin, isSystemAdmin } from '../../../common/utils/roles';
import { castObjectId } from '../../../common/utils/utils';
import { CacheService } from '../../_core/cache/cache.service';
import { DialogFlowService } from '../../_core/dialogFlow/dialogFlow.service';
import { PermissionResources, User, UserRoles } from '../../users/interfaces/user.interface';
import { matchIp } from '../../workspace-access-group/middleware/ip.middleware';
import { WorkspaceAccessGroupService } from '../../workspace-access-group/services/workspace-access-group.service';
import { UpdateWorkspaceAdvancedModuleFeaturesDto, UpdateWorkspaceFlagsDto, WorkspaceDto } from '../dtos/workspace.dto';
import { Workspace } from '../interfaces/workspace.interface';
import { WorkspaceModel } from '../schemas/workspace.schema';
import { QueryStringFilter } from './../../../common/abstractions/queryStringFilter.interface';
import { CatchError, Exceptions } from './../../auth/exceptions';
import { EventsService } from './../../events/events.service';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class WorkspacesService extends MongooseAbstractionService<Workspace> {
    constructor(
        @InjectModel('Workspace') protected readonly model: Model<Workspace>,
        cacheService: CacheService,
        readonly eventsService: EventsService,
        private readonly workspaceAccessGroupService: WorkspaceAccessGroupService,
        private readonly externalDataService: ExternalDataService,
    ) {
        super(model, cacheService);
    }

    private async getWorkspaceBlockedCacheKey(workspaceId: string) {
        return `workspace-disabled-${workspaceId}`;
    }

    getSearchFilter(): any {}
    getEventsData() {}

    @CatchError()
    async findWorkspaceBySSOId(ssoId: string) {
        return await this.model
            .find({
                'sso.ssoId': ssoId,
            })
            .exec();
    }

    async _create(workspaceDto: WorkspaceDto) {
        let newWorkspace = new WorkspaceModel({ ...workspaceDto }) as any;
        newWorkspace = await this.create({ ...newWorkspace?.toJSON?.() });
        this.eventsService.sendEvent({
            data: newWorkspace,
            dataType: KissbotEventDataType.WORKSPACE,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WORKSPACE_CREATED,
        });
        return newWorkspace;
    }

    async _update(workspaceId, workspaceDto: WorkspaceDto, user?: User) {
        let canChangeWorkspaceName = user && isSystemAdmin(user) ? true : false;
        const isAnySystem = isAnySystemAdmin(user);

        const updateWorkspace = new WorkspaceModel();
        Object.assign(updateWorkspace, canChangeWorkspaceName ? workspaceDto : omit(workspaceDto, ['name']));
        if (!isAnySystem) {
            Object.assign(updateWorkspace, omit(workspaceDto, ['featureFlag']));
        }

        if (updateWorkspace?.featureFlag?.campaign) {
            updateWorkspace.featureFlag.activeMessage = true;
            await this.externalDataService.createDefaultActiveMessages(workspaceId);
        }
        if (
            updateWorkspace.userFeatureFlag?.enableConversationCategorization &&
            !(await this.externalDataService.hasConversationObjectiveAndOutcome(workspaceId))
        ) {
            throw Exceptions.CONVERSATION_OBJECTIVE_AND_OUTCOME_NEEDED;
        }

        if (updateWorkspace?.generalConfigs?.enableAgentStatusForAgents) {
            if (!(await this.externalDataService.hasActiveBreakSettingByWorkspace(workspaceId))) {
                throw Exceptions.AGENT_STATUS_NEEDED;
            }
        }

        if (updateWorkspace?.generalConfigs?.ignoreUserFollowupConversation) {
            await this.externalDataService.updateInteractionWelcome(workspaceId);
        }

        await this.update(workspaceId, updateWorkspace);
        if (updateWorkspace?.featureFlag?.disabledWorkspace) {
            await this.disableWorkspace(workspaceId);
        } else {
            await this.enableWorkspace(workspaceId);
        }
        if (updateWorkspace?.featureFlag?.dashboardNewVersion) {
            await this.externalDataService.createDefaultConversationTemplates(workspaceId);
        }
        this.eventsService.sendEvent({
            data: updateWorkspace,
            dataType: KissbotEventDataType.WORKSPACE,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WORKSPACE_UPDATED,
        });
        return updateWorkspace;
    }

    async updateAdvancedModuleFeatures(
        workspaceId: string,
        data: UpdateWorkspaceAdvancedModuleFeaturesDto,
        user?: User,
    ) {
        const workspace = await this.findOne({ _id: castObjectId(workspaceId) });

        if (workspace) {
            const updateWorkspace = workspace;
            Object.assign(updateWorkspace, {
                advancedModuleFeatures: {
                    ...(workspace?.advancedModuleFeatures || {}),
                    ...(data?.advancedModuleFeatures || {}),
                },
            });
            await this.update(workspaceId, updateWorkspace);

            this.eventsService.sendEvent({
                data: updateWorkspace,
                dataType: KissbotEventDataType.WORKSPACE,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.WORKSPACE_UPDATED,
            });
            return updateWorkspace;
        }
    }

    async updateFlagsAndConfigs(workspaceId: string, dto: UpdateWorkspaceFlagsDto, user?: User): Promise<Workspace> {
        const updatePayload = { $set: {} };

        if (dto.featureFlag) {
            if (!isAnySystemAdmin(user)) {
                throw new ForbiddenException('Você não tem permissão para atualizar featureFlag.');
            }
            for (const key in dto.featureFlag) {
                if (Object.prototype.hasOwnProperty.call(dto.featureFlag, key)) {
                    updatePayload.$set[`featureFlag.${key}`] = dto.featureFlag[key];
                }
            }
        }

        if (dto.generalConfigs) {
            for (const key in dto.generalConfigs) {
                if (Object.prototype.hasOwnProperty.call(dto.generalConfigs, key)) {
                    updatePayload.$set[`generalConfigs.${key}`] = dto.generalConfigs[key];
                }
            }
        }

        if (Object.keys(updatePayload.$set).length === 0) {
            return this.getOne(workspaceId);
        }

        const updatedWorkspace = await this.model.findByIdAndUpdate(workspaceId, updatePayload, { new: true }).exec();

        if (!updatedWorkspace) {
            throw new NotFoundException(`Workspace com ID "${workspaceId}" não encontrado ao tentar atualizar.`);
        }

        this.eventsService.sendEvent({
            data: updatedWorkspace,
            dataType: KissbotEventDataType.WORKSPACE,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WORKSPACE_UPDATED,
        });

        return updatedWorkspace;
    }

    @CatchError()
    async updateNameBillingWorkspace(workspaceId: string, name: string): Promise<any> {
        return await this.externalDataService.updateWorkspaceName(workspaceId, name);
    }

    @CatchError()
    async updateWorspaceName(workspaceId, name: string) {
        try {
            const updatedAt = moment().toDate();

            const result = await this.update(workspaceId, {
                name: name,
                updatedAt: updatedAt,
            });

            await this.updateNameBillingWorkspace(workspaceId, name);

            return result;
        } catch (e) {
            console.log('error updateWorspaceName: ', e);
        }
    }

    async _delete(workspaceId) {
        const workspace = await this.getOne(workspaceId);

        if (!workspace) throw new NotFoundException();

        await this.delete(workspaceId);
        this.eventsService.sendEvent({
            data: workspace,
            dataType: KissbotEventDataType.WORKSPACE,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WORKSPACE_DELETED,
        });
        return workspace;
    }

    async _getOne(workspaceId: any) {
        const workspace: Workspace = await this.model.findOne({ _id: workspaceId });
        return workspace;
    }

    async appendIntegrationStatus(workspaces: any[]) {
        const groupedData = await this.externalDataService.getStatus();

        return workspaces.map((workspace) => ({
            ...workspace?.toJSON(),
            integrationStatus: groupedData[workspace._id] ?? [],
        }));
    }

    async _getAll(user: User, query: QueryStringFilter, clientIp: string) {
        const filter: any = {};
        const isAnyAdmin = isAnySystemAdmin(user);
        let showDialogFlow = true;

        if (query?.filter?.simple) {
            showDialogFlow = false;
            delete query?.filter?.simple;
        }

        if (!isAnyAdmin) {
            filter._id = {
                $in: [
                    ...user.roles
                        .filter(
                            (role) =>
                                role.resource == PermissionResources.WORKSPACE &&
                                !!role.resourceId &&
                                (role.role == UserRoles.WORKSPACE_ADMIN || role.role == UserRoles.WORKSPACE_AGENT),
                        )
                        .map((role) => role.resourceId),
                ],
            };
        }

        query.filter = {
            ...filter,
            ...query.filter,
        };

        if (isAnyAdmin) {
            const response = await this.queryPaginate(query);

            try {
                const data = await this.appendIntegrationStatus(response?.data ?? []);
                if (!showDialogFlow) {
                    response.data = data?.map((workspace) => {
                        if (workspace?.dialogFlowAccount) {
                            workspace.dialogFlowAccount = true;
                        }
                        return { ...workspace };
                    });
                    return response;
                }
                response.data = data;
                return response;
            } catch (error) {}
        }

        // Se usuário não é admin, realiza validação de bloqueio de ip para front lidar com o bloqueio
        // e não permitir acesso á páginas
        const response = await this.queryPaginate(query);
        const data: any = response.data.map(async (workspace) => {
            if (workspace?.dialogFlowAccount) {
                delete workspace.dialogFlowAccount;
            }
            const groups = await this.workspaceAccessGroupService.findByWorkspaceIdAndMatchUser(
                castObjectId(workspace._id),
                castObjectId(user._id),
            );

            if (!groups.length) {
                return {
                    ...workspace.toJSON({ minimize: false }),
                    restrictedIp: false,
                };
            }

            let ipMatches = false;
            groups.forEach((group) => {
                if (ipMatches) {
                    return;
                }
                ipMatches = !!matchIp(group, clientIp);
            });

            return {
                ...workspace.toJSON({ minimize: false }),
                restrictedIp: !ipMatches,
            };
        });

        response.data = await Promise.all(data);
        return response;
    }

    public async dialogFlowInstance(workspaceId: string): Promise<DialogFlowService> {
        if (process.env.NODE_ENV === 'test') {
            return null;
        }

        const workspace: Workspace = await this.getOne(workspaceId);
        if (workspace?.dialogFlowAccount) {
            return new DialogFlowService(
                workspace.dialogFlowAccount,
                (workspace.toJSON?.({ minimize: false }) ?? workspace) as Workspace,
            );
        }
        return null;
    }

    private async disableWorkspace(workspaceId: string) {
        const cacheKey = await this.getWorkspaceBlockedCacheKey(workspaceId);
        const client = await this.cacheService.getClient();
        await client.set(cacheKey, 'true');
        await this.externalDataService.disableWorkspaceChannelConfigs(workspaceId);
    }

    private async enableWorkspace(workspaceId: string) {
        const cacheKey = await this.getWorkspaceBlockedCacheKey(workspaceId);
        const client = await this.cacheService.getClient();
        await client.del(cacheKey);
    }

    async isWorkspaceDisabled(workspaceId: string): Promise<boolean> {
        const cacheKey = await this.getWorkspaceBlockedCacheKey(workspaceId);
        const client = await this.cacheService.getClient();
        const result = await client.get(cacheKey);
        if (result) {
            return result === 'true';
        }
        const workspace = await this.getOne(workspaceId);
        if (!!workspace.featureFlag?.disabledWorkspace) {
            await this.disableWorkspace(workspaceId);
        }
        return !!workspace.featureFlag?.disabledWorkspace;
    }

    async isWorkspaceRatingEnabled(workspaceId: string): Promise<boolean> {
        try {
            const result = await this.model.findOne({ _id: workspaceId }, { featureFlag: 1 });
            return result?.featureFlag?.rating;
        } catch (error) {
            console.log('Error workspaceService.isWorkspaceRatingEnabled: ', error);
            return false;
        }
    }

    @CatchError()
    async updateWorspaceCustomerXSettings(
        workspaceId,
        customerSettings: { customerXId: string; customerXEmail: string },
    ) {
        try {
            const updatedAt = moment().toDate();

            const result = await this.update(workspaceId, {
                customerXSettings: { id: customerSettings.customerXId, email: customerSettings.customerXEmail },
                updatedAt: updatedAt,
            });

            await this.externalDataService.updateWorkspaceCustomerXSettings(workspaceId, customerSettings);

            return result;
        } catch (e) {
            console.log('error updateWorspaceCustomerXSettings: ', e);
        }
    }
}
