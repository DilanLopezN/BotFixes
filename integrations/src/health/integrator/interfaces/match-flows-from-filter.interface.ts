import { FlowPeriodOfDay, FlowSteps, FlowTriggerType } from '../../flow/interfaces/flow.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export interface MatchFlowsFromFilters {
  targetFlowType: FlowSteps;
  filters: CorrelationFilter;
  patientBornDate: string;
  periodOfDay: FlowPeriodOfDay;
  patientSex?: string;
  patientCpf?: string;
  trigger?: FlowTriggerType;
}
