import { FlowType } from './flow.interface';

export interface ExecutedFlows {
  [flowId: string]: FlowType;
}
