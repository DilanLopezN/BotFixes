import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { MongooseAbstractionService } from '../../../../common/abstractions/mongooseAbstractionService.service';
import { HealthFlow } from 'kissbot-core';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { CatchError, Exceptions } from '../../../auth/exceptions';
import { HealthIntegrationService } from './health-integration.service';
import { FlowPublicationHistoryService } from '../../../flow-publication-history/flow-publication-history.service';
import { FlowHistoryService } from './flow-history.service';
import { User } from '../../../users/interfaces/user.interface';
import { ExternalDataService } from './external-data.service';
import { IntegrationType } from '../../interfaces/health/health-integration.interface';
import { castObjectId } from '../../../../common/utils/utils';

@Injectable()
export class HealthFlowService extends MongooseAbstractionService<HealthFlow & Document> {
    private logger = new Logger(HealthFlowService.name);

    constructor(
        @InjectModel('HealthFlow') protected readonly model: Model<HealthFlow & Document>,
        private readonly httpService: HttpService,
        private readonly healthIntegrationService: HealthIntegrationService,
        private readonly flowPublicationHistoryService: FlowPublicationHistoryService,
        private readonly flowHistoryService: FlowHistoryService,
        private readonly externalDataService: ExternalDataService,
    ) {
        super(model);
    }

    getSearchFilter() {}
    getEventsData() {}

    @CatchError()
    async _create(flow: HealthFlow) {
        return await this.create(flow);
    }

    @CatchError()
    async _update(flowId: string, flow: HealthFlow) {
        return await this.update(flowId, flow);
    }

    @CatchError()
    async _delete(flowId: string) {
        return await this.delete(flowId);
    }

    @CatchError()
    async syncDraft(integrationId: string, workspaceId: string, forceSync?: boolean) {
        const integration = await this.healthIntegrationService.findOne({
            workspaceId,
            _id: integrationId,
        });

        const lastPublishFlow = integration.lastPublishFlowDraft || 1;
        let query: any = {
            $or: [
                {
                    deletedAt: {
                        $gte: lastPublishFlow,
                    },
                },
                {
                    updatedAt: {
                        $gte: lastPublishFlow,
                    },
                },
                {
                    createdAt: {
                        $gte: lastPublishFlow,
                    },
                },
            ],
        };

        if (integration.type === IntegrationType.CUSTOM_IMPORT && forceSync) {
            query = {};
        }

        let flows = await this.model.find({
            integrationId,
            workspaceId,
            ...query,
        });

        if (!forceSync) {
            flows = flows.filter((flow) => {
                const lastPublishedToDraft = flow.lastPublishedToDraft || 0;
                return (
                    !lastPublishedToDraft ||
                    (flow.deletedAt && flow.deletedAt > lastPublishedToDraft) ||
                    (flow.updatedAt && flow.updatedAt > lastPublishedToDraft) ||
                    (flow.createdAt && flow.createdAt > lastPublishedToDraft)
                );
            });
        }

        if (!flows.length) {
            throw Exceptions.NO_DATA_TO_SYNC;
        }

        try {
            const response = await lastValueFrom(
                this.httpService.post(`/integration/${integrationId}/health/flow/sync-draft`, flows, {
                    timeout: 60_000,
                }),
            );

            const publishedFlowDate = +new Date();
            await this.healthIntegrationService.getModel().updateOne(
                {
                    _id: integrationId,
                },
                {
                    $set: {
                        lastPublishFlowDraft: publishedFlowDate,
                    },
                },
            );

            const flowIds = flows.map((flow) => flow._id);
            await this.model.updateMany(
                {
                    _id: { $in: flowIds },
                },
                {
                    $set: {
                        lastPublishedToDraft: publishedFlowDate,
                    },
                },
            );

            return response?.data ?? [];
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    @CatchError()
    async syncOneDraft(integrationId: string, workspaceId: string, flowId: string) {
        const integration = await this.healthIntegrationService.findOne({
            workspaceId,
            _id: integrationId,
        });

        const lastPublishFlowDraft = integration.lastPublishFlowDraft || 1;

        const flowsAfterDraftPublish = await this.model.find({
            integrationId,
            workspaceId,
            $or: [
                { deletedAt: { $gte: lastPublishFlowDraft } },
                { updatedAt: { $gte: lastPublishFlowDraft } },
                { createdAt: { $gte: lastPublishFlowDraft } },
            ],
        });

        const pendingFlowsDraft = flowsAfterDraftPublish.filter((flow) => {
            const lastPublishedToDraft = flow.lastPublishedToDraft || 0;
            return (
                !lastPublishedToDraft ||
                (flow.deletedAt && flow.deletedAt > lastPublishedToDraft) ||
                (flow.updatedAt && flow.updatedAt > lastPublishedToDraft) ||
                (flow.createdAt && flow.createdAt > lastPublishedToDraft)
            );
        });

        if (pendingFlowsDraft.length === 1) {
            return await this.syncDraft(integrationId, workspaceId, true);
        }

        const flow = await this.model.findOne({
            _id: flowId,
            integrationId,
            workspaceId,
        });

        if (!flow) {
            throw Exceptions.NO_DATA_TO_SYNC;
        }

        const flowLastPublishedToDraft = flow.lastPublishedToDraft || 0;

        const flowNeedsSyncToDraft =
            !flowLastPublishedToDraft ||
            (flow.deletedAt && flow.deletedAt > flowLastPublishedToDraft) ||
            (flow.updatedAt && flow.updatedAt > flowLastPublishedToDraft) ||
            (flow.createdAt && flow.createdAt > flowLastPublishedToDraft);

        if (!flowNeedsSyncToDraft) {
            throw Exceptions.NO_DATA_TO_SYNC;
        }

        try {
            const response = await lastValueFrom(
                this.httpService.post(`/integration/${integrationId}/health/flow/sync-draft`, [flow], {
                    timeout: 60_000,
                }),
            );

            await this.model.updateOne({ _id: flowId }, { $set: { lastPublishedToDraft: +new Date() } });

            return response?.data ?? [];
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    @CatchError()
    async sync(integrationId: string, workspaceId: string, userId: string, forceSync?: boolean) {
        const integration = await this.healthIntegrationService.findOne({
            workspaceId,
            _id: integrationId,
        });

        const lastPublishFlowDraft = integration.lastPublishFlowDraft || 1;
        const lastPublishFlow = integration.lastPublishFlow || 0;

        // se algum flow foi alterado depois de sincronizado para homologação
        // obriga a publicar a nova mudança para homogalogação e ai permite publicar para produção
        const flowsAfterDraftPublishCount = await this.model.countDocuments({
            integrationId,
            workspaceId,
            $or: [
                {
                    deletedAt: {
                        $gte: lastPublishFlowDraft,
                    },
                },
                {
                    updatedAt: {
                        $gte: lastPublishFlowDraft,
                    },
                },
                {
                    createdAt: {
                        $gte: lastPublishFlowDraft,
                    },
                },
            ],
        });

        if (lastPublishFlowDraft < lastPublishFlow && !flowsAfterDraftPublishCount) {
            throw Exceptions.NO_DATA_TO_PUBLISH;
        }

        if (lastPublishFlowDraft < lastPublishFlow && flowsAfterDraftPublishCount) {
            throw Exceptions.CANT_PUBLISH_PRODUCTION_FLOWS;
        }

        if (!!flowsAfterDraftPublishCount) {
            throw Exceptions.CANT_PUBLISH_PRODUCTION_FLOWS_NEW_HOMOLOG_VERSION;
        }

        let query: any = {
            $or: [
                {
                    deletedAt: {
                        $gte: lastPublishFlow,
                    },
                },
                {
                    updatedAt: {
                        $gte: lastPublishFlow,
                    },
                },
                {
                    createdAt: {
                        $gte: lastPublishFlow,
                    },
                },
            ],
        };

        if (integration.type === IntegrationType.CUSTOM_IMPORT && forceSync) {
            query = {};
        }

        let flows = await this.model.find({
            integrationId,
            workspaceId,
            ...query,
        });

        if (!forceSync) {
            flows = flows.filter((flow) => {
                const lastPublishedToProd = flow.lastPublishedToProd || 0;
                return (
                    !lastPublishedToProd ||
                    (flow.deletedAt && flow.deletedAt > lastPublishedToProd) ||
                    (flow.updatedAt && flow.updatedAt > lastPublishedToProd) ||
                    (flow.createdAt && flow.createdAt > lastPublishedToProd)
                );
            });
        }

        if (!flows.length) {
            throw Exceptions.NO_DATA_TO_PUBLISH;
        }

        await this.flowHistoryService.bulkCreate(userId, flows);

        try {
            const response = await lastValueFrom(
                this.httpService.post(`/integration/${integrationId}/health/flow/sync`, undefined, {
                    timeout: 60_000,
                }),
            );

            const publishedFlowDate = +new Date();
            await this.healthIntegrationService.getModel().updateOne(
                {
                    _id: integrationId,
                },
                {
                    $set: {
                        lastPublishFlow: publishedFlowDate,
                    },
                },
            );

            const flowIds = flows.map((flow) => flow._id);
            await this.model.updateMany(
                {
                    _id: { $in: flowIds },
                },
                {
                    $set: {
                        lastPublishedToProd: publishedFlowDate,
                    },
                },
            );

            await this.flowPublicationHistoryService.create({
                userId,
                workspaceId,
                integrationId,
            });

            return response?.data ?? [];
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    @CatchError()
    async syncOne(integrationId: string, workspaceId: string, flowId: string, userId: string, forceSync?: boolean) {
        const integration = await this.healthIntegrationService.findOne({
            workspaceId,
            _id: integrationId,
        });

        const lastPublishFlowDraft = integration.lastPublishFlowDraft || 1;
        const lastPublishFlow = integration.lastPublishFlow || 0;

        const flow = await this.model.findOne({
            _id: flowId,
            integrationId,
            workspaceId,
        });

        if (!flow) {
            throw Exceptions.NO_DATA_TO_SYNC;
        }

        const flowLastPublishedToDraft = flow.lastPublishedToDraft || 0;

        if (!flowLastPublishedToDraft && !forceSync) {
            throw Exceptions.CANT_PUBLISH_PRODUCTION_FLOWS_NEW_HOMOLOG_VERSION;
        }

        const flowModifiedAfterDraft =
            (flow.updatedAt && flow.updatedAt > flowLastPublishedToDraft) ||
            (flow.deletedAt && flow.deletedAt > flowLastPublishedToDraft) ||
            (flow.createdAt && flow.createdAt > flowLastPublishedToDraft);

        if (flowModifiedAfterDraft && !forceSync) {
            throw Exceptions.CANT_PUBLISH_PRODUCTION_FLOWS_NEW_HOMOLOG_VERSION;
        }

        const flowsAfterDraftPublishCount = await this.model.countDocuments({
            integrationId,
            workspaceId,
            $or: [
                { deletedAt: { $gte: lastPublishFlowDraft } },
                { updatedAt: { $gte: lastPublishFlowDraft } },
                { createdAt: { $gte: lastPublishFlowDraft } },
            ],
        });

        if (lastPublishFlowDraft < lastPublishFlow && !flowsAfterDraftPublishCount) {
            throw Exceptions.NO_DATA_TO_PUBLISH;
        }

        const flowsAfterPublish = await this.model.find({
            integrationId,
            workspaceId,
            $or: [
                { deletedAt: { $gte: lastPublishFlow } },
                { updatedAt: { $gte: lastPublishFlow } },
                { createdAt: { $gte: lastPublishFlow } },
            ],
        });

        const pendingFlows = flowsAfterPublish.filter((flow) => {
            const lastPublishedToProd = flow.lastPublishedToProd || 0;
            return (
                !lastPublishedToProd ||
                (flow.deletedAt && flow.deletedAt > lastPublishedToProd) ||
                (flow.updatedAt && flow.updatedAt > lastPublishedToProd) ||
                (flow.createdAt && flow.createdAt > lastPublishedToProd)
            );
        });

        if (pendingFlows.length === 1) {
            return await this.sync(integrationId, workspaceId, userId, forceSync);
        }

        await this.flowHistoryService.bulkCreate(userId, [flow]);

        try {
            const response = await lastValueFrom(
                this.httpService.post(`/integration/${integrationId}/health/flow/sync`, [flow], {
                    timeout: 60_000,
                }),
            );

            await this.model.updateOne({ _id: flowId }, { $set: { lastPublishedToProd: +new Date() } });

            await this.flowPublicationHistoryService.create({
                userId,
                workspaceId,
                integrationId,
            });

            return response?.data ?? [];
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    // Função chamada para forçar sync dos flows de correlação de integrações do tipo CUSTOM_IMPORT
    // Faz com que as correlações sejam forçadas a serem feitas novamente, em draft e production.
    async forceSyncFlow(integrationId: string, workspaceId: string, userId: string) {
        const responseDraft = await this.syncDraft(integrationId, workspaceId, true);

        if (!responseDraft?.ok) {
            return responseDraft;
        }

        const responseSync = await this.sync(integrationId, workspaceId, userId, true);

        return responseSync;
    }

    async pendingPublicationsOnIntegrations(workspaceId: string, user: User) {
        const integrations = (
            await this.healthIntegrationService._getAll(
                user,
                { filter: { workspaceId: castObjectId(workspaceId) } },
                workspaceId,
            )
        )?.data;

        if (!!integrations.length) {
            let pendingFlows: boolean = false;
            let pendingEntities: boolean = false;

            for (const integration of integrations) {
                const lastPublishFlow = integration.lastPublishFlow || 0;

                if (!pendingFlows) {
                    const flowsPedingPublishCount = await this.model.countDocuments({
                        integrationId: castObjectId(integration._id),
                        workspaceId: castObjectId(workspaceId),
                        $or: [
                            {
                                deletedAt: {
                                    $gte: lastPublishFlow,
                                },
                            },
                            {
                                updatedAt: {
                                    $gte: lastPublishFlow,
                                },
                            },
                            {
                                createdAt: {
                                    $gte: lastPublishFlow,
                                },
                            },
                        ],
                    });

                    if (flowsPedingPublishCount) {
                        pendingFlows = true;
                    }
                }

                if (!pendingEntities) {
                    const pendingEntitiesResult =
                        await this.externalDataService.getPendingPublicationEntitiesByIntegrationId(
                            workspaceId,
                            integration,
                        );

                    if (pendingEntitiesResult) {
                        pendingEntities = true;
                    }
                }
            }

            return { pendingFlows, pendingEntities };
        }
    }

    async pendingPublicationsFlowOnIntegration(
        workspaceId: string,
        integrationId: string,
    ): Promise<{
        pendingFlows: { data: HealthFlow[]; count: number };
        pendingFlowsDraft: { data: HealthFlow[]; count: number };
    }> {
        let pendingFlows: HealthFlow[] = [];
        let pendingFlowsDraft: HealthFlow[] = [];
        const integration = await this.healthIntegrationService.findOne({
            workspaceId: castObjectId(workspaceId),
            _id: castObjectId(integrationId),
        });

        if (!!integration) {
            const lastPublishFlow = integration.lastPublishFlow || 0;
            const lastPublishFlowDraft = integration.lastPublishFlowDraft || 1;

            pendingFlows = await this.model.find({
                integrationId: castObjectId(integrationId),
                workspaceId: castObjectId(workspaceId),
                $or: [
                    { deletedAt: { $gte: lastPublishFlow } },
                    { updatedAt: { $gte: lastPublishFlow } },
                    { createdAt: { $gte: lastPublishFlow } },
                ],
            });

            pendingFlows = pendingFlows.filter((flow) => {
                const lastPublishedToProd = flow.lastPublishedToProd || 0;
                return (
                    !lastPublishedToProd ||
                    (flow.deletedAt && flow.deletedAt > lastPublishedToProd) ||
                    (flow.updatedAt && flow.updatedAt > lastPublishedToProd) ||
                    (flow.createdAt && flow.createdAt > lastPublishedToProd)
                );
            });

            pendingFlowsDraft = await this.model.find({
                integrationId: castObjectId(integrationId),
                workspaceId: castObjectId(workspaceId),
                $or: [
                    { deletedAt: { $gte: lastPublishFlowDraft } },
                    { updatedAt: { $gte: lastPublishFlowDraft } },
                    { createdAt: { $gte: lastPublishFlowDraft } },
                ],
            });

            pendingFlowsDraft = pendingFlowsDraft.filter((flow) => {
                const lastPublishedToDraft = flow.lastPublishedToDraft || 0;
                return (
                    !lastPublishedToDraft ||
                    (flow.deletedAt && flow.deletedAt > lastPublishedToDraft) ||
                    (flow.updatedAt && flow.updatedAt > lastPublishedToDraft) ||
                    (flow.createdAt && flow.createdAt > lastPublishedToDraft)
                );
            });
        }
        return {
            pendingFlows: { data: pendingFlows, count: pendingFlows.length },
            pendingFlowsDraft: { data: pendingFlowsDraft, count: pendingFlowsDraft.length },
        };
    }
}
