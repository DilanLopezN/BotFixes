import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Chance } from 'chance';
import * as moment from 'moment';
import { ProdoctorService } from '../services/prodoctor.service';
import { ProdoctorApiService } from '../services/prodoctor-api.service';
import { ProdoctorHelpersService } from '../services/prodoctor-helpers.service';
import { ProdoctorEntitiesService } from '../services/prodoctor-entities.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { AppointmentService } from '../../../shared/appointment.service';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { getSampleIntegrationDocument } from '../../../../mock/integration.mock';
import { getSampleEntity } from '../../../../mock/entity.mock';
import { getSampleAppointment } from '../../../../mock/appointment.mock';
import { IntegrationType } from '../../../interfaces/integration-types';
import { EntityType } from '../../../interfaces/entity.interface';
import { DoctorEntityDocument, InsuranceEntityDocument, ProcedureEntityDocument } from '../../../entities/schema';
import { Patient } from '../../../interfaces/patient.interface';
import { Appointment, AppointmentStatus } from '../../../interfaces/appointment.interface';

// Mock config helper
jest.mock('../../../../common/helpers/config.helper', () => ({
  validateSchema: jest.fn((schema, config) => config),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

describe('ProdoctorService', () => {
  const chance = new Chance();
  let service: ProdoctorService;
  let prodoctorApiService: ProdoctorApiService;
  let prodoctorHelpersService: ProdoctorHelpersService;
  let prodoctorEntitiesService: ProdoctorEntitiesService;
  let entitiesService: EntitiesService;
  let appointmentService: AppointmentService;
  let flowService: FlowService;
  let integrationCacheUtilsService: IntegrationCacheUtilsService;

  const integration = getSampleIntegrationDocument({
    type: IntegrationType.PRODOCTOR,
  });

  // Mock patient data
  const mockPatient: Patient = {
    code: '101',
    name: 'Maria de Souza Santos',
    cpf: '12345678900',
    bornDate: '1991-08-10',
    phone: '11999990001',
  };

  // Mock doctor entity
  const mockDoctorEntity = getSampleEntity<DoctorEntityDocument>({
    code: '100',
    name: 'Dr. João da Silva',
  });

  // Mock insurance entity
  const mockInsuranceEntity = getSampleEntity<InsuranceEntityDocument>({
    code: '501',
    name: 'Unimed',
  });

  // Mock procedure entity
  const mockProcedureEntity = getSampleEntity<ProcedureEntityDocument>({
    code: '10101012',
    name: 'Consulta',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        ProdoctorService,
        {
          provide: ProdoctorApiService,
          useValue: createMock<ProdoctorApiService>(),
        },
        {
          provide: ProdoctorHelpersService,
          useValue: createMock<ProdoctorHelpersService>(),
        },
        {
          provide: ProdoctorEntitiesService,
          useValue: createMock<ProdoctorEntitiesService>(),
        },
        {
          provide: EntitiesService,
          useValue: createMock<EntitiesService>(),
        },
        {
          provide: AppointmentService,
          useValue: createMock<AppointmentService>(),
        },
        {
          provide: FlowService,
          useValue: createMock<FlowService>(),
        },
        {
          provide: IntegrationCacheUtilsService,
          useValue: createMock<IntegrationCacheUtilsService>(),
        },
      ],
    }).compile();

    service = module.get<ProdoctorService>(ProdoctorService);
    prodoctorApiService = module.get<ProdoctorApiService>(ProdoctorApiService);
    prodoctorHelpersService = module.get<ProdoctorHelpersService>(ProdoctorHelpersService);
    prodoctorEntitiesService = module.get<ProdoctorEntitiesService>(ProdoctorEntitiesService);
    entitiesService = module.get<EntitiesService>(EntitiesService);
    appointmentService = module.get<AppointmentService>(AppointmentService);
    flowService = module.get<FlowService>(FlowService);
    integrationCacheUtilsService = module.get<IntegrationCacheUtilsService>(IntegrationCacheUtilsService);

    jest.spyOn(service['logger'], 'error').mockImplementation(jest.fn());
    jest.spyOn(service['logger'], 'warn').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== STATUS ==========

  describe('getStatus', () => {
    it('should return ok: true when getSexos returns success', async () => {
      jest.spyOn(prodoctorApiService, 'getSexos').mockResolvedValue({
        sucesso: true,
        mensagem: null,
        payload: {
          sexos: [
            { codigo: 1, nome: 'Masculino' },
            { codigo: 2, nome: 'Feminino' },
          ],
        },
      });

      const result = await service.getStatus(integration);

      expect(result).toEqual({ ok: true });
      expect(prodoctorApiService.getSexos).toHaveBeenCalledWith(integration);
    });

    it('should fallback to getMedicalUsers when getSexos fails', async () => {
      jest.spyOn(prodoctorApiService, 'getSexos').mockRejectedValue(new Error('Connection failed'));
      jest.spyOn(prodoctorApiService, 'listUsers').mockResolvedValue({
        sucesso: true,
        mensagens: null,
        payload: {
          usuarios: [{ codigo: 1, nome: 'Dr. Teste', ativo: true }],
        },
      });

      const result = await service.getStatus(integration);

      expect(result).toEqual({ ok: true });
      expect(prodoctorApiService.getSexos).toHaveBeenCalledWith(integration);
      expect(prodoctorApiService.listUsers).toHaveBeenCalledWith(integration, { quantidade: 1 });
    });

    it('should return ok: false when both getSexos and getMedicalUsers fail', async () => {
      jest.spyOn(prodoctorApiService, 'getSexos').mockRejectedValue(new Error('Connection failed'));
      jest.spyOn(prodoctorApiService, 'listUsers').mockRejectedValue(new Error('Connection failed'));

      const result = await service.getStatus(integration);

      expect(result).toEqual({ ok: false });
    });

    it('should return ok: false when getSexos returns empty sexos array', async () => {
      jest.spyOn(prodoctorApiService, 'getSexos').mockResolvedValue({
        sucesso: true,
        mensagem: null,
        payload: {
          sexos: [],
        },
      });
      jest.spyOn(prodoctorApiService, 'listUsers').mockRejectedValue(new Error('Connection failed'));

      const result = await service.getStatus(integration);

      expect(result).toEqual({ ok: false });
    });
  });

  // ========== PATIENT METHODS ==========

  describe('getPatient', () => {
    it('should return patient from cache when available', async () => {
      jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(mockPatient);

      const result = await service.getPatient(integration, { cpf: '12345678900', cache: true });

      expect(result).toEqual(mockPatient);
      expect(integrationCacheUtilsService.getPatientFromCache).toHaveBeenCalled();
      expect(prodoctorApiService.getPatient).not.toHaveBeenCalled();
    });

    it('should fetch patient by CPF when not in cache', async () => {
      jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
      jest.spyOn(prodoctorApiService, 'getPatient').mockResolvedValue({
        sucesso: true,
        payload: {
          pacientes: [{ codigo: 101, nome: 'Maria de Souza Santos', cpf: '12345678900' }],
        },
        mensagens: [],
      });
      jest.spyOn(prodoctorApiService, 'getPatientDetails').mockResolvedValue({
        sucesso: true,
        payload: {
          paciente: {
            codigo: 101,
            nome: 'Maria de Souza Santos',
            cpf: '12345678900',
            dataNascimento: '10/08/1991',
          },
        },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformPatientViewModelToPatient').mockReturnValue(mockPatient);

      const result = await service.getPatient(integration, { cpf: '12345678900' });

      expect(result).toEqual(mockPatient);
      expect(prodoctorApiService.getPatient).toHaveBeenCalled();
    });

    it('should fetch patient by code', async () => {
      jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
      jest.spyOn(prodoctorApiService, 'getPatientDetails').mockResolvedValue({
        sucesso: true,
        payload: {
          paciente: {
            codigo: 101,
            nome: 'Maria de Souza Santos',
            cpf: '12345678900',
            dataNascimento: '10/08/1991',
          },
        },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformPatientViewModelToPatient').mockReturnValue(mockPatient);

      const result = await service.getPatient(integration, { code: '101' });

      expect(result).toEqual(mockPatient);
      expect(prodoctorApiService.getPatientDetails).toHaveBeenCalledWith(integration, 101);
    });

    it('should return null when patient not found', async () => {
      jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
      jest.spyOn(prodoctorApiService, 'getPatient').mockResolvedValue({
        sucesso: false,
        payload: { pacientes: [] },
        mensagens: ['Paciente não encontrado'],
      });

      const result = await service.getPatient(integration, { cpf: '00000000000' });

      expect(result).toBeUndefined();
    });
  });

  describe('createPatient', () => {
    const createPatientData = {
      patient: {
        name: 'Novo Paciente',
        cpf: '99988877766',
        bornDate: '1990-01-01',
        phone: '11999999999',
      },
      organizationUnit: {
        code: '1',
      },
    };

    it('should create patient successfully', async () => {
      const createdPatient: Patient = {
        code: '200',
        name: 'Novo Paciente',
        cpf: '99988877766',
        bornDate: '1990-01-01',
      };

      jest.spyOn(prodoctorHelpersService, 'replacePatientToProdoctorPatient').mockReturnValue({
        paciente: {
          nome: 'Novo Paciente',
          cpf: '99988877766',
          dataNascimento: '01/01/1990',
        },
      });
      jest.spyOn(prodoctorApiService, 'createPatient').mockResolvedValue({
        sucesso: true,
        payload: { paciente: { codigo: 200, nome: 'Novo Paciente' } },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'replaceCreatedProdoctorPatientToPatient').mockReturnValue(createdPatient);

      const result = await service.createPatient(integration, createPatientData);

      expect(result).toEqual(createdPatient);
      expect(prodoctorApiService.createPatient).toHaveBeenCalled();
      expect(integrationCacheUtilsService.setPatientCache).toHaveBeenCalled();
    });

    it('should throw error when creation fails', async () => {
      jest.spyOn(prodoctorHelpersService, 'replacePatientToProdoctorPatient').mockReturnValue({
        paciente: { nome: 'Novo Paciente', cpf: '99988877766' },
      });
      jest.spyOn(prodoctorApiService, 'createPatient').mockResolvedValue({
        sucesso: false,
        payload: null,
        mensagens: ['Erro ao criar paciente'],
      });

      await expect(service.createPatient(integration, createPatientData)).rejects.toThrow();
    });
  });

  describe('updatePatient', () => {
    const updatePatientData = {
      patient: {
        name: 'Maria Atualizada',
        cpf: '12345678900',
        bornDate: '1991-08-10',
        phone: '11888888888',
      },
    };

    it('should update patient successfully', async () => {
      const updatedPatient: Patient = {
        code: '101',
        name: 'Maria Atualizada',
        cpf: '12345678900',
        bornDate: '1991-08-10',
      };

      jest.spyOn(prodoctorHelpersService, 'buildUpdatePatientRequest').mockReturnValue({
        paciente: { codigo: 101, nome: 'Maria Atualizada' },
      });
      jest.spyOn(prodoctorApiService, 'updatePatient').mockResolvedValue({
        sucesso: true,
        payload: { paciente: { codigo: 101, nome: 'Maria Atualizada' } },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'replaceCreatedProdoctorPatientToPatient').mockReturnValue(updatedPatient);

      const result = await service.updatePatient(integration, '101', updatePatientData);

      expect(result).toEqual(updatedPatient);
      expect(prodoctorApiService.updatePatient).toHaveBeenCalled();
      expect(integrationCacheUtilsService.setPatientCache).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      jest.spyOn(prodoctorHelpersService, 'buildUpdatePatientRequest').mockReturnValue({
        paciente: { codigo: 101, nome: 'Maria Atualizada' },
      });
      jest.spyOn(prodoctorApiService, 'updatePatient').mockResolvedValue({
        sucesso: false,
        payload: null,
        mensagens: ['Erro ao atualizar paciente'],
      });

      await expect(service.updatePatient(integration, '101', updatePatientData)).rejects.toThrow();
    });
  });

  // ========== SCHEDULE METHODS ==========

  describe('getPatientSchedules', () => {
    it('should return patient schedules', async () => {
      const mockSchedules: Appointment[] = [
        getSampleAppointment({
          appointmentCode: '1001',
          appointmentDate: moment().add(1, 'day').toISOString(),
        }),
      ];

      jest.spyOn(prodoctorApiService, 'searchPatientAppointments').mockResolvedValue({
        sucesso: true,
        payload: {
          agendamentos: [
            {
              codigo: 1001,
              data: moment().add(1, 'day').format('DD/MM/YYYY'),
              hora: '09:00',
            },
          ],
        },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformScheduleToRawAppointment').mockReturnValue({
        appointmentCode: '1001',
        appointmentDate: moment().add(1, 'day').toISOString(),
      } as any);
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue(mockSchedules);

      const result = await service.getPatientSchedules(integration, { patientCode: '101' });

      expect(result).toEqual(mockSchedules);
      expect(prodoctorApiService.searchPatientAppointments).toHaveBeenCalled();
    });

    it('should return empty array when no schedules found', async () => {
      jest.spyOn(prodoctorApiService, 'searchPatientAppointments').mockResolvedValue({
        sucesso: true,
        payload: { agendamentos: [] },
        mensagens: [],
      });

      const result = await service.getPatientSchedules(integration, { patientCode: '101' });

      expect(result).toEqual([]);
    });

    it('should filter schedules by date range', async () => {
      jest.spyOn(prodoctorApiService, 'searchPatientAppointments').mockResolvedValue({
        sucesso: true,
        payload: { agendamentos: [] },
        mensagens: [],
      });

      const startDate = moment('2024-01-01').valueOf();
      const endDate = moment('2024-12-31').valueOf();

      await service.getPatientSchedules(integration, {
        patientCode: '101',
        startDate,
        endDate,
      });

      expect(prodoctorApiService.searchPatientAppointments).toHaveBeenCalledWith(
        integration,
        expect.objectContaining({
          paciente: { codigo: 101 },
          periodo: {
            dataInicial: '01/01/2024',
            dataFinal: '31/12/2024',
          },
        }),
      );
    });
  });

  describe('getAvailableSchedules', () => {
    it('should return available schedules for a doctor', async () => {
      const mockSchedules: Appointment[] = [
        getSampleAppointment({
          appointmentCode: 'slot-1',
          appointmentDate: moment().add(1, 'day').set({ hour: 9, minute: 0 }).toISOString(),
          status: AppointmentStatus.scheduled,
        }),
      ];

      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue(mockDoctorEntity);
      jest.spyOn(prodoctorApiService, 'getAvailableSchedule').mockResolvedValue({
        sucesso: true,
        payload: {
          agendamentos: [
            {
              data: moment().add(1, 'day').format('DD/MM/YYYY HH:mm'),
            },
          ],
        },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformAvailableScheduleToRawAppointment').mockReturnValue({
        appointmentCode: 'slot-1',
        appointmentDate: moment().add(1, 'day').set({ hour: 9, minute: 0 }).toISOString(),
        status: AppointmentStatus.scheduled,
      } as any);
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue(mockSchedules);

      const result = await service.getAvailableSchedules(integration, {
        filter: { doctor: mockDoctorEntity },
        fromDay: 0,
        untilDay: 7,
        limit: 10,
        randomize: false,
      });

      expect(result.schedules).toHaveLength(1);
      expect(prodoctorApiService.getAvailableSchedule).toHaveBeenCalled();
    });

    it('should return empty schedules when doctor code is not provided', async () => {
      const result = await service.getAvailableSchedules(integration, {
        filter: {},
        fromDay: 0,
        untilDay: 7,
        limit: 10,
        randomize: false,
      });

      expect(result.schedules).toEqual([]);
      expect(result.metadata).toBeNull();
    });

    it('should return empty schedules when doctor entity not found', async () => {
      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue(null);

      const result = await service.getAvailableSchedules(integration, {
        filter: { doctor: mockDoctorEntity },
        fromDay: 0,
        untilDay: 7,
        limit: 10,
        randomize: false,
      });

      expect(result.schedules).toEqual([]);
    });

    it('should apply period filter for shifts', async () => {
      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue(mockDoctorEntity);
      jest.spyOn(prodoctorApiService, 'getAvailableSchedule').mockResolvedValue({
        sucesso: true,
        payload: { agendamentos: [] },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'buildShiftsFromPeriod').mockReturnValue({ manha: true });
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([]);

      await service.getAvailableSchedules(integration, {
        filter: { doctor: mockDoctorEntity },
        fromDay: 0,
        untilDay: 7,
        limit: 10,
        randomize: false,
        period: { start: '08:00', end: '12:00' },
      });

      expect(prodoctorHelpersService.buildShiftsFromPeriod).toHaveBeenCalledWith('08:00', '12:00');
    });
  });

  describe('createSchedule', () => {
    const createScheduleData = {
      appointment: {
        appointmentDate: moment().add(1, 'day').set({ hour: 14, minute: 0 }).toISOString(),
        duration: '30',
        code: 'slot-1',
      },
      patient: { code: '101' },
      doctor: { code: '100' },
      insurance: { code: '501', planCode: '1' },
      organizationUnit: { code: '1' },
      procedure: { code: '10101012', specialityCode: '1', specialityType: 'consulta' },
      appointmentType: { code: 'consulta' },
    };

    it('should create schedule successfully', async () => {
      const createdAppointment = getSampleAppointment({
        appointmentCode: '1-100-02122024-1400',
        appointmentDate: createScheduleData.appointment.appointmentDate,
      });

      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue(mockProcedureEntity);
      jest.spyOn(prodoctorApiService, 'insertAppointment').mockResolvedValue({
        sucesso: true,
        payload: {
          agendamento: {
            codigo: 1001,
            localProDoctor: { codigo: 1 },
            usuario: { codigo: 100 },
            data: moment().add(1, 'day').format('DD/MM/YYYY'),
            hora: '14:00',
          },
        },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformScheduleToRawAppointment').mockReturnValue({
        appointmentCode: '1-100-02122024-1400',
        appointmentDate: createScheduleData.appointment.appointmentDate,
      } as any);
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([createdAppointment]);

      const result = await service.createSchedule(integration, createScheduleData);

      expect(result).toEqual(createdAppointment);
      expect(prodoctorApiService.insertAppointment).toHaveBeenCalled();
    });

    it('should throw error when schedule creation fails', async () => {
      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue(mockProcedureEntity);
      jest.spyOn(prodoctorApiService, 'insertAppointment').mockResolvedValue({
        sucesso: false,
        payload: null,
        mensagens: ['Horário indisponível'],
      });

      await expect(service.createSchedule(integration, createScheduleData)).rejects.toThrow();
    });
  });

  describe('cancelSchedule', () => {
    it('should cancel schedule using appointment code format', async () => {
      jest.spyOn(prodoctorApiService, 'cancelAppointment').mockResolvedValue({
        sucesso: true,
        mensagens: ['Agendamento cancelado'],
      });

      const result = await service.cancelSchedule(integration, {
        appointmentCode: '1-100-02122024-1400',
        patientCode: '101',
      });

      expect(result).toEqual({ ok: true });
      expect(prodoctorApiService.cancelAppointment).toHaveBeenCalledWith(
        integration,
        expect.objectContaining({
          localProDoctor: { codigo: 1 },
          usuario: { codigo: 100 },
          data: '02/12/2024',
          hora: '14:00',
        }),
      );
    });

    it('should cancel schedule by searching patient appointments', async () => {
      const mockSchedule = getSampleAppointment({
        appointmentCode: '1001',
        appointmentDate: moment().add(1, 'day').set({ hour: 14, minute: 0 }).toISOString(),
        doctor: mockDoctorEntity,
        organizationUnitId: '1',
      });

      jest.spyOn(prodoctorApiService, 'searchPatientAppointments').mockResolvedValue({
        sucesso: true,
        payload: { agendamentos: [{ codigo: 1001, data: moment().add(1, 'day').format('DD/MM/YYYY'), hora: '14:00' }] },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformScheduleToRawAppointment').mockReturnValue({
        appointmentCode: '1001',
        appointmentDate: mockSchedule.appointmentDate,
        doctorId: '100',
        organizationUnitId: '1',
      } as any);
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([mockSchedule]);
      jest.spyOn(prodoctorApiService, 'cancelAppointment').mockResolvedValue({
        sucesso: true,
        mensagens: [],
      });

      const result = await service.cancelSchedule(integration, {
        appointmentCode: '1001',
        patientCode: '101',
      });

      expect(result).toEqual({ ok: true });
    });

    it('should throw NOT_FOUND when appointment not found', async () => {
      jest.spyOn(prodoctorApiService, 'searchPatientAppointments').mockResolvedValue({
        sucesso: true,
        payload: { agendamentos: [] },
        mensagens: [],
      });
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([]);

      await expect(
        service.cancelSchedule(integration, {
          appointmentCode: '9999',
          patientCode: '101',
        }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });
  });

  describe('confirmSchedule', () => {
    it('should confirm schedule successfully', async () => {
      jest.spyOn(prodoctorApiService, 'updateAppointmentState').mockResolvedValue({
        sucesso: true,
        payload: { agendamento: { codigo: 1001 } },
        mensagens: [],
      });

      const result = await service.confirmSchedule(integration, {
        appointmentCode: '1-100-02122024-0900',
        patientCode: '101',
      });

      expect(result).toEqual({ ok: true });
      expect(prodoctorApiService.updateAppointmentState).toHaveBeenCalledWith(
        integration,
        expect.objectContaining({
          agendamento: expect.objectContaining({
            localProDoctor: { codigo: 1 },
            usuario: { codigo: 100 },
          }),
          alterarEstadoAgendaConsulta: { confirmado: true },
        }),
      );
    });

    it('should return ok: false when confirmation fails', async () => {
      jest.spyOn(prodoctorApiService, 'updateAppointmentState').mockResolvedValue({
        sucesso: false,
        payload: null,
        mensagens: ['Erro ao confirmar'],
      });

      const result = await service.confirmSchedule(integration, {
        appointmentCode: '1-100-02122024-0900',
        patientCode: '101',
      });

      expect(result).toEqual({ ok: false });
    });
  });

  describe('reschedule', () => {
    it('should reschedule by canceling and creating new appointment', async () => {
      const newAppointment = getSampleAppointment({
        appointmentCode: '1-100-03122024-1000',
        appointmentDate: moment().add(2, 'days').toISOString(),
      });

      // Mock cancel
      jest.spyOn(prodoctorApiService, 'cancelAppointment').mockResolvedValue({
        sucesso: true,
        mensagens: [],
      });

      // Mock create
      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue(mockProcedureEntity);
      jest.spyOn(prodoctorApiService, 'insertAppointment').mockResolvedValue({
        sucesso: true,
        payload: { agendamento: { codigo: 1002 } },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformScheduleToRawAppointment').mockReturnValue({
        appointmentCode: '1-100-03122024-1000',
        appointmentDate: newAppointment.appointmentDate,
      } as any);
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([newAppointment]);

      const result = await service.reschedule(integration, {
        scheduleToCancelCode: '1-100-02122024-0900',
        scheduleToCreate: {
          appointment: {
            appointmentDate: moment().add(2, 'days').toISOString(),
            duration: '30',
            code: 'slot-2',
          },
          patient: { code: '101' },
          doctor: { code: '100' },
          insurance: { code: '501', planCode: '1' },
        },
        patient: { code: '101' },
      });

      expect(result).toEqual(newAppointment);
      expect(prodoctorApiService.cancelAppointment).toHaveBeenCalled();
      expect(prodoctorApiService.insertAppointment).toHaveBeenCalled();
    });
  });

  // ========== ENTITY METHODS ==========

  describe('extractSingleEntity', () => {
    it('should delegate to prodoctorEntitiesService', async () => {
      const mockEntities = [mockDoctorEntity];
      jest.spyOn(prodoctorEntitiesService, 'extractEntity').mockResolvedValue(mockEntities);

      const result = await service.extractSingleEntity(integration, EntityType.doctor);

      expect(result).toEqual(mockEntities);
      expect(prodoctorEntitiesService.extractEntity).toHaveBeenCalledWith(
        integration,
        EntityType.doctor,
        undefined,
        false,
      );
    });
  });

  describe('getEntityList', () => {
    it('should return valid entities from entitiesService', async () => {
      const mockEntities = [mockDoctorEntity];
      jest.spyOn(entitiesService, 'getValidEntities').mockResolvedValue(mockEntities);

      const filter = { insurance: mockInsuranceEntity };
      const result = await service.getEntityList(integration, filter, EntityType.doctor);

      expect(result).toBeDefined();
    });
  });

  // ========== MINIFIED PATIENT SCHEDULES ==========

  describe('getMinifiedPatientSchedules', () => {
    it('should return minified schedules from cache', async () => {
      const cachedSchedules = {
        minifiedSchedules: {
          appointmentList: [],
          lastAppointment: null,
          nextAppointment: null,
        },
        schedules: [],
      };

      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue(cachedSchedules);

      const result = await service.getMinifiedPatientSchedules(integration, { patientCode: '101' });

      expect(result).toEqual(cachedSchedules.minifiedSchedules);
      expect(prodoctorApiService.searchPatientAppointments).not.toHaveBeenCalled();
    });

    it('should fetch and transform schedules when not cached', async () => {
      const mockSchedule = getSampleAppointment({
        appointmentCode: '1001',
        appointmentDate: moment().add(1, 'day').toISOString(),
      });

      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue(null);
      jest.spyOn(prodoctorApiService, 'searchPatientAppointments').mockResolvedValue({
        sucesso: true,
        payload: { agendamentos: [{ codigo: 1001 }] },
        mensagens: [],
      });
      jest.spyOn(prodoctorHelpersService, 'transformScheduleToRawAppointment').mockReturnValue({
        appointmentCode: '1001',
        appointmentDate: mockSchedule.appointmentDate,
      } as any);
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([mockSchedule]);
      jest.spyOn(flowService, 'matchFlowsAndGetActions').mockResolvedValue([]);

      const result = await service.getMinifiedPatientSchedules(integration, { patientCode: '101' });

      expect(result).toBeDefined();
      expect(result.appointmentList).toBeDefined();
      expect(integrationCacheUtilsService.setPatientSchedulesCache).toHaveBeenCalled();
    });
  });

  // ========== SCHEDULE VALUE ==========

  describe('getScheduleValue', () => {
    it('should return null (not implemented)', async () => {
      const result = await service.getScheduleValue(integration, {} as any);
      expect(result).toBeNull();
    });
  });

  // ========== APPOINTMENT CODE GENERATION ==========

  describe('generateAppointmentCode', () => {
    it('should generate correct appointment code format', () => {
      const agendamento = {
        localProDoctor: { codigo: 1 },
        usuario: { codigo: 100 },
        data: '02/12/2024',
        hora: '14:00',
      };

      const result = service['generateAppointmentCode'](agendamento);

      expect(result).toBe('1-100-02122024-1400');
    });

    it('should handle missing localProDoctor', () => {
      const agendamento = {
        usuario: { codigo: 100 },
        data: '02/12/2024',
        hora: '14:00',
      };

      const result = service['generateAppointmentCode'](agendamento);

      expect(result).toBe('0-100-02122024-1400');
    });
  });
});
