import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { ProdoctorApiService } from './prodoctor-api.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditService } from '../../../audit/services/audit.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditDataType } from '../../../audit/audit.interface';
import { AgendamentoAlterarRequest } from '../interfaces';

describe('ProdoctorApiService', () => {
  let service: ProdoctorApiService;
  let httpService: HttpService;
  let credentialsHelper: CredentialsHelper;
  let auditService: AuditService;

  const mockIntegration: Partial<IntegrationDocument> = {
    _id: '507f1f77bcf86cd799439011' as any,
    name: 'ProDoctor Test',
    type: IntegrationType.PRODOCTOR,
    enabled: true,
    debug: false,
  };

  const mockConfig = {
    apiUrl: 'http://localhost:7575',
    apiKey: 'test-api-key',
    apiPassword: 'test-api-password',
  };

  const mockHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'X-APIKEY': 'test-api-key',
      'X-APIPASSWORD': 'test-api-password',
      'X-APITIMEZONE': '-03:00',
      'X-APITIMEZONENAME': 'America/Sao_Paulo',
    },
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
                request: { use: jest.fn() },
              },
            },
          },
        },
        {
          provide: CredentialsHelper,
          useValue: {
            getConfig: jest.fn().mockResolvedValue(mockConfig),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========== VALIDAÇÃO ==========
  describe('validateConnection', () => {
    it('deve retornar true quando conexão for válida', async () => {
      const mockResponse = {
        data: {
          sucesso: true,
          payload: { usuarios: [{ codigo: 1, nome: 'Admin' }] },
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.validateConnection(mockIntegration as IntegrationDocument);

      expect(result).toBe(true);
    });

    it('deve retornar false quando conexão falhar', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await service.validateConnection(mockIntegration as IntegrationDocument);

      expect(result).toBe(false);
    });
  });

  // ========== PACIENTES ==========
  describe('Patient Operations', () => {
    describe('searchPatient', () => {
      it('deve buscar paciente por CPF', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              paciente: {
                codigo: 101,
                nome: 'João da Silva',
                cpf: '12345678900',
              },
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.searchPatient(mockIntegration as IntegrationDocument, {
          cpf: '12345678900',
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.paciente.cpf).toBe('12345678900');
        expect(httpService.post).toHaveBeenCalledWith(
          'http://localhost:7575/api/v1/Pacientes',
          { cpf: '12345678900' },
          expect.any(Object),
        );
      });

      it('deve enviar audit events para request e response', async () => {
        const mockResponse = {
          data: { sucesso: true, payload: { paciente: {} } },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        await service.searchPatient(mockIntegration as IntegrationDocument, { cpf: '123' });

        expect(auditService.sendAuditEvent).toHaveBeenCalledTimes(2);
        expect(auditService.sendAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            dataType: AuditDataType.externalRequest,
          }),
        );
        expect(auditService.sendAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            dataType: AuditDataType.externalResponse,
          }),
        );
      });
    });

    describe('getPatientDetails', () => {
      it('deve detalhar paciente por código', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              paciente: {
                codigo: 101,
                nome: 'João da Silva',
                cpf: '12345678900',
                dataNascimento: '15/03/1990',
                sexo: { codigo: 1, nome: 'Masculino' },
              },
            },
          },
        };

        jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.getPatientDetails(mockIntegration as IntegrationDocument, 101);

        expect(result.sucesso).toBe(true);
        expect(result.payload.paciente.codigo).toBe(101);
        expect(httpService.get).toHaveBeenCalledWith(
          'http://localhost:7575/api/v1/Pacientes/Detalhar/101',
          expect.any(Object),
        );
      });

      it('deve lançar erro 404 quando paciente não existir', async () => {
        const mockError = {
          response: {
            status: HttpStatus.NOT_FOUND,
            data: { mensagens: ['Paciente não encontrado'] },
          },
        };

        jest.spyOn(httpService, 'get').mockImplementation(() => {
          throw mockError;
        });

        await expect(service.getPatientDetails(mockIntegration as IntegrationDocument, 999)).rejects.toThrow();
      });
    });

    describe('getPatientByCpf', () => {
      it('deve buscar paciente por CPF', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              paciente: {
                codigo: 101,
                nome: 'João da Silva',
                cpf: '12345678900',
              },
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.getPatientByCpf(mockIntegration as IntegrationDocument, '12345678900');

        expect(result.sucesso).toBe(true);
        expect(result.payload.paciente.cpf).toBe('12345678900');
      });
    });

    describe('createPatient', () => {
      it('deve criar novo paciente', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            mensagens: ['Paciente criado com sucesso'],
            payload: {
              paciente: {
                codigo: 102,
                nome: 'Novo Paciente',
              },
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const request = {
          paciente: {
            nome: 'Novo Paciente',
            cpf: '98765432100',
            dataNascimento: '01/01/2000',
            sexo: { codigo: 2 },
          },
        };

        const result = await service.createPatient(mockIntegration as IntegrationDocument, request);

        expect(result.sucesso).toBe(true);
        expect(result.payload.paciente.codigo).toBe(102);
        expect(httpService.post).toHaveBeenCalledWith(
          'http://localhost:7575/api/v1/Pacientes/Inserir',
          request,
          expect.any(Object),
        );
      });

      it('deve lançar erro de conflito quando CPF já existir', async () => {
        const mockError = {
          response: {
            status: HttpStatus.CONFLICT,
            data: { mensagens: ['CPF já cadastrado'] },
          },
        };

        jest.spyOn(httpService, 'post').mockImplementation(() => {
          throw mockError;
        });

        const request = {
          paciente: { nome: 'Teste', cpf: '11111111111' },
        };

        await expect(service.createPatient(mockIntegration as IntegrationDocument, request)).rejects.toThrow();
      });
    });

    describe('updatePatient', () => {
      it('deve atualizar paciente existente', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              paciente: {
                codigo: 101,
                nome: 'João Atualizado',
              },
            },
          },
        };

        jest.spyOn(httpService, 'put').mockReturnValue(of(mockResponse as AxiosResponse));

        const request = {
          paciente: {
            codigo: 101,
            nome: 'João Atualizado',
            correioEletronico: 'novo@email.com',
          },
        };

        const result = await service.updatePatient(mockIntegration as IntegrationDocument, request);

        expect(result.sucesso).toBe(true);
        expect(result.payload.paciente.nome).toBe('João Atualizado');
      });

      it('deve lançar erro quando código não for informado', async () => {
        const request = {
          paciente: { nome: 'Teste' },
        };

        await expect(service.updatePatient(mockIntegration as IntegrationDocument, request as any)).rejects.toThrow();
      });
    });

    describe('listPacientes', () => {
      it('deve listar pacientes', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              pacientes: [
                { codigo: 101, nome: 'João' },
                { codigo: 102, nome: 'Maria' },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.listPacientes(mockIntegration as IntegrationDocument, {
          quantidade: 10,
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.pacientes).toHaveLength(2);
      });
    });
  });

  // ========== USUÁRIOS (MÉDICOS) ==========
  describe('User/Doctor Operations', () => {
    describe('listUsuarios', () => {
      it('deve listar usuários', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              usuarios: [
                { codigo: 100, nome: 'Dr. Carlos', ativo: true },
                { codigo: 101, nome: 'Dra. Ana', ativo: true },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.listUsuarios(mockIntegration as IntegrationDocument, {
          quantidade: 100,
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.usuarios).toHaveLength(2);
      });
    });

    describe('listUsuariosComEspecialidade', () => {
      it('deve listar usuários com especialidades', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              usuarios: [
                {
                  codigo: 100,
                  nome: 'Dr. Carlos',
                  especialidades: [
                    { codigo: 1, nome: 'Cardiologia' },
                    { codigo: 2, nome: 'Clínica Geral' },
                  ],
                },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.listUsuariosComEspecialidade(mockIntegration as IntegrationDocument, {
          quantidade: 100,
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.usuarios[0].especialidades).toHaveLength(2);
      });
    });

    describe('detalharUsuario', () => {
      it('deve detalhar usuário por código', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              usuario: {
                codigo: 100,
                nome: 'Dr. Carlos Silva',
                crm: '123456',
                especialidades: [{ codigo: 1, nome: 'Cardiologia' }],
              },
            },
          },
        };

        jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.detalharUsuario(mockIntegration as IntegrationDocument, 100);

        expect(result.sucesso).toBe(true);
        expect(result.payload.usuario.crm).toBe('123456');
      });
    });
  });

  // ========== AGENDA ==========
  describe('Schedule Operations', () => {
    describe('listarAgendamentos', () => {
      it('deve listar agendamentos do dia', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              diaAgendaConsulta: {
                data: '25/11/2025',
                usuario: { codigo: 100, nome: 'Dr. Carlos' },
                agendamentos: [
                  { codigo: 1001, hora: '08:00', paciente: { codigo: 101, nome: 'João' } },
                  { codigo: 1002, hora: '09:00', paciente: { codigo: 102, nome: 'Maria' } },
                ],
                totalAgendamentos: 2,
              },
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.listarAgendamentos(mockIntegration as IntegrationDocument, {
          usuario: { codigo: 100 },
          data: '25/11/2025',
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.diaAgendaConsulta.agendamentos).toHaveLength(2);
      });
    });

    describe('buscarAgendamentosPaciente', () => {
      it('deve buscar agendamentos de um paciente', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              agendamentos: [
                {
                  codigo: 1001,
                  data: '25/11/2025',
                  hora: '10:00',
                  usuario: { codigo: 100, nome: 'Dr. Carlos' },
                },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.buscarAgendamentosPaciente(mockIntegration as IntegrationDocument, {
          paciente: { codigo: 101 },
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.agendamentos).toHaveLength(1);
      });
    });

    describe('inserirAgendamento', () => {
      it('deve inserir novo agendamento', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            mensagens: ['Agendamento criado'],
            payload: {
              agendamento: {
                codigo: 2001,
                data: '26/11/2025',
                hora: '14:00',
              },
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const request = {
          paciente: { codigo: 101 },
          usuario: { codigo: 100 },
          data: '26/11/2025',
          hora: '14:00',
          localProDoctor: { codigo: 1 },
        };

        const result = await service.inserirAgendamento(mockIntegration as IntegrationDocument, request);

        expect(result.sucesso).toBe(true);
        expect(result.payload.agendamento.codigo).toBe(2001);
      });
    });

    describe('alterarAgendamento', () => {
      it('deve alterar agendamento existente', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              agendamentoOriginal: { data: '25/11/2025', hora: '10:00' },
              agendamentoAtual: { data: '26/11/2025', hora: '11:00' },
            },
          },
        };

        jest.spyOn(httpService, 'put').mockReturnValue(of(mockResponse as AxiosResponse));

        const usuario = { codigo: 100, nome: 'Dr. Carlos' };

        const request: AgendamentoAlterarRequest = {
          agendamentoOrigem: {
            localProDoctor: { codigo: 1 },
            data: '25/11/2025',
            hora: '10:00',
            usuario, // ✅ obrigatório em agendamentoOrigem
          },
          agendamento: {
            data: '26/11/2025',
            hora: '11:00',
            usuario,
          },
        };

        const result = await service.alterarAgendamento(mockIntegration as IntegrationDocument, request);

        expect(result.sucesso).toBe(true);
      });
    });

    describe('desmarcarAgendamento', () => {
      it('deve desmarcar agendamento', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            mensagens: ['Agendamento desmarcado'],
            payload: {},
          },
        };

        jest.spyOn(httpService, 'patch').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.desmarcarAgendamento(mockIntegration as IntegrationDocument, {
          agendamento: { codigo: 1001 },
        });

        expect(result.sucesso).toBe(true);
      });
    });

    describe('alterarStatusAgendamento', () => {
      it('deve alterar status do agendamento para confirmado', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              agendamento: {
                codigo: 1001,
                estadoAgendaConsulta: { confirmado: true },
              },
            },
          },
        };

        jest.spyOn(httpService, 'patch').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.alterarStatusAgendamento(mockIntegration as IntegrationDocument, {
          agendamento: { codigo: 1001 },
          estadoAgendaConsulta: { confirmado: true },
        });

        expect(result.sucesso).toBe(true);
      });
    });

    describe('buscarHorariosDisponiveis', () => {
      it('deve buscar horários disponíveis', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              agendamentos: [
                { dataHora: '25/11/2025 08:00', duracao: 30 },
                { dataHora: '25/11/2025 08:30', duracao: 30 },
                { dataHora: '25/11/2025 09:00', duracao: 30 },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.buscarHorariosLivres(mockIntegration as IntegrationDocument, {
          usuario: { codigo: 100 },
          periodo: { dataInicial: '25/11/2025', dataFinal: '30/11/2025' },
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.horarios).toBeInstanceOf(Object);
      });
    });

    describe('buscarAgendamentosPorStatus', () => {
      it('deve buscar agendamentos por status', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              agendamentos: [
                { codigo: 1001, estadoAgendaConsulta: { confirmado: true } },
                { codigo: 1002, estadoAgendaConsulta: { confirmado: true } },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.buscarAgendamentosPorStatus(mockIntegration as IntegrationDocument, {
          periodo: { dataInicial: '01/11/2025', dataFinal: '30/11/2025' },
          estadoAgendaConsulta: { confirmado: true },
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.agendamentos).toHaveLength(2);
      });
    });
  });

  // ========== CONVÊNIOS ==========
  describe('Insurance Operations', () => {
    describe('listConvenios', () => {
      it('deve listar convênios', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              convenios: [
                { codigo: 501, nome: 'Unimed', ativo: true },
                { codigo: 502, nome: 'Bradesco Saúde', ativo: true },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.listConvenios(mockIntegration as IntegrationDocument, {
          quantidade: 100,
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.convenios).toHaveLength(2);
      });
    });

    describe('detalharConvenio', () => {
      it('deve detalhar convênio', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              convenio: {
                codigo: 501,
                nome: 'Unimed',
                planos: [{ codigo: 1, nome: 'Nacional' }],
              },
            },
          },
        };

        jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.detalharConvenio(mockIntegration as IntegrationDocument, 501);

        expect(result.sucesso).toBe(true);
        expect(result.payload.convenio.tipoConvenio).toHaveLength(1);
      });
    });
  });

  // ========== LOCAIS PRODOCTOR ==========
  describe('Organization Unit Operations', () => {
    describe('listLocaisProDoctor', () => {
      it('deve listar locais ProDoctor', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              locaisProDoctor: [
                { codigo: 1, nome: 'Clínica Central' },
                { codigo: 2, nome: 'Filial Sul' },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.listLocaisProDoctor(mockIntegration as IntegrationDocument, {
          quantidade: 100,
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.locaisProDoctor).toHaveLength(2);
      });
    });
  });

  // ========== PROCEDIMENTOS ==========
  describe('Procedure Operations', () => {
    describe('listProcedimentos', () => {
      it('deve listar procedimentos', async () => {
        const mockResponse = {
          data: {
            sucesso: true,
            payload: {
              procedimentos: [
                { codigo: '10101012', nome: 'Consulta', tabela: { codigo: 1, nome: 'AMB' } },
                { codigo: '10101013', nome: 'Retorno', tabela: { codigo: 1, nome: 'AMB' } },
              ],
            },
          },
        };

        jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

        const result = await service.listProcedimentos(mockIntegration as IntegrationDocument, {
          quantidade: 100,
        });

        expect(result.sucesso).toBe(true);
        expect(result.payload.procedimentos).toHaveLength(2);
      });
    });
  });

  // ========== DEBUG MODE ==========
  describe('Debug Mode', () => {
    it('não deve logar quando debug desativado', async () => {
      const debugIntegration = { ...mockIntegration, debug: false };
      const logSpy = jest.spyOn(service['logger'], 'debug');

      const mockResponse = { data: { sucesso: true, payload: {} } };
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

      await service.listUsuarios(debugIntegration as IntegrationDocument, { quantidade: 10 });

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('deve logar quando debug ativado', async () => {
      const debugIntegration = { ...mockIntegration, debug: true };
      const logSpy = jest.spyOn(service['logger'], 'debug');

      const mockResponse = { data: { sucesso: true, payload: {} } };
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as AxiosResponse));

      await service.listUsuarios(debugIntegration as IntegrationDocument, { quantidade: 10 });

      expect(logSpy).toHaveBeenCalled();
    });
  });

  // ========== ERROR HANDLING ==========
  describe('Error Handling', () => {
    it('deve tratar erro de rede', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(service.searchPatient(mockIntegration as IntegrationDocument, { cpf: '123' })).rejects.toThrow();
    });

    it('deve enviar audit event de erro', async () => {
      const mockError = {
        response: {
          status: HttpStatus.BAD_REQUEST,
          data: { mensagens: ['Erro'] },
        },
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw mockError;
      });

      try {
        await service.searchPatient(mockIntegration as IntegrationDocument, { cpf: '123' });
      } catch {
        // Expected
      }

      expect(auditService.sendAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          dataType: AuditDataType.externalResponseError,
        }),
      );
    });

    it('deve lançar erro de credenciais inválidas', async () => {
      jest.spyOn(credentialsHelper, 'getConfig').mockResolvedValue({
        apiUrl: 'http://localhost:7575',
        apiKey: null,
        apiPassword: null,
      });

      await expect(service.listUsuarios(mockIntegration as IntegrationDocument, { quantidade: 10 })).rejects.toThrow();
    });
  });
});
