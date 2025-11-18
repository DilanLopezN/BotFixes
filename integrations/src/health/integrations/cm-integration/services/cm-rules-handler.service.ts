import { Injectable } from '@nestjs/common';
import { sortByKeys } from '../../../../common/helpers/sort-objectkeys';
import { CacheService } from '../../../../core/cache/cache.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { ListAvailableSchedules } from '../../../integrator/interfaces/list-available-schedules.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { IRulesHandler } from '../../../rules-handler/rules-handler.interface';
import * as moment from 'moment';

@Injectable()
export class CmRulesHandlerService implements IRulesHandler {
  constructor(
    private readonly cacheService: CacheService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  createRedisKeyFromCacheFirstAvailableSchedules(
    integration: IntegrationDocument,
    { filter, patient }: ListAvailableSchedules,
  ): string {
    const customRedisKey: { [key: string]: string } = {};

    Object.keys(EntityType).forEach((entityType) => {
      const entity = filter[entityType];

      if (entity?._id) {
        customRedisKey[entityType] = entity._id;
      }
    });

    if (patient.sex) {
      customRedisKey['patientSex'] = patient.sex;
    }

    if (patient?.bornDate) {
      const patientAge = String(moment().diff(patient.bornDate, 'years'));
      customRedisKey['patientAge'] = patientAge;
    }

    return this.cacheService.createCustomKey(
      `${this.integrationCacheUtilsService.getRedisKey(integration)}:firstAvailableSchedule`,
      sortByKeys(customRedisKey),
    );
  }
}
