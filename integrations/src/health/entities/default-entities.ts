import { IAppointmentTypeEntity, ITypeOfServiceEntity } from '../interfaces/entity.interface';
import { ScheduleType } from './schema/appointment-type-entity.schema';
import { TypeOfService } from './schema/type-of-service-entity.schema';

const defaultAppointmentTypesMap: { [key in ScheduleType]: string } = {
  [ScheduleType.Exam]: 'E',
  [ScheduleType.Consultation]: 'C',
  [ScheduleType.FollowUp]: 'R',
};

const defaultAppointmentTypes: Partial<IAppointmentTypeEntity>[] = [
  {
    code: defaultAppointmentTypesMap[ScheduleType.Exam],
    name: 'Exame',
    params: {
      referenceScheduleType: ScheduleType.Exam,
    },
  },
  {
    code: defaultAppointmentTypesMap[ScheduleType.Consultation],
    name: 'Consulta',
    params: {
      referenceScheduleType: ScheduleType.Consultation,
    },
  },
];

const defaultTypesOfServiceMap: { [key in TypeOfService]: string } = {
  [TypeOfService.telemedicine]: '1',
  [TypeOfService.surgery]: '2',
  [TypeOfService.followUp]: '3',
  [TypeOfService.default]: '4',
  [TypeOfService.firstAppointment]: '5',
  [TypeOfService.custom]: '-1',
};

const defaultTypesOfService: Partial<ITypeOfServiceEntity>[] = [
  {
    code: defaultTypesOfServiceMap[TypeOfService.telemedicine],
    name: 'Telemedicina',
    params: {
      referenceTypeOfService: TypeOfService.telemedicine,
    },
  },
  {
    code: defaultTypesOfServiceMap[TypeOfService.surgery],
    name: 'Cirurgia',
    params: {
      referenceTypeOfService: TypeOfService.surgery,
    },
  },
  {
    code: defaultTypesOfServiceMap[TypeOfService.followUp],
    name: 'Retorno',
    params: {
      referenceTypeOfService: TypeOfService.followUp,
    },
  },
  {
    code: defaultTypesOfServiceMap[TypeOfService.default],
    name: 'Presencial',
    params: {
      referenceTypeOfService: TypeOfService.default,
    },
  },
  {
    code: defaultTypesOfServiceMap[TypeOfService.firstAppointment],
    name: 'Primeira consulta',
    params: {
      referenceTypeOfService: TypeOfService.firstAppointment,
    },
  },
];

export { defaultAppointmentTypes, defaultTypesOfService, defaultTypesOfServiceMap, defaultAppointmentTypesMap };
