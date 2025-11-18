import { Test, TestingModule } from '@nestjs/testing';
import { getSampleIntegrationDocument } from '../../../mock/integration.mock';
import { InterAppointmentService } from '../inter-appointment.service';
import { EntitiesService } from '../../entities/services/entities.service';
import { createMock } from '@golevelup/ts-jest';
import { IntegrationCacheUtilsService } from '../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationType } from '../../interfaces/integration-types';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { getSampleEntity } from '../../../mock/entity.mock';
import {
  AppointmentTypeEntityDocument,
  InsuranceEntityDocument,
  OccupationAreaEntityDocument,
  ProcedureEntityDocument,
  SpecialityEntityDocument,
} from '../../entities/schema';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { PatientSchedules } from '../../integrator/interfaces';
import { FollowUpAppointment, MinifiedAppointments } from '../../interfaces/appointment.interface';
import { Chance } from 'chance';
import { HttpException } from '@nestjs/common';
import { getSampleAppointment } from '../../../mock/appointment.mock';
import { RawAppointment } from '../appointment.service';
import * as moment from 'moment';
import { ExternalInsurances } from '../../external-insurances/interfaces/external-insurances';
import { AuditService } from '../../audit/services/audit.service';
import { ConfigModule } from '@nestjs/config';

// Mock do validateSchema para evitar validação de URI
jest.mock('../../../common/helpers/config.helper', () => ({
  validateSchema: jest.fn((schema, config) => config),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

type MinifiedSchedules = (
  integration: IntegrationDocument,
  patientSchedules: PatientSchedules,
) => Promise<MinifiedAppointments>;

describe('InterAppointmentService', () => {
  const chance = new Chance();
  let interAppointmentService: InterAppointmentService;
  let entitiesService: EntitiesService;
  let integrationCacheUtilsService: IntegrationCacheUtilsService;

  const integration = getSampleIntegrationDocument({
    type: IntegrationType.CM,
  });

  const patientCode = chance.string({ length: 5 });

  const fakeGetPatientSchedules: MinifiedSchedules = () => {
    return Promise.resolve({
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    });
  };

  const resolvePatientSchedules = (patientSchedules: RawAppointment[]) =>
    Promise.resolve({
      minifiedSchedules: {
        lastAppointment: patientSchedules?.[0],
        nextAppointment: null,
        appointmentList: patientSchedules?.map(({ appointmentCode, appointmentDate }) => ({
          appointmentCode,
          appointmentDate,
        })),
      },
      schedules: patientSchedules,
    });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: EntitiesService,
          useValue: createMock<EntitiesService>(),
        },
        {
          provide: IntegrationCacheUtilsService,
          useValue: createMock<IntegrationCacheUtilsService>({
            getPatientSchedulesCache: () => {
              return Promise.resolve(null);
            },
          }),
        },
        {
          provide: AuditService,
          useValue: createMock<AuditService>(),
        },
        InterAppointmentService,
      ],
    }).compile();

    interAppointmentService = module.get<InterAppointmentService>(InterAppointmentService);
    entitiesService = module.get<EntitiesService>(EntitiesService);
    integrationCacheUtilsService = module.get<IntegrationCacheUtilsService>(IntegrationCacheUtilsService);
  });

  it('should be defined', () => {
    expect(interAppointmentService).toBeDefined();
    expect(entitiesService).toBeDefined();
    expect(integrationCacheUtilsService).toBeDefined();
  });

  describe('FUNC: InterAppointmentService.validateInsuranceInterAppointment', () => {
    it('FUNC: Agendando para um convênio particular', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          params: {
            isParticular: true,
          },
        }),
      };

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(0);
    });

    it('FUNC: Não conseguiu buscar agendamentos do paciente', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>(),
      };

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));

      try {
        const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
          integration as IntegrationDocument,
          filter,
          patientCode,
          fakeGetPatientSchedules,
          undefined,
          undefined,
          undefined,
          false,
        );

        expect([doctorsMap, days]).toEqual([undefined, undefined]);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error?.response?.error).toHaveProperty('message', 'Não foi possível validar interAppointment');
      }
    });

    it('FUNC: Valida caso paciente caso paciente não possua nenhum agendamento anterior', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>(),
      };

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules([]));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(0);
    });

    it('FUNC: Valida caso sem interconsulta', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '50',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(39, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(65, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(0);
    });

    it('FUNC: Valida dias exatos de interconsulta', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '50',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(10, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(39, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(21);
    });

    it('FUNC: Existem agendamentos a serem ignorados na interconsulta', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '10',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(10, 'days').toISOString(),
          insurance: filter.insurance,
          appointmentCode: '1',
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(39, 'days').toISOString(),
          insurance: filter.insurance,
          appointmentCode: '2',
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        ['1', '2'],
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(0);
    });

    it('FUNC: Existem agendamentos do tipo retorno', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '10',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(10, 'days').toISOString(),
          insurance: filter.insurance,
          isFollowUp: true,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(28, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(3);
    });

    it('FUNC: Agendamento para um convênio diferente dos agendamentos anteriores', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '21',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(10, 'days').toISOString(),
          insurance: getSampleEntity<InsuranceEntityDocument>({
            code: '11',
          }),
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(28, 'days').toISOString(),
          insurance: getSampleEntity<InsuranceEntityDocument>({
            code: '11',
          }),
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(0);
    });

    it('FUNC: Valida caso paciente tenha agendamentos para uma data futura', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().add(10, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(22, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(41);
    });

    it('FUNC: Valida caso de convênios tenham códigos diferentes mas foram agrupados com mesmo referenceInsuranceType', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
          params: {
            referenceInsuranceType: ExternalInsurances.amil,
          },
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(10, 'days').toISOString(),
          insurance: getSampleEntity<InsuranceEntityDocument>({
            code: '30',
            params: {
              referenceInsuranceType: ExternalInsurances.amil,
            },
          }),
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(22, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(21);
    });

    it('FUNC: Valida caso tipo de agendamento tenham códigos diferentes', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'E',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'E',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'E',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(10, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: getSampleEntity<SpecialityEntityDocument>({
            code: '1',
            specialityType: 'C',
          }),
          procedure: getSampleEntity<ProcedureEntityDocument>({
            code: '10',
            specialityCode: '1',
            specialityType: 'C',
          }),
          appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
            code: 'C',
          }),
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(22, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(9);
    });

    it('FUNC: Valida caso integração utilize a regra: rules.useProcedureAsInterAppointmentValidation', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'E',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'E',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'E',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(10, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: getSampleEntity<ProcedureEntityDocument>({
            code: '20',
            specialityCode: '1',
            specialityType: 'E',
          }),
          appointmentType: filter.appointmentType,
        }),
        getSampleAppointment({
          appointmentDate: moment().subtract(22, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const integration = getSampleIntegrationDocument({
        type: IntegrationType.CM,
        rules: {
          useProcedureAsInterAppointmentValidation: true,
        },
      });

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(9);
    });

    it('FUNC: Valida cenário do follow up gerado pela listagem de retornos', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const patientFollowUps = () => {
        return Promise.resolve([
          {
            procedure: filter.procedure,
            speciality: filter.speciality,
            insurance: filter.insurance,
            inFollowUpPeriod: true,
            followUpLimit: moment().add(9, 'days').toISOString(),
          },
        ] as FollowUpAppointment[]);
      };

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        patientFollowUps,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(10);
    });

    it('FUNC: Valida cenário do follow up gerado pela listagem de retornos é maior que a lógica padrão de interconsulta', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(21, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: getSampleEntity<SpecialityEntityDocument>({
            code: '1',
            specialityType: 'C',
          }),
          procedure: getSampleEntity<ProcedureEntityDocument>({
            code: '10',
            specialityCode: '1',
            specialityType: 'C',
          }),
          appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
            code: 'C',
          }),
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const patientFollowUps = () => {
        return Promise.resolve([
          {
            procedure: filter.procedure,
            speciality: filter.speciality,
            insurance: filter.insurance,
            inFollowUpPeriod: true,
            followUpLimit: moment().add(22, 'days').toISOString(),
          },
        ] as FollowUpAppointment[]);
      };

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        patientFollowUps,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(23);
    });

    it('FUNC: Valida cenário que consulta está agendada  para + de 30 dias', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(60, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: getSampleEntity<SpecialityEntityDocument>({
            code: '1',
            specialityType: 'C',
          }),
          procedure: getSampleEntity<ProcedureEntityDocument>({
            code: '10',
            specialityCode: '1',
            specialityType: 'C',
          }),
          appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
            code: 'C',
          }),
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(0);
    });

    it('FUNC: Valida caso paciente esteja reagendando um agendamento', async () => {
      const appointmentCodeToReschedule = '5566';
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'C',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'C',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'C',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentCode: appointmentCodeToReschedule,
          appointmentDate: moment().add(10, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        [appointmentCodeToReschedule],
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(0);
    });

    it('FUNC: Valida caso integração utilize a regra: rules.useOccupationAreaAsInterAppointmentValidation', async () => {
      const filter: CorrelationFilter = {
        insurance: getSampleEntity<InsuranceEntityDocument>({
          code: '20',
        }),
        speciality: getSampleEntity<SpecialityEntityDocument>({
          code: '1',
          specialityType: 'E',
        }),
        procedure: getSampleEntity<ProcedureEntityDocument>({
          code: '10',
          specialityCode: '1',
          specialityType: 'E',
        }),
        appointmentType: getSampleEntity<AppointmentTypeEntityDocument>({
          code: 'E',
        }),
        occupationArea: getSampleEntity<OccupationAreaEntityDocument>({
          code: '33',
        }),
      };

      const patientSchedules: RawAppointment[] = [
        getSampleAppointment({
          appointmentDate: moment().subtract(12, 'days').toISOString(),
          insurance: filter.insurance,
          speciality: filter.speciality,
          procedure: filter.procedure,
          appointmentType: filter.appointmentType,
          occupationArea: filter.occupationArea,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockImplementation(() => Promise.resolve(filter.insurance));
      jest
        .spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache')
        .mockImplementation(() => resolvePatientSchedules(patientSchedules));

      const integration = getSampleIntegrationDocument({
        type: IntegrationType.CM,
        rules: {
          useOccupationAreaAsInterAppointmentValidation: true,
        },
      });

      const [doctorsMap, days] = await interAppointmentService.validateInsuranceInterAppointment(
        integration as IntegrationDocument,
        filter,
        patientCode,
        fakeGetPatientSchedules,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(doctorsMap).toBeInstanceOf(Map);
      expect(days).toEqual(19);
    });
  });
});
