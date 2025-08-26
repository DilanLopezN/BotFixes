import { DistributionType } from '../enums/distribution-type.enum';

export interface Agent {
    id: string;
    name: string;
    teamId: string;
    email: string;
}

export interface AssignmentResult {
    agent: Agent;
    executedRules: DistributionType[];
}
