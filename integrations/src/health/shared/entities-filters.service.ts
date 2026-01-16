import { Injectable } from '@nestjs/common';
import { compareObjectIds } from '../../common/helpers/compare-ids';
import {
  AppointmentTypeEntity,
  OccupationAreaEntityDocument,
  SpecialityEntityDocument,
  EntityDocument,
  ProcedureEntityDocument,
} from '../entities/schema';
import { EntitiesService } from '../entities/services/entities.service';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { CorrelationFilter } from '../interfaces/correlation-filter.interface';
import { EntityType } from '../interfaces/entity.interface';
import { IntegrationType } from '../interfaces/integration-types';
import * as moment from 'moment';
import { castObjectId } from '../../common/helpers/cast-objectid';

@Injectable()
export class EntitiesFiltersService {
  constructor(private readonly entitiesService: EntitiesService) {}

  public async filterEntitiesByReferences(
    integration: IntegrationDocument,
    entities: EntityDocument[],
    targetEntity: EntityType,
    entitiesFilter: CorrelationFilter,
  ) {
    switch (targetEntity) {
      case EntityType.occupationArea:
        return await this.filterOccupationAreaEntities(integration, entities, entitiesFilter);

      case EntityType.speciality:
        return await this.filterSpecialityEntities(integration, entities, entitiesFilter);

      case EntityType.procedure:
        return await this.filterProcedureEntities(integration, entities as ProcedureEntityDocument[], entitiesFilter);

      case EntityType.organizationUnit:
        return await this.filterOrganizationUnitEntities(integration, entities, entitiesFilter);

      case EntityType.doctor:
        return await this.filterDoctorEntities(integration, entities, entitiesFilter);

      default:
        return entities;
    }
  }

  private filterSpecialitiesByAppointmentType(
    specialities: SpecialityEntityDocument[],
    appointmentType: AppointmentTypeEntity,
  ): SpecialityEntityDocument[] {
    if (!appointmentType?.code) {
      return specialities;
    }

    return (specialities as unknown as SpecialityEntityDocument[]).filter(
      (speciality) => speciality.specialityType === appointmentType.code,
    );
  }

  private filterSpecialitiesByAppointmentReferenceScheduleType(
    specialities: SpecialityEntityDocument[],
    appointmentType: AppointmentTypeEntity,
  ): SpecialityEntityDocument[] {
    if (!appointmentType?.code) {
      return specialities;
    }

    return (specialities as unknown as SpecialityEntityDocument[]).filter(
      (speciality) => speciality.specialityType === appointmentType.params.referenceScheduleType,
    );
  }

  private async filterSpecialityEntities(
    integration: IntegrationDocument,
    entities: EntityDocument[],
    filters: CorrelationFilter,
  ): Promise<EntityDocument[]> {
    switch (integration.type) {
      case IntegrationType.CLINIC:
        // Filtra por referenceScheduleType - quando Tipo de Agendamento for Estático e Próprio
        entities = this.filterSpecialitiesByAppointmentReferenceScheduleType(
          entities as unknown as SpecialityEntityDocument[],
          filters.appointmentType,
        );
        break;

      case IntegrationType.SUPORTE_INFORMATICA:
      case IntegrationType.FEEGOW:
      case IntegrationType.MANAGER:
      case IntegrationType.CUSTOM_IMPORT:
      case IntegrationType.PRODOCTOR:
      case IntegrationType.KONSIST:
        break;

      case IntegrationType.BOTDESIGNER:
        return this.filterSpecialitiesByAppointmentType(
          entities as unknown as SpecialityEntityDocument[],
          filters.appointmentType,
        );

      default:
        // Filter by appointmentType - quando Tipo de Agendamento for Estático e Default Bot
        entities = this.filterSpecialitiesByAppointmentType(
          entities as unknown as SpecialityEntityDocument[],
          filters.appointmentType,
        );
        break;
    }

    if (!filters.occupationArea) {
      return entities;
    }

    const occupationArea = await this.entitiesService.getEntityByCode(
      filters.occupationArea.code,
      EntityType.occupationArea,
      integration._id,
    );

    return (
      occupationArea?.references
        .filter((ref) => ref.type === EntityType.speciality)
        .map((ref) => entities.find((entity) => compareObjectIds(ref.refId, entity._id)))
        .filter((entity) => entity) || []
    );
  }

  private async filterProcedureEntities(
    integration: IntegrationDocument,
    entities: ProcedureEntityDocument[],
    filters: CorrelationFilter,
  ): Promise<EntityDocument[]> {
    if (integration.type === IntegrationType.BOTDESIGNER) {
      return entities;
    }

    if (integration.type === IntegrationType.AMIGO) {
      if (!filters.speciality?.code) {
        return entities;
      }

      return entities.filter((entity) => entity.specialityCode === filters.speciality.code) as EntityDocument[];
    }

    if (!filters.occupationArea) {
      return entities;
    }

    const occupationArea = await this.entitiesService.getEntityByCode(
      filters.occupationArea.code,
      EntityType.occupationArea,
      integration._id,
    );

    return (
      occupationArea?.references
        .filter((ref) => ref.type === EntityType.procedure)
        .map((ref) => entities.find((entity) => compareObjectIds(ref.refId, entity._id)))
        .filter((entity) => entity) || []
    );
  }

  private async filterOccupationAreaEntities(
    integration: IntegrationDocument,
    entities: EntityDocument[],
    filters: CorrelationFilter,
  ): Promise<EntityDocument[]> {
    if (integration.type === IntegrationType.BOTDESIGNER) {
      return entities;
    }

    if (!filters.speciality && !filters.procedure) {
      return entities;
    }

    if (filters.procedure && filters.speciality && filters.doctor) {
      const doctor = await this.entitiesService.getEntityByCode(
        filters.doctor.code,
        EntityType.doctor,
        integration._id,
      );

      if (!doctor?.references?.length) {
        return entities;
      }

      const validEntities = await this.entitiesService.getCollection(EntityType.occupationArea).find({
        $or: [
          {
            'references.refId': { $in: [filters.speciality._id] },
            'references.type': EntityType.speciality,
          },
          { 'references.refId': { $in: [filters.procedure._id] }, 'references.type': EntityType.procedure },
        ],
        integrationId: castObjectId(integration._id),
        _id: { $in: entities.map((entity) => castObjectId(entity._id)) },
      });

      if (!validEntities.length) {
        return [];
      }

      const doctorOccupationAreaIds = doctor.references.map((reference) => reference.refId?.toHexString());
      return validEntities.filter((entity) => doctorOccupationAreaIds.includes(entity._id?.toHexString()));
    }

    if (filters.procedure && filters.speciality) {
      return await this.entitiesService.getCollection(EntityType.occupationArea).find({
        $or: [
          {
            'references.refId': { $in: [filters.speciality._id] },
            'references.type': EntityType.speciality,
          },
          { 'references.refId': { $in: [filters.procedure._id] }, 'references.type': EntityType.procedure },
        ],
        integrationId: castObjectId(integration._id),
        _id: { $in: entities.map((entity) => castObjectId(entity._id)) },
      });
    }

    if (filters.speciality) {
      return await this.entitiesService.getCollection(EntityType.occupationArea).find({
        'references.refId': { $in: [filters.speciality._id] },
        'references.type': EntityType.speciality,
        integrationId: castObjectId(integration._id),
        _id: { $in: entities.map((entity) => castObjectId(entity._id)) },
      });
    }

    if (filters.procedure) {
      return await this.entitiesService.getCollection(EntityType.occupationArea).find({
        'references.refId': { $in: [filters.procedure._id] },
        'references.type': EntityType.procedure,
        integrationId: castObjectId(integration._id),
        _id: { $in: entities.map((entity) => castObjectId(entity._id)) },
      });
    }

    return entities;
  }

  private async filterOrganizationUnitEntities(
    integration: IntegrationDocument,
    entities: EntityDocument[],
    filters: CorrelationFilter,
  ): Promise<EntityDocument[]> {
    if (!filters.organizationUnitLocation) {
      return entities;
    }

    const organizationUnitLocation = await this.entitiesService.getEntityByCode(
      filters.organizationUnitLocation.code,
      EntityType.organizationUnitLocation,
      integration._id,
    );

    return (
      organizationUnitLocation?.references
        .filter((ref) => ref.type === EntityType.organizationUnit)
        .map((ref) => entities.find((entity) => compareObjectIds(ref.refId, entity._id)))
        .filter((entity) => entity) || []
    );
  }

  private async filterDoctorEntities(
    integration: IntegrationDocument,
    entities: EntityDocument[],
    filters: CorrelationFilter,
  ): Promise<EntityDocument[]> {
    if (integration.type === IntegrationType.BOTDESIGNER || !filters.occupationArea) {
      return entities;
    }

    const occupationArea = (await this.entitiesService.getEntityById(
      castObjectId(filters.occupationArea._id),
      EntityType.occupationArea,
      integration._id,
    )) as OccupationAreaEntityDocument;

    if (!occupationArea?.params?.hasRelationshipWithDoctors) {
      return entities;
    }

    return await this.entitiesService.getCollection(EntityType.doctor).find({
      'references.refId': { $in: [filters.occupationArea._id] },
      'references.type': EntityType.occupationArea,
      integrationId: castObjectId(integration._id),
      _id: { $in: entities.map((entity) => castObjectId(entity._id)) },
    });
  }

  public filterEntitiesByParams(
    _: IntegrationDocument,
    entities: EntityDocument[],
    filters: {
      bornDate: string;
    },
  ) {
    if (!filters?.bornDate) {
      return entities;
    }

    const patientAge = moment().diff(moment(filters.bornDate), 'years');

    return entities.filter((entity) => {
      const { minimumAge, maximumAge } = entity?.params ?? {};

      if (!maximumAge && !minimumAge) {
        return true;
      }

      if (maximumAge && minimumAge) {
        return maximumAge >= patientAge && minimumAge <= patientAge;
      }

      if (maximumAge) {
        return maximumAge >= patientAge;
      }

      return minimumAge <= patientAge;
    });
  }
}
