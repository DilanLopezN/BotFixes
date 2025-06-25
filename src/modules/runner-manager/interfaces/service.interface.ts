import { Runner } from '../models/runner.entity';
import { EnvTypes } from '../models/service.entity';

export interface ServiceInterface {
    id: number;
    env: EnvTypes;
    integrationId: string;
    runnerId: number;
    workspaceId: string;
    createdAt: Date;
    runner?: Runner;
}

export interface CreateService extends Omit<ServiceInterface, 'id' | 'createdAt'> {}

export interface UpdateService extends ServiceInterface {}
