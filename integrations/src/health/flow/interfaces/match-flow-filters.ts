import { FlowPeriodOfDay } from './flow.interface';

export interface MatchFlowsFilters {
  patientBornDate?: string;
  periodOfDay?: FlowPeriodOfDay;
  patientSex?: string;
  patientCpf?: string;
}
