import { HealthEntityType } from '~/constants/health-entity-type';
import { HealthIntegrationSynchronizeStatus } from '~/constants/health-integration-synchronize-status';
import { IntegrationEnvironment } from '~/constants/integration-environment';
import { IntegrationSyncType } from '~/constants/integration-sync-type';
import type { HealthIntegrationRules } from '~/interfaces/health-integratio-rules';
import type { HealthIntegrationLastSinglePublishEntities } from '~/interfaces/health-integration-last-single-publish-entities';
import type { IntegrationInternalApi } from '~/interfaces/integration-internal-api';

export interface HealthIntegration {
  _id?: string;
  name: string;
  codeIntegration: string;
  entitiesToSync: HealthEntityType[];
  entitiesFlow: HealthEntityType[];
  type: string;
  apiToken?: string;
  apiUrl?: string;
  workspaceId: string;
  syncStatus?: HealthIntegrationSynchronizeStatus;
  syncErrorStatus?: HealthIntegrationSynchronizeStatus;
  lastSyncTimestamp?: number;
  lastSyncErrorTimestamp?: number;
  enabled: boolean;
  requiredAuthentication: boolean;
  lastSyncEntities?: number;
  lastPublishFlow?: number;
  lastPublishFlowDraft?: number;
  lastSinglePublishEntities?: HealthIntegrationLastSinglePublishEntities;
  rules?: HealthIntegrationRules;
  environment?: IntegrationEnvironment;
  syncType?: IntegrationSyncType;
  debug?: boolean;
  auditRequests?: boolean;
  internalApi?: IntegrationInternalApi;
  apiUsername?: string;
  apiPassword?: string;
  routines?: {
    cronSearchAvailableSchedules?: boolean;
  };
  integrationStatus?: any;
  newMessagesCount?: any;
}
