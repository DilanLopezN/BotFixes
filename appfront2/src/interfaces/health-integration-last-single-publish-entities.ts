import { HealthEntityType } from '~/constants/health-entity-type';

export interface HealthIntegrationLastSinglePublishEntities {
  [HealthEntityType.appointmentType]?: number;
  [HealthEntityType.doctor]?: number;
  [HealthEntityType.group]?: number;
  [HealthEntityType.insurance]?: number;
  [HealthEntityType.insurancePlan]?: number;
  [HealthEntityType.insuranceSubPlan]?: number;
  [HealthEntityType.organizationUnit]?: number;
  [HealthEntityType.planCategory]?: number;
  [HealthEntityType.procedure]?: number;
  [HealthEntityType.speciality]?: number;
  [HealthEntityType.occupationArea]?: number;
  [HealthEntityType.organizationUnitLocation]?: number;
  [HealthEntityType.typeOfService]?: number;
}
