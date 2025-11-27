import { Request } from 'express';
import { inMemoryAppointments, generateAppointmentKey, generateAppointmentCode } from './db-mocks';

type MockFn = (req: Request) => any;

/**
 * Dados mock para pacientes
 */
const mockPatients = [
  {
    codigo: 101,
    nome: 'Maria de Souza',
    cpf: '12345678900',
    dataNascimento: '10/08/1991',
    nascimento: '1991-08-10',
    sexo: { codigo: 2, nome: 'Feminino' },
    email: 'maria.souza@example.com',
    telefone: { ddd: '11', numero: '999990001', tipo: { codigo: 3, nome: 'Celular' } },
    telefones: [{ tipo: 'Celular', numero: '(11) 99999-0001' }],
  },
  {
    codigo: 102,
    nome: 'Carlos Pereira',
    cpf: '98765432100',
    dataNascimento: '22/04/1985',
    nascimento: '1985-04-22',
    sexo: { codigo: 1, nome: 'Masculino' },
    email: 'carlos.pereira@example.com',
    telefone: { ddd: '11', numero: '999990002', tipo: { codigo: 3, nome: 'Celular' } },
    telefones: [{ tipo: 'Celular', numero: '(11) 99999-0002' }],
  },
  {
    codigo: 103,
    nome: 'Ana Santos',
    cpf: '11122233344',
    dataNascimento: '15/03/1990',
    nascimento: '1990-03-15',
    sexo: { codigo: 2, nome: 'Feminino' },
    email: 'ana.santos@example.com',
    telefone: { ddd: '21', numero: '988887777', tipo: { codigo: 3, nome: 'Celular' } },
    telefones: [{ tipo: 'Celular', numero: '(21) 98888-7777' }],
  },
];

/**
 * Dados mock para médicos/usuários
 */
const mockDoctors = [
  {
    codigo: 100,
    nome: 'Dr. João da Silva',
    especialidade: { codigo: 1, nome: 'Clínica Geral' },
    conselho: 'CRM',
    numeroConselho: '12345-SP',
    ativo: true,
  },
  {
    codigo: 101,
    nome: 'Dra. Ana Paula',
    especialidade: { codigo: 2, nome: 'Cardiologia' },
    conselho: 'CRM',
    numeroConselho: '54321-SP',
    ativo: true,
  },
  {
    codigo: 102,
    nome: 'Dr. Pedro Santos',
    especialidade: { codigo: 3, nome: 'Ortopedia' },
    conselho: 'CRM',
    numeroConselho: '67890-SP',
    ativo: true,
  },
  {
    codigo: 103,
    nome: 'Dra. Carla Lima',
    especialidade: { codigo: 4, nome: 'Dermatologia' },
    conselho: 'CRM',
    numeroConselho: '11111-SP',
    ativo: true,
  },
];

/**
 * Dados mock para convênios
 */
const mockInsurances = [
  { codigo: 501, nome: 'Unimed', ativo: true },
  { codigo: 502, nome: 'Bradesco Saúde', ativo: true },
  { codigo: 503, nome: 'SulAmérica', ativo: true },
  { codigo: 504, nome: 'Amil', ativo: true },
  { codigo: 505, nome: 'Particular', ativo: true },
];

/**
 * Dados mock para unidades/locais
 */
const mockOrganizationUnits = [
  { codigo: 1, nome: 'Clínica Central', ativo: true },
  { codigo: 2, nome: 'Clínica Unidade 2', ativo: true },
  { codigo: 3, nome: 'Hospital São Paulo', ativo: true },
];

const mockProcedures = [
  {
    codigo: '10101012',
    nome: 'Consulta em consultório (no horário normal)',
    tabela: { codigo: 22, nome: 'CBHPM' },
    honorario: 150.0,
  },
  {
    codigo: '10101039',
    nome: 'Retorno de consulta',
    tabela: { codigo: 22, nome: 'CBHPM' },
    honorario: 75.0,
  },
  {
    codigo: '40301010',
    nome: 'Eletrocardiograma',
    tabela: { codigo: 22, nome: 'CBHPM' },
    honorario: 50.0,
  },
  {
    codigo: '40302016',
    nome: 'Ecocardiograma transtorácico',
    tabela: { codigo: 22, nome: 'CBHPM' },
    honorario: 250.0,
  },
  {
    codigo: '40801020',
    nome: 'Hemograma completo',
    tabela: { codigo: 22, nome: 'CBHPM' },
    honorario: 30.0,
  },
];

/**
 * Dados mock para especialidades
 */
const mockSpecialities = [
  { codigo: 1, nome: 'Clínica Geral' },
  { codigo: 2, nome: 'Cardiologia' },
  { codigo: 3, nome: 'Ortopedia' },
  { codigo: 4, nome: 'Dermatologia' },
  { codigo: 5, nome: 'Pediatria' },
  { codigo: 6, nome: 'Psiquiatria' },
  { codigo: 7, nome: 'Ginecologia' },
  { codigo: 8, nome: 'Oftalmologia' },
  { codigo: 9, nome: 'Neurologia' },
  { codigo: 10, nome: 'Endocrinologia' },
];

/**
 * Dados mock para agendamentos (estáticos)
 */
const mockAppointments = [
  {
    codigo: 1001,
    data: '25/11/2025',
    hora: '08:00',
    duracao: 30,
    usuario: mockDoctors[0],
    paciente: mockPatients[0],
    localProDoctor: mockOrganizationUnits[0],
    convenio: mockInsurances[0],
    procedimentoMedico: mockProcedures[0],
    estadoAgendaConsulta: { codigo: 1, descricao: 'Agendado', agendado: true },
    tipoAgendamento: { consulta: true },
    complemento: 'Primeira consulta',
  },
  {
    codigo: 1002,
    data: '25/11/2025',
    hora: '09:00',
    duracao: 30,
    usuario: mockDoctors[0],
    paciente: mockPatients[1],
    localProDoctor: mockOrganizationUnits[0],
    convenio: mockInsurances[1],
    procedimentoMedico: mockProcedures[1],
    estadoAgendaConsulta: { codigo: 2, descricao: 'Confirmado', confirmado: true },
    tipoAgendamento: { retorno: true },
    complemento: 'Retorno de exames',
  },
  {
    codigo: 1003,
    data: '25/11/2025',
    hora: '10:00',
    duracao: 45,
    usuario: mockDoctors[1],
    paciente: mockPatients[2],
    localProDoctor: mockOrganizationUnits[0],
    convenio: mockInsurances[2],
    procedimentoMedico: mockProcedures[0],
    estadoAgendaConsulta: { codigo: 1, descricao: 'Agendado', agendado: true },
    tipoAgendamento: { consulta: true },
    complemento: '',
  },
];

/**
 * Gera horários disponíveis
 */
const generateAvailableSlots = (date: string, usuario: any, localProDoctor: any) => {
  const slots = [];
  const hours = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
  ];

  const diaSemanaMap: Record<string, string> = {
    '0': 'domingo',
    '1': 'segunda-feira',
    '2': 'terça-feira',
    '3': 'quarta-feira',
    '4': 'quinta-feira',
    '5': 'sexta-feira',
    '6': 'sábado',
  };

  for (const hora of hours) {
    // Verifica se o horário não está ocupado in-memory
    const key = generateAppointmentKey(localProDoctor?.codigo ?? 1, usuario?.codigo ?? 100, date, hora);

    if (!inMemoryAppointments.has(key)) {
      slots.push({
        localProDoctor: localProDoctor || { codigo: 1, nome: 'Clínica Central' },
        usuario: usuario || { codigo: 100, nome: 'Dr. João da Silva' },
        data: date,
        hora,
        duracao: 30,
        disponivel: true,
      });
    }
  }

  return slots;
};

/**
 * Mocks adicionais realistas para a API ProDoctor
 */
export const additionalRealisticMocks: Record<string, MockFn> = {
  /* -------------------------------------------------------------------------- */
  /*                    BUSCAR HORÁRIOS DISPONÍVEIS                             */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Agenda/BuscarHorariosDisponiveis': (req) => {
    const { dataInicio, dataFim, usuario, localProDoctor, turnos, diasNaSemana } = (req.body || {}) as any;

    let slots = generateAvailableSlots(dataInicio ?? '25/11/2025', usuario, localProDoctor);

    // Filtrar por turno se especificado
    if (turnos?.manha) {
      slots = slots.filter((s) => {
        const hour = parseInt(s.hora.split(':')[0]);
        return hour < 12;
      });
    } else if (turnos?.tarde) {
      slots = slots.filter((s) => {
        const hour = parseInt(s.hora.split(':')[0]);
        return hour >= 12 && hour < 18;
      });
    } else if (turnos?.noite) {
      slots = slots.filter((s) => {
        const hour = parseInt(s.hora.split(':')[0]);
        return hour >= 18;
      });
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        agendamentos: slots,
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                    BUSCAR AGENDAMENTOS POR STATUS                          */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Agenda/BuscarPorStatus': (req) => {
    const { estadoAgendaConsulta, periodo, usuario, localProDoctor } = (req.body || {}) as any;

    // Combina agendamentos mock com in-memory
    let agendamentos = [...mockAppointments];

    // Adiciona agendamentos in-memory
    inMemoryAppointments.forEach((appointment) => {
      agendamentos.push(appointment);
    });

    // Filtrar por status
    if (estadoAgendaConsulta?.confirmado) {
      agendamentos = agendamentos.filter((a) => a.estadoAgendaConsulta?.confirmado);
    }
    if (estadoAgendaConsulta?.agendado) {
      agendamentos = agendamentos.filter((a) => a.estadoAgendaConsulta?.agendado);
    }
    if (estadoAgendaConsulta?.atendido) {
      agendamentos = agendamentos.filter((a) => a.estadoAgendaConsulta?.confirmado);
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        agendamentos: agendamentos.map((a) => ({
          codigo: a.codigo,
          data: a.data,
          hora: a.hora,
          duracao: a.duracao,
          usuario: { codigo: a.usuario.codigo, nome: a.usuario.nome },
          paciente: { codigo: a.paciente.codigo, nome: a.paciente.nome },
          localProDoctor: a.localProDoctor,
          estadoAgendaConsulta: a.estadoAgendaConsulta,
        })),
      },
    };
  },
  'POST /api/v1/Agenda/Livres': (req) => {
    const { usuario, periodo, localProDoctor, convenio, turnos } = (req.body || {}) as any;

    const dataInicial = periodo?.dataInicial || '25/11/2025';
    const dataFinal = periodo?.dataFinal || '30/11/2025';

    // Gerar slots para 5 dias
    const slots = [];
    const dates = ['25/11/2025', '26/11/2025', '27/11/2025', '28/11/2025', '29/11/2025'];

    for (const date of dates) {
      slots.push(...generateAvailableSlots(date, usuario, localProDoctor));
    }

    // Filtrar por turno se especificado
    let filteredSlots = slots;
    if (turnos?.manha) {
      filteredSlots = slots.filter((s) => {
        const hour = parseInt(s.dataHora.split(' ')[1].split(':')[0]);
        return hour < 12;
      });
    } else if (turnos?.tarde) {
      filteredSlots = slots.filter((s) => {
        const hour = parseInt(s.dataHora.split(' ')[1].split(':')[0]);
        return hour >= 12 && hour < 18;
      });
    } else if (turnos?.noite) {
      filteredSlots = slots.filter((s) => {
        const hour = parseInt(s.dataHora.split(' ')[1].split(':')[0]);
        return hour >= 18;
      });
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        agendamentos: filteredSlots,
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                       LISTAR USUÁRIOS DETALHADOS                           */
  /* -------------------------------------------------------------------------- */
  'POST /api/v1/Usuarios': (req) => {
    const { quantidade, locaisProDoctor } = (req.body || {}) as any;

    let usuarios = [...mockDoctors];

    if (locaisProDoctor?.length) {
      // Filtrar por local (simulação simples)
      usuarios = usuarios.slice(0, 2);
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        usuarios: usuarios.slice(0, quantidade || 5000),
      },
    };
  },

  // Detalhar usuário
  'GET /api/v1/Usuarios/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const doctor = mockDoctors.find((d) => d.codigo === Number(codigo));

    if (!doctor) {
      return {
        sucesso: false,
        mensagem: 'Usuário não encontrado',
        payload: null,
      };
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        usuario: doctor,
      },
    };
  },

  'POST /api/v1/Usuario/ListarDetalhes': (req) => {
    const { quantidade, ativo } = (req.body || {}) as any;

    let usuarios = mockDoctors;
    if (ativo !== undefined) {
      usuarios = usuarios.filter((u) => u.ativo === ativo);
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: usuarios.length,
        itens: usuarios.slice(0, quantidade || 10),
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                       BUSCAR PACIENTE (endpoint alternativo)               */
  /* -------------------------------------------------------------------------- */
  // Buscar pacientes - seguindo a API real do ProDoctor (BasicPacienteSearch -> PDResponsePacienteListaViewModel)
  'POST /api/v1/Pacientes': (req) => {
    const body: any = req.body || {};

    // Filtros da API ProDoctor (BasicPacienteSearch)
    const termo = body?.termo ?? '';
    const campo = body?.campo ?? 0; // 0=Nome, 1=CPF, 2=Telefone
    const pagina = body?.pagina ?? 1;
    const quantidade = body?.quantidade ?? 5000;
    const somenteAtivos = body?.somenteAtivos ?? false;

    // Base de dados fake de pacientes (PacienteListarViewModel)
    const pacientes = [
      {
        codigo: 101,
        nome: 'Maria de Souza',
        nomeCivil: 'Maria de Souza Silva',
        dataNascimento: '10/08/1991',
        cpf: '12345678900',
        telefone1: { ddd: '11', numero: '999990001', tipo: { codigo: 3, nome: 'Celular' } },
        telefone2: null,
        telefone3: null,
        telefone4: null,
      },
      {
        codigo: 102,
        nome: 'Carlos Pereira',
        nomeCivil: 'Carlos Eduardo Pereira',
        dataNascimento: '22/04/1985',
        cpf: '98765432100',
        telefone1: { ddd: '11', numero: '999990002', tipo: { codigo: 3, nome: 'Celular' } },
        telefone2: { ddd: '11', numero: '32210002', tipo: { codigo: 1, nome: 'Residencial' } },
        telefone3: null,
        telefone4: null,
      },
      {
        codigo: 103,
        nome: 'João Henrique',
        nomeCivil: 'João Henrique Santos',
        dataNascimento: '23/11/1988',
        cpf: '11122233344',
        telefone1: { ddd: '11', numero: '999990003', tipo: { codigo: 3, nome: 'Celular' } },
        telefone2: null,
        telefone3: null,
        telefone4: null,
      },
    ];

    let resultado = [...pacientes];

    // Aplicar filtro por termo e campo
    if (termo) {
      const termoLimpo = termo.replace(/\D/g, ''); // Remove não-dígitos para CPF/Telefone
      const termoLower = termo.toLowerCase();

      resultado = resultado.filter((p) => {
        switch (campo) {
          case 0: // Nome
            return p.nome.toLowerCase().includes(termoLower) || p.nomeCivil?.toLowerCase().includes(termoLower);
          case 1: // CPF
            return p.cpf.includes(termoLimpo);
          case 2: // Telefone
            const telefones = [p.telefone1, p.telefone2, p.telefone3, p.telefone4]
              .filter(Boolean)
              .map((t: any) => `${t.ddd}${t.numero}`);
            return telefones.some((tel) => tel.includes(termoLimpo));
          default:
            return true;
        }
      });
    }

    // Paginação
    const inicio = (pagina - 1) * quantidade;
    const fim = inicio + quantidade;
    const pacientesPaginados = resultado.slice(inicio, fim);

    // Formato de resposta da API ProDoctor (PDResponsePacienteListaViewModel)
    return {
      payload: {
        pacientes: pacientesPaginados,
      },
      message: {
        codigo: 0,
        texto: null,
      },
    };
  },
  'POST /api/v1/Pacientes/Buscar': (req) => {
    const { cpf, nome } = (req.body || {}) as any;

    let paciente = null;

    if (cpf) {
      paciente = mockPatients.find((p) => p.cpf === cpf.replace(/\D/g, ''));
    } else if (nome) {
      paciente = mockPatients.find((p) => p.nome.toLowerCase().includes(nome.toLowerCase()));
    }

    if (!paciente) {
      return {
        sucesso: false,
        mensagens: ['Paciente não encontrado'],
        payload: { paciente: null },
      };
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: { paciente },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                       DETALHAR PACIENTE (endpoint alternativo)             */
  /* -------------------------------------------------------------------------- */

  'GET /api/v1/Pacientes/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const paciente = mockPatients.find((p) => p.codigo === Number(codigo));

    if (!paciente) {
      return {
        sucesso: false,
        mensagens: ['Paciente não encontrado'],
        payload: null,
      };
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: { paciente },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                       LISTAR ESPECIALIDADES                                */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Especialidades/Listar': (req) => {
    const { quantidade } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: mockSpecialities.length,
        itens: mockSpecialities.slice(0, quantidade || 20),
      },
    };
  },

  'POST /api/v1/Convenios': (req) => {
    const body: any = req.body || {};
    const termo = body?.termo ?? '';
    const pagina = body?.pagina ?? 1;
    const quantidade = body?.quantidade ?? 5000;
    const somenteAtivos = body?.somenteAtivos ?? true;

    const convenios = [
      { codigo: 501, nome: 'Unimed', ativo: true },
      { codigo: 502, nome: 'Bradesco Saúde', ativo: true },
      { codigo: 503, nome: 'SulAmérica', ativo: true },
      { codigo: 504, nome: 'Amil', ativo: true },
      { codigo: 505, nome: 'NotreDame Intermédica', ativo: true },
      { codigo: 506, nome: 'Hapvida', ativo: false },
    ];

    let resultado = somenteAtivos ? convenios.filter((c) => c.ativo) : [...convenios];

    if (termo) {
      const termoLower = termo.toLowerCase();
      resultado = resultado.filter((c) => c.nome.toLowerCase().includes(termoLower));
    }

    const inicio = (pagina - 1) * quantidade;
    const pacientesPaginados = resultado.slice(inicio, inicio + quantidade);

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        convenios: pacientesPaginados,
      },
    };
  },

  // Detalhar convênio
  'GET /api/v1/Convenios/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const codigoNum = Number(codigo);

    const convenios: Record<number, any> = {
      501: { codigo: 501, nome: 'Unimed', cnpj: '12.345.678/0001-01', ativo: true },
      502: { codigo: 502, nome: 'Bradesco Saúde', cnpj: '98.765.432/0001-02', ativo: true },
      503: { codigo: 503, nome: 'SulAmérica', cnpj: '11.222.333/0001-03', ativo: true },
    };

    const convenio = convenios[codigoNum] || { codigo: codigoNum, nome: 'Convênio Desconhecido', ativo: true };

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        convenio,
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                       BUSCAR AGENDAMENTO POR CÓDIGO                        */
  /* -------------------------------------------------------------------------- */

  'GET /api/v1/Agenda/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;

    // Primeiro busca in-memory
    let agendamento = null;
    inMemoryAppointments.forEach((appointment) => {
      if (appointment.codigo === Number(codigo)) {
        agendamento = appointment;
      }
    });

    // Se não encontrou, busca nos mocks estáticos
    if (!agendamento) {
      agendamento = mockAppointments.find((a) => a.codigo === Number(codigo));
    }

    if (!agendamento) {
      return {
        sucesso: false,
        mensagens: ['Agendamento não encontrado'],
        payload: null,
      };
    }

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        agendamento: {
          ...agendamento,
          telefones: agendamento.paciente?.telefones || [{ tipo: 'Celular', numero: '(11) 99999-0001' }],
          email: agendamento.paciente?.email || 'paciente@example.com',
        },
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                       DEBUG ENDPOINTS                                      */
  /* -------------------------------------------------------------------------- */

  // Endpoint de debug para listar todos os agendamentos in-memory
  'GET /api/v1/Debug/Agendamentos': (req) => {
    const appointments: any[] = [];
    inMemoryAppointments.forEach((value, key) => {
      appointments.push({ key, ...value });
    });

    return {
      sucesso: true,
      mensagens: [],
      payload: {
        total: appointments.length,
        agendamentos: appointments,
      },
    };
  },

  // Endpoint de debug para limpar todos os agendamentos in-memory
  'DELETE /api/v1/Debug/Agendamentos': (req) => {
    inMemoryAppointments.clear();

    return {
      sucesso: true,
      mensagens: ['Todos os agendamentos in-memory foram removidos'],
      payload: {
        total: 0,
      },
    };
  },
};

/**
 * Exporta os dados mock para uso em testes
 */
export const mockData = {
  patients: mockPatients,
  doctors: mockDoctors,
  insurances: mockInsurances,
  organizationUnits: mockOrganizationUnits,
  procedures: mockProcedures,
  specialities: mockSpecialities,
  appointments: mockAppointments,
};
