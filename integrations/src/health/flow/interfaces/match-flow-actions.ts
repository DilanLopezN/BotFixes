import { Types } from 'mongoose';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { FlowAction, FlowSteps, FlowTriggerType } from './flow.interface';
import { MatchFlowsFilters } from './match-flow-filters';

export interface MatchFlowActions {
  integrationId: Types.ObjectId;
  targetFlowTypes: FlowSteps[];
  entitiesFilter: CorrelationFilter;
  filters?: MatchFlowsFilters;
  trigger?: FlowTriggerType;
  customFlowActions?: FlowAction[];
}
