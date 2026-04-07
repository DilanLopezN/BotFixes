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
          randomize: false,
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
          randomize: false,
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
          randomize: false,
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
          randomize: false,
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
          randomize: false,
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

    describe('FUNC: getAppointments - firstEachDoctorBalanced', () => {
      it('should return only ONE slot per doctor (the earliest) when limit forces processing', async () => {
        // Cenário: 3 médicos, cada um com múltiplos horários
        // Deve retornar o PRIMEIRO de cada médico, depois preencher o limit com horários extras
        const multipleSlotDoctors = [
          // Doctor1 - 3 horários (mais tarde)
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 14:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 16:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          // Doctor2 - 3 horários (mais cedo)
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 08:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 10:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 12:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          // Doctor3 - 3 horários (meio termo)
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 09:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 11:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 15:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 5, // limit < 9 appointments para forçar processamento
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          multipleSlotDoctors,
        );

        // Deve retornar 5 appointments (limit)
        expect(result).toHaveLength(5);

        // Primeiros 3 são o primeiro de cada médico, ordenados cronologicamente
        expect(result[0].appointmentDate).toEqual(moment.utc('2025-11-18 08:00:00').toISOString()); // doctor2 (1º)
        expect(result[1].appointmentDate).toEqual(moment.utc('2025-11-18 10:00:00').toISOString()); // doctor2 (2º)
        expect(result[2].appointmentDate).toEqual(moment.utc('2025-11-18 12:00:00').toISOString()); // doctor2 (3º)
        expect(result[3].appointmentDate).toEqual(moment.utc('2025-11-19 09:00:00').toISOString()); // doctor3 (1º)
        expect(result[4].appointmentDate).toEqual(moment.utc('2025-11-20 10:00:00').toISOString()); // doctor1 (1º)
      });

      it('should respect period filter and return earliest slot per doctor', async () => {
        // Cenário: médicos com horários em períodos diferentes (manhã e tarde)
        // Filtrando apenas tarde, deve retornar primeiro de cada médico + preencher limit
        const periodAppointments = [
          // Doctor1 - manhã e tarde
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 09:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 14:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 16:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          // Doctor2 - apenas tarde
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 14:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 16:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          // Doctor3 - apenas tarde
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 15:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 17:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 5, // limit < appointments para forçar processamento
            period: { start: '12:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorBalanced,
            periodOfDay: FlowPeriodOfDay.afternoon,
          },
          periodAppointments,
        );

        // Deve retornar 5 appointments (limit)
        expect(result).toHaveLength(5);

        // Todos os horários devem ser >= 12:00
        result.forEach((apt) => {
          const hour = moment(apt.appointmentDate).utc().hours();
          expect(hour).toBeGreaterThanOrEqual(12);
        });

        // Verifica ordem cronológica: primeiro de cada médico, depois extras
        expect(result[0].appointmentDate).toEqual(moment.utc('2025-11-18 14:00:00').toISOString()); // doctor2 (1º)
        expect(result[1].appointmentDate).toEqual(moment.utc('2025-11-18 16:00:00').toISOString()); // doctor2 (2º)
        expect(result[2].appointmentDate).toEqual(moment.utc('2025-11-19 15:00:00').toISOString()); // doctor3 (1º)
        expect(result[3].appointmentDate).toEqual(moment.utc('2025-11-19 17:00:00').toISOString()); // doctor3 (2º)
        expect(result[4].appointmentDate).toEqual(moment.utc('2025-11-20 14:00:00').toISOString()); // doctor1 (1º)
      });

      it('should apply limit correctly', async () => {
        // Cenário: 5 médicos, mas limit = 3
        const manyDoctors = [];
        for (let i = 1; i <= 5; i++) {
          manyDoctors.push({
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').add(i, 'days').toISOString(),
            doctorId: `doctor${i}`,
            doctorDefault: { code: `doctor${i}`, name: `Doctor ${i}` },
          });
        }

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 3,
            period: { start: '00:00', end: '23:59' },
            randomize: true,
            sortMethod: AppointmentSortMethod.firstEachDoctorBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          manyDoctors,
        );

        // Deve retornar apenas 3 (os 3 primeiros cronologicamente)
        expect(result).toHaveLength(3);

        // Verificar ordem cronológica
        for (let i = 1; i < result.length; i++) {
          const prev = moment(result[i - 1].appointmentDate);
          const curr = moment(result[i].appointmentDate);
          expect(curr.isSameOrAfter(prev)).toBe(true);
        }
      });

      it('should handle single doctor with multiple slots', async () => {
        // Cenário: apenas 1 médico com vários horários
        // Deve retornar apenas o PRIMEIRO horário deste médico
        const singleDoctorMultipleSlots = [
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 14:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 16:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 3, // limit < appointments para forçar processamento
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          singleDoctorMultipleSlots,
        );

        // Deve retornar 3 appointments (limit), todos do mesmo médico
        expect(result).toHaveLength(3);
        expect(result[0].appointmentDate).toEqual(moment.utc('2025-11-20 08:00:00').toISOString());
        expect(result[1].appointmentDate).toEqual(moment.utc('2025-11-20 10:00:00').toISOString());
        expect(result[2].appointmentDate).toEqual(moment.utc('2025-11-20 14:00:00').toISOString());

        const doctors = new Set(result.map((apt: any) => apt.doctorDefault?.code || apt.doctorId));
        expect(doctors.size).toBe(1);
        expect(doctors.has('doctor1')).toBe(true);
      });
    });

    describe('FUNC: getAppointments - firstEachDoctorFullyBalanced', () => {
      it('should distribute appointments evenly using round-robin when limit forces processing', async () => {
        // Cenário: 3 médicos com múltiplos horários
        // Deve distribuir igualmente usando round-robin
        const multipleSlotDoctors = [
          // Doctor1 - 5 horários
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:30:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 11:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 14:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 16:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          // Doctor2 - 5 horários
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 08:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 08:30:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 10:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 12:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 14:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          // Doctor3 - 5 horários
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 09:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 09:30:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 11:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 15:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 17:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 9, // 3 médicos * 3 horários cada = distribuição 3-3-3
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          multipleSlotDoctors,
        );

        expect(result).toHaveLength(9);

        // Contar horários por médico
        const countByDoctor = {
          doctor1: 0,
          doctor2: 0,
          doctor3: 0,
        };

        result.forEach((apt: any) => {
          const doctorId = apt.doctorDefault?.code || apt.doctorId;
          countByDoctor[doctorId]++;
        });

        // Deve ter 3 horários de cada médico (distribuição balanceada)
        expect(countByDoctor.doctor1).toBe(3);
        expect(countByDoctor.doctor2).toBe(3);
        expect(countByDoctor.doctor3).toBe(3);

        // Verificar ordem cronológica
        for (let i = 1; i < result.length; i++) {
          const prev = moment(result[i - 1].appointmentDate);
          const curr = moment(result[i].appointmentDate);
          expect(curr.isSameOrAfter(prev)).toBe(true);
        }
      });

      it('should prevent one doctor from dominating results (unbalanced scenario)', async () => {
        // Cenário real: 1 médico com 10 horários, 2 médicos com 2 horários cada
        // Deve balancear para evitar que o médico dominante tome todos os slots
        const unbalancedAppointments = [
          // Doctor1 - 10 horários (dominante)
          ...Array.from({ length: 10 }, (_, i) => ({
            ...getSampleAppointment(),
            appointmentDate: moment
              .utc('2025-11-20 08:00:00')
              .add(i * 30, 'minutes')
              .toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor Dominant' },
          })),
          // Doctor2 - 3 horários
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-21 08:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-21 09:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-21 10:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          // Doctor3 - 3 horários
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-22 08:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-22 09:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-22 10:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 12,
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          unbalancedAppointments,
        );

        expect(result).toHaveLength(12);

        // Contar horários por médico
        const countByDoctor = {
          doctor1: 0,
          doctor2: 0,
          doctor3: 0,
        };

        result.forEach((apt: any) => {
          const doctorId = apt.doctorDefault?.code || apt.doctorId;
          countByDoctor[doctorId]++;
        });

        // Doctor1 não deve dominar: máximo 6 horários (metade do limit)
        expect(countByDoctor.doctor1).toBeLessThanOrEqual(6);
        expect(countByDoctor.doctor1).toBeGreaterThanOrEqual(4);

        // Outros médicos devem ter representação significativa
        expect(countByDoctor.doctor2).toBeGreaterThanOrEqual(3);
        expect(countByDoctor.doctor3).toBeGreaterThanOrEqual(3);

        // Total deve ser balanceado (nenhum médico com mais que 50% dos horários)
        const maxCount = Math.max(countByDoctor.doctor1, countByDoctor.doctor2, countByDoctor.doctor3);
        expect(maxCount).toBeLessThanOrEqual(result.length * 0.5);
      });

      it('should respect period filter and distribute evenly', async () => {
        // Cenário: médicos com horários em períodos diferentes
        const periodAppointments = [
          // Doctor1 - manhã e tarde
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 09:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 14:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 16:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 18:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          // Doctor2 - apenas tarde
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 14:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 15:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 16:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-18 17:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          // Doctor3 - apenas tarde
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 15:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 16:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 17:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-19 18:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 9, // 3 médicos * 3 horários
            period: { start: '12:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.afternoon,
          },
          periodAppointments,
        );

        expect(result).toHaveLength(9);

        // Todos os horários devem ser >= 12:00
        result.forEach((apt) => {
          const hour = moment(apt.appointmentDate).utc().hours();
          expect(hour).toBeGreaterThanOrEqual(12);
        });

        // Contar horários por médico
        const countByDoctor = {
          doctor1: 0,
          doctor2: 0,
          doctor3: 0,
        };

        result.forEach((apt: any) => {
          const doctorId = apt.doctorDefault?.code || apt.doctorId;
          countByDoctor[doctorId]++;
        });

        // Distribuição balanceada aproximada
        // Doctor1 tem menos horários na tarde (3), então pode ter menos
        expect(countByDoctor.doctor1).toBeGreaterThanOrEqual(2);
        expect(countByDoctor.doctor1).toBeLessThanOrEqual(3);
        expect(countByDoctor.doctor2).toBeGreaterThanOrEqual(3);
        expect(countByDoctor.doctor2).toBeLessThanOrEqual(4);
        expect(countByDoctor.doctor3).toBeGreaterThanOrEqual(2);
        expect(countByDoctor.doctor3).toBeLessThanOrEqual(4);

        // Verificar que nenhum médico domina (máx 50% dos horários)
        const maxCount = Math.max(countByDoctor.doctor1, countByDoctor.doctor2, countByDoctor.doctor3);
        expect(maxCount).toBeLessThanOrEqual(Math.ceil(result.length * 0.5));
      });

      it('should apply limit correctly and maintain balance', async () => {
        // Cenário: 4 médicos, mas limit = 6
        // Deve distribuir 6 horários de forma balanceada
        const manyDoctors = [];
        for (let i = 1; i <= 4; i++) {
          for (let j = 0; j < 5; j++) {
            manyDoctors.push({
              ...getSampleAppointment(),
              appointmentDate: moment
                .utc('2025-11-20 08:00:00')
                .add(i, 'days')
                .add(j * 30, 'minutes')
                .toISOString(),
              doctorId: `doctor${i}`,
              doctorDefault: { code: `doctor${i}`, name: `Doctor ${i}` },
            });
          }
        }

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 6,
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          manyDoctors,
        );

        expect(result).toHaveLength(6);

        // Contar horários por médico
        const countByDoctor = {};
        result.forEach((apt: any) => {
          const doctorId = apt.doctorDefault?.code || apt.doctorId;
          countByDoctor[doctorId] = (countByDoctor[doctorId] || 0) + 1;
        });

        // Com 4 médicos e limit 6, a distribuição ideal é 2-2-1-1 ou 2-1-2-1, etc
        const counts = Object.values(countByDoctor) as number[];
        const maxCount = Math.max(...counts);
        const minCount = Math.min(...counts);

        // Diferença máxima de 1 horário entre médicos
        expect(maxCount - minCount).toBeLessThanOrEqual(1);

        // Verificar ordem cronológica
        for (let i = 1; i < result.length; i++) {
          const prev = moment(result[i - 1].appointmentDate);
          const curr = moment(result[i].appointmentDate);
          expect(curr.isSameOrAfter(prev)).toBe(true);
        }
      });

      it('should handle single doctor with multiple slots', async () => {
        // Cenário: apenas 1 médico com vários horários
        // Deve retornar os primeiros N horários deste médico
        const singleDoctorMultipleSlots = [
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 14:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 16:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 3,
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          singleDoctorMultipleSlots,
        );

        expect(result).toHaveLength(3);
        expect(result[0].appointmentDate).toEqual(moment.utc('2025-11-20 08:00:00').toISOString());
        expect(result[1].appointmentDate).toEqual(moment.utc('2025-11-20 10:00:00').toISOString());
        expect(result[2].appointmentDate).toEqual(moment.utc('2025-11-20 14:00:00').toISOString());

        const doctors = new Set(result.map((apt: any) => apt.doctorDefault?.code || apt.doctorId));
        expect(doctors.size).toBe(1);
        expect(doctors.has('doctor1')).toBe(true);
      });

      it('should handle tie-breaking with same timestamp for first appointment', async () => {
        // Cenário: múltiplos médicos com PRIMEIRO horário no mesmo timestamp
        // Deve escolher randomicamente um deles, mas incluir o outro médico também
        const tieAppointments = [
          // Doctor1 e Doctor2 têm PRIMEIRO horário no mesmo momento
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          // Horários seguintes (timestamps diferentes)
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 09:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 09:30:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:30:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 6,
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          tieAppointments,
        );

        // Como há empate no primeiro horário (08:00), um timestamp é perdido
        // Resultado esperado: 5 horários (6 disponíveis - 1 duplicado)
        expect(result).toHaveLength(5);

        // Contar horários por médico
        const countByDoctor = {
          doctor1: 0,
          doctor2: 0,
        };

        result.forEach((apt: any) => {
          const doctorId = apt.doctorDefault?.code || apt.doctorId;
          countByDoctor[doctorId]++;
        });

        // Ambos os médicos devem ter horários (distribuição balanceada)
        expect(countByDoctor.doctor1).toBeGreaterThanOrEqual(2);
        expect(countByDoctor.doctor2).toBeGreaterThanOrEqual(2);

        // Verificar que a distribuição está próxima (2-3 ou 3-2)
        expect(Math.abs(countByDoctor.doctor1 - countByDoctor.doctor2)).toBeLessThanOrEqual(1);
      });

      it('should work with limit equal to number of doctors', async () => {
        // Cenário: limit = número de médicos
        // Deve retornar exatamente 1 horário de cada médico
        const equalLimitDoctors = [
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 09:00:00').toISOString(),
            doctorId: 'doctor1',
            doctorDefault: { code: 'doctor1', name: 'Doctor 1' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-21 08:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-21 09:00:00').toISOString(),
            doctorId: 'doctor2',
            doctorDefault: { code: 'doctor2', name: 'Doctor 2' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-22 08:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-22 09:00:00').toISOString(),
            doctorId: 'doctor3',
            doctorDefault: { code: 'doctor3', name: 'Doctor 3' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 3, // exatamente o número de médicos
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          equalLimitDoctors,
        );

        expect(result).toHaveLength(3);

        // Cada médico deve ter exatamente 1 horário
        const countByDoctor = {
          doctor1: 0,
          doctor2: 0,
          doctor3: 0,
        };

        result.forEach((apt: any) => {
          const doctorId = apt.doctorDefault?.code || apt.doctorId;
          countByDoctor[doctorId]++;
        });

        expect(countByDoctor.doctor1).toBe(1);
        expect(countByDoctor.doctor2).toBe(1);
        expect(countByDoctor.doctor3).toBe(1);
      });

      it('should prioritize earliest slot among eligible doctors in each selection', async () => {
        // Cenário: 4 médicos com horários variados — valida que entre os elegíveis (mesma contagem)
        // o algoritmo sempre escolhe o próximo horário mais cedo, não uma ordem fixa
        //
        // Médico A: [08:00, 08:20, 08:40]
        // Médico B: [08:00, 09:00, 10:00]  ← empata com A em 08:00, perde sorteio
        // Médico C: [07:00, 07:30, 07:45]
        // Médico D: [07:15, 07:45, 08:30]
        const fourDoctors = [
          // Doctor A
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').toISOString(),
            doctorId: 'doctorA',
            doctorDefault: { code: 'doctorA', name: 'Doctor A' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:20:00').toISOString(),
            doctorId: 'doctorA',
            doctorDefault: { code: 'doctorA', name: 'Doctor A' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:40:00').toISOString(),
            doctorId: 'doctorA',
            doctorDefault: { code: 'doctorA', name: 'Doctor A' },
          },
          // Doctor B - empata com A em 08:00 mas tem horários mais tardios
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:00:00').toISOString(),
            doctorId: 'doctorB',
            doctorDefault: { code: 'doctorB', name: 'Doctor B' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 09:00:00').toISOString(),
            doctorId: 'doctorB',
            doctorDefault: { code: 'doctorB', name: 'Doctor B' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 10:00:00').toISOString(),
            doctorId: 'doctorB',
            doctorDefault: { code: 'doctorB', name: 'Doctor B' },
          },
          // Doctor C - horários mais cedo de todos
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 07:00:00').toISOString(),
            doctorId: 'doctorC',
            doctorDefault: { code: 'doctorC', name: 'Doctor C' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 07:30:00').toISOString(),
            doctorId: 'doctorC',
            doctorDefault: { code: 'doctorC', name: 'Doctor C' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 07:45:00').toISOString(),
            doctorId: 'doctorC',
            doctorDefault: { code: 'doctorC', name: 'Doctor C' },
          },
          // Doctor D - horários cedo, ligeiramente depois de C
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 07:15:00').toISOString(),
            doctorId: 'doctorD',
            doctorDefault: { code: 'doctorD', name: 'Doctor D' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 07:45:00').toISOString(),
            doctorId: 'doctorD',
            doctorDefault: { code: 'doctorD', name: 'Doctor D' },
          },
          {
            ...getSampleAppointment(),
            appointmentDate: moment.utc('2025-11-20 08:30:00').toISOString(),
            doctorId: 'doctorD',
            doctorDefault: { code: 'doctorD', name: 'Doctor D' },
          },
        ];

        const { appointments: result } = await appointmentService.getAppointments(
          integration,
          {
            limit: 8,
            period: { start: '00:00', end: '23:59' },
            randomize: false,
            sortMethod: AppointmentSortMethod.firstEachDoctorFullyBalanced,
            periodOfDay: FlowPeriodOfDay.indifferent,
          },
          fourDoctors,
        );

        expect(result).toHaveLength(8);

        // Resultado deve estar ordenado cronologicamente
        for (let i = 1; i < result.length; i++) {
          const prev = moment(result[i - 1].appointmentDate);
          const curr = moment(result[i].appointmentDate);
          expect(curr.isSameOrAfter(prev)).toBe(true);
        }

        // Todos os 4 médicos devem aparecer (nenhum excluído)
        const doctors = new Set(result.map((apt: any) => apt.doctorDefault?.code || apt.doctorId));
        expect(doctors.has('doctorA')).toBe(true);
        expect(doctors.has('doctorB')).toBe(true);
        expect(doctors.has('doctorC')).toBe(true);
        expect(doctors.has('doctorD')).toBe(true);

        // Nenhum médico deve ter mais que 50% dos horários
        const countByDoctor: Record<string, number> = {};
        result.forEach((apt: any) => {
          const id = apt.doctorDefault?.code || apt.doctorId;
          countByDoctor[id] = (countByDoctor[id] || 0) + 1;
        });
        const maxCount = Math.max(...Object.values(countByDoctor));
        expect(maxCount).toBeLessThanOrEqual(Math.ceil(result.length / 2));

        // C e D (horários mais cedo) devem estar entre os 3 primeiros do resultado
        const firstThree = result.slice(0, 3).map((apt: any) => apt.doctorDefault?.code || apt.doctorId);
        expect(firstThree.some((id) => id === 'doctorC' || id === 'doctorD')).toBe(true);

        // O horário mais cedo do resultado deve ser de C (07:00) ou D (07:15)
        const firstDoctor = (result[0] as any).doctorDefault?.code || (result[0] as any).doctorId;
        expect(['doctorC', 'doctorD']).toContain(firstDoctor);
      });
    });

    it('FUNC:getAppointments: should return correct appointments with firstEachDay', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 4,
          period: { start: '00:00', end: '23:59' },
          randomize: false,
          sortMethod: AppointmentSortMethod.firstEachDay,
          periodOfDay: FlowPeriodOfDay.indifferent,
        },
        appointments,
      );

      // Deve retornar o primeiro horário de cada dia, até o limite de 4
      expect(result).toHaveLength(4);

      // Dia 12 - primeiro horário é appointments[4] às 07:39
      expect(result[0].appointmentDate).toEqual(moment(appointments[4].appointmentDate).utc().toISOString());
      // Dia 13 - primeiro horário é appointments[5] às 15:34
      expect(result[1].appointmentDate).toEqual(moment(appointments[5].appointmentDate).utc().toISOString());
      // Dia 14 - primeiro horário é appointments[3] às 21:00
      expect(result[2].appointmentDate).toEqual(moment(appointments[3].appointmentDate).utc().toISOString());
      // Dia 15 - primeiro horário é appointments[12] às 22:30
      expect(result[3].appointmentDate).toEqual(moment(appointments[12].appointmentDate).utc().toISOString());
    });

    it('FUNC:getAppointments: should return correct appointments with firstEachDay limited to 2', async () => {
      const { appointments: result } = await appointmentService.getAppointments(
        integration,
        {
          limit: 2,
          period: { start: '00:00', end: '23:59' },
          randomize: false,
          sortMethod: AppointmentSortMethod.firstEachDay,
          periodOfDay: FlowPeriodOfDay.indifferent,
        },
        appointments,
      );

      // Deve retornar apenas 2 dias
      expect(result).toHaveLength(2);

      // Dia 12 - primeiro horário
      expect(result[0].appointmentDate).toEqual(moment(appointments[4].appointmentDate).utc().toISOString());
      // Dia 13 - primeiro horário
      expect(result[1].appointmentDate).toEqual(moment(appointments[5].appointmentDate).utc().toISOString());
    });
  });
});
