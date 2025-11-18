import { Types } from 'mongoose';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { EntityType } from '../../interfaces/entity.interface';
import { FlowPeriodOfDay, FlowSteps, FlowTriggerType, FlowType } from './flow.interface';

interface FlowFilters {
  patientAge?: number;
  periodOfDay?: FlowPeriodOfDay;
  patientSex?: string;
  patientCpf: string;
}

interface FlowsByFilter {
  integrationId: Types.ObjectId;
  entitiesFilter: CorrelationFilter;
  targetEntities: FlowSteps[];
  filters: FlowFilters;
  filterUnmatchedEntity?: EntityType[];
  flowType?: FlowType;
  matchExactIds?: { [key in EntityType]?: string[] };
  trigger?: FlowTriggerType;
}

export { FlowFilters, FlowsByFilter };
