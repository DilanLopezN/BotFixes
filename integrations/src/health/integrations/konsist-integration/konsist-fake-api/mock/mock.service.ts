import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { realisticMocks } from '../db-mocks';

@Injectable()
export class MockService {
  swagger: any;

  constructor() {
    // Tenta carregar swagger.json do diretório atual
    const swaggerPath = path.join(process.cwd(), 'swagger.json');

    if (fs.existsSync(swaggerPath)) {
      this.swagger = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
      console.log('[MockService] Swagger carregado de swagger.json');
    } else {
      // Swagger inline mínimo com as rotas essenciais do fluxo de agendamento
      this.swagger = {
        paths: {
          // Pacientes
          '/listarpaciente': { post: { responses: { '200': {} } } },
          '/paciente': { post: { responses: { '201': {} } } },
          // Convênios
          '/listarconvenio': { get: { responses: { '200': {} } } },
          '/listarconvenio/{id}': { get: { responses: { '200': {} } } },
          // Médicos
          '/listarmedico': { get: { responses: { '200': {} } } },
          '/listarmedico/{id}': { get: { responses: { '200': {} } } },
          // Especialidades
          '/listarespecialidade': { get: { responses: { '200': {} } } },
          // Serviços/Procedimentos
          '/listarservico': { get: { responses: { '200': {} } } },
          '/listarservico/{:idconvenio}': { get: { responses: { '200': {} } } },
          // Filiais/Locais
          '/clientefilial': { get: { responses: { '200': {} } } },
          '/clientefilial/{id}': { get: { responses: { '200': {} } } },
          // Fluxo de Agendamento
          '/medico/agendamento/disponiveis': { post: { responses: { '201': {} } } },
          '/medico/agendamento/horarios-disponiveis': { post: { responses: { '201': {} } } },
          '/medico/agendamento/marcar': { post: { responses: { '201': {} } } },
          '/medico/agendamento/status-protocolo': { post: { responses: { '200': {} } } },
          // Confirmação/Cancelamento
          '/status': { post: { responses: { '201': {} } } },
          '/status-lote': { post: { responses: { '201': {} } } },
          // Agendamentos
          '/agendamentos': { post: { responses: { '200': {} } } },
          '/agendamentos/{cpf}': { get: { responses: { '200': {} } } },
          '/listaragenda': { post: { responses: { '200': {} } } },
        },
      };
      console.log('[MockService] Usando swagger inline (arquivo não encontrado)');
    }
  }

  /**
   * Retorna o status HTTP de sucesso baseado nas responses do swagger
   */
  getSuccessStatus(responses: any = {}): number {
    const codes = Object.keys(responses);
    const success = codes.find((c) => c.startsWith('2'));
    return success ? parseInt(success, 10) : 200;
  }

  /**
   * Busca mock customizado para a rota
   */
  getCustomMock(method: string, swaggerRoute: string, req: any): any {
    const key = `${method} ${swaggerRoute}`;
    const mockFn = realisticMocks[key];

    if (mockFn) {
      return mockFn(req);
    }

    return undefined; // undefined = usar mock padrão, null = 404
  }

  /**
   * Constrói resposta mock padrão
   */
  buildDefaultMock(swaggerRoute: string, method: string, req: any): any {
    return {
      message: 'Mock Konsist - resposta automática',
      method,
      swaggerRoute,
      params: req.params,
      query: req.query,
      body: req.body,
    };
  }
}
