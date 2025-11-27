import { Request } from 'express';
import { additionalRealisticMocks } from './additionnal-mocks';

type MockFn = (req: Request) => any;

/**
 * In-memory storage para agendamentos criados
 * Permite simular confirmação e outras operações
 */
export const inMemoryAppointments: Map<string, any> = new Map();

/**
 * Gerador de código único para agendamentos
 */
let appointmentCodeCounter = 10000;
export const generateAppointmentCode = (): number => ++appointmentCodeCounter;

/**
 * Gera uma chave única para identificar um agendamento
 */
export const generateAppointmentKey = (
  localProDoctorCodigo: number,
  usuarioCodigo: number,
  data: string,
  hora: string,
): string => {
  return `${localProDoctorCodigo}-${usuarioCodigo}-${data.replace(/\//g, '')}-${hora.replace(':', '')}`;
};

/**
 * Mocks realistas para a API ProDoctor aberta.
 * Chave: `${METHOD} ${swaggerRoute}`
 * Exemplo: "POST /api/v1/Pacientes"
 *
 * IMPORTANTE: A estrutura de resposta segue o padrão da API oficial ProDoctor:
 * - sucesso: boolean
 * - mensagens: string[]
 * - payload: { ... } (contém os dados específicos de cada endpoint)
 */
export const realisticMocks: Record<string, MockFn> = {
  /* -------------------------------------------------------------------------- */
  /*                                   AGENDA                                   */
  /* -------------------------------------------------------------------------- */

  // Listar agendamentos do dia para um usuário
  'POST /api/v1/Agenda/Listar': (req) => {
    const { usuario, data, localProDoctor } = (req.body || {}) as any;

    // Buscar agendamentos in-memory que correspondem aos critérios
    const agendamentosInMemory: any[] = [];
    inMemoryAppointments.forEach((appointment) => {
      if (
        (!usuario?.codigo || appointment.usuario?.codigo === usuario.codigo) &&
        (!data || appointment.data === data) &&
        (!localProDoctor?.codigo || appointment.localProDoctor?.codigo === localProDoctor.codigo)
      ) {
        agendamentosInMemory.push({
          hora: appointment.hora,
          estadoAgendaConsulta: appointment.estadoAgendaConsulta || {
            codigo: 1,
            descricao: 'Agendado',
          },
          paciente: appointment.paciente,
          convenio: appointment.convenio,
          procedimentoMedico: appointment.procedimentoMedico,
          complemento: appointment.complemento,
          tipoAgendamento: appointment.tipoAgendamento,
        });
      }
    });

    // Dados mock fixos + in-memory
    const consultasMock = [
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
    ];

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        diaAgendaConsulta: {
          data: data ?? '20/11/2025',
          usuario: {
            codigo: usuario?.codigo ?? 100,
            nome: 'Dr. João da Silva',
          },
          localProDoctor: localProDoctor || {
            codigo: 1,
            nome: 'Clínica Central',
          },
          agendamentos: [...consultasMock, ...agendamentosInMemory],
          totalAgendamentos: consultasMock.length + agendamentosInMemory.length,
        },
      },
    };
  },

  // Buscar agendamentos de um paciente
  'POST /api/v1/Agenda/Buscar': (req) => {
    const { paciente, periodo } = (req.body || {}) as any;

    // Buscar agendamentos in-memory para o paciente
    const agendamentosInMemory: any[] = [];
    inMemoryAppointments.forEach((appointment, key) => {
      if (appointment.paciente?.codigo === paciente?.codigo) {
        agendamentosInMemory.push({
          codigo: appointment.codigo,
          data: appointment.data,
          hora: appointment.hora,
          localProDoctor: appointment.localProDoctor,
          usuario: appointment.usuario,
          estadoAgendaConsulta: appointment.estadoAgendaConsulta || {
            codigo: 1,
            descricao: 'Agendado',
          },
          convenio: appointment.convenio,
          procedimentoMedico: appointment.procedimentoMedico,
          tipoAgendamento: appointment.tipoAgendamento,
          complemento: appointment.complemento,
        });
      }
    });

    // Dados mock fixos
    const agendamentosMock = [
      {
        codigo: 2001,
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
        codigo: 2002,
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
          atendido: true,
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
    ];

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        agendamentos: [...agendamentosMock, ...agendamentosInMemory],
      },
    };
  },

  // =========================================================================
  // INSERIR AGENDAMENTO - ROTA PRINCIPAL QUE ESTAVA COM PROBLEMA
  // =========================================================================
  'POST /api/v1/Agenda/Inserir': (req) => {
    const body: any = req.body || {};
    const agendamento = body.agendamento || {};
    const paciente = agendamento.paciente || {};

    // Gera código único para o agendamento
    const codigo = generateAppointmentCode();

    // Monta o objeto do agendamento
    const localProDoctor = agendamento.localProDoctor || {
      codigo: 1,
      nome: 'Clínica Central',
    };
    const usuario = agendamento.usuario || {
      codigo: 100,
      nome: 'Dr. João da Silva',
    };
    const data = agendamento.data ?? '20/11/2025';
    const hora = agendamento.hora ?? '14:00';

    // Cria objeto completo do agendamento para armazenar in-memory
    const agendamentoCriado = {
      codigo,
      localProDoctor,
      usuario,
      data,
      hora,
      paciente: {
        codigo: paciente.codigo ?? 9999,
        nome: paciente.nome ?? 'Novo Paciente',
        nascimento: paciente.nascimento ?? '1995-01-01',
      },
      convenio: agendamento.convenio,
      procedimentoMedico: agendamento.procedimentoMedico,
      tipoAgendamento: agendamento.tipoAgendamento,
      complemento: agendamento.complemento ?? 'Agendamento gerado pela API mock',
      teleconsulta: agendamento.teleconsulta ?? null,
      estadoAgendaConsulta: {
        codigo: 1,
        descricao: 'Agendado',
        agendado: true,
      },
      criadoEm: new Date().toISOString(),
    };

    // Armazena in-memory para posterior consulta/confirmação
    const key = generateAppointmentKey(localProDoctor.codigo, usuario.codigo, data, hora);
    inMemoryAppointments.set(key, agendamentoCriado);

    // Log para debug
    console.log(`[FAKE-API] Agendamento criado com código ${codigo}, key: ${key}`);
    console.log(`[FAKE-API] Total de agendamentos in-memory: ${inMemoryAppointments.size}`);

    // Retorna no formato correto esperado pelo service
    // Conforme swagger: PDResponseAgendamentoAgendaInsertViewModel
    return {
      sucesso: true,
      mensagens: ['Agendamento inserido com sucesso'],
      payload: {
        agendamento: {
          codigo, // Adiciona o código gerado
          localProDoctor,
          usuario,
          data,
          hora,
          paciente: agendamentoCriado.paciente,
          complemento: agendamentoCriado.complemento,
          teleconsulta: agendamentoCriado.teleconsulta,
        },
      },
    };
  },

  // Desmarcar agendamento
  'PATCH /api/v1/Agenda/Desmarcar': (req) => {
    const { data, hora, usuario, localProDoctor, agendamentoID } = (req.body || {}) as any;

    // Se veio agendamentoID, usa esses dados
    const dataFinal = agendamentoID?.data ?? data ?? '20/11/2025';
    const horaFinal = agendamentoID?.hora ?? hora ?? '10:00';
    const usuarioFinal = agendamentoID?.usuario ?? usuario ?? { codigo: 100 };
    const localFinal = agendamentoID?.localProDoctor ?? localProDoctor ?? { codigo: 1 };

    // Remove do in-memory se existir
    const key = generateAppointmentKey(localFinal.codigo, usuarioFinal.codigo, dataFinal, horaFinal);
    const removed = inMemoryAppointments.delete(key);

    console.log(`[FAKE-API] Agendamento desmarcado, key: ${key}, encontrado: ${removed}`);

    return {
      sucesso: true,
      mensagens: ['Agendamento desmarcado com sucesso (mock).'],
      payload: {
        sucesso: true,
      },
    };
  },

  // Alterar agendamento
  'PUT /api/v1/Agenda/Alterar': (req) => {
    const { agendamentoOrigem, agendamento } = (req.body || {}) as any;

    // Remove o agendamento original do in-memory
    if (agendamentoOrigem) {
      const keyOrigem = generateAppointmentKey(
        agendamentoOrigem.localProDoctor?.codigo ?? 1,
        agendamentoOrigem.usuario?.codigo ?? 100,
        agendamentoOrigem.data ?? '20/11/2025',
        agendamentoOrigem.hora ?? '09:00',
      );
      inMemoryAppointments.delete(keyOrigem);
    }

    // Adiciona o novo agendamento
    if (agendamento) {
      const codigo = generateAppointmentCode();
      const keyNovo = generateAppointmentKey(
        agendamento.localProDoctor?.codigo ?? 1,
        agendamento.usuario?.codigo ?? 100,
        agendamento.data ?? '20/11/2025',
        agendamento.hora ?? '10:00',
      );

      const agendamentoAtualizado = {
        codigo,
        ...agendamento,
        estadoAgendaConsulta: {
          codigo: 1,
          descricao: 'Agendado',
          agendado: true,
        },
      };

      inMemoryAppointments.set(keyNovo, agendamentoAtualizado);
    }

    return {
      sucesso: true,
      mensagens: ['Agendamento alterado com sucesso (mock).'],
      payload: {
        agendamento: {
          codigo: generateAppointmentCode(),
          localProDoctor: agendamento?.localProDoctor || { codigo: 1, nome: 'Clínica Central' },
          usuario: agendamento?.usuario || { codigo: 100, nome: 'Dr. João da Silva' },
          data: agendamento?.data ?? '20/11/2025',
          hora: agendamento?.hora ?? '10:00',
          paciente: agendamento?.paciente,
          complemento: agendamento?.complemento,
        },
      },
    };
  },

  // Excluir agendamento
  'DELETE /api/v1/Agenda/Excluir': (req) => {
    const body: any = req.body || {};

    if (body.localProDoctor && body.usuario && body.data && body.hora) {
      const key = generateAppointmentKey(body.localProDoctor.codigo, body.usuario.codigo, body.data, body.hora);
      inMemoryAppointments.delete(key);
    }

    return {
      sucesso: true,
      mensagens: ['Agendamento excluído com sucesso (mock).'],
      payload: {
        sucesso: true,
      },
    };
  },

  // Detalhar agendamento
  'POST /api/v1/Agenda/Detalhar': (req) => {
    const { data, hora, localProDoctor, usuario, codigo } = (req.body || {}) as any;

    // Primeiro tenta buscar in-memory
    if (localProDoctor?.codigo && usuario?.codigo && data && hora) {
      const key = generateAppointmentKey(localProDoctor.codigo, usuario.codigo, data, hora);
      const agendamento = inMemoryAppointments.get(key);

      if (agendamento) {
        return {
          sucesso: true,
          mensagens: [],
          payload: {
            agendamento: {
              ...agendamento,
              telefones: [{ tipo: 'Celular', numero: '(11) 99999-0001' }],
              email: 'paciente@example.com',
            },
          },
        };
      }
    }

    // Se não encontrou in-memory, retorna dados mock
    return {
      sucesso: true,
      mensagens: [],
      payload: {
        agendamento: {
          codigo: codigo ?? 2001,
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
            agendado: true,
          },
        },
      },
    };
  },

  // Buscar por status/tipo
  'POST /api/v1/Agenda/BuscarPorStatusTipo': (req) => {
    const body: any = req.body || {};
    const { estadoAgendaConsulta, tipoAgendamento } = body;

    // Buscar agendamentos in-memory filtrados por status
    const agendamentosInMemory: any[] = [];
    inMemoryAppointments.forEach((appointment) => {
      let match = true;

      if (estadoAgendaConsulta?.confirmado && !appointment.estadoAgendaConsulta?.confirmado) {
        match = false;
      }
      if (estadoAgendaConsulta?.agendado && !appointment.estadoAgendaConsulta?.agendado) {
        match = false;
      }

      if (match) {
        agendamentosInMemory.push({
          codigo: appointment.codigo,
          data: appointment.data,
          hora: appointment.hora,
          localProDoctor: appointment.localProDoctor,
          usuario: appointment.usuario,
          paciente: appointment.paciente,
          estadoAgendaConsulta: appointment.estadoAgendaConsulta,
        });
      }
    });

    // Dados mock fixos
    const agendamentosMock = [
      {
        codigo: 3001,
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
          agendado: true,
        },
      },
      {
        codigo: 3002,
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
          codigo: 2,
          descricao: 'Confirmado',
          confirmado: true,
        },
      },
    ];

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        agendamentos: [...agendamentosMock, ...agendamentosInMemory],
      },
    };
  },

  // =========================================================================
  // ALTERAR STATUS - USADO PARA CONFIRMAR AGENDAMENTO
  // =========================================================================
  'PATCH /api/v1/Agenda/AlterarStatus': (req) => {
    const { estadoAgendaConsulta, agendamentoID } = (req.body || {}) as any;

    // Tenta encontrar o agendamento in-memory e atualizar o status
    if (
      agendamentoID?.localProDoctor?.codigo &&
      agendamentoID?.usuario?.codigo &&
      agendamentoID?.data &&
      agendamentoID?.hora
    ) {
      const key = generateAppointmentKey(
        agendamentoID.localProDoctor.codigo,
        agendamentoID.usuario.codigo,
        agendamentoID.data,
        agendamentoID.hora,
      );

      const agendamento = inMemoryAppointments.get(key);
      if (agendamento) {
        // Atualiza o status do agendamento
        agendamento.estadoAgendaConsulta = {
          ...agendamento.estadoAgendaConsulta,
          ...estadoAgendaConsulta,
          descricao: estadoAgendaConsulta?.confirmado
            ? 'Confirmado'
            : estadoAgendaConsulta?.atendido
              ? 'Atendido'
              : estadoAgendaConsulta?.faltou
                ? 'Faltou'
                : estadoAgendaConsulta?.desmarcado
                  ? 'Desmarcado'
                  : 'Agendado',
        };

        inMemoryAppointments.set(key, agendamento);

        console.log(
          `[FAKE-API] Status do agendamento atualizado, key: ${key}, novo status:`,
          agendamento.estadoAgendaConsulta,
        );

        return {
          sucesso: true,
          mensagens: ['Status alterado com sucesso (mock).'],
          payload: {
            agendamento: {
              codigo: agendamento.codigo,
              estadoAgendaConsulta: agendamento.estadoAgendaConsulta,
            },
          },
        };
      }
    }

    // Se não encontrou in-memory, retorna resposta mock padrão
    return {
      sucesso: true,
      mensagens: ['Status alterado com sucesso (mock).'],
      payload: {
        agendamento: {
          codigo: agendamentoID?.codigo ?? 2001,
          estadoAgendaConsulta: estadoAgendaConsulta || {
            codigo: 2,
            descricao: 'Confirmado',
            confirmado: true,
          },
        },
      },
    };
  },

  // =========================================================================
  // ALTERAR ESTADO (endpoint alternativo)
  // =========================================================================
  'PATCH /api/v1/Agenda/AlterarEstado': (req) => {
    // Redireciona para AlterarStatus
    return realisticMocks['PATCH /api/v1/Agenda/AlterarStatus'](req);
  },

  /* -------------------------------------------------------------------------- */
  /*                        ANAMNESES E EVOLUÇÕES                               */
  /* -------------------------------------------------------------------------- */

  // Listar anamneses/evoluções de um paciente
  'GET /api/v1/AnamneseEvolucao/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
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
            resumo: 'Melhora do quadro após tratamento...',
          },
        ],
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                                 PACIENTES                                  */
  /* -------------------------------------------------------------------------- */

  // Buscar paciente
  'POST /api/v1/Paciente/Buscar': (req) => {
    const { cpf, nome, codigo } = (req.body || {}) as any;

    // Dados mock de pacientes
    const pacientesMock = [
      {
        codigo: 101,
        nome: 'Maria de Souza',
        cpf: '12345678900',
        dataNascimento: '10/08/1991',
        sexo: { codigo: 2, nome: 'Feminino' },
        email: 'maria.souza@example.com',
        telefone: { ddd: '11', numero: '999990001', tipo: { codigo: 3, nome: 'Celular' } },
      },
      {
        codigo: 102,
        nome: 'Carlos Pereira',
        cpf: '98765432100',
        dataNascimento: '22/04/1985',
        sexo: { codigo: 1, nome: 'Masculino' },
        email: 'carlos.pereira@example.com',
        telefone: { ddd: '11', numero: '999990002', tipo: { codigo: 3, nome: 'Celular' } },
      },
    ];

    let pacienteEncontrado = null;

    if (cpf) {
      pacienteEncontrado = pacientesMock.find((p) => p.cpf === cpf.replace(/\D/g, ''));
    } else if (codigo) {
      pacienteEncontrado = pacientesMock.find((p) => p.codigo === codigo);
    } else if (nome) {
      pacienteEncontrado = pacientesMock.find((p) => p.nome.toLowerCase().includes(nome.toLowerCase()));
    }

    if (!pacienteEncontrado) {
      return {
        sucesso: false,
        mensagens: ['Paciente não encontrado'],
        payload: { paciente: null },
      };
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: { paciente: pacienteEncontrado },
    };
  },

  // Detalhar paciente
  'GET /api/v1/Paciente/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        paciente: {
          codigo: Number(codigo),
          nome: Number(codigo) === 102 ? 'Carlos Pereira' : 'Maria de Souza',
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
          convenios: [
            {
              codigo: 501,
              nome: 'Unimed',
              carteira: 'ABC12345',
              plano: 'Nacional',
              validadeCarteira: '2026-12-31',
            },
          ],
          ativo: true,
        },
      },
    };
  },

  // Inserir paciente
  'POST /api/v1/Pacientes/Inserir': (req) => {
    const body: any = req.body || {};
    const { paciente } = body;

    return {
      sucesso: true,
      mensagens: ['Paciente inserido com sucesso (mock).'],
      payload: {
        paciente: {
          codigo: 9999,
          nome: paciente?.nome ?? 'Novo Paciente',
          cpf: paciente?.cpf ?? '00000000000',
          email: paciente?.email ?? 'novo.paciente@example.com',
          dataNascimento: paciente?.dataNascimento ?? '01/01/2000',
          sexo: paciente?.sexo,
          ativo: true,
        },
      },
    };
  },

  // Alterar paciente
  'PUT /api/v1/Pacientes/Alterar': (req) => {
    const body: any = req.body || {};
    const { paciente } = body;

    return {
      sucesso: true,
      mensagens: ['Paciente alterado com sucesso (mock).'],
      payload: {
        paciente: {
          codigo: paciente?.codigo ?? 101,
          nome: paciente?.nome ?? 'Paciente Alterado',
          cpf: paciente?.cpf ?? '12345678900',
          email: paciente?.email ?? 'paciente.alterado@example.com',
          ativo: paciente?.ativo ?? true,
        },
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                                 USUÁRIOS                                   */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Usuario/Listar': (req) => {
    const { quantidade } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: 3,
        itens: [
          { codigo: 100, nome: 'Dr. João da Silva', ativo: true },
          { codigo: 101, nome: 'Dra. Ana Paula', ativo: true },
          { codigo: 102, nome: 'Dr. Pedro Santos', ativo: true },
        ].slice(0, quantidade || 10),
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                              LOCAL PRODOCTOR                               */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/LocalProDoctor/Listar': (req) => {
    const { quantidade } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: 2,
        itens: [
          { codigo: 1, nome: 'Clínica Central', ativo: true },
          { codigo: 2, nome: 'Clínica Unidade 2', ativo: true },
        ].slice(0, quantidade || 10),
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                                 CONVÊNIOS                                  */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Convenio/Listar': (req) => {
    const { quantidade } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: 3,
        itens: [
          { codigo: 501, nome: 'Unimed', ativo: true },
          { codigo: 502, nome: 'Bradesco Saúde', ativo: true },
          { codigo: 503, nome: 'SulAmérica', ativo: true },
        ].slice(0, quantidade || 10),
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                              PROCEDIMENTOS                                 */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Procedimentos': (req) => {
    const { descricao, tabela, quantidade } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: 3,
        itens: [
          {
            tabela: { codigo: 22, nome: 'TUSS' },
            codigo: '40801020',
            descricao: 'Hemograma completo',
            valor: 35.0,
          },
          {
            tabela: { codigo: 1, nome: 'AMB' },
            codigo: '10101012',
            descricao: 'Consulta médica',
            valor: 250.0,
          },
          {
            tabela: { codigo: 1, nome: 'AMB' },
            codigo: '10101013',
            descricao: 'Retorno de consulta',
            valor: 150.0,
          },
        ].slice(0, quantidade || 10),
      },
    };
  },

  'POST /api/v1/TabelasProcedimentos': (req) => {
    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: 2,
        itens: [
          { codigo: 1, nome: 'AMB' },
          { codigo: 22, nome: 'TUSS' },
        ],
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                       IMAGENS E DOCUMENTOS                                 */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/ImagensDocumentos/Inserir': (req) => {
    const body: any = req.body || {};
    const { pacienteCodigo, nomeArquivo, tipo } = body;

    return {
      sucesso: true,
      mensagens: ['Imagem/Documento inserido com sucesso (mock).'],
      payload: {
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

  'GET /api/v1/ImagensDocumentos/{codigo}': (req) => {
    const { codigo } = req.params;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
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
  'POST /api/v1/LocaisProDoctor': (req) => {
    const body: any = req.body || {};
    const termo = body?.termo ?? '';
    const campo = body?.campo ?? 0; // 0=Nome, 1=CPF/CNPJ
    const pagina = body?.pagina ?? 1;
    const quantidade = body?.quantidade ?? 5000;
    const somenteAtivos = body?.somenteAtivos ?? true;

    const locais = [
      {
        codigo: 1,
        nome: 'Clínica Central',
        cnpj: '12345678000199',
        telefone: { ddd: '11', numero: '40028922', tipo: { codigo: 2, nome: 'Comercial' } },
        endereco: {
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: 'Sala 101',
          bairro: 'Bela Vista',
          cidade: { codigo: 1, nome: 'São Paulo' },
          estado: { codigo: 35, nome: 'São Paulo', sigla: 'SP' },
          cep: '01310100',
        },
        ativo: true,
      },
      {
        codigo: 2,
        nome: 'Clínica Unidade 2',
        cnpj: '98765432000188',
        telefone: { ddd: '11', numero: '40901234', tipo: { codigo: 2, nome: 'Comercial' } },
        endereco: {
          logradouro: 'Rua das Flores',
          numero: '123',
          complemento: null,
          bairro: 'Centro',
          cidade: { codigo: 1, nome: 'São Paulo' },
          estado: { codigo: 35, nome: 'São Paulo', sigla: 'SP' },
          cep: '01001000',
        },
        ativo: true,
      },
      {
        codigo: 3,
        nome: 'Clínica Zona Sul',
        cnpj: '11222333000177',
        telefone: { ddd: '11', numero: '55551234', tipo: { codigo: 2, nome: 'Comercial' } },
        endereco: {
          logradouro: 'Av. Santo Amaro',
          numero: '500',
          complemento: 'Térreo',
          bairro: 'Santo Amaro',
          cidade: { codigo: 1, nome: 'São Paulo' },
          estado: { codigo: 35, nome: 'São Paulo', sigla: 'SP' },
          cep: '04506000',
        },
        ativo: false,
      },
    ];

    let resultado = somenteAtivos ? locais.filter((l) => l.ativo) : [...locais];

    if (termo) {
      const termoLimpo = termo.replace(/\D/g, '');
      const termoLower = termo.toLowerCase();

      resultado = resultado.filter((l) => {
        switch (campo) {
          case 0: // Nome
            return l.nome.toLowerCase().includes(termoLower);
          case 1: // CPF/CNPJ
            return l.cnpj.includes(termoLimpo);
          default:
            return true;
        }
      });
    }

    const inicio = (pagina - 1) * quantidade;
    const locaisPaginados = resultado.slice(inicio, inicio + quantidade);

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        locaisProDoctor: locaisPaginados,
      },
    };
  },

  // Detalhar local ProDoctor
  'GET /api/v1/LocaisProDoctor/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const codigoNum = Number(codigo);

    const locais: Record<number, any> = {
      1: {
        codigo: 1,
        nome: 'Clínica Central',
        cnpj: '12345678000199',
        inscricaoEstadual: '123456789',
        inscricaoMunicipal: '987654321',
        telefone: { ddd: '11', numero: '40028922', tipo: { codigo: 2, nome: 'Comercial' } },
        telefone2: { ddd: '11', numero: '40028923', tipo: { codigo: 2, nome: 'Comercial' } },
        email: 'contato@clinicacentral.com.br',
        site: 'www.clinicacentral.com.br',
        endereco: {
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: 'Sala 101',
          bairro: 'Bela Vista',
          cidade: { codigo: 1, nome: 'São Paulo' },
          estado: { codigo: 35, nome: 'São Paulo', sigla: 'SP' },
          cep: '01310100',
        },
        horarioFuncionamento: 'Segunda a Sexta, 08:00 às 18:00',
        ativo: true,
      },
      2: {
        codigo: 2,
        nome: 'Clínica Unidade 2',
        cnpj: '98765432000188',
        inscricaoEstadual: '234567890',
        inscricaoMunicipal: '876543210',
        telefone: { ddd: '11', numero: '40901234', tipo: { codigo: 2, nome: 'Comercial' } },
        email: 'contato@clinicaunidade2.com.br',
        endereco: {
          logradouro: 'Rua das Flores',
          numero: '123',
          complemento: null,
          bairro: 'Centro',
          cidade: { codigo: 1, nome: 'São Paulo' },
          estado: { codigo: 35, nome: 'São Paulo', sigla: 'SP' },
          cep: '01001000',
        },
        horarioFuncionamento: 'Segunda a Sábado, 07:00 às 20:00',
        ativo: true,
      },
    };

    const local = locais[codigoNum];

    if (!local) {
      return {
        sucesso: false,
        mensagens: ['Local ProDoctor não encontrado'],
        payload: null,
      };
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        localProDoctor: local,
      },
    };
  },

  // Adiciona os mocks adicionais
  ...additionalRealisticMocks,
};

/**
 * Funções utilitárias para testes e debugging
 */
export const mockUtils = {
  /**
   * Lista todos os agendamentos in-memory
   */
  listAllAppointments: () => {
    const appointments: any[] = [];
    inMemoryAppointments.forEach((value, key) => {
      appointments.push({ key, ...value });
    });
    return appointments;
  },

  /**
   * Limpa todos os agendamentos in-memory
   */
  clearAllAppointments: () => {
    inMemoryAppointments.clear();
    appointmentCodeCounter = 10000;
  },

  /**
   * Busca um agendamento por key
   */
  getAppointmentByKey: (key: string) => {
    return inMemoryAppointments.get(key);
  },

  /**
   * Adiciona um agendamento manualmente
   */
  addAppointment: (appointment: any) => {
    const key = generateAppointmentKey(
      appointment.localProDoctor?.codigo ?? 1,
      appointment.usuario?.codigo ?? 100,
      appointment.data,
      appointment.hora,
    );
    appointment.codigo = appointment.codigo ?? generateAppointmentCode();
    inMemoryAppointments.set(key, appointment);
    return key;
  },
};
