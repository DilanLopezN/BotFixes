import { HttpStatus, Injectable } from '@nestjs/common';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  EntityDocument,
  AppointmentTypeEntityDocument,
  InsuranceEntityDocument,
  OrganizationUnitEntityDocument,
  ProcedureEntityDocument,
  DoctorEntityDocument,
  SpecialityEntityDocument,
  InsurancePlanEntityDocument,
  OccupationAreaEntityDocument,
  OrganizationUnitLocationEntityDocument,
  InsurancePlanEntity,
} from '../../../entities/schema';
import { IIntegratorService } from '../../../integrator/interfaces/integrator-service.interface';
import {
  Appointment,
  AppointmentSortMethod,
  AppointmentStatus,
  AppointmentValue,
  MinifiedAppointments,
} from '../../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import {
  EntitySourceType,
  EntityType,
  EntityTypes,
  SpecialityTypes,
  EntityVersionType,
  IAppointmentTypeEntity,
  IDoctorEntity,
  IInsuranceEntity,
  IInsurancePlanEntity,
  IOrganizationUnitEntity,
  IProcedureEntity,
  ISpecialityEntity,
  ITypeOfServiceEntity,
} from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import { ActivitiesResponse, DoctoraliaResponseArray, DoctoraliaResponsePlain, InsuranceResponse } from '../interfaces';
import {
  DoctoraliaCreatePatientRequest,
  DoctoraliaCreatePatientResponse,
  DoctoraliaGetPatientResponse,
  DoctoraliaUpdatePatientRequest,
} from '../interfaces/patient.interface';
import { DoctoraliaApiService } from './doctoralia-api.service';
import * as moment from 'moment';
import {
  DoctoraliaUpdateAppointmentRequest,
  AppointmentResponse,
  DoctoraliaConfirmedAppointmentResponse,
  DoctoraliaAvailableSchedules,
  DoctoraliaCreateAppointmentRequest,
} from '../interfaces/appointment.interface';
import { AppointmentService, RawAppointment } from '../../../shared/appointment.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { orderBy, uniqBy } from 'lodash';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { InitialPatient } from '../../../integrator/interfaces/patient.interface';
import { between } from '../../../../common/helpers/between';
import { CreateSchedule } from '../../../integrator/interfaces/create-schedule.interface';
import { CancelSchedule } from '../../../integrator/interfaces/cancel-schedule.interface';
import { PatientFilters } from '../../../integrator/interfaces/patient-filters.interface';
import {
  AvailableSchedulesMetadata,
  ListAvailableSchedules,
  ListAvailableSchedulesResponse,
} from '../../../integrator/interfaces/list-available-schedules.interface';
import { ConfirmSchedule } from '../../../integrator/interfaces/confirm-schedule.interface';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { PatientSchedules } from '../../../integrator/interfaces/patient-schedules.interface';
import { Reschedule } from '../../../integrator/interfaces/reschedule.interface';
import { DoctoraliaHelpersService } from './doctoralia-helpers.service';
import { FlowService } from '../../../flow/service/flow.service';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import { formatPhone, getNumberWith9, convertPhoneNumber } from '../../../../common/helpers/format-phone';
import { getExpirationByEntity } from '../../../integration-cache-utils/cache-expirations';
import { defaultAppointmentTypes, defaultTypesOfService } from '../../../entities/default-entities';
import { formatCurrency } from '../../../../common/helpers/format-currency';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { EntitiesFiltersService } from '../../../shared/entities-filters.service';
import { IntegrationRules } from '../../../integration/interfaces/integration.interface';
import { RulesHandlerService } from '../../../rules-handler/rules-handler.service';

type EntityFilters = { [key in EntityType]?: EntityTypes };
type RequestParams = { [key: string]: any };

const SPLIT_LEGACYID_REGEX = /-|_/;

@Injectable()
export class DoctoraliaService implements IIntegratorService {
  constructor(
    private readonly doctoraliaApiService: DoctoraliaApiService,
    private readonly entitiesService: EntitiesService,
    private readonly appointmentService: AppointmentService,
    private readonly doctoraliaHelpersService: DoctoraliaHelpersService,
    private readonly flowService: FlowService,
    private readonly entitiesFiltersService: EntitiesFiltersService,
    private readonly rulesHandlerService: RulesHandlerService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  private async getResourceFilters(
    targetEntity: EntityType,
    filters: EntityFilters,
    integration: IntegrationDocument,
  ): Promise<RequestParams> {
    if (!filters || Object.keys(filters).length === 0) {
      return {};
    }

    const params: RequestParams = {};

    if (filters.hasOwnProperty(EntityType.speciality)) {
      params.typologyid = filters[EntityType.speciality].code;
    }

    if (filters.hasOwnProperty(EntityType.procedure)) {
      params.activityid = filters[EntityType.procedure].code;
    }

    if (
      filters?.organizationUnitLocation?.code &&
      filters.organizationUnitLocation?.references?.length &&
      targetEntity !== EntityType.organizationUnitLocation
    ) {
      const organizationUnits = await this.entitiesService.getCollection(EntityType.organizationUnit).find({
        _id: { $in: filters.organizationUnitLocation.references.map((ref) => castObjectId(ref.refId)) },
        integrationId: castObjectId(integration._id),
        canView: true,
        $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
      });

      if (organizationUnits.length) {
        params.areaid = organizationUnits.map((organizationUnit) => organizationUnit.code);
      }
    } else if (filters.hasOwnProperty(EntityType.organizationUnit)) {
      params.areaid = filters[EntityType.organizationUnit].code;
    }

    if (filters.hasOwnProperty(EntityType.doctor)) {
      params.resourceid = filters[EntityType.doctor].code;
    }

    if (
      this.doctoraliaHelpersService.runSplitInsuranceIntoInsurancePlansRule(integration) &&
      filters.hasOwnProperty(EntityType.insurancePlan)
    ) {
      params.insuranceid = filters[EntityType.insurancePlan].code;
    } else if (filters.hasOwnProperty(EntityType.insurance)) {
      params.insuranceid = filters[EntityType.insurance].code;
    }

    return params;
  }

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    filter?: CorrelationFilter,
    cache: boolean = false,
  ) {
    return await this.extractEntity(integration, entityType, filter, cache);
  }

  public async extractEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilters?: EntityFilters,
    cache?: boolean,
    patientBornDate?: string,
  ): Promise<EntityTypes[]> {
    const requestFilters = await this.getResourceFilters(entityType, rawFilters, integration);

    if (cache) {
      const resourceCache = await this.integrationCacheUtilsService.getCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
      );

      if (resourceCache) {
        return resourceCache;
      }
    }

    const getResource = () => {
      switch (entityType) {
        case EntityType.organizationUnit:
          return this.getOrganizationUnits(integration, requestFilters);

        case EntityType.insurance:
          return this.getInsurances(integration, requestFilters);

        case EntityType.insurancePlan:
          return this.getInsurancePlans(integration, requestFilters);

        case EntityType.doctor:
          return this.getDoctors(integration, requestFilters);

        case EntityType.speciality:
          return this.getSpecialities(integration, requestFilters);

        case EntityType.appointmentType:
          return this.getAppointmentTypes(integration);

        case EntityType.typeOfService:
          return this.getTypeOfServices(integration);

        case EntityType.procedure:
          return this.getProcedures(integration, requestFilters, patientBornDate);

        default:
          return [];
      }
    };

    const resource: EntityTypes[] = await getResource();
    if (cache && resource?.length) {
      await this.integrationCacheUtilsService.setCachedEntitiesFromRequest(
        entityType,
        integration,
        requestFilters,
        resource,
        getExpirationByEntity(entityType),
      );
    }
    return resource;
  }

  private async getSpecialities(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<ISpecialityEntity[]> {
    try {
      const data = await this.doctoraliaApiService.getSpecialities(integration, requestFilters);
      const entities = data?.return?.results?.map((resource) => {
        const entity: ISpecialityEntity = {
          code: resource.typologyid,
          integrationId: castObjectId(integration._id),
          name: resource.typologyTitle,
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          specialityType: SpecialityTypes.C,
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getSpecialities', error);
    }
  }

  private async getDoctors(integration: IntegrationDocument, requestFilters: RequestParams): Promise<IDoctorEntity[]> {
    try {
      let data = null;

      if (this.doctoraliaHelpersService.getUseDistinctDoctors(integration)) {
        data = await this.doctoraliaApiService.getResourcesDistinct(integration, requestFilters);
      } else {
        data = await this.doctoraliaApiService.getResources(integration, requestFilters);
      }

      const entities = data?.return?.results.map((resource) => {
        const entity: IDoctorEntity = {
          code: resource.resourceid || resource.resource_consumerid,
          integrationId: castObjectId(integration._id),
          name: resource.resourceName,
          activeErp: true,
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
          data: {
            resource_consumerid: resource.resource_consumerid,
          },
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getDoctors', error);
    }
  }

  private async getProcedures(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
    patientBornDate?: string,
  ): Promise<IProcedureEntity[]> {
    try {
      let entities: ActivitiesResponse[] = [];

      if (!requestFilters?.typologyid) {
        const data = await this.doctoraliaApiService.getSpecialities(integration, requestFilters);

        for (const resource of data?.return?.results || []) {
          const response = await this.doctoraliaApiService.getProcedures(integration, {
            ...requestFilters,
            typologyid: resource.typologyid,
          });

          entities.push(...(response?.return?.results ?? []));
        }

        const response = await this.doctoraliaApiService.getProcedures(integration, requestFilters);
        entities = uniqBy(entities.concat(response?.return?.results ?? []), 'activityid');
      } else {
        const response = await this.doctoraliaApiService.getProcedures(integration, requestFilters);
        entities = response?.return?.results ?? [];
      }

      const isRedeCare = ['650da32f5f6a39da9f321a80', '68b984e75d4c2573a8561e10', '65245197631168b73189504c'].includes(
        castObjectIdToString(integration._id),
      );

      return (
        entities
          ?.filter((procedure) =>
            patientBornDate
              ? between(
                  moment().diff(patientBornDate, 'years'),
                  parseInt(procedure.user_min_age, 10),
                  parseInt(procedure.user_max_age, 10),
                )
              : true,
          )
          ?.map((resource) => ({
            code: resource.activityid,
            integrationId: castObjectId(integration._id),
            name: resource.activityTitle,
            source: EntitySourceType.erp,
            activeErp: !isRedeCare ? true : (Boolean(resource.mopBookability) ?? true),
            version: EntityVersionType.production,
            specialityCode: resource.typologyid,
            specialityType: SpecialityTypes.C,
          })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getProcedures', error);
    }
  }

  private async getInsurances(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IInsuranceEntity[]> {
    try {
      const data = await this.doctoraliaApiService.getInsurances(integration, requestFilters);

      if (this.doctoraliaHelpersService.runSplitInsuranceIntoInsurancePlansRule(integration)) {
        const entities: IInsuranceEntity[] = [];

        const insurancesGroup: { [key: string]: InsuranceResponse[] } = data?.return?.results.reduce(
          (groups, resource) => {
            let insuranceGroupCode = resource.legacyid.split(SPLIT_LEGACYID_REGEX)[0];

            if (
              this.doctoraliaHelpersService.ruleIsActive(
                integration,
                IntegrationRules.splitInsuranceIntoInsurancePlansV2,
              )
            ) {
              insuranceGroupCode = resource.tags;
            }

            if (!groups.hasOwnProperty(insuranceGroupCode)) {
              groups[insuranceGroupCode] = [];
            }

            groups[insuranceGroupCode].push(resource);
            return groups;
          },
          {},
        );

        Object.keys(insurancesGroup).forEach((insuranceGroupCode) => {
          const insuranceWithTag = insurancesGroup[insuranceGroupCode].find((insurance) => insurance.tags?.length);

          insurancesGroup[insuranceGroupCode].forEach((resource) => {
            let insuranceName = insuranceWithTag?.tags;

            if (!insuranceName) {
              insuranceName = resource.legacyTitle?.split(SPLIT_LEGACYID_REGEX)?.[0]?.trim();
            }

            let insuranceLegacyCode = resource.legacyid.split(SPLIT_LEGACYID_REGEX)[0];

            if (
              this.doctoraliaHelpersService.ruleIsActive(
                integration,
                IntegrationRules.splitInsuranceIntoInsurancePlansV2,
              )
            ) {
              insuranceLegacyCode = resource.tags;
            }

            const entity: IInsuranceEntity = {
              code: this.doctoraliaHelpersService.createCustomInsuranceId(insuranceLegacyCode),
              integrationId: castObjectId(integration._id),
              name: insuranceName,
              activeErp: true,
              source: EntitySourceType.erp,
              version: EntityVersionType.production,
            };

            entities.push(entity);
          });
        });

        return entities ?? [];
      }

      const entities = data?.return?.results?.map((resource) => {
        const entity: IInsuranceEntity = {
          code: resource.insuranceid,
          integrationId: castObjectId(integration._id),
          name: resource.insurance_title,
          activeErp: true,
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getInsurances', error);
    }
  }

  private async getInsurancePlans(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IInsurancePlanEntity[]> {
    try {
      if (this.doctoraliaHelpersService.runSplitInsuranceIntoInsurancePlansRule(integration)) {
        const data = await this.doctoraliaApiService.getInsurances(integration, {
          ...requestFilters,
          insuranceid: undefined,
        });

        const insurancesGroup: { [key: string]: InsuranceResponse[] } = data?.return?.results.reduce(
          (groups, resource) => {
            let insuranceGroupCode = resource.legacyid.split(SPLIT_LEGACYID_REGEX)[0];

            if (
              this.doctoraliaHelpersService.ruleIsActive(
                integration,
                IntegrationRules.splitInsuranceIntoInsurancePlansV2,
              )
            ) {
              insuranceGroupCode = resource.tags;
            }

            if (!groups.hasOwnProperty(insuranceGroupCode)) {
              groups[insuranceGroupCode] = [];
            }

            groups[insuranceGroupCode].push(resource);
            return groups;
          },
          {},
        );

        const entities: IInsurancePlanEntity[] = [];

        Object.keys(insurancesGroup).forEach((insuranceGroupCode) => {
          const insuranceWithTag = insurancesGroup[insuranceGroupCode].find((insurance) => insurance.tags?.length);

          insurancesGroup[insuranceGroupCode].forEach((resource) => {
            let insuranceName = insuranceWithTag?.tags;

            if (!insuranceName) {
              insuranceName = resource.legacyTitle?.split(SPLIT_LEGACYID_REGEX)?.[0]?.trim();
            }

            let insurancePlanName = resource.legacyTitle
              .slice(insuranceName?.length)
              ?.replace(/^\s/, '')
              ?.replace(SPLIT_LEGACYID_REGEX, '')
              ?.trim();

            if (!insurancePlanName) {
              insurancePlanName = resource.legacyTitle?.trim();
            } else if (insurancePlanName.startsWith('-')) {
              insurancePlanName = insurancePlanName.slice(1);
            }

            let insuranceLegacyCode = resource.legacyid.split(SPLIT_LEGACYID_REGEX)[0];

            if (
              this.doctoraliaHelpersService.ruleIsActive(
                integration,
                IntegrationRules.splitInsuranceIntoInsurancePlansV2,
              )
            ) {
              insuranceLegacyCode = resource.tags;
            }

            const entity: IInsurancePlanEntity = {
              code: resource.insuranceid,
              integrationId: castObjectId(integration._id),
              name: insurancePlanName,
              activeErp: true,
              source: EntitySourceType.erp,
              version: EntityVersionType.production,
              insuranceCode: this.doctoraliaHelpersService.createCustomInsuranceId(insuranceLegacyCode),
            };

            entities.push(entity);
          });
        });

        return entities;
      }

      return [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getInsurancePlans', error);
    }
  }

  private async getOrganizationUnits(
    integration: IntegrationDocument,
    requestFilters: RequestParams,
  ): Promise<IOrganizationUnitEntity[]> {
    try {
      const data = await this.doctoraliaApiService.getAreas(integration, requestFilters);
      const entities = data?.return?.results?.map((resource) => {
        const entity: IOrganizationUnitEntity = {
          code: resource.areaid,
          integrationId: castObjectId(integration._id),
          name: resource.areaTitle,
          source: EntitySourceType.erp,
          version: EntityVersionType.production,
          activeErp: true,
          data: {
            address: resource.address.trim(),
          },
        };

        return entity;
      });

      return entities || [];
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getOrganizationUnits', error);
    }
  }

  private async getTypeOfServices(integration: IntegrationDocument): Promise<ITypeOfServiceEntity[]> {
    try {
      return (
        defaultTypesOfService?.map((resource) => ({
          code: resource.code,
          integrationId: castObjectId(integration._id),
          name: resource.name?.trim(),
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          params: {
            ...resource.params,
          },
        })) || []
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getTypeOfServices', error);
    }
  }

  private async getAppointmentTypes(integration: IntegrationDocument): Promise<IAppointmentTypeEntity[]> {
    try {
      return defaultAppointmentTypes?.map((resource) => {
        const entity: IAppointmentTypeEntity = {
          code: resource.code,
          integrationId: castObjectId(integration._id),
          name: resource.name,
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
          params: {
            ...resource.params,
          },
        };

        return entity;
      });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getAppointmentTypes', error);
    }
  }

  private async getValidApiAppointmentTypes(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<AppointmentTypeEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.appointmentType, filters, cache);
      const codes = data?.map((appointmenType) => appointmenType.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.appointmentType,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as AppointmentTypeEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.appointmentType,
      );

      await this.integrationCacheUtilsService.setProcessedEntities(
        integration,
        EntityType.appointmentType,
        entities,
        codes,
      );
      return entities as AppointmentTypeEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiOrganizationUnits(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<OrganizationUnitEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.organizationUnit, filters, cache);
      const codes = data?.map((organization) => organization.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.organizationUnit,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as OrganizationUnitEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.organizationUnit,
      );

      await this.integrationCacheUtilsService.setProcessedEntities(
        integration,
        EntityType.organizationUnit,
        entities,
        codes,
      );
      return entities as OrganizationUnitEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiInsurances(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<InsuranceEntityDocument[]> {
    try {
      const data = (await this.extractEntity(integration, EntityType.insurance, filters, cache)) as IInsuranceEntity[];
      const codes = data?.map((insurance) => insurance.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.insurance,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as InsuranceEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.insurance);

      await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.insurance, entities, codes);
      return entities as InsuranceEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  // insurancePlan não tem cache processesEntitiesCache por causa do split de convenio
  // só usa o cache da request
  private async getValidApiInsurancePlans(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<InsurancePlanEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.insurancePlan, filters, cache);
      const codes = data?.map((insurancePlan) => insurancePlan.code);
      const entityFilters: Partial<InsurancePlanEntity> = {};

      if (
        this.doctoraliaHelpersService.runSplitInsuranceIntoInsurancePlansRule(integration) &&
        filters?.insurance?.code
      ) {
        entityFilters.insuranceCode = filters.insurance.code;
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        codes,
        EntityType.insurancePlan,
        entityFilters,
      );

      return entities as InsurancePlanEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiProcedures(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
    patientBornDate?: string,
  ): Promise<ProcedureEntityDocument[]> {
    try {
      const data = (await this.extractEntity(
        integration,
        EntityType.procedure,
        filters,
        cache,
        patientBornDate,
      )) as IProcedureEntity[];
      const codes = data?.map((procedure) => procedure.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.procedure,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as ProcedureEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.procedure);
      const validEntities: ProcedureEntityDocument[] = [];

      (entities as ProcedureEntityDocument[]).forEach((savedEntity) => {
        data.forEach((receivedEntity) => {
          if (
            receivedEntity.code === savedEntity.code &&
            receivedEntity.specialityCode === savedEntity.specialityCode
          ) {
            validEntities.push(savedEntity);
          }
        });

        if (
          savedEntity.source === EntitySourceType.user &&
          (savedEntity.specialityCode === filters.speciality?.code ||
            !filters.speciality ||
            !savedEntity?.specialityCode)
        ) {
          validEntities.push(savedEntity);
        }
      });

      await this.integrationCacheUtilsService.setProcessedEntities(
        integration,
        EntityType.procedure,
        validEntities,
        codes,
      );
      return validEntities;
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiDoctors(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<DoctorEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.doctor, filters, cache);

      if (this.doctoraliaHelpersService.getUseDistinctDoctors(integration) && data?.length) {
        return (data as IDoctorEntity[]).map((entity) => ({
          ...entity,
          friendlyName: entity.name,
        })) as DoctorEntityDocument[];
      }

      const codes = data?.map((doctor) => doctor.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.doctor,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as DoctorEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.doctor);
      await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.doctor, entities, codes);
      return entities as DoctorEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidApiSpecialities(
    integration: IntegrationDocument,
    filters: EntityFilters,
    cache?: boolean,
  ): Promise<SpecialityEntityDocument[]> {
    try {
      const data = await this.extractEntity(integration, EntityType.speciality, filters, cache);
      const codes = data?.map((speciality) => speciality.code);

      const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
        integration,
        EntityType.speciality,
        codes,
      );

      if (cachedEntities) {
        return cachedEntities as SpecialityEntityDocument[];
      }

      const entities = await this.entitiesService.getValidEntitiesbyCode(integration._id, codes, EntityType.speciality);

      await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.speciality, entities, codes);
      return entities as SpecialityEntityDocument[];
    } catch (error) {
      throw error;
    }
  }

  private async getValidOccupationArea(integration: IntegrationDocument, cache?: boolean) {
    const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
      integration,
      EntityType.occupationArea,
    );

    if (cachedEntities) {
      return cachedEntities as OccupationAreaEntityDocument[];
    }

    const entities = await this.entitiesService.getValidEntities(EntityType.occupationArea, integration._id);

    await this.integrationCacheUtilsService.setProcessedEntities(integration, EntityType.occupationArea, entities);
    return entities as OccupationAreaEntityDocument[];
  }

  private async getValidOrganizationUnitLocation(integration: IntegrationDocument, cache?: boolean) {
    const cachedEntities = await this.integrationCacheUtilsService.getProcessedEntities(
      integration,
      EntityType.organizationUnitLocation,
    );

    if (cachedEntities) {
      return cachedEntities as OrganizationUnitLocationEntityDocument[];
    }

    const entities = await this.entitiesService.getValidEntities(EntityType.organizationUnitLocation, integration._id);

    await this.integrationCacheUtilsService.setProcessedEntities(
      integration,
      EntityType.organizationUnitLocation,
      entities,
    );
    return entities as OrganizationUnitLocationEntityDocument[];
  }

  public async splitGetAvailableSchedules(
    payload: DoctoraliaAvailableSchedules,
    availableSchedules: ListAvailableSchedules,
    integration: IntegrationDocument,
  ): Promise<DoctoraliaResponseArray<AppointmentResponse>> {
    const range = availableSchedules.untilDay;
    const maxRangeDays = integration.rules?.limitOfDaysToSplitRequestInScheduleSearch || 7;
    const dateFormat = 'DD/MM/YYYY';

    if (range <= maxRangeDays) {
      return await this.doctoraliaApiService.getAppointments(integration, payload);
    }

    const requestsNumber = Math.ceil(range / maxRangeDays);

    const responsePromises = [];
    const response: DoctoraliaResponseArray<AppointmentResponse> = {
      return: {
        results: {
          availabilities: [],
          unavailabilities: [],
        },
      },
    };

    for (let stack = 0; stack < requestsNumber; stack++) {
      const fromDay = availableSchedules.fromDay + stack * maxRangeDays;
      const untilDay = fromDay + maxRangeDays;

      const dynamicPayload: DoctoraliaAvailableSchedules = {
        ...payload,
        start_date: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
        end_date: moment().add(untilDay, 'days').endOf('day').format(dateFormat),
      };

      responsePromises.push(this.doctoraliaApiService.getAppointments(integration, dynamicPayload));
    }

    await Promise.allSettled(responsePromises).then((responses) => {
      responses
        .filter((response) => response.status === 'fulfilled')
        .forEach(({ value }: PromiseFulfilledResult<DoctoraliaResponseArray<AppointmentResponse>>) => {
          response.return.results.availabilities = response?.return?.results?.availabilities.concat(
            value.return.results.availabilities,
          );
          response.return.results.unavailabilities = response?.return?.results?.unavailabilities.concat(
            value.return.results.unavailabilities,
          );
        });
    });

    return response;
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    availableSchedules: ListAvailableSchedules,
  ): Promise<ListAvailableSchedulesResponse> {
    const {
      period,
      randomize,
      sortMethod = AppointmentSortMethod.default,
      filter,
      fromDay = 0,
      untilDay,
      patient,
      limit,
      periodOfDay,
    } = availableSchedules;
    const dateFormat = 'DD/MM/YYYY';

    const { start, end } = this.appointmentService.getPeriodFromPeriodOfDay(integration, {
      periodOfDay: availableSchedules.periodOfDay,
      limit: availableSchedules.limit,
      sortMethod: availableSchedules.sortMethod,
      randomize: availableSchedules.randomize,
      period: availableSchedules.period,
    });

    const payload: DoctoraliaAvailableSchedules = {
      insuranceid: this.doctoraliaHelpersService.getInsuranceCode(
        filter.insurance.code,
        filter.insurancePlan?.code,
        integration,
      ),
      typologyid: filter.procedure?.specialityCode || filter.speciality?.code,
      activityid: filter.procedure?.code,
      areaid: filter.organizationUnit?.code,
      minTime: start,
      maxTime: end,
      start_date: moment().add(fromDay, 'days').startOf('day').format(dateFormat),
      end_date: moment()
        .add(fromDay + untilDay, 'days')
        .endOf('day')
        .format(dateFormat),
    };

    let metadata: AvailableSchedulesMetadata = {};

    if (
      !filter.organizationUnit?.code &&
      filter?.organizationUnitLocation?._id &&
      filter.organizationUnitLocation?.references?.length
    ) {
      const organizationUnits = await this.entitiesService.getCollection(EntityType.organizationUnit).find({
        _id: { $in: filter.organizationUnitLocation.references.map((ref) => castObjectId(ref.refId)) },
        integrationId: castObjectId(integration._id),
        canView: true,
        $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
      });

      if (organizationUnits.length) {
        payload.areaid = organizationUnits.map((organizationUnit) => organizationUnit.code);
      }
    }

    const doctorCode = filter.doctor?.code;
    const hasConsumerId = (filter.doctor?.data as any)?.resource_consumerid;
    const useDistinct = this.doctoraliaHelpersService.getUseDistinctDoctors(integration);

    if (doctorCode) {
      if (useDistinct && hasConsumerId) {
        payload.resource_consumerid = doctorCode;
      } else {
        payload.resourceid = doctorCode;
      }
    }

    // se não tem médico para filtar tenta encontrar médicos da área de atuação selecionada para
    // enviar na request, se não tiver nenhuma não filtra
    if (!filter?.doctor?.code && filter?.occupationArea?._id) {
      const entities = await this.entitiesService.getCollection(EntityType.doctor).find({
        'references.refId': { $in: [filter.occupationArea._id] },
        'references.type': EntityType.occupationArea,
        integrationId: castObjectId(integration._id),
        canView: true,
        canSchedule: true,
        $or: [{ activeErp: true }, { activeErp: { $exists: false } }, { activeErp: { $eq: null } }],
      });

      if (!entities.length) {
        return { schedules: [], metadata };
      }

      payload.resourceids = [];
      payload.resourceids.push(...entities.map((entity) => entity.code));
    }

    try {
      const data = await this.splitGetAvailableSchedules(payload, availableSchedules, integration);
      const result = data.return?.results;

      if (!result?.availabilities?.length) {
        return { schedules: [], metadata };
      }

      const doctorsSet = new Set([]);
      result.availabilities.forEach((schedule) => doctorsSet.add(schedule.resourceid));

      const doctors: DoctorEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
        integration._id,
        Array.from(doctorsSet),
        EntityType.doctor,
        { canSchedule: true },
      );

      const [matchedDoctors] = await this.flowService.matchEntitiesFlows({
        integrationId: integration._id,
        entities: doctors,
        entitiesFilter: availableSchedules.filter,
        targetEntity: FlowSteps.doctor,
        filters: { patientBornDate: patient?.bornDate, patientSex: patient?.sex, patientCpf: patient?.cpf },
      });

      const validDoctors = this.entitiesFiltersService.filterEntitiesByParams(integration, matchedDoctors, {
        bornDate: patient?.bornDate,
      });

      const doctorsMap = validDoctors.reduce((map: { [key: string]: boolean }, doctor) => {
        map[doctor.code] = true;
        return map;
      }, {});

      let replacedAppointments: RawAppointment[] = [];
      const canReturnSchedulePrice = filter.insurance?.params?.showAppointmentValue || false;

      for (const appointment of result.availabilities) {
        if (doctorsMap[appointment.resourceid]) {
          const replacedAppointment: Appointment & { [key: string]: any } = {
            appointmentCode: appointment.machid,
            appointmentDate: this.doctoraliaHelpersService.convertStartDate(
              appointment.start_datetime_timestamp,
              appointment.startTime,
            ),
            duration: appointment.duration,
            procedureId: appointment.activityid.toLowerCase(),
            doctorId: appointment.resourceid,
            organizationUnitId: appointment.areaid,
            status: AppointmentStatus.scheduled,
          };

          if (canReturnSchedulePrice && appointment.activityPrice) {
            replacedAppointment.price = {
              value: formatCurrency(appointment.activityPrice, 2),
              currency: 'R$',
            };
          }

          if (appointment.provider_session_id) {
            replacedAppointment.data = {
              ...(replacedAppointment.data ?? {}),
              provider_session_id: appointment.provider_session_id,
            };
          }

          if (appointment.endTime) {
            replacedAppointment.data = {
              ...(replacedAppointment.data ?? {}),
              endTime: appointment.endTime,
            };
          }

          // Rede primavera
          if (
            appointment?.notice &&
            ['65b5429ac731a7aabfe84a1a', '65ba83002cbb9186212fd7ba'].includes(castObjectIdToString(integration._id))
          ) {
            replacedAppointment.guidance = appointment?.notice;
          }

          replacedAppointments.push(replacedAppointment);
        }
      }

      try {
        ({ replacedAppointments, metadata } = await this.rulesHandlerService.removeSchedulesFilteredBySameDayRules(
          integration,
          availableSchedules,
          replacedAppointments,
          metadata,
          true,
          this.getMinifiedPatientSchedules.bind(this),
        ));
      } catch (error) {
        console.error(error);
      }

      const { appointments: randomizedAppointments, metadata: partialMetadata } =
        await this.appointmentService.getAppointments(
          integration,
          {
            limit,
            period,
            randomize,
            sortMethod,
            periodOfDay,
          },
          replacedAppointments,
        );

      const validSchedules = await this.appointmentService.transformSchedules(integration, randomizedAppointments);
      return { schedules: validSchedules, metadata: { ...metadata, ...partialMetadata } };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getAvailableSchedules', error);
    }
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
    patient?: InitialPatient,
  ): Promise<EntityDocument[]> {
    switch (targetEntity) {
      case EntityType.appointmentType:
        return await this.getValidApiAppointmentTypes(integration, rawFilter, cache);

      case EntityType.speciality:
        return await this.getValidApiSpecialities(integration, rawFilter, cache);

      case EntityType.organizationUnit:
        return await this.getValidApiOrganizationUnits(integration, rawFilter, cache);

      case EntityType.insurance:
        return await this.getValidApiInsurances(integration, rawFilter, cache);

      case EntityType.procedure:
        return await this.getValidApiProcedures(integration, rawFilter, cache, patient.bornDate);

      case EntityType.doctor:
        return await this.getValidApiDoctors(integration, rawFilter, cache);

      case EntityType.insurancePlan:
        return await this.getValidApiInsurancePlans(integration, rawFilter, cache);

      case EntityType.occupationArea:
        return await this.getValidOccupationArea(integration, cache);

      case EntityType.organizationUnitLocation:
        return await this.getValidOrganizationUnitLocation(integration, cache);

      default:
        return [] as EntityDocument[];
    }
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  private replacePatient(result: DoctoraliaGetPatientResponse | DoctoraliaCreatePatientResponse): Patient {
    const { phone = '', birthday = '', birthday_formatted = '' } = result;
    // ao buscar usuario por id não vem birthday apenas birthday_formatted
    const bornDate = birthday_formatted && birthday_formatted !== '' ? birthday_formatted : birthday;

    const normalizedPhone = this.doctoraliaHelpersService.normalizePhone(phone, true);

    return {
      phone: normalizedPhone,
      email: result.email || '',
      name: result.social_name || `${result.fname} ${result.lname}`.trim(),
      socialName: result.social_name,
      sex: result.gender,
      code: result.memberid,
      cpf: result.idnumber,
      bornDate: bornDate ? bornDate.split('/').reverse().join('-') : '',
      cellPhone: normalizedPhone,
      data: {
        erpId: (result as DoctoraliaGetPatientResponse)?.legacyid ?? null,
      },
    };
  }

  private async getPatientByCode(integration: IntegrationDocument, code: string): Promise<Patient> {
    try {
      const data: DoctoraliaResponsePlain<DoctoraliaGetPatientResponse> =
        await this.doctoraliaApiService.getPatientByCode(integration, code);
      const { return: result } = data;
      return this.replacePatient(result);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getPatientByCode', error);
    }
  }

  private async getPatientByCpf(integration: IntegrationDocument, cpf: string, bornDate: string): Promise<Patient> {
    try {
      const data: DoctoraliaResponseArray<DoctoraliaGetPatientResponse[]> =
        await this.doctoraliaApiService.getPatientByCpf(integration, cpf);

      const { return: result } = data;

      if (!result?.results?.length) {
        return null;
      }

      if (result?.results?.length === 1) {
        return this.replacePatient(result?.results[0]);
      }

      const tuotempoPatient = result?.results?.find((tuotempoPatient) => {
        const patient = this.replacePatient(tuotempoPatient);
        return moment.utc(patient.bornDate).startOf('day').valueOf() === moment.utc(bornDate).startOf('day').valueOf();
      });

      return this.replacePatient(tuotempoPatient || result.results[0]);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getPatientByCpf', error);
    }
  }

  public async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, cache } = filters;
    const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(
      integration,
      code,
      cpf,
      filters.bornDate,
    );

    if (patientCache && cache) {
      return patientCache;
    }

    let patient: Patient;

    if (cpf) {
      patient = await this.getPatientByCpf(integration, cpf, filters.bornDate);
    } else if (code) {
      patient = await this.getPatientByCode(integration, code);
    }

    await this.integrationCacheUtilsService.setPatientCache(integration, code, cpf, patient, filters.bornDate);
    return patient;
  }

  public async updatePatient(
    integration: IntegrationDocument,
    patientCode: string,
    { patient }: UpdatePatient,
  ): Promise<Patient> {
    const formatedPhone = this.doctoraliaHelpersService.normalizePhone(patient.cellPhone ?? patient.phone, true);

    const payload: DoctoraliaUpdatePatientRequest = {
      gender: patient.sex?.toUpperCase(),
      phone: formatedPhone,
    };

    if (patient.email) {
      payload.email = patient.email;
    }

    try {
      await this.doctoraliaApiService.updatePatient(integration, payload, patientCode);
      await this.integrationCacheUtilsService.removePatientFromCache(integration, patientCode, patient.cpf);
      return await this.getPatient(integration, { code: patientCode, cpf: patient.cpf });
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.updatePatient', error);
    }
  }

  public async createPatient(integration: IntegrationDocument, { patient }: CreatePatient): Promise<Patient> {
    const splittedName = patient.name.split(' ');

    let phone = this.doctoraliaHelpersService.normalizePhone(patient.cellPhone ?? patient.phone, true);

    const payload: DoctoraliaCreatePatientRequest = {
      birthday: moment(patient.bornDate).format('DD/MM/YYYY'),
      email: patient.email || '',
      gender: patient.sex?.toUpperCase(),
      phone,
      idtype: 1,
      idnumber: patient.cpf,
      fname: splittedName[0],
      lname: splittedName?.slice(1, splittedName.length).join(' '),
      password: String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Math.random().toString(36),
    };

    try {
      const data: DoctoraliaResponsePlain<DoctoraliaCreatePatientResponse> =
        await this.doctoraliaApiService.createPatient(integration, payload);
      const patient = this.replacePatient(data.return);

      await this.integrationCacheUtilsService.setPatientCache(integration, patient.code, patient.cpf, patient);
      return patient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.createPatient', error);
    }
  }

  public async cancelSchedule(integration: IntegrationDocument, cancelSchedule: CancelSchedule): Promise<OkResponse> {
    const { appointmentCode } = cancelSchedule;

    try {
      const data: DoctoraliaResponsePlain<string> = await this.doctoraliaApiService.cancelAppointment(
        integration,
        appointmentCode,
      );

      if (data?.return !== '' && data?.result === 'OK') {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmSchedule,
  ): Promise<OkResponse> {
    const { appointmentCode } = confirmSchedule;

    try {
      const data: DoctoraliaResponsePlain<string> = await this.doctoraliaApiService.updateAppointment(
        integration,
        appointmentCode,
        { is_pending: 2 },
      );

      if (data?.return !== '') {
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.confirmSchedule', error);
    }
  }

  public async createSchedule(integration: IntegrationDocument, createSchedule: CreateSchedule): Promise<Appointment> {
    const { appointment, organizationUnit, insurance, procedure, doctor, patient } = createSchedule;
    const appointmentDate = moment.utc(appointment.appointmentDate);

    const response: Appointment = {
      appointmentDate: appointment.appointmentDate,
      duration: appointment.duration,
      appointmentCode: null,
      status: AppointmentStatus.scheduled,
      guidance: '',
    };

    const payload: DoctoraliaCreateAppointmentRequest = {
      userid: patient.code,
      resourceid: doctor.code,
      activityid: procedure.code,
      start_date: appointmentDate.format('DD/MM/YYYY'),
      end_date: appointmentDate.format('DD/MM/YYYY'),
      startTime: appointmentDate.format('HH:mm'),
      endTime: appointmentDate.add(appointment.duration, 'minutes').format('HH:mm'),
      insuranceid: this.doctoraliaHelpersService.getInsuranceCode(insurance.code, insurance.planCode, integration),
      areaid: organizationUnit.code,
    };

    // vision one
    if (
      patient.weight &&
      ['61b7320caa7ba50008cfc16d', '636be860235a418f5e958c55', '61fec45a09b57e000779711d'].includes(
        castObjectIdToString(integration._id),
      )
    ) {
      payload.custom_0 = patient.weight;
    }

    if (appointment.data?.provider_session_id) {
      payload.provider_session_id = appointment.data.provider_session_id;
    }

    // Oncoclinica piaui
    if (
      appointment.data?.endTime &&
      ['6681e02eb9e153c5ea3acf14', '6245e448c81b950009e5c71d'].includes(castObjectIdToString(integration._id))
    ) {
      payload.endTime = appointment.data.endTime;
    }

    if (patient.insuranceNumber) {
      payload.insurance_card_number = patient.insuranceNumber;
    }

    try {
      const data: DoctoraliaResponsePlain<string> & { preparation?: string; description?: string; notice?: string } =
        await this.doctoraliaApiService.createAppointment(integration, payload);

      const { return: scheduleId, preparation, additional_return, description } = data;

      if (scheduleId) {
        response.appointmentCode = scheduleId;

        try {
          const addressField = additional_return?.reservations?.[scheduleId]?.custom_2;

          if (addressField) {
            response.organizationUnit = {
              data: {
                address: addressField,
              },
            } as any;
          }
        } catch (error) {
          console.log('Error on get address from apointment', integration._id);
        }

        if (preparation) {
          response.guidance = preparation;
        }

        // Por enquanto fixo até descobrir se é padrão retornar dado aqui
        try {
          if (
            description &&
            !response.guidance &&
            ['60e5bad284370800076626fc', '65b5429ac731a7aabfe84a1a'].includes(castObjectIdToString(integration._id))
          ) {
            response.guidance = description;
          }
        } catch (error) {
          console.log('Error on get description', integration._id);
        }

        return response;
      }
    } catch (error) {
      if (error?.response?.statusCode === HttpStatus.OK) {
        return response;
      }
      throw error;
    }
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode } = patientSchedules;
    try {
      const data: DoctoraliaResponseArray<DoctoraliaConfirmedAppointmentResponse[]> =
        await this.doctoraliaApiService.getPatientSchedules(integration, patientCode);
      const { return: result } = data;

      if (!result?.results?.length) {
        return [];
      }

      // retorna reservas canceladas, filtrando cancelled ===null po enquanto até ver a necessidade da rota
      const rawAppointments: RawAppointment[] = await Promise.all(
        result.results
          .filter((reservation) => reservation.cancelled === null)
          .map(
            async (reservation) =>
              await this.doctoraliaHelpersService.createPatientAppointmentObject(reservation, integration),
          ),
      );

      return await this.appointmentService.transformSchedules(integration, rawAppointments);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getPatientSchedules', error);
    }
  }

  async getMinifiedPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> {
    const { patientCode } = patientSchedules;
    const minifiedSchedules: MinifiedAppointments = {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };

    try {
      const data: DoctoraliaResponseArray<DoctoraliaConfirmedAppointmentResponse[]> =
        await this.doctoraliaApiService.getPatientSchedules(integration, patientCode);
      const { return: result } = data;

      if (!result?.results?.length) {
        await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
          minifiedSchedules,
          schedules: [],
        });

        return minifiedSchedules;
      }

      const schedules: Appointment[] = await Promise.all(
        result.results
          .filter((reservation) => reservation.cancelled === null)
          .map(async (reservation) => {
            const [appointment] = await this.appointmentService.transformSchedules(integration, [
              await this.doctoraliaHelpersService.createPatientAppointmentObject(reservation, integration),
            ]);

            const flowSteps = [FlowSteps.listPatientSchedules];

            if (patientSchedules.target) {
              flowSteps.push(patientSchedules.target);
            }

            const flowActions = await this.flowService.matchFlowsAndGetActions({
              integrationId: integration._id,
              targetFlowTypes: flowSteps,
              entitiesFilter: {
                appointmentType: appointment.appointmentType,
                doctor: appointment.doctor,
                insurance: appointment.insurance,
                insurancePlan: appointment.insurancePlan,
                insuranceSubPlan: appointment.insuranceSubPlan,
                organizationUnit: appointment.organizationUnit,
                planCategory: appointment.planCategory,
                procedure: appointment.procedure,
                speciality: appointment.speciality,
                occupationArea: appointment.occupationArea,
                organizationUnitLocation: appointment.organizationUnitLocation,
                typeOfService: appointment.typeOfService,
              },
            });

            minifiedSchedules.appointmentList.push({
              appointmentCode: reservation.resid,
              appointmentDate: this.doctoraliaHelpersService.convertStartDate(
                reservation.start_datetime_timestamp,
                reservation.startTime,
              ),
            });

            return {
              ...appointment,
              actions: flowActions,
            };
          }),
      );

      orderBy(schedules, 'appointmentDate', 'asc').forEach((schedule) => {
        if (moment(schedule.appointmentDate).valueOf() > moment().valueOf() && !minifiedSchedules.nextAppointment) {
          minifiedSchedules.nextAppointment = schedule;
        } else if (moment(schedule.appointmentDate).valueOf() <= moment().valueOf()) {
          minifiedSchedules.lastAppointment = schedule;
        }
      });

      await this.integrationCacheUtilsService.setPatientSchedulesCache(integration, patientCode, {
        minifiedSchedules,
        schedules,
      });

      return minifiedSchedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.getMinifiedPatientSchedules', error);
    }
  }

  async getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'DoctoraliaService.getScheduleValue: Not implemented',
      undefined,
      true,
    );
  }

  async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const data = await this.doctoraliaApiService.getAreas(integration, null, true);
      if (data?.result?.length > 0) {
        return { ok: true };
      }
    } catch (error) {
      throw error;
    }
  }

  async reschedule(integration: IntegrationDocument, reschedule: Reschedule): Promise<Appointment> {
    const { scheduleToCancelCode, scheduleToCreate, patient } = reschedule;

    try {
      const patientAppointments = await this.getPatientSchedules(integration, { patientCode: patient.code });
      const appointmentToCancel = patientAppointments.find(
        (appointment) => appointment.appointmentCode == scheduleToCancelCode,
      );

      if (!appointmentToCancel) {
        throw INTERNAL_ERROR_THROWER('DoctoraliaIntegrationService.reschedule', {
          message: 'Invalid appointment code to cancel',
        });
      }

      const { doctor, procedure, insurance, organizationUnit, appointment } = scheduleToCreate;
      const appointmentDate = moment.utc(appointment.appointmentDate);

      const payload: DoctoraliaUpdateAppointmentRequest = {
        userid: patient.code,
        resourceid: doctor.code,
        activityid: procedure.code,
        start_date: appointmentDate.format('DD/MM/YYYY'),
        end_date: appointmentDate.format('DD/MM/YYYY'),
        startTime: appointmentDate.format('HH:mm'),
        endTime: appointmentDate.add(appointment.duration, 'minutes').format('HH:mm'),
        insuranceid: insurance.code,
        areaid: organizationUnit.code,
      };

      if (appointment.data?.provider_session_id) {
        payload.provider_session_id = appointment.data.provider_session_id;
      }

      const data: DoctoraliaResponsePlain<string> = await this.doctoraliaApiService.updateAppointment(
        integration,
        scheduleToCancelCode,
        payload,
      );

      if (data?.return !== '' && data?.result === 'OK') {
        return {
          appointmentCode: data.return,
          appointmentDate: '',
          status: AppointmentStatus.scheduled,
        };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DoctoraliaService.reschedule', error);
    }
  }
}
