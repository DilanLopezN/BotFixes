import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { InsuranceEntity, InsuranceEntityDocument } from '../schema/insurance-entity.schema';
import { OrganizationUnitEntity, OrganizationUnitEntityDocument } from '../schema/organization-unit-entity.schema';
import { InsurancePlanEntity, InsurancePlanEntityDocument } from '../schema/insurance-plan-entity.schema';
import { ProcedureEntity, ProcedureEntityDocument } from '../schema/procedure-entity.schema';
import { DoctorEntity, DoctorEntityDocument } from '../schema/doctor-entity.schema';
import { SpecialityEntity, SpecialityEntityDocument } from '../schema/speciality-entity.schema';
import { FilterQuery, Model, Types, Connection } from 'mongoose';
import { EntitySourceType, EntityType, EntityVersionType, IEntity } from '../../interfaces/entity.interface';
import { AppointmentTypeEntity, AppointmentTypeEntityDocument } from '../schema/appointment-type-entity.schema';
import { Entity, EntityDocument } from '../schema/entity.schema';
import { IExternalEntity } from '../../api/interfaces/entity.interface';
import { PlanCategoryEntity, PlanCategoryEntityDocument } from '../schema/plan-category-entity.schema';
import { InsuranceSubPlanEntity, InsuranceSubPlanEntityDocument } from '../schema/insurance-subplan-entity.schema';
import { removeAccents } from '../../../common/helpers/normalize-text.helper';
import {
  OrganizationUnitLocationEntity,
  OrganizationUnitLocationEntityDocument,
} from '../schema/organization-unit-location.schema';
import { OccupationAreaEntity, OccupationAreaEntityDocument } from '../schema/occupation-area.schema';
import { chunk, omit } from 'lodash';
import { TypeOfServiceEntity, TypeOfServiceEntityDocument } from '../schema/type-of-service-entity.schema';
import { castObjectId } from '../../../common/helpers/cast-objectid';
import { ReasonEntity, ReasonEntityDocument } from '../schema/reson-entity.schema';
import { ProjectionType } from 'mongoose';
import {
  CorrelationFilter,
  CorrelationFilterByKey,
  CorrelationFilterByKeys,
} from '../../interfaces/correlation-filter.interface';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { LateralityEntity, LateralityEntityDocument } from '../schema/laterality-entity.schema';

@Injectable()
export class EntitiesService {
  private logger = new Logger(EntitiesService.name);
  private omitFields: ProjectionType<EntityDocument> = {
    synonyms: 0,
    version: 0,
    updatedAt: 0,
    createdAt: 0,
    internalSynonyms: 0,
  };

  constructor(
    @InjectModel(InsuranceEntity.name) private insuranceEntityModel: Model<InsuranceEntityDocument>,
    @InjectModel(OrganizationUnitEntity.name)
    private organizationUnitEntityModel: Model<OrganizationUnitEntityDocument>,
    @InjectModel(InsurancePlanEntity.name) private insurancePlanEntityModel: Model<InsurancePlanEntityDocument>,
    @InjectModel(InsuranceSubPlanEntity.name)
    private insuranceSubPlanEntityModel: Model<InsuranceSubPlanEntityDocument>,
    @InjectModel(AppointmentTypeEntity.name) private appointmentTypeEntityModel: Model<AppointmentTypeEntityDocument>,
    @InjectModel(ProcedureEntity.name) private procedureEntityModel: Model<ProcedureEntityDocument>,
    @InjectModel(DoctorEntity.name) private doctorEntityModel: Model<DoctorEntityDocument>,
    @InjectModel(SpecialityEntity.name) private specialityEntityModel: Model<SpecialityEntityDocument>,
    @InjectModel(PlanCategoryEntity.name) private planCategoryEntityModel: Model<PlanCategoryEntityDocument>,
    @InjectModel(OrganizationUnitLocationEntity.name)
    private organizationUnitLocationEntityModel: Model<OrganizationUnitLocationEntityDocument>,
    @InjectModel(OccupationAreaEntity.name) private occupationAreaEntityModel: Model<OccupationAreaEntityDocument>,
    @InjectModel(TypeOfServiceEntity.name) private typeOfServiceEntityModel: Model<TypeOfServiceEntityDocument>,
    @InjectModel(ReasonEntity.name) private reasonEntityModel: Model<ReasonEntityDocument>,
    @InjectModel(LateralityEntity.name) private lateralityEntityModel: Model<LateralityEntityDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  public getCollection(entityType: EntityType): Model<EntityDocument> {
    const models: { [key in EntityType]: Model<any> } = {
      [EntityType.doctor]: this.doctorEntityModel,
      [EntityType.appointmentType]: this.appointmentTypeEntityModel,
      [EntityType.insurance]: this.insuranceEntityModel,
      [EntityType.insurancePlan]: this.insurancePlanEntityModel,
      [EntityType.insuranceSubPlan]: this.insuranceSubPlanEntityModel,
      [EntityType.organizationUnit]: this.organizationUnitEntityModel,
      [EntityType.procedure]: this.procedureEntityModel,
      [EntityType.speciality]: this.specialityEntityModel,
      [EntityType.planCategory]: this.planCategoryEntityModel,
      [EntityType.occupationArea]: this.occupationAreaEntityModel,
      [EntityType.organizationUnitLocation]: this.organizationUnitLocationEntityModel,
      [EntityType.typeOfService]: this.typeOfServiceEntityModel,
      [EntityType.reason]: this.reasonEntityModel,
      [EntityType.laterality]: this.lateralityEntityModel,
    };

    return models[entityType];
  }

  public async getEntityById(
    id: Types.ObjectId,
    entityType: EntityType,
    integrationId: Types.ObjectId,
  ): Promise<EntityDocument> {
    return await this.getCollection(entityType).findOne(
      {
        _id: id,
        integrationId: castObjectId(integrationId),
      },
      this.omitFields,
    );
  }

  public getModel(entityType: EntityType) {
    return this.getCollection(entityType);
  }

  public async getEntityByCode(
    code: string,
    entityType: EntityType,
    integrationId: Types.ObjectId,
  ): Promise<EntityDocument> {
    return await this.getCollection(entityType).findOne(
      {
        code,
        integrationId: castObjectId(integrationId),
      },
      this.omitFields,
    );
  }

  public async syncEntities(
    integration: IntegrationDocument,
    data: { [entityType: string]: IExternalEntity[] },
  ): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction({
      maxCommitTimeMS: 60_000,
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', wtimeout: 60_000 },
    });

    try {
      for (const entityType of Object.keys(data)) {
        const entities = data[entityType];
        const bulkOps: Parameters<Model<EntityDocument>['bulkWrite']>[0] = [];
        const entitiesIdsToDelete: Types.ObjectId[] = [];

        entities.forEach((entity) => {
          const entityId = castObjectId(entity._id);

          if (entity.deletedAt) {
            entitiesIdsToDelete.push(entityId);
          } else {
            bulkOps.push({
              updateOne: {
                filter: {
                  _id: entityId,
                },
                update: {
                  $set: {
                    ...omit(entity, ['deletedAt', 'entityType', '_id']),
                    version: EntityVersionType.production,
                    integrationId: castObjectId(integration._id),
                  },
                },
                upsert: true,
              },
            });
          }
        });

        const model = this.getCollection(entityType as EntityType);
        // todas as entidades que não vieram da api serão excluidas
        // só atualiza se tiver algo no entitiesIds, se não tiver nada, pode ter dado erro na request então ignoro
        if (entitiesIdsToDelete.length) {
          for (const toDeleteChuck of chunk(entitiesIdsToDelete, 200)) {
            await model.deleteMany(
              {
                _id: { $in: toDeleteChuck },
                integrationId: castObjectId(integration._id),
              },
              { session },
            );
          }
        }

        for (const bulkOpsChunk of chunk(bulkOps, 500)) {
          await model.bulkWrite(bulkOpsChunk, { session });
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('EntitiesService.syncEntities', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  public async getValidEntities(entityType: EntityType, integrationId: Types.ObjectId): Promise<EntityDocument[]> {
    return await this.getCollection(entityType).find(
      {
        integrationId: castObjectId(integrationId),
        canView: true,
        $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
      },
      this.omitFields,
    );
  }

  async getEntitiesByTargetAndName(
    integrationId: Types.ObjectId,
    entityType: EntityType,
    searchTexts: string[],
    ids?: Types.ObjectId[],
    filters?: FilterQuery<EntityDocument>,
  ): Promise<EntityDocument[]> {
    const textConditions = [];

    Array.from(new Set(searchTexts)).forEach((text) => {
      text = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const textWithoutAccents = removeAccents(text);

      textConditions.push(
        ...[
          { friendlyName: { $regex: `.*${text}.*`, $options: 'i' } },
          { synonyms: { $regex: `.*${text}.*`, $options: 'i' } },
          { internalSynonyms: { $regex: `.*${text}.*`, $options: 'i' } },
        ],
      );

      if (textWithoutAccents !== text) {
        textConditions.push(
          ...[
            { friendlyName: { $regex: `.*${textWithoutAccents}.*`, $options: 'i' } },
            { synonyms: { $regex: `.*${textWithoutAccents}.*`, $options: 'i' } },
            { internalSynonyms: { $regex: `.*${textWithoutAccents}.*`, $options: 'i' } },
          ],
        );
      }
    });

    let query: FilterQuery<EntityDocument> = {
      integrationId: castObjectId(integrationId),
      canView: true,
      $and: [
        {
          $or: [...textConditions],
        },
        { $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }] },
      ],
    };

    if (ids?.length) {
      query._id = {
        $in: ids.map((id) => castObjectId(id)),
      };
    }

    if (filters) {
      query = {
        ...query,
        ...filters,
      };
    }

    const entities = await this.getCollection(entityType).find(query, this.omitFields).sort({
      order: -1,
      friendlyName: 1,
    });

    return entities;
  }

  async getEntity(
    entityType: EntityType,
    filters: Partial<Entity>,
    integrationId: Types.ObjectId,
  ): Promise<EntityDocument> {
    return await this.getCollection(entityType).findOne(
      {
        integrationId: castObjectId(integrationId),
        $and: [{ ...filters }],
      },
      this.omitFields,
    );
  }

  async getActiveEntities(
    entityType: EntityType,
    filters: FilterQuery<Entity>,
    integrationId: Types.ObjectId,
  ): Promise<EntityDocument[]> {
    return await this.getCollection(entityType)
      .find(
        {
          integrationId: castObjectId(integrationId),
          canView: true,
          $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
          $and: [{ ...filters }],
        },
        this.omitFields,
      )
      .sort({
        order: -1,
        friendlyName: 1,
      });
  }

  async getEntities(
    entityType: EntityType,
    filters: FilterQuery<Entity>,
    integrationId: Types.ObjectId,
  ): Promise<EntityDocument[]> {
    return await this.getCollection(entityType)
      .find(
        {
          integrationId: castObjectId(integrationId),
          $and: [{ ...filters }],
        },
        this.omitFields,
      )
      .sort({
        order: -1,
        friendlyName: 1,
      });
  }

  async getEntitiesByIds(
    integrationId: Types.ObjectId,
    entityType: EntityType,
    ids: Types.ObjectId[],
    filter: Record<string, any> = { sort: true },
  ): Promise<EntityDocument[]> {
    if (!ids?.length) {
      return [];
    }

    const entities = this.getCollection(entityType).find(
      {
        integrationId: castObjectId(integrationId),
        canView: true,
        $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
        _id: {
          $in: ids.map((id) => castObjectId(id)),
        },
      },
      this.omitFields,
    );

    if (filter?.sort) {
      entities.sort({
        order: -1,
        friendlyName: 1,
      });
    }

    return entities;
  }

  async getEntitiesByIdsPreservingOrder(
    integrationId: Types.ObjectId,
    entityType: EntityType,
    ids: Types.ObjectId[],
  ): Promise<EntityDocument[]> {
    if (!ids?.length) {
      return [];
    }

    const entities = await this.getCollection(entityType)
      .aggregate([
        {
          $match: {
            integrationId: castObjectId(integrationId),
            canView: true,
            $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
            _id: { $in: ids },
          },
        },
        {
          $addFields: {
            __order: { $indexOfArray: [ids, '$_id'] },
          },
        },
        {
          $sort: { __order: 1 },
        },
        {
          $project: {
            __order: 0,
            synonyms: 0,
            version: 0,
            updatedAt: 0,
            createdAt: 0,
            internalSynonyms: 0,
          },
        },
      ])
      .exec();

    return entities as EntityDocument[];
  }

  async getValidErpEntitiesByCode(
    integrationId: Types.ObjectId,
    codes: string[],
    entityType: EntityType,
  ): Promise<EntityDocument[]> {
    const query: FilterQuery<EntityDocument> = {
      integrationId: castObjectId(integrationId),
      canView: true,
      $and: [
        { code: { $in: codes } },
        { $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }] },
        { source: EntitySourceType.erp },
      ],
    };

    return await this.getCollection(entityType).find(query, this.omitFields).sort({
      order: -1,
      friendlyName: 1,
    });
  }

  async getValidEntitiesbyCode(
    integrationId: Types.ObjectId,
    codes: string[],
    entityType: EntityType,
    filters?: FilterQuery<EntityDocument>,
  ): Promise<EntityDocument[]> {
    const orCondition: FilterQuery<EntityDocument>[] = [
      {
        canView: true,
        source: EntitySourceType.user,
      },
    ];

    if (codes?.length) {
      orCondition.unshift({ code: { $in: codes } });
    }

    let query: FilterQuery<EntityDocument> = {
      integrationId: castObjectId(integrationId),
      canView: true,
      $and: [
        {
          $or: orCondition,
        },
        { $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }] },
      ],
    };

    if (filters) {
      query = {
        ...query,
        ...filters,
      };
    }
    return await this.getCollection(entityType).find(query, this.omitFields).sort({
      order: -1,
      friendlyName: 1,
    });
  }

  async getEntitiesByCodes(
    integrationId: Types.ObjectId,
    codes: string[],
    entityType: EntityType,
    filters?: FilterQuery<EntityDocument>,
  ): Promise<EntityDocument[]> {
    const orCondition: FilterQuery<EntityDocument>[] = [
      {
        source: EntitySourceType.user,
      },
    ];

    if (codes?.length) {
      orCondition.unshift({ code: { $in: codes } });
    }

    let query: FilterQuery<EntityDocument> = {
      integrationId: castObjectId(integrationId),
      $and: [
        {
          $or: orCondition,
        },
        { $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }] },
      ],
    };

    if (filters) {
      query = {
        ...query,
        ...filters,
      };
    }
    return await this.getCollection(entityType).find(query, this.omitFields).sort({
      order: -1,
      friendlyName: 1,
    });
  }

  async getAnyEntities(entityType: EntityType, integrationId: Types.ObjectId): Promise<EntityDocument[]> {
    return await this.getCollection(entityType).find(
      {
        integrationId: castObjectId(integrationId),
      },
      this.omitFields,
    );
  }

  async createCorrelationFilterData(
    correlationFilter: CorrelationFilterByKey,
    key: 'code' | '_id',
    integrationId: Types.ObjectId,
  ): Promise<CorrelationFilter> {
    const correlationData: CorrelationFilter = {};

    for (const entityType of Object.keys(correlationFilter)) {
      if (correlationFilter[entityType]) {
        correlationData[entityType] = await this.getEntity(
          entityType as EntityType,
          {
            [key]: correlationFilter[entityType],
          },
          integrationId,
        );
      }
    }

    return correlationData;
  }

  async createCorrelationDataKeys(
    correlationFilter: CorrelationFilterByKeys,
    integrationId: Types.ObjectId,
    onlyActiveEntities: boolean = false,
  ): Promise<{ [entityType: string]: { [entityCode: string]: EntityDocument } }> {
    const correlationData: { [entityType: string]: { [entityCode: string]: EntityDocument } } = {};

    for (const entityType of Object.keys(correlationFilter)) {
      if (!correlationFilter[entityType]?.length) {
        continue;
      }

      let entities: EntityDocument[] = [];
      correlationData[entityType] = {};

      // para montar um objeto que será utilizado para listagem de agendamentos do paciente
      // não precisa necessariamente estar ativo no sistema ou no erp para buscar, por isso
      // esta lógica. Utilizar apenas para integrações que não tem implementado entidades 'Default'
      // que não retornam o nome das entidades nas requests
      if (onlyActiveEntities) {
        entities = await this.getActiveEntities(
          entityType as EntityType,
          {
            code: { $in: correlationFilter[entityType] },
          },
          integrationId,
        );
      } else {
        entities = await this.getEntities(
          entityType as EntityType,
          {
            code: { $in: correlationFilter[entityType] },
          },
          integrationId,
        );
      }

      entities.forEach((entity) => {
        correlationData[entityType][entity.code] = entity;
      });
    }

    return correlationData;
  }
}
