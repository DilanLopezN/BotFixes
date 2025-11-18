import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Chance } from 'chance';
import * as moment from 'moment';
import { Types } from 'mongoose';
import { CacheService } from '../../../core/cache/cache.service';
import { getSampleAppointment } from '../../../mock/appointment.mock';
import { getSampleEntity } from '../../../mock/entity.mock';
import { getSampleIntegrationDocument } from '../../../mock/integration.mock';
import { DoctorEntityDocument, ProcedureEntityDocument } from '../../entities/schema';
import { IntegrationCacheUtilsService } from '../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { PatientSchedules } from '../../integrator/interfaces';
import { ListAvailableSchedules } from '../../integrator/interfaces/list-available-schedules.interface';
import { AppointmentStatus, MinifiedAppointments } from '../../interfaces/appointment.interface';
import { IntegrationType } from '../../interfaces/integration-types';
import { RawAppointment } from '../appointment.service';
import { RulesHandlerService } from '../../rules-handler/rules-handler.service';

jest.mock('../../../common/helpers/config.helper', () => ({
  validateSchema: jest.fn((schema, config) => config),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

describe('RulesHandlerService', () => {
  const chance = new Chance();
  let rulesHandlerService: RulesHandlerService;
  let cacheService: CacheService;
  let integrationCacheUtilsService: IntegrationCacheUtilsService;
  let moduleRef: ModuleRef;

  const integration = getSampleIntegrationDocument({
    type: IntegrationType.CM,
  });

  const fakeGetMinifiedPatientSchedules = (
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<MinifiedAppointments> => {
    return Promise.resolve({
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    });
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: CacheService,
          useValue: createMock<CacheService>({
            get: jest.fn(),
            set: jest.fn(),
            createCustomKey: jest.fn().mockReturnValue('test-key'),
          }),
        },
        {
          provide: IntegrationCacheUtilsService,
          useValue: createMock<IntegrationCacheUtilsService>({
            getRedisKey: jest.fn().mockReturnValue('integration-key'),
            getPatientSchedulesCache: jest.fn(),
          }),
        },
        {
          provide: ModuleRef,
          useValue: createMock<ModuleRef>(),
        },
        RulesHandlerService,
      ],
    }).compile();

    rulesHandlerService = module.get<RulesHandlerService>(RulesHandlerService);
    cacheService = module.get<CacheService>(CacheService);
    integrationCacheUtilsService = module.get<IntegrationCacheUtilsService>(IntegrationCacheUtilsService);
    moduleRef = module.get<ModuleRef>(ModuleRef);
  });

  it('should be defined', () => {
    expect(rulesHandlerService).toBeDefined();
    expect(cacheService).toBeDefined();
    expect(integrationCacheUtilsService).toBeDefined();
    expect(moduleRef).toBeDefined();
  });

  describe('FUNC: RulesHandlerService.getDynamicService', () => {
    it('FUNC: Retorna undefined para tipos de integração não suportados', () => {
      const integrationWithUnsupportedType = getSampleIntegrationDocument({
        type: IntegrationType.AMIGO,
      });

      const result = rulesHandlerService.getDynamicService(integrationWithUnsupportedType);

      expect(result).toBeUndefined();
    });
  });

  describe('FUNC: RulesHandlerService.getParamsFromListAvailableSchedules', () => {
    it('FUNC: Retorna filtros originais quando timeCacheFirstAppointmentAvailableForFutureSearches é 0', async () => {
      const filters: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
      };

      const integrationWithoutCache = getSampleIntegrationDocument({
        rules: {
          timeCacheFirstAppointmentAvailableForFutureSearches: 0,
        },
      });

      const result = await rulesHandlerService.getParamsFromListAvailableSchedules(integrationWithoutCache, filters);

      expect(result).toEqual(filters);
    });

    it('FUNC: Retorna filtros originais quando não há data válida no cache', async () => {
      const filters: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
      };

      const integrationWithCache = getSampleIntegrationDocument({
        rules: {
          timeCacheFirstAppointmentAvailableForFutureSearches: 60,
        },
      });

      jest.spyOn(cacheService, 'get').mockResolvedValue(null);

      const result = await rulesHandlerService.getParamsFromListAvailableSchedules(integrationWithCache, filters);

      expect(result).toEqual(filters);
    });

    it('FUNC: Ajusta filtros baseado na data em cache', async () => {
      const filters: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
      };

      const integrationWithCache = getSampleIntegrationDocument({
        rules: {
          timeCacheFirstAppointmentAvailableForFutureSearches: 60,
        },
      });

      const expectedDays = 4;
      const cachedDate = moment().add(5, 'days').toISOString();
      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedDate);

      const result = await rulesHandlerService.getParamsFromListAvailableSchedules(integrationWithCache, filters);

      expect(result.fromDay).toBe(expectedDays);
      expect(result.untilDay).toBe(30 - expectedDays);
    });
  });

  describe('FUNC: RulesHandlerService.setDataFromListAvailableSchedules', () => {
    it('FUNC: Não faz nada quando timeCacheFirstAppointmentAvailableForFutureSearches é 0', async () => {
      const filters: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
      };

      const integrationWithoutCache = getSampleIntegrationDocument({
        rules: {
          timeCacheFirstAppointmentAvailableForFutureSearches: 0,
        },
      });

      const firstAvailableDate = moment().add(1, 'day').toISOString();

      await rulesHandlerService.setDataFromListAvailableSchedules(integrationWithoutCache, filters, firstAvailableDate);

      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('FUNC: Define data no cache quando timeCacheFirstAppointmentAvailableForFutureSearches é maior que 0', async () => {
      const filters: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
      };

      const integrationWithCache = getSampleIntegrationDocument({
        rules: {
          timeCacheFirstAppointmentAvailableForFutureSearches: 60,
        },
      });

      const firstAvailableDate = moment().add(1, 'day').toISOString();

      await rulesHandlerService.setDataFromListAvailableSchedules(integrationWithCache, filters, firstAvailableDate);

      expect(cacheService.set).toHaveBeenCalledWith(firstAvailableDate, 'test-key', 3600);
    });
  });

  describe('FUNC: RulesHandlerService.removeSchedulesFilteredBySameDayRules', () => {
    it('FUNC: Retorna os mesmos agendamentos e metadata quando nenhuma regra está ativa', async () => {
      const availableSchedules: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
        patient: { code: 'patient123', bornDate: '2000-01-01' },
      };

      const replacedAppointments: RawAppointment[] = [];
      const metadata = {};

      const result = await rulesHandlerService.removeSchedulesFilteredBySameDayRules(
        integration,
        availableSchedules,
        replacedAppointments,
        metadata,
        false,
        fakeGetMinifiedPatientSchedules,
      );

      expect(result.replacedAppointments).toEqual(replacedAppointments);
      expect(result.metadata).toEqual(metadata);
    });

    it('FUNC: Filtra agendamentos no mesmo dia quando doNotAllowSameDayScheduling é true', async () => {
      const availableSchedules: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
        patient: { code: 'patient123', bornDate: '2000-01-01' },
      };

      const mockBaseDate = moment().add(1, 'day').format('YYYY-MM-DD');
      const replacedAppointments: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: `${mockBaseDate}T10:00:00.000Z`,
        }),
        getSampleAppointment({
          appointmentDate: moment().add(2, 'day').format('YYYY-MM-DD') + 'T10:00:00.000Z',
        }),
      ];

      const metadata = {};

      const integrationWithSameDayRule = getSampleIntegrationDocument({
        rules: {
          doNotAllowSameDayScheduling: true,
        },
      });

      const patientSchedules = {
        minifiedSchedules: {
          appointmentList: [],
          lastAppointment: null,
          nextAppointment: null,
        },
        schedules: [
          {
            appointmentDate: `${mockBaseDate}T15:00:00.000Z`,
            doctor: getSampleEntity({ code: 'doctor1', _id: new Types.ObjectId(), order: 1 }) as DoctorEntityDocument,
            procedure: getSampleEntity({
              code: 'proc1',
              _id: new Types.ObjectId(),
              order: 1,
            }) as ProcedureEntityDocument,
            appointmentCode: 'appt1',
            status: AppointmentStatus.scheduled,
          },
        ],
      };

      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue(patientSchedules);

      const result = await rulesHandlerService.removeSchedulesFilteredBySameDayRules(
        integrationWithSameDayRule,
        availableSchedules,
        replacedAppointments,
        metadata,
        false,
        fakeGetMinifiedPatientSchedules,
      );

      expect(result.replacedAppointments).toHaveLength(1);
      expect(result.metadata.doNotAllowSameDayScheduling).toBe(true);
    });

    it('FUNC: Filtra agendamentos pelo mesmo médico no mesmo dia quando doNotAllowSameDayAndDoctorScheduling é true', async () => {
      const availableSchedules: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
        patient: { code: 'patient123', bornDate: '2000-01-01' },
      };

      const mockBaseDate = moment().add(1, 'day').format('YYYY-MM-DD');
      const replacedAppointments: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: `${mockBaseDate}T10:00:00.000Z`,
          doctorId: 'doctor1',
        }),
        getSampleAppointment({
          appointmentDate: `${mockBaseDate}T15:00:00.000Z`,
          doctorId: 'doctor2',
        }),
      ];

      const metadata = {};

      const integrationWithSameDayAndDoctorRule = getSampleIntegrationDocument({
        rules: {
          doNotAllowSameDayAndDoctorScheduling: true,
        },
      });

      const patientSchedules = {
        minifiedSchedules: {
          appointmentList: [],
          lastAppointment: null,
          nextAppointment: null,
        },
        schedules: [
          {
            appointmentDate: `${mockBaseDate}T15:00:00.000Z`,
            doctor: getSampleEntity({ code: 'doctor1', _id: new Types.ObjectId(), order: 1 }) as DoctorEntityDocument,
            procedure: getSampleEntity({
              code: 'proc1',
              _id: new Types.ObjectId(),
              order: 1,
            }) as ProcedureEntityDocument,
            appointmentCode: 'appt2',
            status: AppointmentStatus.scheduled,
          },
        ],
      };

      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue(patientSchedules);

      const result = await rulesHandlerService.removeSchedulesFilteredBySameDayRules(
        integrationWithSameDayAndDoctorRule,
        availableSchedules,
        replacedAppointments,
        metadata,
        false,
        fakeGetMinifiedPatientSchedules,
      );

      expect(result.replacedAppointments).toHaveLength(1);
      expect(result.replacedAppointments[0].doctorId).toBe('doctor2');
      expect(result.metadata.doNotAllowSameDayAndDoctorScheduling).toBe(true);
    });

    it('FUNC: Filtra agendamentos pelo mesmo horário quando doNotAllowSameHourScheduling é true', async () => {
      const availableSchedules: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
        patient: { code: 'patient123', bornDate: '2000-01-01' },
      };

      const mockBaseDate = moment().add(1, 'day').format('YYYY-MM-DD');
      const appointmentTime = moment(`${mockBaseDate}T15:00:00.000Z`);

      const replacedAppointments: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: appointmentTime.clone().add(30, 'minutes').toISOString(),
          doctorId: 'doctor2',
        }),
        getSampleAppointment({
          appointmentDate: appointmentTime.clone().add(90, 'minutes').toISOString(),
          doctorId: 'doctor2',
        }),
      ];

      const metadata = {};

      const integrationWithSameHourRule = getSampleIntegrationDocument({
        rules: {
          doNotAllowSameHourScheduling: true,
          doNotAllowSameDayAndDoctorScheduling: true,
          minutesAfterAppointmentCanSchedule: 60,
        },
      });

      const patientSchedules = {
        minifiedSchedules: {
          appointmentList: [],
          lastAppointment: null,
          nextAppointment: null,
        },
        schedules: [
          {
            appointmentDate: appointmentTime.toISOString(),
            doctor: getSampleEntity({ code: 'doctor1', _id: new Types.ObjectId(), order: 1 }) as DoctorEntityDocument,
            procedure: getSampleEntity({
              code: 'proc1',
              _id: new Types.ObjectId(),
              order: 1,
            }) as ProcedureEntityDocument,
            appointmentCode: 'appt3',
            status: AppointmentStatus.scheduled,
          },
        ],
      };

      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue(patientSchedules);

      const result = await rulesHandlerService.removeSchedulesFilteredBySameDayRules(
        integrationWithSameHourRule,
        availableSchedules,
        replacedAppointments,
        metadata,
        false,
        fakeGetMinifiedPatientSchedules,
      );

      expect(result.replacedAppointments).toHaveLength(1);
      expect(
        moment(result.replacedAppointments[0].appointmentDate).diff(appointmentTime, 'minutes'),
      ).toBeGreaterThanOrEqual(60);
    });

    it('FUNC: Chama getMinifiedPatientSchedules quando não há cache e não é retry', async () => {
      const availableSchedules: ListAvailableSchedules = {
        fromDay: 0,
        untilDay: 30,
        filter: {},
        limit: 0,
        randomize: false,
        patient: { code: 'patient123', bornDate: '2000-01-01' },
      };

      const replacedAppointments: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().add(1, 'day').toISOString(),
        }),
      ];

      const metadata = {};

      const integrationWithSameDayRule = getSampleIntegrationDocument({
        rules: {
          doNotAllowSameDayScheduling: true,
        },
      });

      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue(null);

      const mockGetMinifiedPatientSchedules = jest.fn().mockResolvedValue({
        appointmentList: [],
        lastAppointment: null,
        nextAppointment: null,
      });

      const result = await rulesHandlerService.removeSchedulesFilteredBySameDayRules(
        integrationWithSameDayRule,
        availableSchedules,
        replacedAppointments,
        metadata,
        false,
        mockGetMinifiedPatientSchedules,
      );

      expect(mockGetMinifiedPatientSchedules).toHaveBeenCalledWith(integrationWithSameDayRule, {
        patientCode: 'patient123',
      });
    });
  });
});
