import { DeployStatus } from '../models/deploy.entity';
import { ServiceInterface } from './service.interface';

export interface DeployInterface {
    id: number;
    runnerId: number;
    serviceId: number;
    workspaceId: string;
    status?: DeployStatus;
    tag: string;
    createdAt: Date;
}

export interface CreateDeploy extends Omit<DeployInterface, 'id' | 'createdAt' | 'serviceId'> {
    service?: Partial<ServiceInterface>;
}

export interface UpdateDeploy extends DeployInterface {}
