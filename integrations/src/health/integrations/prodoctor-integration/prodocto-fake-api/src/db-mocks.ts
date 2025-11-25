import { Request } from 'express';
import { additionalRealisticMocks } from './additionnal-mocks';

type MockFn = (req: Request) => any;

/**
 * Mocks realistas para a API ProDoctor aberta.
 * Chave: `${METHOD} ${swaggerRoute}`
 * Exemplo: "POST /api/v1/Pacientes"
 */
export const realisticMocks: Record<string, MockFn> = {
  /* -------------------------------------------------------------------------- */
  /*                                   AGENDA                                   */
  /* -------------------------------------------------------------------------- */

  // Listar agendamentos do dia para um usuário
  'POST /api/v1/Agenda/Listar': (req) => {
    const { usuario, data } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        data: data ?? '20/11/2025',
        usuario: {
          codigo: usuario?.codigo ?? 100,
          nome: 'Dr. João da Silva',
        },
        localProDoctor: {
          codigo: 1,
          nome: 'Clínica Central',
        },
        consultas: [
          {
            hora: '08:00',
            estadoAgendaConsulta: {
              codigo: 1,
              descricao: 'Agendado',
            },
            paciente: {
              codigo: 101,
              nome: 'Maria de Souza',
              nascimento: '1991-08-10',
              telefone: '(11) 99999-0001',
            },
            convenio: {
              codigo: 501,
              nome: 'Unimed',
            },
            procedimentoMedico: {
              tabela: { codigo: 1, nome: 'AMB' },
              codigo: '10101012',
              descricao: 'Consulta médica',
            },
            complemento: 'Paciente novo',
          },
          {
            hora: '09:00',
            estadoAgendaConsulta: {
              codigo: 2,
              descricao: 'Retorno',
            },
            paciente: {
              codigo: 102,
              nome: 'Carlos Pereira',
              nascimento: '1985-04-22',
              telefone: '(11) 99999-0002',
            },
            convenio: {
              codigo: 502,
              nome: 'Bradesco Saúde',
            },
            procedimentoMedico: {
              tabela: { codigo: 1, nome: 'AMB' },
              codigo: '10101013',
              descricao: 'Retorno',
            },
            complemento: 'Retorno de exame',
          },
        ],
      },
    };
  },

  // Buscar agendamentos de um paciente
  'POST /api/v1/Agenda/Buscar': (req) => {
    const { paciente } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        paciente: {
          codigo: paciente?.codigo ?? 101,
          nome: paciente?.nome ?? 'Paciente Mock',
          nascimento: '1990-01-01',
        },
        agendamentos: [
          {
            data: '20/11/2025',
            hora: '08:00',
            localProDoctor: {
              codigo: 1,
              nome: 'Clínica Central',
            },
            usuario: {
              codigo: 100,
              nome: 'Dr. João da Silva',
            },
            estadoAgendaConsulta: {
              codigo: 1,
              descricao: 'Agendado',
            },
            convenio: {
              codigo: 501,
              nome: 'Unimed',
            },
            procedimentoMedico: {
              tabela: { codigo: 1, nome: 'AMB' },
              codigo: '10101012',
              descricao: 'Consulta médica',
            },
          },
          {
            data: '10/11/2025',
            hora: '15:30',
            localProDoctor: {
              codigo: 1,
              nome: 'Clínica Central',
            },
            usuario: {
              codigo: 100,
              nome: 'Dr. João da Silva',
            },
            estadoAgendaConsulta: {
              codigo: 3,
              descricao: 'Atendido',
            },
            convenio: {
              codigo: 501,
              nome: 'Unimed',
            },
            procedimentoMedico: {
              tabela: { codigo: 1, nome: 'AMB' },
              codigo: '10101014',
              descricao: 'Retorno',
            },
          },
        ],
      },
    };
  },

  // Buscar horários livres
  'POST /api/v1/Agenda/Livres': (req) => {
    const { dataInicio, dataFim, usuario } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        usuario: {
          codigo: usuario?.codigo ?? 100,
          nome: 'Dr. João da Silva',
        },
        periodo: {
          inicio: dataInicio ?? '20/11/2025',
          fim: dataFim ?? '20/11/2025',
        },
        horariosLivres: [
          {
            data: '20/11/2025',
            horaInicial: '10:00',
            horaFinal: '10:30',
          },
          {
            data: '20/11/2025',
            horaInicial: '11:00',
            horaFinal: '11:30',
          },
          {
            data: '20/11/2025',
            horaInicial: '16:00',
            horaFinal: '16:30',
          },
        ],
      },
    };
  },

  // Inserir agendamento
  'POST /api/v1/Agenda/Inserir': (req) => {
    const body: any = req.body || {};
    const agendamento = body.agendamento || {};
    const paciente = agendamento.paciente || {};

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        localProDoctor: agendamento.localProDoctor || {
          codigo: 1,
          nome: 'Clínica Central',
        },
        usuario: agendamento.usuario || {
          codigo: 100,
          nome: 'Dr. João da Silva',
        },
        data: agendamento.data ?? '20/11/2025',
        hora: agendamento.hora ?? '14:00',
        paciente: {
          codigo: paciente.codigo ?? 9999,
          nome: paciente.nome ?? 'Novo Paciente',
          nascimento: paciente.nascimento ?? '1995-01-01',
        },
        complemento: agendamento.complemento ?? 'Agendamento gerado pela API mock',
        teleconsulta: agendamento.teleconsulta ?? null,
      },
    };
  },

  // Desmarcar agendamento
  'PATCH /api/v1/Agenda/Desmarcar': (req) => {
    const { data, hora, usuario, localProDoctor } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: 'Agendamento desmarcado com sucesso (mock).',
      dados: {
        localProDoctor: localProDoctor || {
          codigo: 1,
          nome: 'Clínica Central',
        },
        usuario: usuario || {
          codigo: 100,
          nome: 'Dr. João da Silva',
        },
        data: data ?? '20/11/2025',
        hora: hora ?? '10:00',
        estadoAnterior: {
          codigo: 1,
          descricao: 'Agendado',
        },
        estadoAtual: {
          codigo: 4,
          descricao: 'Cancelado',
        },
      },
    };
  },

  // Alterar agendamento
  'PUT /api/v1/Agenda/Alterar': (req) => {
    const { agendamentoOrigem, agendamento } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: 'Agendamento alterado com sucesso (mock).',
      dados: {
        agendamentoOriginal: agendamentoOrigem || {
          localProDoctor: { codigo: 1, nome: 'Clínica Central' },
          usuario: { codigo: 100, nome: 'Dr. João da Silva' },
          data: '20/11/2025',
          hora: '09:00',
        },
        agendamentoAtual: agendamento || {
          localProDoctor: { codigo: 1, nome: 'Clínica Central' },
          usuario: { codigo: 100, nome: 'Dr. João da Silva' },
          data: '20/11/2025',
          hora: '10:00',
        },
      },
    };
  },

  // Excluir agendamento
  'DELETE /api/v1/Agenda/Excluir': (req) => {
    const body: any = req.body || {};
    return {
      sucesso: true,
      mensagem: 'Agendamento excluído com sucesso (mock).',
      dados: {
        requisicao: body,
      },
    };
  },

  // Detalhar agendamento
  'POST /api/v1/Agenda/Detalhar': (req) => {
    const { data, hora, localProDoctor, usuario } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        localProDoctor: localProDoctor || {
          codigo: 1,
          nome: 'Clínica Central',
        },
        usuario: usuario || {
          codigo: 100,
          nome: 'Dr. João da Silva',
        },
        data: data ?? '20/11/2025',
        hora: hora ?? '08:00',
        paciente: {
          codigo: 101,
          nome: 'Maria de Souza',
          nascimento: '1991-08-10',
          sexo: 'F',
          cpf: '12345678900',
        },
        convenio: {
          codigo: 501,
          nome: 'Unimed',
          plano: 'Nacional',
          carteirinha: 'ABC123456',
        },
        procedimentoMedico: {
          tabela: { codigo: 1, nome: 'AMB' },
          codigo: '10101012',
          descricao: 'Consulta médica',
          valor: 250.0,
        },
        telefones: [
          { tipo: 'Celular', numero: '(11) 99999-0001' },
          { tipo: 'Residencial', numero: '(11) 4002-8922' },
        ],
        email: 'maria.souza@example.com',
        orientacaoUsuario: 'Chegar com 15 minutos de antecedência.',
        orientacaoConvenio: 'Trazer carteirinha e documento com foto.',
        estadoAgendaConsulta: {
          codigo: 1,
          descricao: 'Agendado',
        },
      },
    };
  },

  // Buscar por status/tipo
  'POST /api/v1/Agenda/BuscarPorStatusTipo': (req) => {
    const body: any = req.body || {};
    const { status, tipo } = body;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        filtro: {
          status: status ?? 'Agendado',
          tipo: tipo ?? 'Consulta',
        },
        agendamentos: [
          {
            data: '20/11/2025',
            hora: '09:30',
            localProDoctor: {
              codigo: 1,
              nome: 'Clínica Central',
            },
            usuario: {
              codigo: 100,
              nome: 'Dr. João da Silva',
            },
            paciente: {
              codigo: 101,
              nome: 'Maria de Souza',
            },
            estadoAgendaConsulta: {
              codigo: 1,
              descricao: 'Agendado',
            },
          },
          {
            data: '20/11/2025',
            hora: '11:00',
            localProDoctor: {
              codigo: 2,
              nome: 'Clínica Unidade 2',
            },
            usuario: {
              codigo: 101,
              nome: 'Dra. Ana Paula',
            },
            paciente: {
              codigo: 102,
              nome: 'Carlos Pereira',
            },
            estadoAgendaConsulta: {
              codigo: 1,
              descricao: 'Agendado',
            },
          },
        ],
      },
    };
  },

  // Alterar status de agendamento
  'PATCH /api/v1/Agenda/AlterarStatus': (req) => {
    const { estadoAgendaConsulta, agendamentoID } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: 'Status do agendamento alterado com sucesso (mock).',
      dados: {
        agendamento: agendamentoID || {
          localProDoctor: { codigo: 1, nome: 'Clínica Central' },
          usuario: { codigo: 100, nome: 'Dr. João da Silva' },
          data: '20/11/2025',
          hora: '08:00',
        },
        estadoAnterior: {
          codigo: 1,
          descricao: 'Agendado',
        },
        estadoAtual:
          estadoAgendaConsulta ||
          ({
            codigo: 3,
            descricao: 'Atendido',
          } as any),
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                        ANAMNESES E EVOLUÇÕES                               */
  /* -------------------------------------------------------------------------- */

  // Listar anamneses/evoluções de um paciente
  'GET /api/v1/AnamneseEvolucao/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        paciente: {
          codigo: Number(codigo),
          nome: 'Paciente Mock',
        },
        evolucoes: [
          {
            codigo: 10001,
            data: '10/11/2025',
            hora: '14:00',
            profissional: {
              codigo: 200,
              nome: 'Dra. Ana Paula',
              conselho: 'CRM',
              numeroConselho: '123456-SP',
            },
            tipo: 'Anamnese',
            resumo: 'Paciente relata dor de cabeça há 3 dias...',
          },
          {
            codigo: 10002,
            data: '15/11/2025',
            hora: '09:30',
            profissional: {
              codigo: 200,
              nome: 'Dra. Ana Paula',
              conselho: 'CRM',
              numeroConselho: '123456-SP',
            },
            tipo: 'Evolução',
            resumo: 'Melhora parcial do quadro, paciente sem febre...',
          },
        ],
      },
    };
  },

  // Detalhar anamnese/evolução
  'GET /api/v1/AnamneseEvolucao/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        codigo: Number(codigo),
        tipo: 'Evolução',
        data: '15/11/2025',
        hora: '09:30',
        paciente: {
          codigo: 101,
          nome: 'Maria de Souza',
        },
        profissional: {
          codigo: 200,
          nome: 'Dra. Ana Paula',
          conselho: 'CRM',
          numeroConselho: '123456-SP',
        },
        texto: 'Paciente apresenta melhora significativa, sem febre, com dor reduzida...',
        anexos: [
          {
            codigo: 1,
            nomeArquivo: 'exame-sangue.pdf',
            tipo: 'PDF',
          },
        ],
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                                  CONVÊNIOS                                 */
  /* -------------------------------------------------------------------------- */

  // Buscar convênios
  'POST /api/v1/Convenios': (req) => {
    const body: any = req.body || {};
    const nome = body?.nome ?? 'Unimed';

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        total: 2,
        itens: [
          {
            codigo: 501,
            nome,
            registroAns: '123456',
            cnpj: '12.345.678/0001-99',
            telefone: '(11) 4002-8922',
            ativo: true,
          },
          {
            codigo: 502,
            nome: 'Bradesco Saúde',
            registroAns: '987654',
            cnpj: '98.765.432/0001-99',
            telefone: '(11) 4090-1234',
            ativo: true,
          },
        ],
      },
    };
  },

  // Detalhar convênio
  'GET /api/v1/Convenios/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const codigoNum = Number(codigo) || 501;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        codigo: codigoNum,
        nome: codigoNum === 501 ? 'Unimed' : 'Bradesco Saúde',
        registroAns: '123456',
        cnpj: '12.345.678/0001-99',
        telefone: '(11) 4002-8922',
        site: 'https://www.conveniomock.com.br',
        planos: [
          { codigo: 1, nome: 'Enfermaria' },
          { codigo: 2, nome: 'Apartamento' },
        ],
        endereco: {
          logradouro: 'Av. Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01310-100',
        },
        ativo: true,
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                                  DOMÍNIOS                                  */
  /* -------------------------------------------------------------------------- */

  'GET /api/v1/Dominios/TiposTelefone': () => ({
    sucesso: true,
    mensagem: null,
    dados: [
      { codigo: 1, descricao: 'Residencial' },
      { codigo: 2, descricao: 'Comercial' },
      { codigo: 3, descricao: 'Celular' },
      { codigo: 4, descricao: 'Recado' },
    ],
  }),

  'GET /api/v1/Dominios/Cores': () => ({
    sucesso: true,
    mensagem: null,
    dados: [
      { codigo: 1, nome: 'Azul', codigoHex: '#2196F3' },
      { codigo: 2, nome: 'Verde', codigoHex: '#4CAF50' },
      { codigo: 3, nome: 'Vermelho', codigoHex: '#F44336' },
      { codigo: 4, nome: 'Amarelo', codigoHex: '#FFEB3B' },
    ],
  }),

  'GET /api/v1/Dominios/Sexos': () => ({
    sucesso: true,
    mensagem: null,
    dados: [
      { codigo: 1, descricao: 'Masculino', sigla: 'M' },
      { codigo: 2, descricao: 'Feminino', sigla: 'F' },
      { codigo: 3, descricao: 'Outro', sigla: 'O' },
    ],
  }),

  'GET /api/v1/Dominios/EstadosCivis': () => ({
    sucesso: true,
    mensagem: null,
    dados: [
      { codigo: 1, descricao: 'Solteiro(a)' },
      { codigo: 2, descricao: 'Casado(a)' },
      { codigo: 3, descricao: 'Divorciado(a)' },
      { codigo: 4, descricao: 'Viúvo(a)' },
      { codigo: 5, descricao: 'União estável' },
    ],
  }),

  'GET /api/v1/Dominios/Escolaridades': () => ({
    sucesso: true,
    mensagem: null,
    dados: [
      { codigo: 1, descricao: 'Fundamental incompleto' },
      { codigo: 2, descricao: 'Fundamental completo' },
      { codigo: 3, descricao: 'Médio incompleto' },
      { codigo: 4, descricao: 'Médio completo' },
      { codigo: 5, descricao: 'Superior incompleto' },
      { codigo: 6, descricao: 'Superior completo' },
      { codigo: 7, descricao: 'Pós-graduação' },
    ],
  }),

  'GET /api/v1/Dominios/ResponsaveisLegais': () => ({
    sucesso: true,
    mensagem: null,
    dados: [
      { codigo: 1, descricao: 'Pai' },
      { codigo: 2, descricao: 'Mãe' },
      { codigo: 3, descricao: 'Responsável legal' },
      { codigo: 4, descricao: 'Tutor(a)' },
    ],
  }),

  /* -------------------------------------------------------------------------- */
  /*                           IMAGENS E DOCUMENTOS                             */
  /* -------------------------------------------------------------------------- */

  // Inserir imagem/documento
  'POST /api/v1/ImagensDocumentos/Inserir': (req) => {
    const { pacienteCodigo, nomeArquivo, tipo } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: 'Imagem/Documento inserido com sucesso (mock).',
      dados: {
        codigo: 9001,
        pacienteCodigo: pacienteCodigo ?? 101,
        nomeArquivo: nomeArquivo ?? 'documento.pdf',
        tipo: tipo ?? 'PDF',
        dataUpload: '20/11/2025',
        usuario: {
          codigo: 100,
          nome: 'Usuário Mock',
        },
        urlDownload: 'https://files.mock/prodoctor/9001',
      },
    };
  },

  // Alterar imagem/documento
  'PUT /api/v1/ImagensDocumentos/Alterar': (req) => {
    const { codigo, nomeArquivo } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: 'Imagem/Documento alterado com sucesso (mock).',
      dados: {
        codigo: codigo ?? 9001,
        nomeArquivo: nomeArquivo ?? 'documento-atualizado.pdf',
        dataAlteracao: '21/11/2025',
      },
    };
  },

  // Excluir imagem/documento
  'DELETE /api/v1/ImagensDocumentos/Excluir/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: `Imagem/Documento ${codigo} excluído com sucesso (mock).`,
      dados: null,
    };
  },

  // Listar imagens/documentos de um paciente
  'GET /api/v1/ImagensDocumentos/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        pacienteCodigo: Number(codigo),
        itens: [
          {
            codigo: 9001,
            nomeArquivo: 'rx-torax.png',
            tipo: 'Imagem',
            dataUpload: '10/11/2025',
          },
          {
            codigo: 9002,
            nomeArquivo: 'exame-lab.pdf',
            tipo: 'PDF',
            dataUpload: '12/11/2025',
          },
        ],
      },
    };
  },

  // Detalhar imagem/documento
  'GET /api/v1/ImagensDocumentos/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        codigo: Number(codigo),
        pacienteCodigo: 101,
        nomeArquivo: Number(codigo) === 9001 ? 'rx-torax.png' : 'exame-lab.pdf',
        tipo: Number(codigo) === 9001 ? 'Imagem' : 'PDF',
        dataUpload: '10/11/2025',
        tamanhoBytes: 345678,
        conteudoBase64: 'iVBORw0KGgoAAAANSUhEUgAA...', // mock
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                                 IMPRESSOS                                  */
  /* -------------------------------------------------------------------------- */

  // Listar impressos de um paciente
  'GET /api/v1/Impressos/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        pacienteCodigo: Number(codigo),
        impressos: [
          {
            codigo: 7001,
            tipo: 'Receita',
            descricao: 'Receita de medicamentos',
            data: '10/11/2025',
          },
          {
            codigo: 7002,
            tipo: 'Solicitação de exame',
            descricao: 'Solicitação de hemograma completo',
            data: '12/11/2025',
          },
        ],
      },
    };
  },

  // Detalhar impresso
  'GET /api/v1/Impressos/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        codigo: Number(codigo),
        paciente: {
          codigo: 101,
          nome: 'Maria de Souza',
        },
        tipo: 'Receita',
        data: '10/11/2025',
        conteudo: 'Tomar 1 comprimido de paracetamol 750mg de 8/8h por 3 dias.',
        profissional: {
          codigo: 200,
          nome: 'Dra. Ana Paula',
          conselho: 'CRM',
          numeroConselho: '123456-SP',
        },
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                              LOCAIS PRODOCTOR                              */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/LocaisProDoctor': (req) => {
    const body: any = req.body || {};
    const nome = body?.nome ?? '';

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        total: 2,
        itens: [
          {
            codigo: 1,
            nome: nome || 'Clínica Central',
            cnpj: '12.345.678/0001-99',
            telefone: '(11) 4002-8922',
            endereco: {
              logradouro: 'Av. Paulista',
              numero: '1000',
              bairro: 'Bela Vista',
              cidade: 'São Paulo',
              uf: 'SP',
              cep: '01310-100',
            },
          },
          {
            codigo: 2,
            nome: 'Clínica Unidade 2',
            cnpj: '98.765.432/0001-99',
            telefone: '(11) 4090-1234',
            endereco: {
              logradouro: 'Rua das Flores',
              numero: '123',
              bairro: 'Centro',
              cidade: 'São Paulo',
              uf: 'SP',
              cep: '01001-000',
            },
          },
        ],
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                                  PACIENTES                                 */
  /* -------------------------------------------------------------------------- */

  // Buscar pacientes
  'POST /api/v1/Pacientes': (req) => {
    const body: any = req.body || {};
    const nomeFiltro = body?.nome ?? '';

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        total: 2,
        itens: [
          {
            codigo: 101,
            nome: nomeFiltro || 'Maria de Souza',
            nascimento: '1991-08-10',
            sexo: 'F',
            cpf: '12345678900',
            telefonePrincipal: '(11) 99999-0001',
            email: 'maria.souza@example.com',
            cidade: 'São Paulo',
            uf: 'SP',
            ativo: true,
          },
          {
            codigo: 102,
            nome: 'Carlos Pereira',
            nascimento: '1985-04-22',
            sexo: 'M',
            cpf: '98765432100',
            telefonePrincipal: '(11) 99999-0002',
            email: 'carlos.pereira@example.com',
            cidade: 'São Paulo',
            uf: 'SP',
            ativo: true,
          },
        ],
      },
    };
  },

  // Detalhar paciente
  'GET /api/v1/Pacientes/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const codigoNum = Number(codigo) || 101;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        codigo: codigoNum,
        nome: codigoNum === 102 ? 'Carlos Pereira' : 'Maria de Souza',
        nascimento: '1991-08-10',
        sexo: 'F',
        cpf: '12345678900',
        rg: '12.345.678-9',
        email: 'paciente@example.com',
        telefones: [
          { tipo: 'Celular', numero: '(11) 99999-0001' },
          { tipo: 'Recado', numero: '(11) 4002-8922' },
        ],
        endereco: {
          logradouro: 'Rua das Flores',
          numero: '123',
          complemento: 'Apto 12',
          bairro: 'Centro',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01001-000',
        },
        estadoCivil: {
          codigo: 2,
          descricao: 'Casado(a)',
        },
        escolaridade: {
          codigo: 6,
          descricao: 'Superior completo',
        },
        responsavelLegal: null,
        convenios: [
          {
            codigo: 501,
            nome: 'Unimed',
            carteira: 'ABC12345',
            plano: 'Nacional',
            validadeCarteira: '2026-12-31',
          },
        ],
        observacoes: 'Paciente com histórico de hipertensão.',
        ativo: true,
      },
    };
  },

  // Inserir paciente
  'POST /api/v1/Pacientes/Inserir': (req) => {
    const body: any = req.body || {};
    const { nome, cpf, email } = body;

    return {
      sucesso: true,
      mensagem: 'Paciente inserido com sucesso (mock).',
      dados: {
        codigo: 9999,
        nome: nome ?? 'Novo Paciente',
        cpf: cpf ?? '00000000000',
        email: email ?? 'novo.paciente@example.com',
        nascimento: body?.nascimento ?? '2000-01-01',
        sexo: body?.sexo ?? 'F',
        ativo: true,
      },
    };
  },

  // Alterar paciente
  'PUT /api/v1/Pacientes/Alterar': (req) => {
    const body: any = req.body || {};

    return {
      sucesso: true,
      mensagem: 'Paciente alterado com sucesso (mock).',
      dados: {
        codigo: body?.codigo ?? 101,
        nome: body?.nome ?? 'Paciente Alterado',
        cpf: body?.cpf ?? '12345678900',
        email: body?.email ?? 'paciente.alterado@example.com',
        ativo: body?.ativo ?? true,
      },
    };
  },

  // Excluir paciente
  'DELETE /api/v1/Pacientes/Excluir/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagem: `Paciente ${codigo} excluído com sucesso (mock).`,
      dados: null,
    };
  },

  // Aniversariantes
  'POST /api/v1/Pacientes/Aniversariantes': (req) => {
    const body: any = req.body || {};
    const { dataInicial, dataFinal } = body;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        periodo: {
          dataInicial: dataInicial ?? '20/11',
          dataFinal: dataFinal ?? '26/11',
        },
        aniversariantes: [
          {
            codigo: 101,
            nome: 'Maria de Souza',
            dataNascimento: '1991-11-22',
            telefone: '(11) 99999-0001',
          },
          {
            codigo: 103,
            nome: 'João Henrique',
            dataNascimento: '1988-11-23',
            telefone: '(11) 99999-0003',
          },
        ],
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                               PROCEDIMENTOS                                */
  /* -------------------------------------------------------------------------- */

  // Buscar procedimentos
  'POST /api/v1/Procedimentos': (req) => {
    const body: any = req.body || {};
    const descricao = body?.descricao ?? 'Consulta';

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        total: 2,
        itens: [
          {
            tabela: { codigo: 1, nome: 'AMB' },
            codigo: '10101012',
            descricao,
            valor: 250.0,
            duracaoMinutos: 30,
          },
          {
            tabela: { codigo: 1, nome: 'AMB' },
            codigo: '10101013',
            descricao: 'Retorno',
            valor: 150.0,
            duracaoMinutos: 20,
          },
        ],
      },
    };
  },

  // Detalhar procedimento
  'GET /api/v1/Procedimentos/Detalhar/{tabela}/{codigo}': (req) => {
    const { tabela, codigo } = req.params;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        tabela: {
          codigo: Number(tabela),
          nome: Number(tabela) === 1 ? 'AMB' : 'Outra Tabela',
        },
        codigo,
        descricao: 'Consulta médica',
        valor: 250.0,
        duracaoMinutos: 30,
        tipo: 'Consulta',
        exigeAutorizacao: false,
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                          TABELAS DE PROCEDIMENTOS                          */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/TabelasProcedimentos': () => ({
    sucesso: true,
    mensagem: null,
    dados: {
      total: 2,
      itens: [
        {
          codigo: 1,
          nome: 'AMB',
          descricao: 'Tabela AMB padrão',
          versao: '2025',
        },
        {
          codigo: 2,
          nome: 'CBHPM',
          descricao: 'Tabela CBHPM',
          versao: '2024',
        },
      ],
    },
  }),

  /* -------------------------------------------------------------------------- */
  /*                                  USUÁRIOS                                  */
  /* -------------------------------------------------------------------------- */

  // Buscar usuários
  'POST /api/v1/Usuarios': (req) => {
    const body: any = req.body || {};
    const nome = body?.nome ?? '';

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        total: 2,
        itens: [
          {
            codigo: 100,
            nome: nome || 'Dr. João da Silva',
            login: 'joao.silva',
            email: 'joao.silva@clinica.com',
            ativo: true,
            perfil: 'Médico',
          },
          {
            codigo: 101,
            nome: 'Dra. Ana Paula',
            login: 'ana.paula',
            email: 'ana.paula@clinica.com',
            ativo: true,
            perfil: 'Médica',
          },
        ],
      },
    };
  },

  // Detalhar usuário
  'GET /api/v1/Usuarios/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const codigoNum = Number(codigo) || 100;

    return {
      sucesso: true,
      mensagem: null,
      dados: {
        codigo: codigoNum,
        nome: codigoNum === 101 ? 'Dra. Ana Paula' : 'Dr. João da Silva',
        login: codigoNum === 101 ? 'ana.paula' : 'joao.silva',
        email: codigoNum === 101 ? 'ana.paula@clinica.com' : 'joao.silva@clinica.com',
        ativo: true,
        perfil: 'Médico',
        crm: codigoNum === 101 ? '654321-SP' : '123456-SP',
        especialidades: [
          { codigo: 10, descricao: 'Clínico Geral' },
          { codigo: 11, descricao: 'Cardiologia' },
        ],
      },
    };
  },

  ...additionalRealisticMocks,
};
