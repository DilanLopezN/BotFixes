import { HealthEntitySource } from '~/constants/health-entity-source';
import { HealthEntityType } from '~/constants/health-entity-type';

export interface GetHealthEntitiesProps {
  workspaceId: string;
  integrationId: string;
  queryString: string;
}

export interface EntityReference {
  refId: string;
  type: HealthEntityType;
}

export interface HealthEntity {
  _id: string;
  iid: string;
  code: string;
  name: string;
  friendlyName: string;
  synonyms: string[];
  version: string;
  lastUpdate: number;
  specialityType: string;
  specialityCode?: string;
  workspaceId: string;
  integrationId: string;
  order?: number;
  source: HealthEntitySource;
  entityType: HealthEntityType;
  parent?: HealthEntity;
  insuranceCode: string;
  interConsultationPeriod?: number;
  activeErp?: boolean;
  draft?: HealthEntity;
  references?: EntityReference[];
  params?: any;
  canCancel?: boolean;
  canConfirmActive?: boolean;
  canConfirmPassive?: boolean;
  canView?: boolean;
  canReschedule?: boolean;
  canSchedule?: boolean;
}
