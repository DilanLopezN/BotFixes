import { HealthEntityType } from 'kissbot-core';
import { IEntityReference, IHealthEntity } from '../../interfaces/health/health-entity.interface';

class HealthEntityDto {
    iid?: string;
    code?: string;
    name?: string;
    friendlyName?: string;
    synonyms?: string[];
    type?: string;
    version?: string;
    lastUpdate?: number;
    specialityType?: string;
    entityType?: HealthEntityType;
    draft?: Partial<IHealthEntity>;
    references?: IEntityReference[];
    params?: any;
}

export class UpdateHealthEntityDto extends HealthEntityDto {}

export class CreateHealthEntityDto extends HealthEntityDto {}
