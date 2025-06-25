import { CreateHealthFlowDto } from '../../dto/health/health-flow.dto';

export interface FlowHistory {
    updatedByUserId: string;
    integrationId: string;
    flowId: string;
    workspaceId: string;
    createdAt: string;
    flow: CreateHealthFlowDto;
}
