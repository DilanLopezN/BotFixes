import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ProdoctorService } from './prodoctor.service';
import { ProdoctorApiService } from './prodoctor-api.service';
import { ProdoctorHelpersService } from './prodoctor-helpers.service';
import { ProdoctorEntitiesService } from './prodoctor-entities.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { AppointmentService } from '../../../shared/appointment.service';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityType, EntitySourceType, EntityVersionType } from '../../../interfaces/entity.interface';

describe('ProdoctorService', () => {
  let service: ProdoctorService;
  let prodoctorApiService: ProdoctorApiService;
  let prodoctorHelpersService: ProdoctorHelpersService;
  let prodoctorEntitiesService: ProdoctorEntitiesService;
  let entitiesService: EntitiesService;
  let appointmentService: AppointmentService;
  let flowService: FlowService;
  let integrationCacheUtilsService: IntegrationCacheUtilsService;

  const mockIntegration: Partial<IntegrationDocument> = {
    _id: '507f1f77bcf86cd799439011' as any,
    name: 'ProDoctor Test Integration',
    type: IntegrationType.PRODOCTOR,
    enabled: true,
    debug: false,
  };

  const mockPatient = {
    codigo: 101,
    nome: 'João da Silva',
    cpf: '12345678900',
    dataNascimento: '15/03/1990',
    sexo: { codigo: 1, nome: 'Masculino' },
    correioEletronico: 'joao@email.com',
    telefone1: { ddd: '11', numero: '999887766', tipo: { codigo: 3, nome: 'Celular' } },
  };

  const mockTransformedPatient = {
    code: '101',
    name: 'João da Silva',
    cpf: '12345678900',
    email: 'joao@email.com',
    phone: '',
    cellPhone: '11999887766',
    bornDate: '1990-03-15T00:00:00.000Z',
    sex: 'M',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdoctorService,
        {
          provide: ProdoctorApiService,
          useValue: {
            getPatientDetails: jest.fn(),
            getPatientByCpf: jest.fn(),
            createPatient: jest.fn(),
            updatePatient: jest.fn(),
            buscarAgendamentosPaciente: jest.fn(),
            inserirAgendamento: jest.fn(),
            desmarcarAgendamento: jest.fn(),
            alterarStatusAgendamento: jest.fn(),
            buscarHorariosLivres: jest.fn(),
            listarAgendamentos: jest.fn(),
            alterarAgendamento: jest.fn(),
            buscarAgendamentosPorStatus: jest.fn(),
            listConvenios: jest.fn(),
            detalharConvenio: jest.fn(),
            listLocaisProDoctor: jest.fn(),
          },
        },
        {
          provide: ProdoctorHelpersService,
          useValue: {
            transformPatient: jest.fn(),
            buildCreatePatientRequest: jest.fn(),
            buildUpdatePatientRequest: jest.fn(),
            transformScheduleToRawAppointment: jest.fn(),
            buildTipoAgendamentoRequest: jest.fn(),
            buildTurnosFromPeriod: jest.fn(),
            transformAvailableScheduleToRawAppointment: jest.fn(),
          },
        },
        {
          provide: ProdoctorEntitiesService,
          useValue: {
            listValidEntities: jest.fn(),
            extractEntity: jest.fn(),
          },
        },
        {
          provide: EntitiesService,
          useValue: {
            getEntityByCode: jest.fn(),
            getValidEntitiesbyCode: jest.fn(),
          },
        },
        {
          provide: AppointmentService,
          useValue: {
            transformSchedules: jest.fn(),
          },
        },
        {
          provide: FlowService,
          useValue: {
            matchFlowsAndGetActions: jest.fn(),
            matchEntitiesFlows: jest.fn(),
          },
        },
        {
          provide: IntegrationCacheUtilsService,
          useValue: {
            getPatientFromCache: jest.fn(),
            setPatientCache: jest.fn(),
            getPatientSchedulesCache: jest.fn(),
            setPatientSchedulesCache: jest.fn(),
          },
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatient', () => {
    describe('by code', () => {
      it('deve retornar paciente do cache quando disponível', async () => {
        jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(mockTransformedPatient);

        const result = await service.getPatient(mockIntegration as IntegrationDocument, {
          code: '101',
          cache: true,
        });

        expect(result).toEqual(mockTransformedPatient);
        expect(integrationCacheUtilsService.getPatientFromCache).toHaveBeenCalledWith(
          mockIntegration,
          '101',
          undefined,
        );
        expect(prodoctorApiService.getPatientDetails).not.toHaveBeenCalled();
      });

      it('deve buscar paciente na API quando cache não disponível', async () => {
        jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
        jest.spyOn(prodoctorApiService, 'getPatientDetails').mockResolvedValue({
          sucesso: true,
          mensagens: [],
          payload: { paciente: mockPatient },
        });
        jest.spyOn(prodoctorHelpersService, 'transformPatient').mockReturnValue(mockTransformedPatient);
        jest.spyOn(integrationCacheUtilsService, 'setPatientCache').mockResolvedValue(undefined);

        const result = await service.getPatient(mockIntegration as IntegrationDocument, {
          code: '101',
          cache: true,
        });

        expect(result).toEqual(mockTransformedPatient);
        expect(prodoctorApiService.getPatientDetails).toHaveBeenCalledWith(mockIntegration, 101);
        expect(integrationCacheUtilsService.setPatientCache).toHaveBeenCalled();
      });

      it('deve lançar erro NOT_FOUND quando paciente não existir', async () => {
        jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
        jest.spyOn(prodoctorApiService, 'getPatientDetails').mockResolvedValue({
          sucesso: false,
          mensagens: ['Paciente não encontrado'],
          payload: { paciente: null },
        });

        await expect(service.getPatient(mockIntegration as IntegrationDocument, { code: '999' })).rejects.toMatchObject(
          { status: HttpStatus.NOT_FOUND },
        );
      });
    });

    describe('by cpf', () => {
      it('deve buscar paciente por CPF', async () => {
        jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
        jest.spyOn(prodoctorApiService, 'getPatientByCpf').mockResolvedValue({
          sucesso: true,
          mensagens: [],
          payload: { paciente: mockPatient },
        });
        jest.spyOn(prodoctorHelpersService, 'transformPatient').mockReturnValue(mockTransformedPatient);
        jest.spyOn(integrationCacheUtilsService, 'setPatientCache').mockResolvedValue(undefined);

        const result = await service.getPatient(mockIntegration as IntegrationDocument, {
          cpf: '12345678900',
        });

        expect(result).toEqual(mockTransformedPatient);
        expect(prodoctorApiService.getPatientByCpf).toHaveBeenCalledWith(mockIntegration, '12345678900');
      });
    });
  });

  describe('createPatient', () => {
    const createPatientData = {
      patient: {
        name: 'Maria Silva',
        cpf: '98765432100',
        bornDate: '1995-05-20',
        sex: 'F',
        email: 'maria@email.com',
        cellPhone: '11988776655',
      },
    };

    it('deve criar paciente com sucesso', async () => {
      const mockCreatedPatient = {
        codigo: 102,
        nome: 'Maria Silva',
        cpf: '98765432100',
        dataNascimento: '20/05/1995',
      };

      const transformedCreated = {
        code: '102',
        name: 'Maria Silva',
        cpf: '98765432100',
        bornDate: '1995-05-20T00:00:00.000Z',
      };

      jest.spyOn(prodoctorHelpersService, 'buildCreatePatientRequest').mockReturnValue({
        paciente: mockCreatedPatient,
      } as any);
      jest.spyOn(prodoctorApiService, 'createPatient').mockResolvedValue({
        sucesso: true,
        mensagens: ['Paciente criado'],
        payload: { paciente: mockCreatedPatient },
      });
      jest.spyOn(prodoctorHelpersService, 'transformPatient').mockReturnValue(transformedCreated as any);
      jest.spyOn(integrationCacheUtilsService, 'setPatientCache').mockResolvedValue(undefined);

      const result = await service.createPatient(mockIntegration as IntegrationDocument, createPatientData as any);

      expect(result.code).toBe('102');
      expect(result.name).toBe('Maria Silva');
      expect(prodoctorApiService.createPatient).toHaveBeenCalled();
      expect(integrationCacheUtilsService.setPatientCache).toHaveBeenCalled();
    });

    it('deve lançar erro quando criação falhar', async () => {
      jest.spyOn(prodoctorHelpersService, 'buildCreatePatientRequest').mockReturnValue({} as any);
      jest.spyOn(prodoctorApiService, 'createPatient').mockResolvedValue({
        sucesso: false,
        mensagens: ['Erro ao criar paciente'],
        payload: { paciente: null },
      });

      await expect(
        service.createPatient(mockIntegration as IntegrationDocument, createPatientData as any),
      ).rejects.toThrow();
    });
  });

  describe('updatePatient', () => {
    it('deve atualizar paciente com sucesso', async () => {
      const updateData = {
        patient: {
          name: 'João da Silva Santos',
          email: 'joao.novo@email.com',
        },
      };

      const updatedPatient = {
        codigo: 101,
        nome: 'João da Silva Santos',
        correioEletronico: 'joao.novo@email.com',
      };

      jest.spyOn(prodoctorHelpersService, 'buildUpdatePatientRequest').mockReturnValue({} as any);
      jest.spyOn(prodoctorApiService, 'updatePatient').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { paciente: updatedPatient },
      });
      jest.spyOn(prodoctorHelpersService, 'transformPatient').mockReturnValue({
        code: '101',
        name: 'João da Silva Santos',
      } as any);
      jest.spyOn(integrationCacheUtilsService, 'setPatientCache').mockResolvedValue(undefined);

      const result = await service.updatePatient(mockIntegration as IntegrationDocument, '101', updateData as any);

      expect(result.name).toBe('João da Silva Santos');
      expect(integrationCacheUtilsService.setPatientCache).toHaveBeenCalled();
    });
  });

  describe('getPatientSchedules', () => {
    it('deve retornar agendamentos do paciente', async () => {
      const mockScheduleResponse = {
        sucesso: true,
        mensagens: [],
        payload: {
          agendamentos: [
            {
              codigo: 1001,
              data: '25/11/2025',
              hora: '09:00',
              duracao: 30,
              usuario: { codigo: 100, nome: 'Dr. Carlos' },
              paciente: { codigo: 101, nome: 'João da Silva' },
              estadoAgendaConsulta: { confirmado: false },
            },
          ],
        },
      };

      jest.spyOn(prodoctorApiService, 'buscarAgendamentosPaciente').mockResolvedValue(mockScheduleResponse as any);
      jest.spyOn(prodoctorHelpersService, 'transformScheduleToRawAppointment').mockReturnValue({
        appointmentCode: '1001',
        appointmentDate: '2025-11-25T09:00:00.000Z',
        status: AppointmentStatus.scheduled,
      } as any);
      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([
        {
          appointmentCode: '1001',
          appointmentDate: '2025-11-25T09:00:00.000Z',
          status: AppointmentStatus.scheduled,
        },
      ] as any);

      const result = await service.getPatientSchedules(mockIntegration as IntegrationDocument, {
        patientCode: '101',
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      expect(result).toHaveLength(1);
      expect(result[0].appointmentCode).toBe('1001');
    });

    it('deve retornar array vazio quando não houver agendamentos', async () => {
      jest.spyOn(prodoctorApiService, 'buscarAgendamentosPaciente').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { agendamentos: [] },
      });

      const result = await service.getPatientSchedules(mockIntegration as IntegrationDocument, {
        patientCode: '101',
      });

      expect(result).toEqual([]);
    });
  });

  describe('createSchedule', () => {
    const createScheduleData = {
      appointment: {
        appointmentDate: '2025-11-25T14:00:00.000Z',
        duration: 30,
      },
      patient: { code: '101' },
      doctor: { code: '100' },
      insurance: { code: '501' },
      organizationUnit: { code: '1' },
    };

    it('deve criar agendamento com sucesso', async () => {
      jest.spyOn(prodoctorHelpersService, 'buildTipoAgendamentoRequest').mockReturnValue({});
      jest.spyOn(prodoctorApiService, 'inserirAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: {
          agendamento: {
            data: '25/11/2025',
            hora: '14:00',
            localProDoctor: { codigo: 1, nome: 'Clínica Central' },
            usuario: { codigo: 100, nome: 'Dr. Carlos' },
            paciente: { codigo: 101, nome: 'João da Silva' },
          },
        },
      });
      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue({
        code: '100',
        name: 'Dr. Carlos',
      } as any);

      const result = await service.createSchedule(mockIntegration as IntegrationDocument, createScheduleData as any);

      expect(result.appointmentCode).toBe('2001');
      expect(result.status).toBe(AppointmentStatus.scheduled);
    });

    it('deve lançar erro quando criação de agendamento falhar', async () => {
      jest.spyOn(prodoctorApiService, 'inserirAgendamento').mockResolvedValue({
        sucesso: false,
        mensagens: ['Horário não disponível'],
        payload: { agendamento: null },
      });

      await expect(
        service.createSchedule(mockIntegration as IntegrationDocument, createScheduleData as any),
      ).rejects.toThrow();
    });
  });

  describe('cancelSchedule', () => {
    it('deve cancelar agendamento com sucesso', async () => {
      jest.spyOn(prodoctorApiService, 'desmarcarAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { sucesso: true },
      });

      const result = await service.cancelSchedule(mockIntegration as IntegrationDocument, {
        appointmentCode: '1001',
        patientCode: '101',
      });

      expect(result.ok).toBe(true);
    });

    it('deve retornar ok false quando cancelamento falhar', async () => {
      jest.spyOn(prodoctorApiService, 'desmarcarAgendamento').mockResolvedValue({
        sucesso: false,
        mensagens: ['Não foi possível cancelar'],
        payload: { sucesso: false },
      });

      const result = await service.cancelSchedule(mockIntegration as IntegrationDocument, {
        appointmentCode: '1001',
        patientCode: '101',
      });

      expect(result.ok).toBe(false);
    });
  });

  describe('confirmSchedule', () => {
    it('deve confirmar agendamento com sucesso', async () => {
      jest.spyOn(prodoctorApiService, 'alterarStatusAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { agendamento: { codigo: 1001, estadoAgendaConsulta: { confirmado: true } } },
      } as any);

      const result = await service.confirmSchedule(mockIntegration as IntegrationDocument, {
        appointmentCode: '1001',
        patientCode: '101',
      });

      expect(result.ok).toBe(true);
      expect(prodoctorApiService.alterarStatusAgendamento).toHaveBeenCalledWith(mockIntegration, {
        agendamento: { codigo: 1001 },
        estadoAgendaConsulta: { confirmado: true },
      });
    });
  });

  describe('reschedule', () => {
    it('deve remarcar agendamento (cancela e cria novo)', async () => {
      const rescheduleData = {
        scheduleToCancelCode: '1001',
        patient: { code: '101' },
        scheduleToCreate: {
          appointment: { appointmentDate: '2025-11-26T10:00:00.000Z' },
          patient: { code: '101' },
          doctor: { code: '100' },
        },
      };

      jest.spyOn(prodoctorApiService, 'desmarcarAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { sucesso: true },
      });

      jest.spyOn(prodoctorApiService, 'inserirAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: {
          agendamento: {
            data: '25/11/2025',
            hora: '14:00',
            localProDoctor: { codigo: 1, nome: 'Clínica Central' },
            usuario: { codigo: 100, nome: 'Dr. Carlos' },
            paciente: { codigo: 101, nome: 'João da Silva' },
          },
        },
      });

      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue({
        code: '100',
        name: 'Dr. Carlos',
      } as any);

      const result = await service.reschedule(mockIntegration as IntegrationDocument, rescheduleData as any);

      expect(result.appointmentCode).toBe('2002');
      expect(prodoctorApiService.desmarcarAgendamento).toHaveBeenCalled();
      expect(prodoctorApiService.inserirAgendamento).toHaveBeenCalled();
    });
  });

  describe('getMinifiedPatientSchedules', () => {
    it('deve retornar agendamentos minificados do cache', async () => {
      const cachedSchedules = {
        minifiedSchedules: {
          appointmentList: [{ appointmentCode: '1001', appointmentDate: '2025-11-25T09:00:00.000Z' }],
          lastAppointment: null,
          nextAppointment: null,
        },
        schedules: [],
      };

      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue(cachedSchedules as any);

      const result = await service.getMinifiedPatientSchedules(mockIntegration as IntegrationDocument, {
        patientCode: '101',
      });

      expect(result.appointmentList).toHaveLength(1);
      expect(prodoctorApiService.buscarAgendamentosPaciente).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableSchedules', () => {
    it('deve buscar horários disponíveis', async () => {
      const mockHorariosResponse = {
        sucesso: true,
        mensagens: [],
        payload: {
          agendamentos: [
            // ✅ CORRETO
            { dataHora: '25/11/2025 08:00' },
            { dataHora: '25/11/2025 08:30' },
          ],
        },
      };

      jest.spyOn(prodoctorApiService, 'buscarHorariosLivres').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: {
          agendamentos: [
            { data: '25/11/2025', hora: '08:00' },
            { data: '25/11/2025', hora: '08:30' },
          ],
        },
      });
      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue({
        code: '100',
        name: 'Dr. Carlos',
      } as any);
      jest.spyOn(prodoctorHelpersService, 'transformAvailableScheduleToRawAppointment').mockReturnValue({
        appointmentCode: null,
        appointmentDate: '2025-11-25T08:00:00.000Z',
        status: AppointmentStatus.scheduled,
      } as any);
      jest
        .spyOn(appointmentService, 'transformSchedules')
        .mockResolvedValue([
          { appointmentDate: '2025-11-25T08:00:00.000Z' },
          { appointmentDate: '2025-11-25T08:30:00.000Z' },
        ] as any);
      jest
        .spyOn(flowService, 'matchEntitiesFlows')
        .mockResolvedValue([
          [{ appointmentDate: '2025-11-25T08:00:00.000Z' }, { appointmentDate: '2025-11-25T08:30:00.000Z' }],
          {},
        ] as any);

      const result = await service.getAvailableSchedules(
        mockIntegration as IntegrationDocument,
        {
          filter: { doctor: { code: '100' } },
          fromDay: 0,
          untilDay: 30,
        } as any,
      );

      expect(result.schedules).toHaveLength(2);
      expect(prodoctorApiService.buscarHorariosLivres).toHaveBeenCalled();
    });

    it('deve retornar vazio quando não houver médico', async () => {
      const result = await service.getAvailableSchedules(
        mockIntegration as IntegrationDocument,
        {
          filter: {},
          fromDay: 0,
          untilDay: 30,
        } as any,
      );

      expect(result.schedules).toEqual([]);
      expect(result.metadata).toBeNull();
    });
  });

  describe('extractSingleEntity', () => {
    it('deve extrair entidades do tipo especificado', async () => {
      const mockEntities = [
        {
          code: '1',
          name: 'Entidade 1',
          source: EntitySourceType.erp,
          integrationId: mockIntegration._id,
          version: EntityVersionType.production,
        },
        {
          code: '2',
          name: 'Entidade 2',
          source: EntitySourceType.erp,
          integrationId: mockIntegration._id,
          version: EntityVersionType.production,
        },
      ];

      jest.spyOn(prodoctorEntitiesService, 'extractEntity').mockResolvedValue(mockEntities as any);

      const result = await service.extractSingleEntity(
        mockIntegration as IntegrationDocument,
        EntityType.insurance,
        {},
        true,
      );

      expect(result).toHaveLength(2);
      expect(prodoctorEntitiesService.extractEntity).toHaveBeenCalledWith(
        mockIntegration,
        EntityType.insurance,
        {},
        true,
      );
    });
  });
});
