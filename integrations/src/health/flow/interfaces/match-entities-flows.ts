import { Types } from 'mongoose';
import { EntityDocument } from '../../entities/schema';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { FlowSteps } from './flow.interface';
import { MatchFlowsFilters } from './match-flow-filters';

export interface MatchEntitiesFlow {
  integrationId: Types.ObjectId;
  entitiesFilter: CorrelationFilter;
  entities: EntityDocument[];
  targetEntity: FlowSteps;
  filters: MatchFlowsFilters;
  forceTargetEntityToCompare?: FlowSteps;
}
