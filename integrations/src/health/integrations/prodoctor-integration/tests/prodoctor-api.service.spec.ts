import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ProdoctorApiService } from '../services/prodoctor-api.service';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { getSampleIntegrationDocument } from '../../../../mock/integration.mock';
import { IntegrationType } from '../../../interfaces/integration-types';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import { createMock } from '@golevelup/ts-jest';
import {
  UserSearchRequest,
  LocationSearchRequest,
  InsuranceSearchRequest,
  ProcedureSearchRequest,
  ProcedureTableSearchRequest,
} from '../interfaces/base.interface';
import {
  ProdoctorPatientSearchRequest,
  ProdoctorPatientSearchField,
  ProdoctorPatientRequest,
} from '../interfaces/patient.interface';
import {
  ListAppointmentsByUserRequest,
  SearchPatientAppointmentsRequest,
  InsertAppointmentRequest,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  UpdateAppointmentStateRequest,
  SearchAppointmentsByStatusRequest,
  AvailableTimesRequest,
} from '../interfaces/schedule.interface';

// Mock request-context
jest.mock('request-context', () => ({
  get: jest.fn().mockReturnValue({}),
}));

/**
 * Testes de integração para ProdoctorApiService
 * Esses testes fazem chamadas reais à fake API rodando em http://172.17.0.1:7575
 * A fake API deve estar rodando para os testes passarem
 */
describe('ProdoctorApiService - Integration Tests', () => {
  let service: ProdoctorApiService;
  let httpService: HttpService;

  const FAKE_API_URL = 'http://172.17.0.1:7575';

  const integration = getSampleIntegrationDocument({
    type: IntegrationType.PRODOCTOR,
    environment: IntegrationEnvironment.test,
    apiUrl: FAKE_API_URL,
    debug: false,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        ProdoctorApiService,
        {
          provide: SentryErrorHandlerService,
          useValue: createMock<SentryErrorHandlerService>({
            defaultApiIntegrationError: jest.fn().mockReturnValue({}),
          }),
        },
        {
          provide: AuditService,
          useValue: createMock<AuditService>({
            sendAuditEvent: jest.fn(),
          }),
        },
        {
          provide: CredentialsHelper,
          useValue: createMock<CredentialsHelper>({
            getConfig: jest.fn().mockResolvedValue({
              apiKey: 'teste',
              apiPassword: 'teste',
            }),
          }),
        },
      ],
    }).compile();

    service = module.get<ProdoctorApiService>(ProdoctorApiService);
    httpService = module.get<HttpService>(HttpService);
  }, 30000);

  // ========== CONNECTION VALIDATION ==========

  describe('validateConnection', () => {
    it('should return true when fake API is running', async () => {
      const result = await service.validateConnection(integration);
      expect(result).toBe(true);
    }, 10000);
  });

  // ========== USERS (DOCTORS) ==========

  describe('listUsers', () => {
    it('should list users from fake API', async () => {
      const request: UserSearchRequest = {
        quantidade: 10,
      };

      const result = await service.listUsers(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.usuarios).toBeDefined();
      expect(Array.isArray(result.payload.usuarios)).toBe(true);
    }, 10000);

    it('should filter users by location', async () => {
      const request: UserSearchRequest = {
        quantidade: 5,
        locaisProDoctor: [{ codigo: 1 }],
      };

      const result = await service.listUsers(integration, request);

      expect(result.sucesso).toBe(true);
      expect(result.payload.usuarios.length).toBeLessThanOrEqual(5);
    }, 10000);
  });

  describe('listUsersWithSpeciality', () => {
    it('should list users with speciality data', async () => {
      const request: UserSearchRequest = {
        quantidade: 10,
      };

      const result = await service.listUsersWithSpeciality(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload.usuarios).toBeDefined();
    }, 10000);
  });

  describe('getUserDetails', () => {
    it('should get user details by code', async () => {
      const userCode = 100; // Dr. João da Silva from mock

      const result = await service.getUserDetails(integration, userCode);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload.usuario).toBeDefined();
      expect(result.payload.usuario.codigo).toBe(userCode);
    }, 10000);

    it('should return error for non-existent user', async () => {
      const userCode = 99999;

      const result = await service.getUserDetails(integration, userCode);

      expect(result.sucesso).toBe(false);
    }, 10000);
  });

  // ========== LOCATIONS (ORGANIZATION UNITS) ==========

  describe('listLocations', () => {
    it('should list locations from fake API', async () => {
      const request: LocationSearchRequest = {
        quantidade: 10,
        somenteAtivos: true,
      };

      const result = await service.listLocations(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.locaisProDoctor).toBeDefined();
      expect(Array.isArray(result.payload.locaisProDoctor)).toBe(true);
    }, 10000);
  });

  // ========== INSURANCES ==========

  describe('listInsurances', () => {
    it('should list insurances from fake API', async () => {
      const request: InsuranceSearchRequest = {
        quantidade: 10,
        somenteAtivos: true,
      };

      const result = await service.listInsurances(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.convenios).toBeDefined();
      expect(Array.isArray(result.payload.convenios)).toBe(true);
    }, 10000);
  });

  describe('getInsuranceDetails', () => {
    it('should get insurance details by code', async () => {
      const insuranceCode = 501; // Unimed from mock

      const result = await service.getInsuranceDetails(integration, insuranceCode);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);
  });

  // ========== PROCEDURES ==========

  describe('listProcedures', () => {
    it('should list procedures from fake API', async () => {
      const request: ProcedureSearchRequest = {
        quantidade: 10,
      };

      const result = await service.listProcedures(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);
  });

  describe('getProcedureDetails', () => {
    it('should get procedure details', async () => {
      const tableCode = 1;
      const procedureCode = '10101012';

      const result = await service.getProcedureDetails(integration, tableCode, procedureCode);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);
  });

  describe('listProcedureTables', () => {
    it('should list procedure tables from fake API', async () => {
      const request: ProcedureTableSearchRequest = {
        quantidade: 10,
      };

      const result = await service.listProcedureTables(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);
  });

  // ========== PATIENTS ==========

  describe('searchPatients', () => {
    it('should search patients by CPF', async () => {
      const request: ProdoctorPatientSearchRequest = {
        termo: '12345678900', // Maria de Souza Santos from mock
        campo: ProdoctorPatientSearchField.CPF,
        quantidade: 10,
      };

      const result = await service.getPatient(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.pacientes).toBeDefined();
      expect(Array.isArray(result.payload.pacientes)).toBe(true);
    }, 10000);

    it('should search patients by name', async () => {
      const request: ProdoctorPatientSearchRequest = {
        termo: 'Maria',
        campo: ProdoctorPatientSearchField.NAME,
        quantidade: 10,
      };

      const result = await service.getPatient(integration, request);

      expect(result).toBeDefined();
      expect(result.payload).toBeDefined();
    }, 10000);

    it('should return empty array when patient not found', async () => {
      const request: ProdoctorPatientSearchRequest = {
        termo: '00000000000',
        campo: ProdoctorPatientSearchField.CPF,
        quantidade: 10,
      };

      const result = await service.getPatient(integration, request);

      expect(result).toBeDefined();
      expect(result.payload.pacientes).toBeDefined();
    }, 10000);
  });

  describe('getPatientDetails', () => {
    it('should get patient details by code', async () => {
      const patientCode = 101; // Maria de Souza Santos from mock

      const result = await service.getPatientDetails(integration, patientCode);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.paciente).toBeDefined();
    }, 10000);
  });

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      const request: ProdoctorPatientRequest = {
        paciente: {
          nome: 'Paciente Teste Jest',
          cpf: '99988877766',
          dataNascimento: '01/01/1990',
          telefone1: {
            ddd: '11',
            numero: '999999999',
            tipo: { codigo: 3 },
          },
          sexo: { codigo: 1 },
        },
      };

      const result = await service.createPatient(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.paciente).toBeDefined();
      expect(result.payload.paciente.codigo).toBeDefined();
    }, 10000);
  });

  describe('updatePatient', () => {
    it('should update an existing patient', async () => {
      const request: ProdoctorPatientRequest = {
        paciente: {
          codigo: 101, // Maria de Souza Santos
          nome: 'Maria de Souza Santos Atualizada',
          cpf: '12345678900',
          dataNascimento: '10/08/1991',
        },
      };

      const result = await service.updatePatient(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);

    it('should throw error when patient code is missing', async () => {
      const request: ProdoctorPatientRequest = {
        paciente: {
          nome: 'Paciente Sem Código',
          cpf: '11122233344',
        },
      };

      await expect(service.updatePatient(integration, request)).rejects.toThrow();
    }, 10000);
  });

  // ========== APPOINTMENTS ==========

  describe('listAppointmentsByUser', () => {
    it('should list appointments for a doctor on a specific date', async () => {
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

      const request: ListAppointmentsByUserRequest = {
        usuario: { codigo: 100 }, // Dr. João da Silva
        data: formattedDate,
      };

      const result = await service.listAppointmentsByUser(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);
  });

  describe('searchPatientAppointments', () => {
    it('should search appointments for a patient', async () => {
      const request: SearchPatientAppointmentsRequest = {
        paciente: { codigo: 101 }, // Maria de Souza Santos
        periodo: {
          dataInicial: '01/01/2024',
          dataFinal: '31/12/2025',
        },
        quantidade: 10,
      };

      const result = await service.searchPatientAppointments(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);
  });

  describe('insertAppointment', () => {
    it('should insert a new appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;

      const request: InsertAppointmentRequest = {
        agendamento: {
          usuario: { codigo: 100 }, // Dr. João da Silva
          paciente: { codigo: 101 }, // Maria de Souza Santos
          data: formattedDate,
          hora: '14:00',
          tipoAgendamento: { consulta: true },
          convenio: { codigo: 501 }, // Unimed
          localProDoctor: { codigo: 1 },
        },
      };

      const result = await service.insertAppointment(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.agendamento).toBeDefined();
    }, 10000);
  });

  describe('updateAppointment', () => {
    it('should update an existing appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;

      const request: UpdateAppointmentRequest = {
        agendamento: {
          usuario: { codigo: 100 },
          paciente: { codigo: 101 },
          data: formattedDate,
          hora: '15:00', // Changed time
          tipoAgendamento: { consulta: true },
          convenio: { codigo: 501 },
          localProDoctor: { codigo: 1 },
        },
        agendamentoOrigem: {
          usuario: { codigo: 100 },
          data: formattedDate,
          hora: '14:00',
          localProDoctor: { codigo: 1 },
        },
      };

      const result = await service.updateAppointment(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);
  });

  describe('cancelAppointment', () => {
    it('should cancel an appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;

      const request: CancelAppointmentRequest = {
        usuario: { codigo: 100 },
        data: formattedDate,
        hora: '15:00',
        localProDoctor: { codigo: 1 },
      };

      const result = await service.cancelAppointment(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
    }, 10000);
  });

  describe('updateAppointmentState', () => {
    it('should update appointment state to confirmed', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const formattedDate = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;

      const request: UpdateAppointmentStateRequest = {
        agendamento: {
          usuario: { codigo: 100 },
          data: formattedDate,
          hora: '09:00',
          localProDoctor: { codigo: 1 },
        },
        alterarEstadoAgendaConsulta: {
          confirmado: true,
        },
      };

      const result = await service.updateAppointmentState(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
    }, 10000);

    it('should update appointment state to attended', async () => {
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

      const request: UpdateAppointmentStateRequest = {
        agendamento: {
          usuario: { codigo: 100 },
          data: formattedDate,
          hora: '10:00',
          localProDoctor: { codigo: 1 },
        },
        alterarEstadoAgendaConsulta: {
          compareceu: true,
          atendido: true,
        },
      };

      const result = await service.updateAppointmentState(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
    }, 10000);
  });

  describe('searchAppointmentsByStatus', () => {
    it('should search appointments by confirmed status', async () => {
      const request: SearchAppointmentsByStatusRequest = {
        periodo: {
          dataInicial: '01/01/2024',
          dataFinal: '31/12/2025',
        },
        estadoAgendaConsulta: {
          confirmado: true,
        },
        quantidade: 10,
      };

      const result = await service.searchAppointmentsByStatus(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
    }, 10000);

    it('should search appointments by type', async () => {
      const request: SearchAppointmentsByStatusRequest = {
        periodo: {
          dataInicial: '01/01/2024',
          dataFinal: '31/12/2025',
        },
        tipoAgendamento: {
          consulta: true,
        },
        quantidade: 10,
      };

      const result = await service.searchAppointmentsByStatus(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
    }, 10000);
  });

  describe('getAvailableTimes', () => {
    it('should get available times for a doctor', async () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const formatDate = (date: Date) =>
        `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

      const request: AvailableTimesRequest = {
        usuario: { codigo: 100 }, // Dr. João da Silva
        periodo: {
          dataInicial: formatDate(today),
          dataFinal: formatDate(nextWeek),
        },
      };

      const result = await service.getAvailableSchedule(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload.agendamentos).toBeDefined();
      expect(Array.isArray(result.payload.agendamentos)).toBe(true);
    }, 10000);

    it('should filter available times by shifts', async () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const formatDate = (date: Date) =>
        `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

      const request: AvailableTimesRequest = {
        usuario: { codigo: 100 },
        periodo: {
          dataInicial: formatDate(today),
          dataFinal: formatDate(nextWeek),
        },
        turnos: {
          manha: true,
          tarde: false,
          noite: false,
        },
      };

      const result = await service.getAvailableSchedule(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
    }, 10000);

    it('should filter available times by location', async () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const formatDate = (date: Date) =>
        `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

      const request: AvailableTimesRequest = {
        usuario: { codigo: 100 },
        periodo: {
          dataInicial: formatDate(today),
          dataFinal: formatDate(nextWeek),
        },
        localProDoctor: { codigo: 1 }, // Clínica Central
      };

      const result = await service.getAvailableSchedule(integration, request);

      expect(result).toBeDefined();
      expect(result.sucesso).toBe(true);
    }, 10000);
  });

  // ========== APPOINTMENT FLOW TEST ==========

  describe('Complete Appointment Flow', () => {
    it('should complete a full appointment scheduling flow', async () => {
      // Step 1: Search for available doctors
      const usersResult = await service.listUsers(integration, { quantidade: 5 });
      expect(usersResult.sucesso).toBe(true);
      expect(usersResult.payload.usuarios.length).toBeGreaterThan(0);

      const doctor = usersResult.payload.usuarios[0];

      // Step 2: Get available times for the doctor
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const formatDate = (date: Date) =>
        `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

      const availableTimesResult = await service.getAvailableSchedule(integration, {
        usuario: { codigo: doctor.codigo },
        periodo: {
          dataInicial: formatDate(today),
          dataFinal: formatDate(nextWeek),
        },
      });
      expect(availableTimesResult.sucesso).toBe(true);

      // Step 3: Search for patient
      const patientResult = await service.getPatient(integration, {
        termo: '12345678900',
        campo: ProdoctorPatientSearchField.CPF,
      });
      expect(patientResult.sucesso).toBe(true);

      // Step 4: Get insurances
      const insurancesResult = await service.listInsurances(integration, { quantidade: 5 });
      expect(insurancesResult.sucesso).toBe(true);

      // Step 5: Create appointment
      const appointmentDate = formatDate(nextWeek);
      const insertResult = await service.insertAppointment(integration, {
        agendamento: {
          usuario: { codigo: doctor.codigo },
          paciente: { codigo: 101 },
          data: appointmentDate,
          hora: '16:00',
          tipoAgendamento: { consulta: true },
          convenio: { codigo: 501 },
          localProDoctor: { codigo: 1 },
        },
      });
      expect(insertResult.sucesso).toBe(true);

      // Step 6: Confirm appointment
      const confirmResult = await service.updateAppointmentState(integration, {
        agendamento: {
          usuario: { codigo: doctor.codigo },
          data: appointmentDate,
          hora: '16:00',
          localProDoctor: { codigo: 1 },
        },
        alterarEstadoAgendaConsulta: {
          confirmado: true,
        },
      });
      expect(confirmResult.sucesso).toBe(true);

      // Step 7: List appointments to verify
      const listResult = await service.listAppointmentsByUser(integration, {
        usuario: { codigo: doctor.codigo },
        data: appointmentDate,
      });
      expect(listResult.sucesso).toBe(true);
    }, 60000);
  });

  // ========== ERROR HANDLING ==========

  describe('Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      // This test verifies the service handles connection issues
      const invalidIntegration = getSampleIntegrationDocument({
        type: IntegrationType.PRODOCTOR,
        environment: IntegrationEnvironment.test,
        apiUrl: 'http://localhost:9999', // Invalid port
      });

      const result = await service.validateConnection(invalidIntegration);
      expect(result).toBe(false);
    }, 15000);
  });
});
