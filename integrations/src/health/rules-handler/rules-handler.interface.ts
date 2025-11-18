import { IntegrationDocument } from '../integration/schema/integration.schema';
import { ListAvailableSchedules } from '../integrator/interfaces/list-available-schedules.interface';

export interface IRulesHandler {
  createRedisKeyFromCacheFirstAvailableSchedules(
    integration: IntegrationDocument,
    data: ListAvailableSchedules,
  ): string;
}
