import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
import { ProdoctorApiService } from './prodoctor-api.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditService } from '../../../audit/services/audit.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationType } from '../../../interfaces/integration-types';

describe('ProdoctorApiService - Patient Operations', () => {
  let service: ProdoctorApiService;
  let httpService: HttpService;
  let credentialsHelper: CredentialsHelper;
  let auditService: AuditService;
  let sentryErrorHandlerService: SentryErrorHandlerService;

  const mockIntegration: Partial<IntegrationDocument> = {
    _id: '507f1f77bcf86cd799439011' as any,
    name: 'ProDoctor Test',
    type: IntegrationType.PRODOCTOR,
    enabled: true,
    debug: false,
  };

  const mockConfigFake = {
    apiUrl: 'http://localhost:7575',
    apiKey: 'test-key',
    apiPassword: 'test-password',
    useFakeApi: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdoctorApiService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn(),
            axiosRef: {
              interceptors: {
                request: {
                  use: jest.fn(),
                },
              },
            },
          },
        },
        {
          provide: CredentialsHelper,
          useValue: {
            getConfig: jest.fn(),
          },
        },
        {
          provide: SentryErrorHandlerService,
          useValue: {
            defaultApiIntegrationError: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            sendAuditEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProdoctorApiService>(ProdoctorApiService);
    httpService = module.get<HttpService>(HttpService);
    credentialsHelper = module.get<CredentialsHelper>(CredentialsHelper);
    auditService = module.get<AuditService>(AuditService);
    sentryErrorHandlerService = module.get<SentryErrorHandlerService>(SentryErrorHandlerService);

    jest.spyOn(credentialsHelper, 'getConfig').mockResolvedValue(mockConfigFake);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchPatient', () => {
    it('deve buscar paciente por CPF com sucesso', async () => {
      const mockResponse = {
        data: {
          payload: {
            paciente: {
              codigo: 1,
              nome: 'João da Silva',
              cpf: '11122233344',
              dataNascimento: '15/03/1990',
              sexo: { codigo: 1, nome: 'Masculino' },
              email: 'joao.silva@email.com',
              telefone: {
                ddd: '11',
                numero: '999887766',
                tipo: { codigo: 3, nome: 'Celular' },
              },
            },
          },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const result = await service.searchPatient(mockIntegration as any, {
        cpf: '11122233344',
      });

      expect(result.sucesso).toBe(true);
      expect(result.payload.paciente.nome).toBe('João da Silva');
      expect(result.payload.paciente.cpf).toBe('11122233344');
      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:3456/api/v1/Paciente/Buscar',
        { cpf: '11122233344' },
        expect.any(Object),
      );
    });

    it('deve buscar paciente por nome', async () => {
      const mockResponse = {
        data: {
          payload: {
            paciente: {
              codigo: 2,
              nome: 'Maria Oliveira',
              cpf: '55566677788',
              dataNascimento: '20/07/1985',
            },
          },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const result = await service.searchPatient(mockIntegration as any, {
        nome: 'Maria',
      });

      expect(result.sucesso).toBe(true);
      expect(result.payload.paciente.nome).toBe('Maria Oliveira');
    });

    it('deve retornar resposta vazia quando paciente não for encontrado', async () => {
      const mockError = {
        response: {
          status: HttpStatus.NOT_FOUND,
          data: {
            mensagens: ['Paciente não encontrado'],
          },
        },
        status: HttpStatus.NOT_FOUND,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw mockError;
      });

      const result = await service.searchPatient(mockIntegration as any, {
        cpf: '99999999999',
      });

      expect(result.sucesso).toBe(false);
      expect(result.payload.paciente).toBeNull();
      expect(result.mensagens).toContain('Paciente não encontrado');
    });

    it('deve registrar audit events', async () => {
      const mockResponse = {
        data: {
          payload: { paciente: {} },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      await service.searchPatient(mockIntegration as any, { cpf: '123' });

      // Deve ter chamado audit 2 vezes: request e response
      expect(auditService.sendAuditEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPatientByCpf', () => {
    it('deve buscar paciente por CPF formatado', async () => {
      const mockResponse = {
        data: {
          payload: {
            paciente: {
              codigo: 1,
              nome: 'João da Silva',
              cpf: '11122233344',
            },
          },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      await service.getPatientByCpf(mockIntegration as any, '111.222.333-44');

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cpf: '11122233344', // Verifica se removeu formatação
        }),
        expect.any(Object),
      );
    });

    it('deve incluir localProDoctor quando fornecido', async () => {
      const mockResponse = {
        data: {
          payload: { paciente: {} },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      await service.getPatientByCpf(mockIntegration as any, '11122233344', 1);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cpf: '11122233344',
          localProDoctor: { codigo: 1 },
        }),
        expect.any(Object),
      );
    });
  });

  describe('getPatientDetails', () => {
    it('deve retornar detalhes completos do paciente', async () => {
      const mockResponse = {
        data: {
          payload: {
            paciente: {
              codigo: 1,
              nome: 'João da Silva Santos',
              cpf: '11122233344',
              dataNascimento: '15/03/1990',
              sexo: { codigo: 1, nome: 'Masculino' },
              email: 'joao.silva@email.com',
              nomeSocial: 'João',
              nomeMae: 'Maria da Silva',
              telefone: {
                ddd: '11',
                numero: '999887766',
                tipo: { codigo: 3, nome: 'Celular' },
              },
            },
          },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse) as any);

      const result = await service.getPatientDetails(mockIntegration as any, 1);

      expect(result.sucesso).toBe(true);
      expect(result.payload.paciente.codigo).toBe(1);
      expect(result.payload.paciente.nomeMae).toBe('Maria da Silva');
      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3456/api/v1/Paciente/Detalhar/1',
        expect.any(Object),
      );
    });

    it('deve lançar erro quando paciente não existir', async () => {
      const mockError = {
        response: {
          status: HttpStatus.NOT_FOUND,
          data: {
            mensagens: ['Paciente não encontrado'],
          },
        },
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => {
        throw mockError;
      });

      await expect(service.getPatientDetails(mockIntegration as any, 999)).rejects.toThrow();
    });
  });

  describe('createPatient', () => {
    it('deve criar novo paciente com sucesso', async () => {
      const mockResponse = {
        data: {
          payload: {
            paciente: {
              codigo: 10,
              nome: 'Novo Paciente',
              cpf: '12312312312',
              dataNascimento: '01/01/2000',
            },
          },
          sucesso: true,
          mensagens: ['Paciente criado com sucesso'],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const request = {
        paciente: {
          nome: 'Novo Paciente',
          cpf: '12312312312',
          dataNascimento: '01/01/2000',
          sexo: { codigo: 1 },
          email: 'novo@email.com',
          telefone: {
            ddd: '11',
            numero: '988887777',
            tipo: { codigo: 3 },
          },
        },
        localProDoctor: { codigo: 1 },
      };

      const result = await service.createPatient(mockIntegration as any, request);

      expect(result.sucesso).toBe(true);
      expect(result.payload.paciente.codigo).toBe(10);
      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:3456/api/v1/Pacientes/Inserir',
        request,
        expect.any(Object),
      );
    });

    it('deve lançar erro de conflito quando CPF já existir', async () => {
      const mockError = {
        response: {
          status: HttpStatus.CONFLICT,
          data: {
            mensagens: ['Paciente já cadastrado com este CPF'],
          },
        },
        status: HttpStatus.CONFLICT,
        message: 'Paciente já cadastrado',
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw mockError;
      });

      const request = {
        paciente: {
          nome: 'Paciente Duplicado',
          cpf: '11122233344',
          dataNascimento: '01/01/2000',
        },
        localProDoctor: { codigo: 1 },
      };

      await expect(service.createPatient(mockIntegration as any, request)).rejects.toThrow(
        'Paciente já cadastrado com este CPF',
      );
    });
  });

  describe('updatePatient', () => {
    it('deve atualizar paciente existente', async () => {
      const mockResponse = {
        data: {
          payload: {
            paciente: {
              codigo: 1,
              nome: 'João da Silva Santos Atualizado',
              cpf: '11122233344',
              email: 'novo.email@test.com',
            },
          },
          sucesso: true,
          mensagens: ['Paciente atualizado com sucesso'],
        },
      };

      jest.spyOn(httpService, 'put').mockReturnValue(of(mockResponse) as any);

      const request = {
        paciente: {
          codigo: 1,
          nome: 'João da Silva Santos Atualizado',
          cpf: '11122233344',
          dataNascimento: '15/03/1990',
          email: 'novo.email@test.com',
        },
        localProDoctor: { codigo: 1 },
      };

      const result = await service.updatePatient(mockIntegration as any, request);

      expect(result.sucesso).toBe(true);
      expect(result.payload.paciente.email).toBe('novo.email@test.com');
      expect(httpService.put).toHaveBeenCalledWith(
        'http://localhost:3456/api/v1/Pacientes/Alterar',
        request,
        expect.any(Object),
      );
    });

    it('deve lançar erro quando código não for informado', async () => {
      const request = {
        paciente: {
          nome: 'Teste',
          cpf: '11122233344',
          dataNascimento: '01/01/2000',
        },
        localProDoctor: { codigo: 1 },
      };

      await expect(service.updatePatient(mockIntegration as any, request)).rejects.toThrow(
        'Código do paciente é obrigatório',
      );
    });
  });

  describe('listPatients', () => {
    it('deve listar todos os pacientes', async () => {
      const mockResponse = {
        data: {
          payload: {
            pacientes: [
              {
                codigo: 1,
                nome: 'João da Silva',
                cpf: '11122233344',
                dataNascimento: '15/03/1990',
              },
              {
                codigo: 2,
                nome: 'Maria Oliveira',
                cpf: '55566677788',
                dataNascimento: '20/07/1985',
              },
            ],
          },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      const result = await service.listPatients(mockIntegration as any, {
        quantidade: 10,
      });

      expect(result.sucesso).toBe(true);
      expect(result.payload.pacientes).toHaveLength(2);
    });
  });

  describe('deletePatient', () => {
    it('deve excluir paciente com sucesso', async () => {
      const mockResponse = {
        data: undefined,
        status: 204,
      };

      jest.spyOn(httpService, 'delete').mockReturnValue(of(mockResponse) as any);

      await service.deletePatient(mockIntegration as any, 1);

      expect(httpService.delete).toHaveBeenCalledWith(
        'http://localhost:3456/api/v1/Pacientes/Excluir/1',
        expect.any(Object),
      );
    });
  });

  describe('Debug Mode', () => {
    it('não deve logar quando debug estiver desativado', async () => {
      const debugIntegration = { ...mockIntegration, debug: false };
      const logSpy = jest.spyOn(service['logger'], 'debug');

      const mockResponse = {
        data: {
          payload: { paciente: {} },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      await service.searchPatient(debugIntegration as any, { cpf: '11122233344' });

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('deve logar quando debug estiver ativado', async () => {
      const debugIntegration = { ...mockIntegration, debug: true };
      const logSpy = jest.spyOn(service['logger'], 'debug');

      const mockResponse = {
        data: {
          payload: { paciente: {} },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      await service.searchPatient(debugIntegration as any, { cpf: '11122233344' });

      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('Audit Events', () => {
    it('deve enviar audit event para request e response', async () => {
      const mockResponse = {
        data: {
          payload: { paciente: {} },
          sucesso: true,
          mensagens: [],
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);

      await service.searchPatient(mockIntegration as any, { cpf: '123' });

      // Verifica que sendAuditEvent foi chamado pelo menos 2 vezes
      expect(auditService.sendAuditEvent).toHaveBeenCalledTimes(2);

      // Verifica que foi chamado com externalRequest
      expect(auditService.sendAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          dataType: expect.any(String),
          integrationId: expect.any(String),
        }),
      );
    });

    it('deve enviar audit event de erro quando falhar', async () => {
      const mockError = {
        response: {
          status: HttpStatus.BAD_REQUEST,
          data: {
            mensagens: ['Erro'],
          },
        },
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw mockError;
      });

      try {
        await service.searchPatient(mockIntegration as any, { cpf: '123' });
      } catch (error) {
        // Esperado falhar
      }

      // Verifica que sendAuditEvent foi chamado (request + error)
      expect(auditService.sendAuditEvent).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erro de rede', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(service.searchPatient(mockIntegration as any, { cpf: '123' })).rejects.toThrow();
    });

    it('deve extrair mensagem de erro da API', async () => {
      const mockError = {
        response: {
          status: HttpStatus.BAD_REQUEST,
          data: {
            mensagens: ['Dados inválidos'],
          },
        },
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw mockError;
      });

      await expect(service.createPatient(mockIntegration as any, {} as any)).rejects.toThrow();
    });
  });
});
