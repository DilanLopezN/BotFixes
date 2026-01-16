import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from '../appointment.service';
import { AppointmentSortMethod } from '../../interfaces/appointment.interface';
import { getSampleAppointment } from '../../../mock/appointment.mock';
import * as moment from 'moment';
import { getSampleIntegrationDocument } from '../../../mock/integration.mock';
import { EntitiesService } from '../../entities/services/entities.service';
import { createMock } from '@golevelup/ts-jest';
import { FlowPeriodOfDay } from '../../flow/interfaces/flow.interface';

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;

  const dates: moment.MomentSetObject[] = [
    { day: 12, hour: 9, minutes: 8 }, // 0
    { day: 13, hour: 19, minutes: 30 }, // 1
    { day: 12, hour: 11, minutes: 23 }, // 2
    { day: 14, hour: 21, minutes: 0 }, // 3
    { day: 12, hour: 7, minutes: 39 }, // 4
    { day: 13, hour: 15, minutes: 34 }, // 5
    { day: 12, hour: 14, minutes: 34 }, // 6
    { day: 12, hour: 13, minutes: 19 }, // 7
    { day: 12, hour: 12, minutes: 0 }, // 8
    { day: 12, hour: 12, minutes: 15 }, // 9
    { day: 14, hour: 22, minutes: 11 }, // 10
    { day: 12, hour: 19, minutes: 11 }, // 11
    { day: 15, hour: 22, minutes: 30 }, // 12
  ];

  const integration = getSampleIntegrationDocument({});
  const appointments = new Array(dates.length)
    .fill(null)
    .map(() => getSampleAppointment())
    .map((appointment, index) => {
      return {
        ...appointment,
        appointmentDate: moment().utc().set(dates[index]).toISOString(),
      };
    });

  const appointmentsWithOrganization = appointments.map((appointment, index) => {
    return {
      ...appointment,
      organizationUnitId: index % 2 === 0 ? '1' : '2',
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [AppointmentService, { provide: EntitiesService, useValue: createMock<EntitiesService>() }],
    }).compile();

    appointmentService = module.get<AppointmentService>(AppointmentService);
  });

  it('should be defined', () => {
    expect(appointmentService).toBeDefined();
  });

  describe('FUNC: getAppointments', () => {
    it('FUNC:getAppointments: should return correct appointments with firstEachPeriodDay full period', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 8,
          period: { start: '00:00', end: '23:59' },
          randomize: true,
          sortMethod: AppointmentSortMethod.firstEachPeriodDay,
          periodOfDay: FlowPeriodOfDay.indifferent,
        },
        appointments,
      );

      expect(result).toHaveLength(8);

      expect(result[0].appointmentDate).toEqual(moment(appointments[4].appointmentDate).utc().toISOString());
      expect(result[1].appointmentDate).toEqual(moment(appointments[0].appointmentDate).utc().toISOString());
      expect(result[2].appointmentDate).toEqual(moment(appointments[2].appointmentDate).utc().toISOString());
      expect(result[3].appointmentDate).toEqual(moment(appointments[8].appointmentDate).utc().toISOString());
      expect(result[4].appointmentDate).toEqual(moment(appointments[9].appointmentDate).utc().toISOString());
      expect(result[5].appointmentDate).toEqual(moment(appointments[7].appointmentDate).utc().toISOString());
      expect(result[6].appointmentDate).toEqual(moment(appointments[5].appointmentDate).utc().toISOString());
      expect(result[7].appointmentDate).toEqual(moment(appointments[1].appointmentDate).utc().toISOString());
    });

    it('FUNC:getAppointments: should return correct appointments with firstEachPeriodDay afternoon', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 7,
          period: { start: '12:00', end: '23:59' },
          randomize: true,
          sortMethod: AppointmentSortMethod.firstEachPeriodDay,
          periodOfDay: FlowPeriodOfDay.afternoon,
        },
        appointments,
      );

      expect(result).toHaveLength(7);

      expect(result[0].appointmentDate).toEqual(moment(appointments[8].appointmentDate).utc().toISOString());
      expect(result[1].appointmentDate).toEqual(moment(appointments[9].appointmentDate).utc().toISOString());
      expect(result[2].appointmentDate).toEqual(moment(appointments[7].appointmentDate).utc().toISOString());
      expect(result[3].appointmentDate).toEqual(moment(appointments[5].appointmentDate).utc().toISOString());
      expect(result[4].appointmentDate).toEqual(moment(appointments[1].appointmentDate).utc().toISOString());
      expect(result[5].appointmentDate).toEqual(moment(appointments[3].appointmentDate).utc().toISOString());
      expect(result[6].appointmentDate).toEqual(moment(appointments[10].appointmentDate).utc().toISOString());
    });

    it('FUNC:getAppointments: should return correct appointments with combineDatePeriodByOrganization', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 12,
          period: { start: '00:00', end: '23:59' },
          randomize: true,
          sortMethod: AppointmentSortMethod.combineDatePeriodByOrganization,
          periodOfDay: FlowPeriodOfDay.indifferent,
        },
        appointmentsWithOrganization,
      );

      expect(result).toHaveLength(11);

      expect(result[0].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[4].appointmentDate).utc().toISOString(),
      );
      expect(result[1].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[0].appointmentDate).utc().toISOString(),
      );
      expect(result[2].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[2].appointmentDate).utc().toISOString(),
      );
      expect(result[3].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[9].appointmentDate).utc().toISOString(),
      );
      expect(result[4].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[7].appointmentDate).utc().toISOString(),
      );
      expect(result[5].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[11].appointmentDate).utc().toISOString(),
      );
      expect(result[6].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[5].appointmentDate).utc().toISOString(),
      );
      expect(result[7].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[1].appointmentDate).utc().toISOString(),
      );
      expect(result[8].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[3].appointmentDate).utc().toISOString(),
      );
      expect(result[9].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[10].appointmentDate).utc().toISOString(),
      );
      expect(result[10].appointmentDate).toEqual(
        moment(appointmentsWithOrganization[12].appointmentDate).utc().toISOString(),
      );
    });

    it('FUNC:getAppointments: should return correct appointments with firstEachHourDay', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 5,
          period: { start: '12:00', end: '23:59' },
          randomize: true,
          sortMethod: AppointmentSortMethod.firstEachHourDay,
          periodOfDay: FlowPeriodOfDay.afternoon,
        },
        appointments,
      );

      expect(result[0].appointmentDate).toEqual(moment(appointments[8].appointmentDate).utc().toISOString());
      expect(result[1].appointmentDate).toEqual(moment(appointments[7].appointmentDate).utc().toISOString());
      expect(result[2].appointmentDate).toEqual(moment(appointments[6].appointmentDate).utc().toISOString());
    });

    it('FUNC:getAppointments: should return correct appointments without randomize param', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 4,
          period: { start: '00:00', end: '12:00' },
          randomize: false,
          sortMethod: AppointmentSortMethod.default,
          periodOfDay: FlowPeriodOfDay.morning,
        },
        appointments,
      );

      expect(result).toHaveLength(4);

      expect(result[0].appointmentDate).toEqual(moment(appointments[4].appointmentDate).utc().toISOString());
      expect(result[1].appointmentDate).toEqual(moment(appointments[0].appointmentDate).utc().toISOString());
      expect(result[2].appointmentDate).toEqual(moment(appointments[2].appointmentDate).utc().toISOString());
      expect(result[3].appointmentDate).toEqual(moment(appointments[8].appointmentDate).utc().toISOString());
    });

    it('FUNC:getAppointments: should return correct appointments without valid appointments', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 10,
          period: { start: '00:00', end: '12:00' },
          randomize: false,
          sortMethod: AppointmentSortMethod.default,
          periodOfDay: FlowPeriodOfDay.morning,
        },
        [],
      );

      expect(result).toHaveLength(0);
    });

    it('FUNC:getAppointments: should return correct appointments with firstEachPeriodDay night', async () => {
      integration.rules.usesNightTimeInTheSelectionOfPeriod = true;

      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 5,
          period: { start: '18:00', end: '23:59' },
          randomize: true,
          sortMethod: AppointmentSortMethod.firstEachPeriodDay,
          periodOfDay: FlowPeriodOfDay.night,
        },
        appointments,
      );

      expect(result[0].appointmentDate).toEqual(moment(appointments[11].appointmentDate).utc().toISOString());
      expect(result[1].appointmentDate).toEqual(moment(appointments[1].appointmentDate).utc().toISOString());
      expect(result[2].appointmentDate).toEqual(moment(appointments[3].appointmentDate).utc().toISOString());
      expect(result[3].appointmentDate).toEqual(moment(appointments[10].appointmentDate).utc().toISOString());
    });
  });
});
