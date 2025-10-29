import { FlowStatusEnum } from '~/constants/flow-status';
import { FlowData } from './flow-libraries';

export interface Flow {
  id: number;
  workspaceId: string;
  channelConfigId: string;
  active: boolean;
  flowId: number;
  flowName: string;
  status: FlowStatusEnum;
  flowLibraryId: number;
  flowFields?: Record<string, any>;
  flowsData: FlowData[];
}
