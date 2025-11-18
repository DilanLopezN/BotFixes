import { FlowTriggerType } from '../../flow/interfaces/flow.interface';

export interface MatchFlowsConfirmation {
  scheduleCode?: string;
  scheduleId?: number;
  scheduleIds?: number[];
  trigger?: FlowTriggerType;
}
