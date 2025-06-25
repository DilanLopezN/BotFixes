import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as Sentry from '@sentry/node';
import { HealthEntitySource, HealthEntityType, HealthIntegrationSynchronizeStatus, User } from 'kissbot-core';
import { chunk, deburr, groupBy, omit, omitBy } from 'lodash';
import * as moment from 'moment';
import { FilterQuery, Model, Types } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { CacheService } from '../../../_core/cache/cache.service';
import { ExternalHealthEntity, HealthEntity, IHealthEntity } from '../../interfaces/health/health-entity.interface';
import { HealthIntegration, IntegrationType } from '../../interfaces/health/health-integration.interface';
import { MongooseAbstractionService } from './../../../../common/abstractions/mongooseAbstractionService.service';
import { CatchError, Exceptions } from './../../../auth/exceptions';
import { ExternalDataService } from './external-data.service';
import { HealthIntegrationService } from './health-integration.service';
import { castObjectId, castObjectIdToString, getUnaccentRegexString } from '../../../../common/utils/utils';
import { DeleteDisabledHealthEntitiesResponse } from '../../interfaces/health/delete-disabled-health-entities-response.interface';

const getDefaultCacheSyncKey = (integrationId: string) => `SYNC_ALL:${integrationId}`;
const DEFAULT_SYNC_EXPIRATION = 600;

@Injectable()
export class HealthEntityService extends MongooseAbstractionService<HealthEntity> {
    private readonly logger = new Logger(HealthEntityService.name);

    defaultEntitiesToSync = [
        HealthEntityType.appointmentType,
        HealthEntityType.typeOfService,
        HealthEntityType.doctor,
        HealthEntityType.insurance,
        HealthEntityType.insurancePlan,
        HealthEntityType.insuranceSubPlan,
        HealthEntityType.organizationUnit,
        HealthEntityType.procedure,
        HealthEntityType.speciality,
        HealthEntityType.planCategory,
    ];

    constructor(
        @InjectModel('HealthEntity') protected readonly model: Model<HealthEntity>,
        @Inject(forwardRef(() => HealthIntegrationService))
        private readonly healthIntegrationService: HealthIntegrationService,
        private readonly externalDataService: ExternalDataService,
        private readonly httpService: HttpService,
        readonly cacheService: CacheService,
    ) {
        super(model);
    }

    private getIntegrationImportPrefixCacheKey(workspaceId: string, integrationId: string): string {
        return `INTEGRATION_IMPORT:${workspaceId}:${integrationId}`;
    }

    private async setIntegrationImportAtCacheKey(workspaceId: string, integrationId: string) {
        const now = +new Date();
        const client = await this.cacheService.getClient();
        const key = this.getIntegrationImportPrefixCacheKey(workspaceId, integrationId);
        await client.set(key, JSON.stringify(now));
        await client.expire(key, 300000);
    }

    private async getIntegrationImportAtCache(workspaceId: string, integrationId: string) {
        const client = await this.cacheService.getClient();
        const key = this.getIntegrationImportPrefixCacheKey(workspaceId, integrationId);
        const importAt = await client.get(key);
        return JSON.parse(importAt);
    }

    private async deleteIntegrationImportFromCache(workspaceId: string, integrationId: string): Promise<void> {
        const client = await this.cacheService.getClient();
        const key = this.getIntegrationImportPrefixCacheKey(workspaceId, integrationId);
        await client.del(key);
    }

    getSearchFilter(search: string): any {
        const regexSearch = getUnaccentRegexString(search);

        return {
            $or: [
                {
                    name: { $regex: `.*${regexSearch}.*`, $options: 'i' },
                },
                {
                    code: { $regex: `.*${regexSearch}.*` },
                },
                {
                    friendlyName: { $regex: `.*${regexSearch}.*`, $options: 'i' },
                },
                {
                    'parent.name': { $regex: `.*${regexSearch}.*`, $options: 'i' },
                },
                {
                    synonyms: {
                        $elemMatch: { $regex: `.*${regexSearch}.*`, $options: 'i' },
                    },
                },
            ],
        };
    }

    getEventsData() {}

    async extractHealthEntity(entityType: HealthEntityType, healthIntegrationId: string, workspaceId: string) {
        try {
            const integration = await this.healthIntegrationService.getModel().findOne({
                _id: new Types.ObjectId(healthIntegrationId),
                workspaceId: new Types.ObjectId(workspaceId),
            });
            const syncedEntities = await this.getEntitiesFromIntegrationToSync(integration, entityType);
            const promises: Promise<any>[] = syncedEntities.map((entity) => {
                return this.saveOrUpdateExternalEntity(
                    integration,
                    entity,
                    integration.workspaceId.toHexString(),
                    entityType,
                );
            });

            promises.push(
                this.healthIntegrationService.update(healthIntegrationId, {
                    syncStatus: HealthIntegrationSynchronizeStatus.synchronizing,
                }),
            );

            const chunks = chunk(promises, 100);
            for (let i = 0; i < chunks.length; i++) {
                await Promise.all(chunks[i]);
            }
        } catch (e) {
            throw e;
        } finally {
            this.logger.log('extractHealthEntity end');
        }
    }

    private async getEntitiesFromIntegrationToSync(
        integration: HealthIntegration,
        entityType: HealthEntityType,
    ): Promise<ExternalHealthEntity[]> {
        try {
            const response = await lastValueFrom(
                this.httpService.get(`integration/${integration._id}/health/integrator/extract/${entityType}`, {
                    timeout: 2_960_000,
                }),
            );

            return response.data ?? [];
        } catch (e) {
            if (e?.response?.status != 400) {
                console.log('HealthEntityService.getEntitiesFromIntegrationToSync', e);
            }
        }
    }

    private async getAllEntitiesFromIntegrationToSync(
        integration: HealthIntegration,
    ): Promise<{ [key: string]: ExternalHealthEntity[] }> {
        try {
            const response = await lastValueFrom(
                this.httpService.get(`integration/${integration._id}/health/integrator/extract-all`, {
                    timeout: 120_000,
                }),
            );

            return response.data ?? [];
        } catch (e) {
            if (e?.response?.status != 400) {
                console.log('HealthEntityService.getAllEntitiesFromIntegrationToSync', e);
            }
        }
    }

    private customFieldsToOmitInUpdate(integration: HealthIntegration, entityType: HealthEntityType): string[] {
        const defaultFieldsToOmit = [];

        switch (entityType) {
            case HealthEntityType.speciality:
                return ['specialityType', ...defaultFieldsToOmit];

            case HealthEntityType.procedure: {
                if (integration.type === IntegrationType.AMIGO) {
                    return ['specialityCode', 'specialityType', ...defaultFieldsToOmit];
                }

                return defaultFieldsToOmit;
            }

            default:
                return defaultFieldsToOmit;
        }
    }

    private getFieldsToUpdateOrOmitExternalEntity(
        entity: ExternalHealthEntity,
        entityType: HealthEntityType,
        integration: HealthIntegration,
    ): FilterQuery<Partial<HealthEntity>> {
        let fieldsToFindUpdate = {} as FilterQuery<Partial<HealthEntity>>;

        switch (entityType) {
            case HealthEntityType.procedure: {
                fieldsToFindUpdate = {
                    specialityCode: entity.specialityCode,
                    specialityType: entity.specialityType,
                    code: entity.code,
                };

                if (integration.type === IntegrationType.AMIGO) {
                    fieldsToFindUpdate = {
                        code: entity.code,
                    };
                }
                break;
            }

            case HealthEntityType.insurancePlan: {
                fieldsToFindUpdate = {
                    insuranceCode: entity.insuranceCode,
                    code: entity.code,
                };
                break;
            }

            case HealthEntityType.speciality: {
                fieldsToFindUpdate = {
                    code: entity.code,
                };

                if (integration.type === IntegrationType.CM || integration.type === IntegrationType.BOTDESIGNER) {
                    fieldsToFindUpdate.specialityType = entity.specialityType;
                }
                break;
            }

            case HealthEntityType.insuranceSubPlan:
            case HealthEntityType.planCategory: {
                fieldsToFindUpdate = {
                    insuranceCode: entity.insuranceCode,
                    insurancePlanCode: entity.insurancePlanCode,
                    code: entity.code,
                };
                break;
            }

            default:
                fieldsToFindUpdate = {
                    code: entity.code,
                };
                break;
        }

        return {
            ...fieldsToFindUpdate,
            integrationId: castObjectId(integration._id),
            workspaceId: integration.workspaceId,
            entityType,
        };
    }

    // Sobrescreve actions que vieram preenchidas de entidades da integração
    private getEntityActionsDefault(entity: HealthEntity | ExternalHealthEntity): Partial<HealthEntity> {
        const data = {
            canSchedule: entity.canSchedule,
            canReschedule: entity.canReschedule,
            canConfirmActive: entity.canConfirmActive,
            canConfirmPassive: entity.canConfirmPassive,
            canCancel: entity.canCancel,
            canView: entity.canView,
            internalSynonyms: [],
        };

        try {
            const diacriticalName = deburr(entity.name);

            if (diacriticalName) {
                data.internalSynonyms.push(diacriticalName.trim().toLowerCase());
            }
        } catch (error) {}

        return omitBy(data, (value) => !value);
    }

    async saveOrUpdateExternalEntity(
        integration: HealthIntegration,
        entity: ExternalHealthEntity,
        workspaceId: string,
        entityType: HealthEntityType,
    ) {
        const entityFindQuery = this.getFieldsToUpdateOrOmitExternalEntity(entity, entityType, integration);
        const fieldsToOmitInUpdate = this.customFieldsToOmitInUpdate(integration, entityType);

        const newEntity = {
            ...omit(entity, fieldsToOmitInUpdate),
            entityType,
            integrationId: castObjectId(integration._id),
            workspaceId: castObjectId(workspaceId),
            activeErp: entity.activeErp,
        } as HealthEntity;

        return await this.model
            .updateMany(
                { ...entityFindQuery },
                {
                    $set: {
                        ...newEntity,
                        ...this.getEntityActionsDefault(newEntity),
                        updatedAt: moment().valueOf(),
                    },
                    $setOnInsert: {
                        friendlyName: entity.name,
                        createdAt: moment().valueOf(),
                        // campo pode ser alterado depois de criado na api, então seta essa campo só quando cria a entidade
                        ...(entityType === HealthEntityType.speciality
                            ? {
                                  specialityType: entity.specialityType,
                              }
                            : {}),
                    },
                },
                { upsert: true },
            )
            .exec();
    }

    async _delete(entityId: string, workspaceId: string) {
        const result = await this.model.updateOne(
            {
                _id: entityId,
                $or: [{ source: HealthEntitySource.user }, { activeErp: false }],
                workspaceId: new Types.ObjectId(workspaceId),
            },
            {
                $set: {
                    deletedAt: +new Date(),
                },
            },
        );

        if (result.modifiedCount === 0) {
            throw Exceptions.HEALTH_ENTITY_NOT_FOUND;
        }
    }

    public async publishAllHealthEntities(healthIntegrationId: string, workspaceId: string) {
        const cacheKeyDefault = getDefaultCacheSyncKey(healthIntegrationId);

        try {
            const integration = await this.healthIntegrationService.getModel().findOne({
                _id: new Types.ObjectId(healthIntegrationId),
                workspaceId: new Types.ObjectId(workspaceId),
            });
            const client = this.cacheService.getClient();
            // verifica se já está executando
            const syncKeys = await client.keys(`API:${cacheKeyDefault}:*`);

            if (syncKeys?.length) {
                throw Exceptions.ALREADY_PUBLISHING_ENTITIES;
            }

            const data: { [entityType: string]: HealthEntity[] } = {};

            for (const entityType of integration.entitiesToSync || Object.values(HealthEntityType)) {
                const lastPublishedEntity = integration.lastSinglePublishEntities?.[entityType] || 0;

                const entities = await this.model.find(
                    {
                        workspaceId: new Types.ObjectId(workspaceId),
                        integrationId: new Types.ObjectId(healthIntegrationId),
                        entityType,
                        $or: [
                            {
                                $and: [
                                    {
                                        deletedAt: {
                                            $gte: lastPublishedEntity,
                                        },
                                    },
                                    {
                                        deletedAt: {
                                            $exists: true,
                                        },
                                    },
                                ],
                            },
                            {
                                $and: [
                                    {
                                        createdAt: {
                                            $gte: lastPublishedEntity,
                                        },
                                    },
                                    {
                                        createdAt: {
                                            $exists: true,
                                        },
                                    },
                                ],
                            },
                            {
                                $and: [
                                    {
                                        updatedAt: {
                                            $gte: lastPublishedEntity,
                                        },
                                    },
                                    {
                                        updatedAt: {
                                            $exists: true,
                                        },
                                    },
                                ],
                            },
                            {
                                $and: [
                                    {
                                        activeErp: false,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        draft: 0,
                        parent: 0,
                    },
                );

                if (entities.length) {
                    data[entityType] = entities;
                    const cacheKeyDefault = getDefaultCacheSyncKey(healthIntegrationId);
                    await client.set(
                        `${cacheKeyDefault}:${entityType}`,
                        JSON.stringify(entities),
                        'EX',
                        DEFAULT_SYNC_EXPIRATION,
                    );
                }
            }

            if (Object.keys(data).length === 0) {
                return;
            }

            await lastValueFrom(
                this.httpService.post(`integration/${integration._id}/health/integrator/synchronize-entities`),
            );

            const date = +new Date();
            await this.healthIntegrationService.getModel().updateOne(
                {
                    _id: healthIntegrationId,
                },
                {
                    $set: {
                        lastSinglePublishEntities: {
                            speciality: date,
                            insurance: date,
                            procedure: date,
                            organizationUnit: date,
                            doctor: date,
                            appointmentType: date,
                            insurancePlan: date,
                            insuranceSubPlan: date,
                            planCategory: date,
                            group: date,
                            occupationArea: date,
                            organizationUnitLocation: date,
                            typeOfService: date,
                        },
                    },
                },
            );

            await this.model.updateMany(
                {
                    workspaceId: new Types.ObjectId(workspaceId),
                    integrationId: integration._id,
                    draft: { $exists: true },
                },
                {
                    $unset: {
                        draft: true,
                    },
                },
            );
        } catch (error) {
            console.error(error);
            await this.cacheService.removeKeysByPattern(`${cacheKeyDefault}*`);
            throw error;
        }
    }

    public async publishHealthEntity(healthIntegrationId: string, workspaceId: string, entityType: HealthEntityType) {
        const cacheKeyDefault = getDefaultCacheSyncKey(healthIntegrationId);

        try {
            const integration = await this.healthIntegrationService.getModel().findOne({
                _id: new Types.ObjectId(healthIntegrationId),
                workspaceId: new Types.ObjectId(workspaceId),
            });
            const client = this.cacheService.getClient();
            const syncKeys = await client.keys(`API:${cacheKeyDefault}:*`);

            if (syncKeys?.length) {
                throw Exceptions.ALREADY_PUBLISHING_ENTITIES;
            }

            const activeEntitiesCount = await this.model.countDocuments({
                workspaceId,
                integrationId: healthIntegrationId,
                $or: [
                    {
                        activeErp: true,
                    },
                    { activeErp: null },
                ],
                entityType,
            });

            if (!activeEntitiesCount) {
                throw Exceptions.CANT_SYNC_ALL_ENTITIES_DISABLED;
            }

            const data: { [entityType: string]: HealthEntity[] } = {};
            const lastPublishedEntity = integration.lastSinglePublishEntities?.[entityType] || 0;

            const entities = await this.model.find(
                {
                    workspaceId: castObjectId(workspaceId),
                    integrationId: castObjectId(healthIntegrationId),
                    entityType,
                    $or: [
                        {
                            $and: [
                                {
                                    deletedAt: {
                                        $gte: lastPublishedEntity,
                                    },
                                },
                                {
                                    deletedAt: {
                                        $exists: true,
                                    },
                                },
                            ],
                        },
                        {
                            $and: [
                                {
                                    createdAt: {
                                        $gte: lastPublishedEntity,
                                    },
                                },
                                {
                                    createdAt: {
                                        $exists: true,
                                    },
                                },
                            ],
                        },
                        {
                            $and: [
                                {
                                    updatedAt: {
                                        $gte: lastPublishedEntity,
                                    },
                                },
                                {
                                    updatedAt: {
                                        $exists: true,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    draft: 0,
                    parent: 0,
                },
            );

            if (entities?.length) {
                data[entityType] = entities || [];
                await client.set(
                    `${cacheKeyDefault}:${entityType}`,
                    JSON.stringify(entities),
                    'EX',
                    DEFAULT_SYNC_EXPIRATION,
                );
            }

            if (Object.keys(data).length === 0) {
                return;
            }

            await lastValueFrom(
                this.httpService.post(
                    `integration/${integration._id}/health/integrator/synchronize-entities/${entityType}`,
                ),
            );

            await this.healthIntegrationService.getModel().updateOne(
                {
                    _id: healthIntegrationId,
                },
                {
                    $set: {
                        [`lastSinglePublishEntities.${[entityType]}`]: +new Date(),
                    },
                },
            );

            await this.model.updateMany(
                {
                    workspaceId: new Types.ObjectId(workspaceId),
                    integrationId: integration._id,
                    entityType: entityType,
                },
                {
                    $unset: {
                        draft: true,
                    },
                },
            );
        } catch (error) {
            console.error(error);
            await this.cacheService.removeKeysByPattern(`${cacheKeyDefault}*`);
            throw error;
        }
    }

    public async extractEachHealthEntity(integration: HealthIntegration, partialEntitiesType?: HealthEntityType[]) {
        const entities: { [key: string]: ExternalHealthEntity[] } = {};

        const toExtractEntities = partialEntitiesType?.length
            ? partialEntitiesType
            : !integration.entitiesToSync?.length
            ? this.defaultEntitiesToSync
            : integration.entitiesToSync;

        for (const entityType of toExtractEntities) {
            const data = await this.getEntitiesFromIntegrationToSync(integration, entityType as HealthEntityType);
            entities[entityType] = data;
        }

        return entities;
    }

    public async extractAllHealthEntitiesFromRedis(integration: HealthIntegration) {
        return await this.getAllEntitiesFromIntegrationToSync(integration);
    }

    public async extractAllHealthEntitities(
        healthIntegrationId: string,
        workspaceId: string,
        partialEntitiesType?: HealthEntityType[],
    ): Promise<{ ok: boolean }> {
        const integration = await this.healthIntegrationService.getModel().findOne({
            _id: new Types.ObjectId(healthIntegrationId),
            workspaceId: new Types.ObjectId(workspaceId),
        });

        if (process.env.NODE_ENV !== 'local') {
            const integrationsStatus: any = await this.externalDataService.getIntegrationStatus(workspaceId);
            const status = integrationsStatus?.find(
                (integrationStatus) => integrationStatus.integrationId === healthIntegrationId,
            );

            if (status?.online === false) {
                throw Exceptions.OFFLINE_INTEGRATION;
            }
        }

        const importAt = await this.getIntegrationImportAtCache(workspaceId, healthIntegrationId);

        if (importAt) {
            throw Exceptions.ERROR_IMPORT_ENTITIES_INTEGRATION;
        } else {
            await this.setIntegrationImportAtCacheKey(workspaceId, healthIntegrationId);
        }

        if (integration.type === IntegrationType.SUPORTE_INFORMATICA) {
            await this.deleteIntegrationImportFromCache(workspaceId, healthIntegrationId);
            await this.extractAllHealthEntitiesFromRedis(integration);
            return { ok: true };
        }

        const entities: { [key: string]: ExternalHealthEntity[] } = await this.extractEachHealthEntity(
            integration,
            partialEntitiesType,
        );

        await this.createEntitiesFromSync(entities, integration);
        await this.createParentEntity(integration);

        await this.healthIntegrationService.getModel().updateOne(
            {
                _id: healthIntegrationId,
            },
            {
                $set: {
                    lastSyncEntities: +new Date(),
                },
            },
        );

        await this.deleteIntegrationImportFromCache(workspaceId, healthIntegrationId);
        return { ok: true };
    }

    private async createEntitiesFromSync(
        entities: { [key: string]: ExternalHealthEntity[] },
        integration: HealthIntegration,
    ): Promise<void> {
        const bulkOps = [];
        const date = +new Date();

        for (const entityType of Object.keys(entities ?? {})) {
            (entities?.[entityType] || [])?.forEach((entity) => {
                if (!Array.isArray(entities[entityType])) {
                    entities[entityType] = [];
                }

                const entityFindQuery = this.getFieldsToUpdateOrOmitExternalEntity(
                    entity,
                    entityType as HealthEntityType,
                    integration,
                );

                const fieldsToOmitInUpdate = this.customFieldsToOmitInUpdate(
                    integration,
                    entityType as HealthEntityType,
                );

                bulkOps.push({
                    updateOne: {
                        filter: entityFindQuery,
                        update: {
                            $set: {
                                ...omit(entity, fieldsToOmitInUpdate),
                                entityType,
                                activeErp: entity.activeErp ?? true,
                                integrationId: castObjectId(integration._id),
                                updatedAt: date,
                                ...this.getEntityActionsDefault(entity),
                                deletedAt: null,
                            } as HealthEntity,
                            $setOnInsert: {
                                createdAt: date,
                                friendlyName: entity.name,
                                // campo pode ser alterado depois de criado na api, então seta essa campo só quando cria a entidade
                                ...(entityType === HealthEntityType.speciality
                                    ? {
                                          specialityType: entity.specialityType,
                                      }
                                    : {}),
                            },
                        },
                        upsert: true,
                    },
                });
            });
        }

        if (!bulkOps.length) {
            return;
        }

        const session = await this.model.db.startSession();
        session.startTransaction();

        try {
            await this.model
                .updateMany(
                    {
                        integrationId: integration._id,
                        source: HealthEntitySource.erp,
                        entityType: {
                            $in: [
                                ...((integration.entitiesToSync as HealthEntityType[]) ?? this.defaultEntitiesToSync),
                            ],
                        },
                    },
                    { activeErp: false },
                    { session },
                )
                .exec();

            await this.model.bulkWrite(bulkOps, { session });
            await session.commitTransaction();
        } catch (error) {
            this.logger.error(error);
            await session.abortTransaction();
        } finally {
            await session.endSession();
        }
    }

    private async createParentEntity(integration: HealthIntegration): Promise<void> {
        const savedEntities = await this.model.find({
            integrationId: castObjectId(integration._id),
            $or: [
                {
                    entityType: {
                        $in: [HealthEntityType.insurance, HealthEntityType.speciality, HealthEntityType.insurancePlan],
                    },
                },
                {
                    entityType: {
                        $in: [
                            HealthEntityType.insuranceSubPlan,
                            HealthEntityType.planCategory,
                            HealthEntityType.procedure,
                        ],
                    },
                    parent: { $exists: false },
                },
            ],
        });

        const savedEntitiesGrouped: { [key: string]: HealthEntity[] } = groupBy(
            savedEntities,
            (item: HealthEntity) => item.entityType,
        ) as { [key: string]: HealthEntity[] };

        const mapSavedEntitiesGrouped = savedEntitiesGrouped[HealthEntityType.insurance]?.reduce<{
            [key: string]: { [key: string]: HealthEntity };
        }>((acc, entity) => {
            acc[entity.entityType] = {
                ...acc[entity.entityType],
                [entity.code]: entity,
            };
            return acc;
        }, {});

        const bulkOps = [];

        const getOperation = (entity) => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(entity._id) },
                update: {
                    $set: entity,
                },
                upsert: true,
            },
        });

        Object.keys(savedEntitiesGrouped).forEach((entityType) => {
            switch (entityType) {
                case HealthEntityType.procedure: {
                    savedEntitiesGrouped[entityType].forEach((entity) => {
                        if (!entity.parent) {
                            const specialities = savedEntitiesGrouped[HealthEntityType.speciality] ?? [];
                            const parent = specialities?.find(
                                (speciality) =>
                                    (speciality.code === entity.specialityCode &&
                                        speciality.specialityType === entity.specialityType) ||
                                    ((integration.type === IntegrationType.FEEGOW ||
                                        integration.type === IntegrationType.MANAGER) &&
                                        speciality.code === entity.specialityCode),
                            );

                            if (parent) {
                                return bulkOps.push(getOperation({ ...entity.toJSON({ minimize: false }), parent }));
                            }
                        }
                    });
                    break;
                }

                case HealthEntityType.insurancePlan: {
                    savedEntitiesGrouped[entityType]?.forEach((entity) => {
                        if (!entity.parent) {
                            const insurances = mapSavedEntitiesGrouped[HealthEntityType.insurance] ?? {};
                            const parent = insurances[entity.insuranceCode];

                            if (parent) {
                                return bulkOps.push(getOperation({ ...entity.toJSON({ minimize: false }), parent }));
                            }
                        }
                    });
                    break;
                }

                case HealthEntityType.planCategory: {
                    savedEntitiesGrouped[entityType]?.forEach((entity) => {
                        if (!entity.parent) {
                            const insurances = mapSavedEntitiesGrouped[HealthEntityType.insurance] ?? {};
                            const parent = insurances[entity.insuranceCode];

                            if (parent) {
                                return bulkOps.push(getOperation({ ...entity.toJSON({ minimize: false }), parent }));
                            }
                        }
                    });
                    break;
                }

                case HealthEntityType.insuranceSubPlan: {
                    savedEntitiesGrouped[entityType]?.forEach((entity) => {
                        if (!entity.parent) {
                            const insurancePlans = savedEntitiesGrouped[HealthEntityType.insurancePlan] ?? [];
                            const parent = insurancePlans?.find(
                                (insurancePlan) =>
                                    insurancePlan.code == entity.insurancePlanCode &&
                                    insurancePlan.insuranceCode === entity.insuranceCode,
                            );

                            if (parent) {
                                return bulkOps.push(getOperation({ ...entity.toJSON({ minimize: false }), parent }));
                            }
                        }
                    });
                    break;
                }
            }
        });

        if (!bulkOps.length) {
            return;
        }

        await Promise.all(chunk(bulkOps, 70).map((bulkOpsChunk) => this.model.bulkWrite(bulkOpsChunk)));
    }

    public async updateEntity(
        healthEntityId: string,
        data: Partial<IHealthEntity>,
        workspaceId: string,
        user: User,
        updateSpecialityType?: boolean,
    ): Promise<HealthEntity> {
        const entity = await this.model.findOne({ _id: healthEntityId });

        if (!entity?.draft) {
            const newData = { ...data, draft: { ...entity } };
            data = newData;
        }

        await this.model.updateOne(
            {
                _id: new Types.ObjectId(healthEntityId),
                workspaceId: new Types.ObjectId(workspaceId),
            },
            { ...data, updatedAt: moment().valueOf(), updatedBy: user._id },
        );

        const updatedEntity = await this.model.findOne({ _id: healthEntityId });
        let overrideParams: Partial<IHealthEntity> = {};

        if (
            // Caso o campo specialityType mude na entidade do tipo speciality, deve mudar este campo também no seu parent
            entity.entityType === HealthEntityType.speciality &&
            updatedEntity?.specialityType !== entity?.specialityType &&
            updateSpecialityType
        ) {
            overrideParams = { specialityType: updatedEntity.specialityType };
        }

        await this.updateEntityParent(updatedEntity, overrideParams);
        return updatedEntity;
    }

    private async updateEntityParent(entity: HealthEntity, overrideParams?: any) {
        await this.model.updateMany(
            {
                'parent._id': castObjectId(entity._id),
            },
            {
                $set: {
                    parent: entity,
                    updatedBy: entity.updatedBy,
                    updatedAt: entity.updatedAt,
                    ...overrideParams,
                },
            },
        );
    }

    public async updateReverseChangesEntity(
        healthEntityId: string,
        data: Partial<IHealthEntity>,
        workspaceId: string,
    ): Promise<HealthEntity> {
        await this.model.replaceOne(
            {
                _id: new Types.ObjectId(healthEntityId),
                workspaceId: new Types.ObjectId(workspaceId),
            },
            {
                ...data,
            },
        );

        const updatedEntity = await this.model.findOne({ _id: healthEntityId });
        await this.updateEntityParent(updatedEntity);

        return updatedEntity;
    }

    public async updateEntityBatch(data: HealthEntity[], workspaceId: string, user: User): Promise<any> {
        return await data.map(async (entity) => {
            await this.updateEntity(castObjectIdToString(entity._id), entity, workspaceId, user);
        });
    }

    public async deleteEntityBatch(entityIds: string[]): Promise<any> {
        return await this.model.updateMany(
            { _id: { $in: entityIds } },
            {
                $set: {
                    deletedAt: +new Date(),
                },
            },
        );
    }

    public async createEntity(entities: IHealthEntity[]): Promise<HealthEntity[]> {
        try {
            for (const entity of entities) {
                if (entity.source == HealthEntitySource.user) {
                    entity.activeErp = true;
                }
            }
        } catch (e) {
            Sentry.captureException(e);
        }

        return await this.model.insertMany(entities);
    }

    public async createEntitiesFromRedisSync(integration: HealthIntegration) {
        const bulkOps = [];
        const defaultRedisKey = 'INTEGRATOR:' + integration._id + ':extract';
        const client = this.cacheService.getClient();
        const date = +new Date();

        for (const entityType of Object.values(HealthEntityType)) {
            const entities: any = await client.hgetall(`${defaultRedisKey}:${entityType}`);

            (Object.values(entities) as string[])?.forEach((stringEntity) => {
                const entity = JSON.parse(stringEntity);

                const entityFindQuery = this.getFieldsToUpdateOrOmitExternalEntity(
                    entity,
                    entityType as HealthEntityType,
                    integration,
                );

                const fieldsToOmitInUpdate = this.customFieldsToOmitInUpdate(
                    integration,
                    entityType as HealthEntityType,
                );

                bulkOps.push({
                    updateOne: {
                        filter: entityFindQuery,
                        update: {
                            $set: {
                                ...omit(entity, fieldsToOmitInUpdate),
                                entityType,
                                activeErp: entity.activeErp ?? true,
                                integrationId: castObjectId(integration._id),
                                updatedAt: date,
                                deletedAt: null,
                            } as HealthEntity,
                            $setOnInsert: {
                                friendlyName: entity.name,
                                // campo pode ser alterado depois de criado na api, então seta essa campo só quando cria a entidade
                                ...(entityType === HealthEntityType.speciality
                                    ? {
                                          specialityType: entity.specialityType,
                                      }
                                    : {}),
                            },
                        },
                        upsert: true,
                    },
                });
            });
        }

        if (!bulkOps.length) {
            return;
        }

        const session = await this.model.db.startSession();
        session.startTransaction();

        try {
            await this.model
                .updateMany(
                    {
                        integrationId: integration._id,
                        source: HealthEntitySource.erp,
                        entityType: {
                            $in: [
                                ...((integration.entitiesToSync as HealthEntityType[]) ?? this.defaultEntitiesToSync),
                            ],
                        },
                    },
                    { activeErp: false },
                )
                .exec();

            await Promise.all(chunk(bulkOps, 50).map((bulkOpsChunk) => this.model.bulkWrite(bulkOpsChunk)));
            await session.commitTransaction();
        } catch (error) {
            this.logger.error(error);
            await session.abortTransaction();
        } finally {
            await session.endSession();
        }

        Object.values(HealthEntityType).forEach(async (entityType) => {
            await client.del(`${defaultRedisKey}:${entityType}`);
        });

        return { ok: true };
    }

    public async syncEntitiesFromRedis(integration: HealthIntegration) {
        await this.createEntitiesFromRedisSync(integration);
        await this.createParentEntity(integration);

        await this.healthIntegrationService.getModel().updateOne(
            {
                _id: integration._id,
            },
            {
                $set: {
                    lastSyncEntities: +new Date(),
                },
            },
        );
    }

    @CatchError()
    public async getHealthEntitiesToSync({
        workspaceId,
        integrationId,
        entityType,
    }: {
        workspaceId: string;
        integrationId: string;
        entityType: HealthEntityType;
    }) {
        const integration = await this.healthIntegrationService.findOne({
            workspaceId,
            _id: integrationId,
        });

        const lastPublishEntities = integration.lastSinglePublishEntities?.[entityType] || 1;

        const entities = await this.model.find({
            integrationId: new Types.ObjectId(integrationId),
            workspaceId: new Types.ObjectId(workspaceId),
            entityType,
            $or: [
                {
                    deletedAt: {
                        $gte: lastPublishEntities,
                    },
                },
                {
                    updatedAt: {
                        $gte: lastPublishEntities,
                    },
                },
            ],
        });

        return entities;
    }

    async getPendingPublicationEntitiesByIntegrationId(workspaceId: string, integration: HealthIntegration) {
        let pendingEntities: boolean = false;

        for (const entity of integration.entitiesToSync) {
            const lastPublishEntity = integration.lastSinglePublishEntities?.[entity] || 0;

            if (!pendingEntities) {
                const result = await this.model.find({
                    workspaceId: castObjectId(workspaceId),
                    integrationId: castObjectId(integration._id),
                    entityType: entity,
                    $or: [
                        {
                            deletedAt: {
                                $gte: lastPublishEntity,
                            },
                        },
                        {
                            updatedAt: {
                                $gte: lastPublishEntity,
                            },
                        },
                        {
                            createdAt: {
                                $gte: lastPublishEntity,
                            },
                        },
                    ],
                });

                if (result?.length) {
                    pendingEntities = true;
                }
            }
        }
        return pendingEntities;
    }

    async deleteDisabledHealthEntities(
        integrationId: string,
        workspaceId: string,
        entityType: HealthEntityType,
    ): Promise<DeleteDisabledHealthEntitiesResponse> {
        const filter = {
            integrationId: castObjectId(integrationId),
            workspaceId: castObjectId(workspaceId),
            entityType,
            activeErp: false,
            $or: [{ deletedAt: { $eq: null } }, { deletedAt: { $exists: false } }],
        };

        const result = await this.model.updateMany(filter, {
            $set: {
                deletedAt: +new Date(),
            },
        });

        if (result.modifiedCount === 0) throw Exceptions.HEALTH_ENTITY_NOT_FOUND;

        return { ok: true };
    }
}
