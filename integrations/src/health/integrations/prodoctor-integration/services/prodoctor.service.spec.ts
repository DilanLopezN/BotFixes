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
    email: 'joao@email.com',
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
            minifySchedules: jest.fn(),
          },
        },
        {
          provide: FlowService,
          useValue: {
            getFlowByIntegration: jest.fn(),
            updateFlowSteps: jest.fn(),
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
      });

      it('deve buscar paciente na API quando cache não disponível', async () => {
        jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
        jest.spyOn(prodoctorApiService, 'getPatientDetails').mockResolvedValue({
          sucesso: true,
          mensagens: [],
          payload: { paciente: mockPatient },
        });
        jest.spyOn(prodoctorHelpersService, 'transformPatient').mockReturnValue(mockTransformedPatient);

        const result = await service.getPatient(mockIntegration as IntegrationDocument, {
          code: '101',
          cache: true,
        });

        expect(result).toEqual(mockTransformedPatient);
        expect(prodoctorApiService.getPatientDetails).toHaveBeenCalledWith(mockIntegration, 101);
      });

      it('deve lançar erro NOT_FOUND quando paciente não existir', async () => {
        jest.spyOn(integrationCacheUtilsService, 'getPatientFromCache').mockResolvedValue(null);
        jest.spyOn(prodoctorApiService, 'getPatientDetails').mockResolvedValue({
          sucesso: false,
          mensagens: ['Paciente não encontrado'],
          payload: null,
        });

        await expect(service.getPatient(mockIntegration as IntegrationDocument, { code: '999' })).rejects.toMatchObject(
          {
            status: HttpStatus.NOT_FOUND,
          },
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

        const result = await service.getPatient(mockIntegration as IntegrationDocument, {
          cpf: '12345678900',
        });

        expect(result).toEqual(mockTransformedPatient);
        expect(prodoctorApiService.getPatientByCpf).toHaveBeenCalledWith(mockIntegration, '12345678900');
      });
    });
  });

  describe('createPatient', () => {
    it('deve criar paciente com sucesso', async () => {
      const createPatientData = {
        patient: {
          name: 'João da Silva',
          cpf: '12345678900',
          bornDate: '1990-03-15T00:00:00.000Z',
          email: 'joao@email.com',
          cellPhone: '11999887766',
          sex: 'M',
        },
        organizationUnit: { code: '1' },
      };

      jest.spyOn(prodoctorHelpersService, 'buildCreatePatientRequest').mockReturnValue({} as any);
      jest.spyOn(prodoctorApiService, 'createPatient').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { paciente: mockPatient },
      });
      jest.spyOn(prodoctorHelpersService, 'transformPatient').mockReturnValue(mockTransformedPatient);

      const result = await service.createPatient(mockIntegration as IntegrationDocument, createPatientData as any);

      expect(result).toEqual(mockTransformedPatient);
      expect(prodoctorApiService.createPatient).toHaveBeenCalled();
    });

    it('deve lançar erro quando criação falhar', async () => {
      const createPatientData = {
        patient: {
          name: 'João da Silva',
          cpf: '12345678900',
        },
        organizationUnit: { code: '1' },
      };

      jest.spyOn(prodoctorHelpersService, 'buildCreatePatientRequest').mockReturnValue({} as any);
      jest.spyOn(prodoctorApiService, 'createPatient').mockResolvedValue({
        sucesso: false,
        mensagens: ['Erro ao criar paciente'],
        payload: null,
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
          email: 'novo@email.com',
        },
      };

      jest.spyOn(prodoctorHelpersService, 'buildUpdatePatientRequest').mockReturnValue({} as any);
      jest.spyOn(prodoctorApiService, 'updatePatient').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: {
          paciente: {
            ...mockPatient,
            nome: 'João da Silva Santos',
            codigo: 201,
          },
        },
      });
      jest
        .spyOn(prodoctorHelpersService, 'transformPatient')
        .mockReturnValue({ ...mockTransformedPatient, name: 'João da Silva Santos', email: 'novo@email.com' });

      const result = await service.updatePatient(mockIntegration as IntegrationDocument, '101', updateData as any);

      expect(result.name).toBe('João da Silva Santos');
      expect(result.email).toBe('novo@email.com');
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
              data: '25/11/2025',
              hora: '09:00',
              localProDoctor: { codigo: 1, nome: 'Clínica Central' },
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
      // FIX: API pode retornar null ou sucesso false
      jest.spyOn(prodoctorApiService, 'buscarAgendamentosPaciente').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { agendamentos: null },
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
      // FIX: Response da API ProDoctor conforme swagger
      jest.spyOn(prodoctorHelpersService, 'buildTipoAgendamentoRequest').mockReturnValue({});
      jest.spyOn(prodoctorApiService, 'inserirAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: {
          agendamento: {
            // AgendamentoAgendaInsertViewModel não tem campo 'codigo'
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

      // FIX: O appointmentCode é gerado pelo buildAppointmentCode quando não há codigo
      expect(result.appointmentCode).toBe('1-100-25112025-1400');
      expect(result.status).toBe(AppointmentStatus.scheduled);
    });

    it('deve lançar erro quando criação de agendamento falhar', async () => {
      jest.spyOn(prodoctorHelpersService, 'buildTipoAgendamentoRequest').mockReturnValue({});
      jest.spyOn(prodoctorApiService, 'inserirAgendamento').mockResolvedValue({
        sucesso: false,
        mensagens: ['Erro ao criar agendamento'],
        payload: null,
      });

      await expect(
        service.createSchedule(mockIntegration as IntegrationDocument, createScheduleData as any),
      ).rejects.toThrow();
    });
  });

  describe('cancelSchedule', () => {
    it('deve cancelar agendamento com sucesso', async () => {
      // FIX: Response da API ProDoctor
      jest.spyOn(prodoctorApiService, 'desmarcarAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: ['Agendamento cancelado com sucesso'],
        payload: { sucesso: true },
      });

      const result = await service.cancelSchedule(mockIntegration as IntegrationDocument, {
        appointmentCode: '1-100-25112025-1400',
        patientCode: '101',
      });

      expect(result.ok).toBe(true);
    });

    it('deve retornar ok false quando cancelamento falhar', async () => {
      // FIX: Response da API ProDoctor
      jest.spyOn(prodoctorApiService, 'desmarcarAgendamento').mockResolvedValue({
        sucesso: false,
        mensagens: ['Erro ao cancelar agendamento'],
        payload: { sucesso: false },
      });

      const result = await service.cancelSchedule(mockIntegration as IntegrationDocument, {
        appointmentCode: '1-100-25112025-1400',
        patientCode: '101',
      });

      expect(result.ok).toBe(false);
    });
  });

  describe('confirmSchedule', () => {
    it('deve confirmar agendamento com sucesso', async () => {
      // FIX: Response da API ProDoctor conforme interface PDResponseAlterarStatusAgendamentoViewModel
      jest.spyOn(prodoctorApiService, 'alterarStatusAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: ['Agendamento confirmado com sucesso'],
        payload: {
          agendamento: {
            codigo: 2001,
            estadoAgendaConsulta: { confirmado: true },
          },
        },
      });

      const result = await service.confirmSchedule(mockIntegration as IntegrationDocument, {
        appointmentCode: '1-100-25112025-1400',
        patientCode: '101',
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('reschedule', () => {
    it('deve remarcar agendamento (cancela e cria novo)', async () => {
      const rescheduleData = {
        scheduleToCancelCode: '1-100-25112025-1400',
        scheduleToCreate: {
          appointment: {
            appointmentDate: '2025-11-26T14:00:00.000Z',
            duration: 30,
          },
          patient: { code: '101' },
          doctor: { code: '100' },
          organizationUnit: { code: '1' },
        },
        patient: { code: '101' },
      };

      // FIX: Mock das duas operações
      jest.spyOn(prodoctorApiService, 'desmarcarAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: { sucesso: true },
      });

      jest.spyOn(prodoctorHelpersService, 'buildTipoAgendamentoRequest').mockReturnValue({});
      jest.spyOn(prodoctorApiService, 'inserirAgendamento').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: {
          agendamento: {
            data: '26/11/2025',
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

      expect(result.appointmentCode).toBe('1-100-26112025-1400');
      expect(result.status).toBe(AppointmentStatus.scheduled);
    });
  });

  describe('getMinifiedPatientSchedules', () => {
    it('deve retornar agendamentos minificados do cache', async () => {
      const mockMinifiedSchedules = {
        appointmentList: [
          {
            appointmentCode: '1001',
            appointmentDate: '2025-11-25T09:00:00.000Z',
            status: AppointmentStatus.scheduled,
          },
        ],
        lastAppointment: null,
        nextAppointment: {
          appointmentCode: '1001',
          appointmentDate: '2025-11-25T09:00:00.000Z',
          status: AppointmentStatus.scheduled,
        },
      };

      // FIX: Usar método correto do cache
      jest.spyOn(integrationCacheUtilsService, 'getPatientSchedulesCache').mockResolvedValue({
        minifiedSchedules: mockMinifiedSchedules,
        schedules: [],
      });

      const result = await service.getMinifiedPatientSchedules(mockIntegration as IntegrationDocument, {
        patientCode: '101',
      });

      expect(result).toEqual(mockMinifiedSchedules);
    });
  });

  describe('getAvailableSchedules', () => {
    it('deve buscar horários disponíveis', async () => {
      const availableSchedulesRequest = {
        filter: {
          organizationUnit: { code: '1' },
          doctor: { code: '100' },
        },
        fromDay: 0,
        untilDay: 7,
      };

      // FIX 1: Mock CRÍTICO - getEntityByCode é chamado pelo service
      jest.spyOn(entitiesService, 'getEntityByCode').mockResolvedValue({
        _id: 'mock-entity-id' as any,
        code: '100',
        name: 'Dr. Carlos',
        integrationId: mockIntegration._id,
        source: EntitySourceType.erp,
        activeErp: true,
        version: EntityVersionType.production,
      } as any);

      // FIX 2: buildTurnosFromPeriod retorna objeto TurnosRequest
      jest.spyOn(prodoctorHelpersService, 'buildTurnosFromPeriod').mockReturnValue({
        turno1: { horaInicial: '08:00', horaFinal: '12:00' },
      } as any);

      jest.spyOn(prodoctorApiService, 'buscarHorariosLivres').mockResolvedValue({
        sucesso: true,
        mensagens: [],
        payload: {
          agendamentos: [
            { data: '25/11/2025', hora: '08:00', duracao: 30 },
            { data: '25/11/2025', hora: '09:00', duracao: 30 },
          ],
        },
      });

      jest.spyOn(prodoctorHelpersService, 'transformAvailableScheduleToRawAppointment').mockReturnValue({
        appointmentDate: '2025-11-25T08:00:00.000Z',
        duration: 30,
      } as any);

      jest.spyOn(appointmentService, 'transformSchedules').mockResolvedValue([
        { appointmentDate: '2025-11-25T08:00:00.000Z', duration: 30 },
        { appointmentDate: '2025-11-25T09:00:00.000Z', duration: 30 },
      ] as any);

      const result = await service.getAvailableSchedules(
        mockIntegration as IntegrationDocument,
        availableSchedulesRequest as any,
      );

      // FIX 3: Propriedade correta é 'schedules' não 'schedulesList'
      expect(result.schedules).toHaveLength(2);
      expect(entitiesService.getEntityByCode).toHaveBeenCalledWith('100', EntityType.doctor, mockIntegration._id);
    });

    it('deve retornar vazio quando não houver médico', async () => {
      // FIX: Limpar mocks anteriores
      jest.clearAllMocks();

      const availableSchedulesRequest = {
        filter: {}, // Sem doctor
        fromDay: 0,
        untilDay: 7,
      };

      const result = await service.getAvailableSchedules(
        mockIntegration as IntegrationDocument,
        availableSchedulesRequest as any,
      );

      // FIX: Propriedade correta é 'schedules' não 'schedulesList'
      expect(result.schedules).toEqual([]);
      expect(result.metadata).toBeNull();

      // Verificar que não chamou a API
      expect(prodoctorApiService.buscarHorariosLivres).not.toHaveBeenCalled();
    });
  });

  describe('extractSingleEntity', () => {
    it('deve extrair entidades do tipo especificado', async () => {
      const mockEntities = [
        {
          code: '1',
          name: 'Clínica Central',
          integrationId: mockIntegration._id,
          source: EntitySourceType.erp,
          activeErp: true,
          version: EntityVersionType.production,
        },
      ];

      jest.spyOn(prodoctorEntitiesService, 'extractEntity').mockResolvedValue(mockEntities as any);

      const result = await service.extractSingleEntity(
        mockIntegration as IntegrationDocument,
        EntityType.organizationUnit,
        {},
        true,
      );

      expect(result).toEqual(mockEntities);

      expect(prodoctorEntitiesService.extractEntity).toHaveBeenCalledWith(
        mockIntegration,
        EntityType.organizationUnit,
        {},
        true,
      );
    });
  });
});
