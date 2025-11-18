import { Types } from 'mongoose';
import { EntityType } from '../health/interfaces/entity.interface';
import { IntegrationType } from '../health/interfaces/integration-types';
import { Chance } from 'chance';
import { IntegrationEnvironment, IntegrationSyncType } from '../health/integration/interfaces/integration.interface';
import { IntegrationDocument } from '../health/integration/schema/integration.schema';
import * as moment from 'moment';

const getSampleIntegrationDocument = (integration: Partial<IntegrationDocument>): IntegrationDocument => {
  const chance = new Chance();

  return {
    _id: new Types.ObjectId(),
    rules: {
      useProcedureAsInterAppointmentValidation: false,
      useOccupationAreaAsInterAppointmentValidation: false,
      useProcedureWithoutSpecialityRelation: false,
      requiredTypeOfServiceOnCreateAppointment: false,
      listOnlyDoctorsWithAvailableSchedules: false,
      usesCorrelation: false,
    },
    apiToken: chance.string({ length: 10 }),
    enabled: true,
    workspaceId: new Types.ObjectId().toHexString(),
    type: IntegrationType.CM,
    codeIntegration: String(chance.d100() * 10),
    name: chance.company(),
    lastSyncTimestamp: moment().subtract(1, 'days').valueOf(),
    syncStatus: 2,
    lastSyncErrorTimestamp: null,
    lastSyncEntities: moment().subtract(2, 'days').valueOf(),
    entitiesToSync: [
      EntityType.speciality,
      EntityType.insurance,
      EntityType.procedure,
      EntityType.organizationUnit,
      EntityType.doctor,
      EntityType.appointmentType,
      EntityType.insurancePlan,
    ],
    entitiesFlow: [
      EntityType.speciality,
      EntityType.insurance,
      EntityType.procedure,
      EntityType.organizationUnit,
      EntityType.doctor,
      EntityType.appointmentType,
    ],
    apiPassword: chance.string({ length: 10 }),
    apiUsername: chance.string({ length: 10 }),
    syncType: IntegrationSyncType.daily,
    environment: IntegrationEnvironment.production,
    apiUrl: chance.url(),
    ...integration,
  } as IntegrationDocument;
};

export { getSampleIntegrationDocument };
