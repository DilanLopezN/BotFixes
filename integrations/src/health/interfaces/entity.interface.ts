import { Types } from 'mongoose';
import { ScheduleType, TypeOfService } from '../entities/schema';

enum EntityType {
  organizationUnit = 'organizationUnit',
  speciality = 'speciality',
  insurance = 'insurance',
  insurancePlan = 'insurancePlan',
  procedure = 'procedure',
  doctor = 'doctor',
  appointmentType = 'appointmentType',
  planCategory = 'planCategory',
  insuranceSubPlan = 'insuranceSubPlan',
  occupationArea = 'occupationArea',
  organizationUnitLocation = 'organizationUnitLocation',
  typeOfService = 'typeOfService',
  reason = 'reason',
}

enum EntityVersionType {
  draft = 'draft',
  production = 'production',
}

enum EntitySourceType {
  erp = 0,
  user = 1,
  api = 2,
}

enum SpecialityTypes {
  C = 'C',
  E = 'E',
  R = 'R',
}

interface IEntityReference {
  refId: Types.ObjectId;
  type: EntityType;
}

interface EntityParams {
  minimumAge?: number;
  maximumAge?: number;
}

interface IEntity {
  code: string;
  name: string;
  friendlyName?: string;
  synonyms?: string[];
  internalSynonyms?: string[];
  source: EntitySourceType;
  order?: number;
  integrationId: Types.ObjectId;
  parent?: IEntity;
  version: EntityVersionType;
  data?: any;
  references?: IEntityReference[];
  activeErp?: boolean;
  createdAt?: number;
  updatedAt?: number;
  params?: EntityParams;
  canSchedule?: boolean;
  canReschedule?: boolean;
  canConfirmActive?: boolean;
  canConfirmPassive?: boolean;
  canCancel?: boolean;
  canView?: boolean;
  embeddingsSyncAt?: number;
  // foi criada em memória para retornar na extração / listagem de entidades
  virtual?: boolean;
}

interface IAppointmentTypeEntity extends IEntity {
  params?: {
    referenceScheduleType?: ScheduleType;
  } & EntityParams;
}

interface IDoctorEntity extends IEntity {}

interface IGroupEntity extends IEntity {}

interface IInsuranceEntity extends IEntity {
  params?: {
    interAppointmentPeriod?: number;
    isParticular?: boolean;
    showAppointmentValue?: boolean;
    includeInSuggestionsList?: boolean;
  } & EntityParams;
}

interface IInsurancePlanEntity extends IEntity {
  insuranceCode: string;
}

interface IInsuranceSubPlanEntity extends IEntity {
  insuranceCode: string;
  insurancePlanCode: string;
}

interface IOrganizationUnitEntity extends IEntity {
  data?: {
    address?: string;
  } & any;
}

interface ITypeOfServiceEntity extends IEntity {
  params?: {
    referenceTypeOfService?: TypeOfService;
  } & EntityParams;
}

interface IOrganizationUnitLocationEntity extends IEntity {}

interface IOccupationAreaEntity extends IEntity {
  params?: {
    // se true, na listagem de horários ou qualquer outro lugar que lista médicos,
    // irá filtrar apenas os médicos que tenham uma relação com a area de atuação selecionada,
    // caso contrário a area de atuação só servirá como um agrupador
    hasRelationshipWithDoctors?: boolean;
  } & EntityParams;
}

interface IProcedureEntity extends IEntity {
  specialityCode: string;
  specialityType: string;
  tuss?: string;
  guidance?: string;
}

interface ISpecialityEntity extends IEntity {
  specialityType: string;
}

interface IInsurancePlanCategoryEntity extends IEntity {
  insuranceCode: string;
  insurancePlanCode?: string;
}

interface IReasonEntity extends IEntity {}

type EntityTypes =
  | IProcedureEntity
  | IOrganizationUnitEntity
  | IInsurancePlanEntity
  | IInsuranceEntity
  | IInsuranceSubPlanEntity
  | IGroupEntity
  | IDoctorEntity
  | IInsurancePlanCategoryEntity
  | IOrganizationUnitLocationEntity
  | IOccupationAreaEntity
  | ITypeOfServiceEntity
  | IAppointmentTypeEntity;

export {
  EntityVersionType,
  SpecialityTypes,
  EntityType,
  EntitySourceType,
  ISpecialityEntity,
  IOrganizationUnitEntity,
  IInsuranceEntity,
  IInsurancePlanCategoryEntity,
  IProcedureEntity,
  IInsurancePlanEntity,
  IDoctorEntity,
  IAppointmentTypeEntity,
  IInsuranceSubPlanEntity,
  IGroupEntity,
  IOccupationAreaEntity,
  ITypeOfServiceEntity,
  IOrganizationUnitLocationEntity,
  IReasonEntity,
  IEntity,
  IEntityReference,
  EntityTypes,
  EntityParams,
};
