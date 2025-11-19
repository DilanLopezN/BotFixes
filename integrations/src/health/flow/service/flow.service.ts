import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Flow, FlowDocument } from '../schema/flow.schema';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { EntityType } from '../../interfaces/entity.interface';
import { FlowAction, FlowType, FlowSteps, IApiFlow, IFlow } from '../interfaces/flow.interface';
import { EntityDocument } from '../../entities/schema';
import { Appointment } from '../../interfaces/appointment.interface';
import * as moment from 'moment';
import { FlowTransformerService } from './flow-transformer.service';
import { chunk, groupBy, omit, pick } from 'lodash';
import { MatchAppoinemtntsFlow } from '../interfaces/match-appointments-flows';
import { MatchEntitiesFlow } from '../interfaces/match-entities-flows';
import { MatchFlowActions } from '../interfaces/match-flow-actions';
import { castObjectId, castObjectIdToString } from '../../../common/helpers/cast-objectid';
import { FlowDraft, FlowDraftDocument } from '../schema/flow-draft.schema';
import * as contextService from 'request-context';
import { CtxMetadata } from '../../../common/interfaces/ctx-metadata';
import { isHomologChannel } from '../../../common/helpers/homolog-channel';
import { FlowFilters, FlowsByFilter } from '../interfaces/flow-filters.interface';
import { FlowCacheService } from './flow-cache.service';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    @InjectModel(Flow.name) protected flowModel: Model<FlowDocument>,
    @InjectModel(FlowDraft.name) protected flowDraftModel: Model<FlowDraftDocument>,
    private readonly flowTransformerService: FlowTransformerService,
    private readonly flowCacheService: FlowCacheService,
  ) {}

  private getModel(): Model<FlowDocument | FlowDraftDocument> {
    const metadata: CtxMetadata = contextService.get('req:default-headers');

    if (isHomologChannel(metadata?.channelId)) {
      return this.flowDraftModel;
    }
    return this.flowModel;
  }

  public async create(flow: Omit<IFlow, '_id'>) {
    return await this.getModel().create(flow);
  }

  public async update(flowId: string, flow: Omit<IFlow, 'createdAt' | '_id'>) {
    return await this.getModel().updateOne(
      {
        _id: flowId,
        integrationId: castObjectId(flow.integrationId),
      },
      {
        $set: flow,
      },
    );
  }

  public async syncDraft(integrationId: Types.ObjectId, flows: IApiFlow[]) {
    try {
      const bulkOps: Parameters<Model<FlowDocument>['bulkWrite']>[0] = flows.map((flow) => {
        if (!!flow.deletedAt) {
          return {
            updateOne: {
              filter: { _id: castObjectId(flow._id) },
              update: {
                $set: {
                  ...omit(flow, ['_id']),
                  integrationId: castObjectId(flow.integrationId),
                  deletedAt: moment.utc(flow.deletedAt).valueOf(),
                  updatedAt: moment.utc(flow.updatedAt).valueOf(),
                  createdAt: moment.utc(flow.createdAt).valueOf(),
                },
              },
              upsert: true,
            },
          };
        }

        const keys: { [key: string]: Types.ObjectId } = {};

        Object.keys(EntityType).forEach((key) => {
          if (!!flow[`${key}Id`]) {
            keys[`${key}Id`] = flow[`${key}Id`];
          }
        });

        return {
          updateOne: {
            filter: { _id: castObjectId(flow._id) },
            update: {
              $set: {
                ...omit(flow, ['_id']),
                integrationId: castObjectId(integrationId),
                ...keys,
                updatedAt: moment.utc(flow.updatedAt).valueOf(),
                createdAt: moment.utc(flow.createdAt).valueOf(),
              },
            },
            upsert: true,
          },
        };
      });

      await Promise.all(chunk(bulkOps, 50).map((bulkOpsChunk) => this.flowDraftModel.bulkWrite(bulkOpsChunk)));

      await this.flowCacheService.clearMatchFlowsAndGetActionsCacheByIntegrationId(castObjectIdToString(integrationId));

      return {
        ok: true,
      };
    } catch (error) {
      this.logger.error('FlowService.syncDraft', error);
      throw error;
    }
  }

  public async sync(integrationId: Types.ObjectId) {
    const draftFlows = await this.flowDraftModel.find({
      integrationId: castObjectId(integrationId),
      $or: [{ inactive: { $eq: false } }, { inactive: { $eq: null } }],
      deletedAt: { $eq: null },
    });

    const session = await this.flowModel.db.startSession();
    session.startTransaction({
      maxCommitTimeMS: 60_000,
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', wtimeout: 60_000 },
    });

    try {
      await this.flowModel.deleteMany(
        {
          integrationId: castObjectId(integrationId),
        },
        { session },
      );

      if (!draftFlows?.length) {
        await session.commitTransaction();
        return {
          ok: true,
        };
      }

      const flows: Flow[] = [];
      const publishedAt = moment().valueOf();

      for (const draftFlow of draftFlows) {
        flows.push({
          ...draftFlow.toJSON(),
          publishedAt,
        });
      }

      await this.flowModel.insertMany(flows, { session });
      await session.commitTransaction();

      await this.flowCacheService.clearMatchFlowsAndGetActionsCacheByIntegrationId(castObjectIdToString(integrationId));

      return {
        ok: true,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('FlowService.', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  public async getFlowsByCorrelation(
    integrationId: Types.ObjectId,
    filters: CorrelationFilter,
    targetEntity: EntityType,
  ): Promise<FlowDocument[]> {
    const query: FilterQuery<FlowDocument> = {
      integrationId: castObjectId(integrationId),
      $or: [{ inactive: { $eq: false } }, { inactive: { $eq: null } }],
      type: FlowType.correlation,
      deletedAt: { $eq: null },
      [`${targetEntity}Id`]: { $exists: true, $gt: [] },
    };

    const validFilters = pick(filters, Object.keys(EntityType)) || {};

    Object.keys(validFilters).forEach((key) => {
      if (!query.$and) {
        query.$and = [];
      }

      query.$and.push({
        [`${key}Id`]: { $in: [castObjectId(validFilters[key]._id)] },
      });
    });

    return await this.getModel().find(query);
  }

  private async getFlowsByFilter({
    entitiesFilter,
    filters,
    integrationId,
    targetEntities,
    filterUnmatchedEntity,
    flowType,
    matchExactIds,
    trigger,
  }: FlowsByFilter): Promise<FlowDocument[]> {
    const matchedFilterKeys: EntityType[] = [];
    const unMatchedFilterKeys: EntityType[] = [];

    Object.keys(EntityType).forEach((entityType) => {
      if (!!entitiesFilter?.[entityType]?._id) {
        return matchedFilterKeys.push(entityType as EntityType);
      }
      unMatchedFilterKeys.push(entityType as EntityType);
    });

    const queryMatched = matchedFilterKeys.reduce((acc, matchedEntityTypeKey) => {
      const formattedMatchedEntityTypeKey = `${matchedEntityTypeKey}Id`;

      return [
        ...acc,
        {
          $expr: {
            $cond: {
              if: { $in: [matchedEntityTypeKey, { $ifNull: ['$opposeStep', []] }] },
              then: {
                $or: [
                  {
                    $not: [
                      {
                        $in: [
                          castObjectId(entitiesFilter[matchedEntityTypeKey]._id),
                          { $ifNull: [`$${formattedMatchedEntityTypeKey}`, []] },
                        ],
                      },
                    ],
                  },
                  { $eq: [{ $type: `$${formattedMatchedEntityTypeKey}` }, 'missing'] },
                  { $eq: [`$${formattedMatchedEntityTypeKey}`, null] },
                  {
                    $and: [
                      { $isArray: `$${formattedMatchedEntityTypeKey}` },
                      { $eq: [{ $size: `$${formattedMatchedEntityTypeKey}` }, 0] },
                    ],
                  },
                ],
              },
              else: {
                $or: [
                  {
                    $in: [
                      castObjectId(entitiesFilter[matchedEntityTypeKey]._id),
                      { $ifNull: [`$${formattedMatchedEntityTypeKey}`, []] },
                    ],
                  },
                  { $eq: [{ $type: `$${formattedMatchedEntityTypeKey}` }, 'missing'] },
                  { $eq: [`$${formattedMatchedEntityTypeKey}`, null] },
                  {
                    $and: [
                      { $isArray: `$${formattedMatchedEntityTypeKey}` },
                      { $eq: [{ $size: `$${formattedMatchedEntityTypeKey}` }, 0] },
                    ],
                  },
                ],
              },
            },
          },
        },
      ];
    }, []);

    const queryUnMatched = unMatchedFilterKeys
      // filtra opcionalmente para para não fazer filtro de certas entidades no flow
      .filter((unMatchedEntityTypeKey) =>
        filterUnmatchedEntity?.length
          ? !filterUnmatchedEntity.includes(unMatchedEntityTypeKey as EntityType)
          : !targetEntities.includes(unMatchedEntityTypeKey as unknown as FlowSteps),
      )
      .reduce<FilterQuery<FlowDocument>[]>((acc, unMatchedEntityTypeKey) => {
        const formattedUnMatchedEntityTypeKey = `${unMatchedEntityTypeKey}Id`;

        return [
          ...acc,
          {
            $or: [
              { [formattedUnMatchedEntityTypeKey]: { $exists: false } },
              { [formattedUnMatchedEntityTypeKey]: { $eq: null } },
              { [formattedUnMatchedEntityTypeKey]: { $size: 0 } },
            ],
          },
        ];
      }, []);

    const andQuery: FilterQuery<FlowDocument>[] = [
      ...queryMatched,
      { $and: [...queryUnMatched] },
      {
        $or: [
          { step: { $in: [...(targetEntities ?? [])] } },
          { step: { $exists: false } },
          { step: { $eq: null } },
          { step: { $size: 0 } },
        ],
      },
    ];

    if (!!trigger) {
      andQuery.push({ trigger: { $eq: trigger } });
    } else {
      andQuery.push({ $or: [{ trigger: { $size: 0 } }, { trigger: { $eq: null } }] });
    }

    const query: FilterQuery<FlowDocument> = {
      integrationId: castObjectId(integrationId),
      $and: andQuery,
      $or: [{ inactive: { $eq: false } }, { inactive: { $eq: null } }],
      // tipo correlação não executa flow
      type: { $nin: [FlowType.correlation] },
      deletedAt: { $eq: null },
    };

    // faz match exato de entidades
    if (!!matchExactIds) {
      const partialQuery: FilterQuery<FlowDocument>[] = [];

      Object.keys(matchExactIds).forEach((entityType) => {
        const formattedEntityTypeKey = `${entityType}Id`;

        partialQuery.push({
          $or: [
            { [formattedEntityTypeKey]: { $in: matchExactIds[entityType].map((id) => castObjectId(id)) } },
            { [formattedEntityTypeKey]: { $exists: false } },
            { [formattedEntityTypeKey]: { $eq: null } },
            { [formattedEntityTypeKey]: { $size: 0 } },
          ],
        });
      });

      query.$and = [...partialQuery, ...query.$and];
    }

    if (!!flowType) {
      delete query.type;
      query.type = flowType;
    }

    // filtra por idade, dentro do range minimo e máximo ou se min ou max estiver null, considera apenas um
    if (filters) {
      if (filters.patientAge >= 0) {
        query.$and = [
          ...query.$and,
          {
            $or: [
              { $and: [{ minimumAge: { $lte: filters.patientAge } }, { maximumAge: { $gte: filters.patientAge } }] },
              { $and: [{ minimumAge: { $lte: filters.patientAge } }, { maximumAge: { $eq: null } }] },
              { $and: [{ minimumAge: { $eq: null } }, { maximumAge: { $gte: filters.patientAge } }] },
              { $and: [{ minimumAge: { $eq: null } }, { maximumAge: { $eq: null } }] },
            ],
          },
        ];
      }

      // filtra por periodo só os que tiverem periodo cadastrado, se não tiver também retorna
      if (filters.periodOfDay) {
        query.$and = [
          ...query.$and,
          {
            $or: [
              { periodOfDay: filters.periodOfDay },
              { periodOfDay: { $exists: false } },
              { periodOfDay: { $eq: null } },
            ],
          },
        ];
      }

      if (filters.patientSex?.length) {
        query.$and = [
          ...query.$and,
          {
            $or: [
              { patientSex: filters.patientSex },
              { patientSex: { $exists: false } },
              { patientSex: { $eq: null } },
            ],
          },
        ];
      }

      if (filters.patientCpf?.length) {
        query.$and = [
          ...query.$and,
          {
            $or: [
              { cpfs: { $in: [filters.patientCpf] } },
              { cpfs: { $exists: false } },
              { cpfs: { $eq: null } },
              { cpfs: { $size: 0 } },
            ],
          },
        ];
      }

      const now: number = moment().valueOf();
      const time = moment.duration(moment(now).format('HH:mm')).valueOf();

      query.$and = [
        ...query.$and,
        {
          $or: [
            { $and: [{ executeFrom: { $lte: now } }, { executeUntil: { $gte: now } }] },
            { $and: [{ executeFrom: { $lte: now } }, { executeUntil: { $eq: null } }] },
            { $and: [{ executeFrom: { $eq: null } }, { executeUntil: { $gte: now } }] },
            { $and: [{ executeFrom: { $eq: null } }, { executeUntil: { $eq: null } }] },
          ],
        },
        {
          $or: [
            { $and: [{ runBetweenStart: { $lte: time as number } }, { runBetweenEnd: { $gte: time as number } }] },
            { $and: [{ runBetweenStart: { $lte: time as number } }, { runBetweenEnd: { $eq: null } }] },
            { $and: [{ runBetweenStart: { $eq: null } }, { runBetweenEnd: { $gte: time as number } }] },
            { $and: [{ runBetweenStart: { $eq: null } }, { runBetweenEnd: { $eq: null } }] },
          ],
        },
      ];
    }

    return await this.getModel().aggregate([{ $match: { ...query } }]);
  }

  private getHexId(id: any) {
    return id?.toHexString?.() ?? id;
  }

  private getHexIds(ids: null | string[] | Types.ObjectId[]) {
    return ids?.map((id) => this.getHexId(id)) ?? [];
  }

  private implementAnyFlowFilters(
    flow: Flow,
    entitiesFilter: CorrelationFilter,
    ignoreEntityType?: FlowSteps,
  ): boolean {
    let implement = undefined;

    if (!Object.keys(EntityType).includes(ignoreEntityType)) {
      return false;
    }

    Object.keys(EntityType)
      .filter((entityType) => entityType !== ignoreEntityType)
      .forEach((entityType) => {
        implement = implement || !!this.getHexIds(flow[`${entityType}Id`]).includes(entitiesFilter?.[entityType]?._id);
      });

    return implement;
  }

  private existAnyValidEntityFilters(filters: CorrelationFilter): boolean {
    let anyValidFilter = false;

    Object.keys(EntityType).forEach((entityType) => {
      anyValidFilter = anyValidFilter || !!filters?.[entityType]?._id;
    });

    return anyValidFilter;
  }

  public async matchEntitiesFlows({
    entities,
    entitiesFilter,
    filters,
    integrationId,
    targetEntity,
    forceTargetEntityToCompare,
  }: MatchEntitiesFlow): Promise<[EntityDocument[], { [flowId: string]: FlowType }]> {
    const params: FlowsByFilter = {
      integrationId,
      entitiesFilter,
      targetEntities: [targetEntity],
      filters: {
        periodOfDay: filters.periodOfDay,
        patientAge: filters.patientBornDate ? moment().diff(filters.patientBornDate, 'years') : undefined,
        patientSex: filters.patientSex,
        patientCpf: filters.patientCpf,
      },
    };

    if (forceTargetEntityToCompare) {
      params.targetEntities.push(forceTargetEntityToCompare);
      targetEntity = forceTargetEntityToCompare;
    }

    // se a entidade tiver código negativo ela é virtual então removo para não atrapalhar o match de flows
    if (entitiesFilter?.[targetEntity]?.code < 0) {
      entitiesFilter[targetEntity] = null;
    }

    const flows = await this.getFlowsByFilter(params);

    if (!flows.length) {
      return [entities, null];
    }

    const executedFlows = new Map<string, FlowType>();

    const entitiesToMap: EntityDocument[] = [];
    const groupedFlows = groupBy(flows, 'type');
    // Primeiro trata as inclusões para filtrar e depois aplicar as actions
    // ou omissões apenas nestes

    // IncludeOnly só funciona se vier pelo menos um filtro aplicado, para evitar erros
    // Ex: Adicioar apenas X especialidades se o convenio for "Particular"
    const includeOnlyFlows = groupedFlows[FlowType.includeOnly] || [];

    try {
      const newIncludeEntities: EntityDocument[] = [];

      if (includeOnlyFlows.length) {
        entities.forEach((entity) => {
          let includeEntity = false;

          includeOnlyFlows.forEach((flow) => {
            const matchAnyFilter = this.implementAnyFlowFilters(flow, entitiesFilter, targetEntity);

            if (
              this.getHexIds(flow[`${targetEntity}Id`]).includes(this.getHexId(entity._id)) &&
              (matchAnyFilter || this.existAnyValidEntityFilters(entitiesFilter))
            ) {
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
              includeEntity = true;
            }
          });

          if (includeEntity) {
            newIncludeEntities.push(entity);
          }
        });
      }

      if (newIncludeEntities.length) {
        entitiesToMap.push(...newIncludeEntities);
      }
    } catch (error) {
      this.logger.error('FlowService.matchEntitiesFlows', error);
    }

    // se não deu tem nenhum includeOnly utiliza todas as entidades
    // se tem pelo menos um deveria ter dado match nas entidades
    if (!includeOnlyFlows.length) {
      entitiesToMap.push(...entities);
    }

    const newEntities: any[] = [];
    const flowsWithoutIncludeOnly = [...(groupedFlows[FlowType.action] ?? []), ...(groupedFlows[FlowType.omit] ?? [])];

    entitiesToMap.forEach((entity) => {
      const newEntity = { ...(entity.toJSON?.() ?? entity) };
      const actions = [];
      let skip = false;

      flowsWithoutIncludeOnly.forEach((flow) => {
        let isOpposedStep = null;
        if (flow.opposeStep && flow.opposeStep.length > 0) {
          isOpposedStep = flow.opposeStep.filter((step) => step === targetEntity)?.[0];
        }

        if (isOpposedStep) {
          if (flow.type === FlowType.action) {
            if (
              !this.getHexIds(flow[`${targetEntity}Id`]).includes(this.getHexId(entity._id)) ||
              (!forceTargetEntityToCompare && !flow[`${targetEntity}Id`]?.length)
            ) {
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
              return actions.push(...flow.actions);
            }
          } else if (flow.type === FlowType.omit) {
            if (!this.getHexIds(flow[`${targetEntity}Id`]).includes(this.getHexId(entity._id))) {
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
              skip = true;
              // já realizada combinações no mongo, entao se tiver qualquer um, ignorar
              // se não tem nenhum match no flow da entidade atual, ignora tudo com base nos filtros
            } else if (!flow[`${targetEntity}Id`]?.length && this.implementAnyFlowFilters(flow, entitiesFilter)) {
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
              skip = true;
            }
          }
        } else {
          // se existir um flow com o mesmo tipo da entidade, adicionar acões na propria entidade
          if (flow.type === FlowType.action) {
            if (
              this.getHexIds(flow[`${targetEntity}Id`]).includes(this.getHexId(entity._id)) ||
              (!forceTargetEntityToCompare && !flow[`${targetEntity}Id`]?.length)
            ) {
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
              return actions.push(...flow.actions);
            }
          } else if (flow.type === FlowType.omit) {
            if (this.getHexIds(flow[`${targetEntity}Id`]).includes(this.getHexId(entity._id))) {
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
              skip = true;
              // já realizada combinações no mongo, entao se tiver qualquer um, ignorar
              // se não tem nenhum match no flow da entidade atual, ignora tudo com base nos filtros
            } else if (!flow[`${targetEntity}Id`]?.length && this.implementAnyFlowFilters(flow, entitiesFilter)) {
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
              skip = true;
            }
          }
        }
      });

      if (!skip) {
        if (actions.length) {
          return newEntities.push({
            ...newEntity,
            actions: this.flowTransformerService.transformFlowActions(actions),
          });
        }
        return newEntities.push(newEntity);
      }
    });

    return [newEntities, Object.fromEntries(executedFlows)];
  }

  public async matchAppointmentsFlows({
    appointments,
    entitiesFilter,
    filters,
    integrationId,
    targetEntity,
  }: MatchAppoinemtntsFlow): Promise<[Appointment[], { [flowId: string]: FlowType }]> {
    const flowFilters: FlowFilters = {
      periodOfDay: filters.periodOfDay,
      patientAge: filters.patientBornDate ? moment().diff(filters.patientBornDate, 'years') : undefined,
      patientSex: filters.patientSex,
      patientCpf: filters.patientCpf,
    };

    const actionFlows = await this.getFlowsByFilter({
      integrationId,
      entitiesFilter,
      targetEntities: [targetEntity],
      filters: flowFilters,
      flowType: FlowType.action,
      filterUnmatchedEntity: [EntityType.doctor],
    });

    const omitFlows = await this.getFlowsByFilter({
      integrationId,
      entitiesFilter,
      targetEntities: [targetEntity],
      filters: flowFilters,
      flowType: FlowType.omit,
      filterUnmatchedEntity: [EntityType.doctor],
      matchExactIds: {
        [EntityType.doctor]: Array.from(
          new Set(appointments.map((appointment) => this.getHexId(appointment.doctor?._id))),
        ),
      },
    });

    const flows = [...actionFlows, ...omitFlows];

    if (!flows.length) {
      return [appointments, null];
    }

    const newAppointments: any[] = [];
    const executedFlows = new Map<string, FlowType>();

    appointments.forEach((appointment) => {
      const newAppointment = { ...appointment };
      const actions = [];
      let skip = false;

      flows.forEach((flow) => {
        let isOpposedStep = null;
        if (flow.opposeStep && flow.opposeStep.length > 0) {
          isOpposedStep = flow.opposeStep.filter((step) => step === targetEntity)?.[0];
        }

        if (isOpposedStep) {
          if (
            flow.type === FlowType.action &&
            (!this.getHexIds(flow.doctorId).includes(this.getHexId(appointment.doctor?._id)) || !flow.doctorId)
          ) {
            executedFlows.set(castObjectIdToString(flow._id), flow.type);
            return actions.push(...flow.actions);
          } else if (flow.type === FlowType.omit) {
            // unica entidade que pode não vir, pois é opcional no appointment
            if (!this.getHexIds(flow.doctorId).includes(this.getHexId(appointment.doctor?._id))) {
              skip = true;
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
            } else if (!flow[`${FlowSteps.doctor}Id`]) {
              // tentar trocar isso para a func implementAnyFlowFilters
              if (
                this.getHexIds(flow.insuranceId).includes(entitiesFilter.insurance._id) ||
                this.getHexIds(flow.appointmentTypeId).includes(entitiesFilter.appointmentType?._id) ||
                this.getHexIds(flow.insurancePlanId).includes(entitiesFilter.insurancePlan?._id) ||
                this.getHexIds(flow.insuranceSubPlanId).includes(entitiesFilter.insuranceSubPlan?._id) ||
                this.getHexIds(flow.organizationUnitId).includes(entitiesFilter.organizationUnit?._id) ||
                this.getHexIds(flow.planCategoryId).includes(entitiesFilter.planCategory?._id) ||
                this.getHexIds(flow.procedureId).includes(entitiesFilter.procedure?._id) ||
                this.getHexIds(flow.doctorId).includes(entitiesFilter.doctor?._id) ||
                this.getHexIds(flow.specialityId).includes(entitiesFilter.speciality?._id) ||
                this.getHexIds(flow.occupationAreaId).includes(entitiesFilter.occupationArea?._id) ||
                this.getHexIds(flow.typeOfServiceId).includes(entitiesFilter.typeOfService?._id) ||
                this.getHexIds(flow.organizationUnitLocationId).includes(entitiesFilter.organizationUnitLocation?._id)
              ) {
                executedFlows.set(castObjectIdToString(flow._id), flow.type);
                skip = true;
              }
            }
          }
        } else {
          if (
            flow.type === FlowType.action &&
            (this.getHexIds(flow.doctorId).includes(this.getHexId(appointment.doctor?._id)) || !flow.doctorId)
          ) {
            executedFlows.set(castObjectIdToString(flow._id), flow.type);
            return actions.push(...flow.actions);
          } else if (flow.type === FlowType.omit) {
            // unica entidade que pode não vir, pois é opcional no appointment
            if (this.getHexIds(flow.doctorId).includes(this.getHexId(appointment.doctor?._id))) {
              skip = true;
              executedFlows.set(castObjectIdToString(flow._id), flow.type);
            } else if (!flow[`${FlowSteps.doctor}Id`]) {
              // tentar trocar isso para a func implementAnyFlowFilters
              if (
                this.getHexIds(flow.insuranceId).includes(entitiesFilter.insurance._id) ||
                this.getHexIds(flow.appointmentTypeId).includes(entitiesFilter.appointmentType?._id) ||
                this.getHexIds(flow.insurancePlanId).includes(entitiesFilter.insurancePlan?._id) ||
                this.getHexIds(flow.insuranceSubPlanId).includes(entitiesFilter.insuranceSubPlan?._id) ||
                this.getHexIds(flow.organizationUnitId).includes(entitiesFilter.organizationUnit?._id) ||
                this.getHexIds(flow.planCategoryId).includes(entitiesFilter.planCategory?._id) ||
                this.getHexIds(flow.procedureId).includes(entitiesFilter.procedure?._id) ||
                this.getHexIds(flow.doctorId).includes(entitiesFilter.doctor?._id) ||
                this.getHexIds(flow.specialityId).includes(entitiesFilter.speciality?._id) ||
                this.getHexIds(flow.occupationAreaId).includes(entitiesFilter.occupationArea?._id) ||
                this.getHexIds(flow.typeOfServiceId).includes(entitiesFilter.typeOfService?._id) ||
                this.getHexIds(flow.organizationUnitLocationId).includes(entitiesFilter.organizationUnitLocation?._id)
              ) {
                executedFlows.set(castObjectIdToString(flow._id), flow.type);
                skip = true;
              }
            }
          }
        }
      });

      if (!skip) {
        if (actions.length) {
          return newAppointments.push({
            ...newAppointment,
            actions: this.flowTransformerService.transformFlowActions(actions),
          });
        }
        return newAppointments.push(newAppointment);
      }
    });

    return [newAppointments, Object.fromEntries(executedFlows)];
  }

  public async matchFlowsAndGetActions({
    entitiesFilter,
    filters,
    integrationId,
    targetFlowTypes,
    trigger,
    customFlowActions,
  }: MatchFlowActions): Promise<FlowAction[]> {
    const cacheParams = {
      entitiesFilter,
      filters,
      integrationId,
      targetFlowTypes,
      trigger,
      customFlowActions,
    };

    const cachedResult = await this.flowCacheService.getMatchFlowActionsCache(cacheParams);
    if (cachedResult !== null) {
      return cachedResult;
    }

    const flows = await this.getFlowsByFilter({
      integrationId,
      entitiesFilter,
      targetEntities: targetFlowTypes,
      flowType: FlowType.action,
      filters: {
        periodOfDay: filters?.periodOfDay,
        patientAge: filters?.patientBornDate ? moment().diff(filters.patientBornDate, 'years') : undefined,
        patientSex: filters?.patientSex,
        patientCpf: filters?.patientCpf,
      },
      trigger,
    });

    if (!flows.length && !customFlowActions?.length) {
      const emptyResult: FlowAction[] = [];
      await this.flowCacheService.setMatchFlowActionsCache(cacheParams, emptyResult);
      return emptyResult;
    }

    const flowActions: FlowAction[] = customFlowActions || [];
    flows.forEach((flow) => flowActions.push(...(flow.actions ?? [])));
    const result = this.flowTransformerService.transformFlowActions(flowActions);

    await this.flowCacheService.setMatchFlowActionsCache(cacheParams, result);

    return result;
  }
}
