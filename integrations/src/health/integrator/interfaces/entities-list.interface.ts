import { EntityDocument } from '../../entities/schema';
import { ExecutedFlows } from '../../flow/interfaces/executed-flows.interface';
import { FlowPeriodOfDay } from '../../flow/interfaces/flow.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { EntityType, EntityVersionType } from '../../interfaces/entity.interface';

export interface DefaultEntitiesFilters {
  appointmentTypeCode?: string;
  doctorCode?: string;
  insuranceCode?: string;
  insurancePlanCode?: string;
  insuranceSubPlanCode?: string;
  occupationAreaCode?: string;
  organizationUnitCode?: string;
  organizationUnitLocationCode?: string;
  planCategoryCode?: string;
  procedureCode?: string;
  specialityCode?: string;
  typeOfServiceCode?: string;
}

export interface EntityFilter {
  targetEntity: EntityType;
  filter: DefaultEntitiesFilters;
  cache?: boolean;
}

export interface EntityList {
  version?: EntityVersionType;
  filter: CorrelationFilter;
  targetEntity: EntityType;
  periodOfDay?: FlowPeriodOfDay;
  cache?: boolean;
  patient: {
    bornDate?: string;
    sex?: string;
    cpf?: string;
    code?: string;
    name?: string;
    phone?: string;
  };
  dateLimit?: number;
}

export interface EntityListText extends EntityList {
  text: string;
}

export interface EntityListResponse {
  data: EntityDocument[];
  executedFlows: ExecutedFlows;
}

export interface EntityListTextResponse {
  data: EntityDocument[];
  executedFlows: ExecutedFlows;
  isValid: boolean;
}
