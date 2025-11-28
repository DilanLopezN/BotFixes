import { Request } from 'express';
import { generateAppointmentKey, inMemoryAppointments } from './db-mocks';

type MockFn = (req: Request) => any;

/**
 * Dados mock realistas para pacientes
 */
export const mockPatients = [
  {
    codigo: 101,
    nome: 'Maria de Souza Santos',
    dataNascimento: '10/08/1991',
    cpf: '12345678900',
    nomeCivil: 'Maria de Souza Santos',
    telefone1: {
      tipoTelefone: { codigo: 3, descricao: 'Celular' },
      numero: '11999990001',
    },
    telefone2: {
      tipoTelefone: { codigo: 1, descricao: 'Residencial' },
      numero: '1132145678',
    },
    telefone3: null,
    telefone4: null,
  },
  {
    codigo: 102,
    nome: 'Carlos Pereira Lima',
    dataNascimento: '22/04/1985',
    cpf: '98765432100',
    nomeCivil: 'Carlos Pereira Lima',
    telefone1: {
      tipoTelefone: { codigo: 3, descricao: 'Celular' },
      numero: '21988887777',
    },
    telefone2: null,
    telefone3: null,
    telefone4: null,
  },
  {
    codigo: 103,
    nome: 'Ana Paula Oliveira',
    dataNascimento: '15/12/1978',
    cpf: '11122233344',
    nomeCivil: 'Ana Paula Oliveira',
    telefone1: {
      tipoTelefone: { codigo: 3, descricao: 'Celular' },
      numero: '31977776666',
    },
    telefone2: null,
    telefone3: null,
    telefone4: null,
  },
];

/**
 * Dados mock para médicos/usuários
 */
const mockDoctors = [
  {
    codigo: 100,
    nome: 'Dr. João da Silva',
    cpf: '11111111111',
    crm: '123456-SP',
    ativo: true,
    especialidade: { codigo: 1, nome: 'Cardiologia' },
  },
  {
    codigo: 101,
    nome: 'Dra. Ana Carolina Santos',
    cpf: '22222222222',
    crm: '654321-SP',
    ativo: true,
    especialidade: { codigo: 3, nome: 'Dermatologia' },
  },
  {
    codigo: 102,
    nome: 'Dr. Roberto Mendes',
    cpf: '33333333333',
    crm: '789012-RJ',
    ativo: true,
    especialidade: { codigo: 4, nome: 'Ortopedia' },
  },
  {
    codigo: 103,
    nome: 'Dra. Fernanda Costa',
    cpf: '44444444444',
    crm: '345678-MG',
    ativo: true,
    especialidade: { codigo: 6, nome: 'Pediatria' },
  },
];

/**
 * Dados mock para convênios
 */
const mockInsurances = [
  {
    codigo: 501,
    nome: 'Unimed',
    ativo: true,
    planos: [
      { codigo: 1, nome: 'Nacional' },
      { codigo: 2, nome: 'Estadual' },
    ],
  },
  {
    codigo: 502,
    nome: 'Bradesco Saúde',
    ativo: true,
    planos: [
      { codigo: 3, nome: 'Top Nacional' },
      { codigo: 4, nome: 'Efetivo' },
    ],
  },
  {
    codigo: 503,
    nome: 'SulAmérica',
    ativo: true,
    planos: [{ codigo: 5, nome: 'Especial' }],
  },
  {
    codigo: 504,
    nome: 'Amil',
    ativo: true,
    planos: [
      { codigo: 6, nome: 'S750' },
      { codigo: 7, nome: 'S450' },
    ],
  },
  {
    codigo: 505,
    nome: 'Particular',
    ativo: true,
    planos: [],
  },
];

/**
 * Dados mock para locais ProDoctor (unidades)
 */
const mockOrganizationUnits = [
  {
    codigo: 1,
    nome: 'Clínica Central',
    endereco: 'Av. Paulista, 1000 - São Paulo/SP',
    telefone: '(11) 3000-0001',
  },
  {
    codigo: 2,
    nome: 'Filial Sul',
    endereco: 'Rua das Palmeiras, 500 - Porto Alegre/RS',
    telefone: '(51) 3000-0002',
  },
  {
    codigo: 3,
    nome: 'Unidade Norte',
    endereco: 'Av. das Américas, 2000 - Manaus/AM',
    telefone: '(92) 3000-0003',
  },
];

/**
 * Dados mock para procedimentos
 */
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
  { codigo: 1, nome: 'Cardiologia' },
  { codigo: 2, nome: 'Clínica Geral' },
  { codigo: 3, nome: 'Dermatologia' },
  { codigo: 4, nome: 'Ortopedia' },
  { codigo: 5, nome: 'Traumatologia' },
  { codigo: 6, nome: 'Pediatria' },
  { codigo: 7, nome: 'Ginecologia' },
  { codigo: 8, nome: 'Oftalmologia' },
  { codigo: 9, nome: 'Neurologia' },
  { codigo: 10, nome: 'Endocrinologia' },
];

/**
 * Dados mock para agendamentos
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
    estadoAgendaConsulta: { codigo: 1, descricao: 'Agendado' },
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
    estadoAgendaConsulta: { codigo: 1, descricao: 'Agendado' },
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
 * Mocks realistas adicionais para a API ProDoctor
 */
export const additionalRealisticMocks: Record<string, MockFn> = {
  /* -------------------------------------------------------------------------- */
  /*                              USUÁRIOS/MÉDICOS                              */
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

  'GET /api/v1/Usuarios/Detalhar/{codigo}': (req) => {
    const fullPath = req.params['0'];
    const codigo = fullPath.split('/').pop(); // último elemento = 100

    console.log('CODIGO:', codigo);

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

  /* -------------------------------------------------------------------------- */
  /*                                 CONVÊNIOS                                  */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Convenios': (req) => {
    const { quantidade } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        convenios: mockInsurances.slice(0, quantidade || 5000),
      },
    };
  },

  'GET /api/v1/Convenios/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const insurance = mockInsurances.find((i) => i.codigo === Number(codigo));

    if (!insurance) {
      return {
        sucesso: false,
        mensagem: 'Convênio não encontrado',
        payload: null,
      };
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        convenio: insurance,
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                            LOCAIS PRODOCTOR                                */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/LocaisProDoctor': (req) => {
    const { quantidade } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        locaisProDoctor: mockOrganizationUnits.slice(0, quantidade || 5000),
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                              PROCEDIMENTOS                                 */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Procedimentos': (req) => {
    const { quantidade, convenios, tabelas } = (req.body || {}) as any;

    let procedures = [...mockProcedures];

    // Filtro por tabela
    if (tabelas?.length) {
      procedures = procedures.filter((p) => tabelas.some((t: any) => t.codigo === p.tabela.codigo));
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        procedimentos: procedures.slice(0, quantidade || 5000),
      },
    };
  },

  'GET /api/v1/ProcedimentosMedicos/Detalhar/{codigo}': (req) => {
    const { codigo } = req.params;
    const procedure = mockProcedures.find((p) => p.codigo === codigo);

    if (!procedure) {
      return {
        sucesso: false,
        mensagem: 'Procedimento não encontrado',
        payload: null,
      };
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        procedimentoMedico: procedure,
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                          TABELAS DE PROCEDIMENTOS                          */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/TabelasProcedimentos': (req) => {
    return {
      sucesso: true,
      mensagem: null,
      payload: {
        tabelasProcedimentos: [
          { codigo: 22, nome: 'CBHPM' },
          { codigo: 90, nome: 'AMB' },
          { codigo: 18, nome: 'TUSS' },
        ],
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                         HORÁRIOS DISPONÍVEIS                               */
  /* -------------------------------------------------------------------------- */

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
  /*                    BUSCAR AGENDAMENTOS POR STATUS                          */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Agenda/BuscarPorStatusTipo': (req) => {
    const { estadoAgendaConsulta, periodo, usuario, localProDoctor } = (req.body || {}) as any;

    let agendamentos = [...mockAppointments];

    if (estadoAgendaConsulta?.confirmado) {
      agendamentos = agendamentos.filter((a) => a.estadoAgendaConsulta.confirmado);
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: {
        agendamentos: agendamentos.map((a) => ({
          codigo: a.codigo,
          data: a.data,
          hora: a.hora,
          usuario: { codigo: a.usuario.codigo, nome: a.usuario.nome },
          paciente: { codigo: a.paciente.codigo, nome: a.paciente.nome },
          estadoAgendaConsulta: a.estadoAgendaConsulta,
        })),
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                            ALTERAR STATUS                                  */
  /* -------------------------------------------------------------------------- */

  'PATCH /api/v1/Agenda/AlterarStatus': (req) => {
    const { agendamento, estadoAgendaConsulta } = (req.body || {}) as any;

    return {
      sucesso: true,
      mensagem: 'Status alterado com sucesso (mock).',
      payload: {
        agendamento: {
          codigo: agendamento?.codigo ?? 1001,
          estadoAgendaConsulta: estadoAgendaConsulta || { confirmado: true },
        },
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                               DOMÍNIOS                                     */
  /* -------------------------------------------------------------------------- */

  'GET /api/v1/Dominios/Sexos': () => {
    return {
      sucesso: true,
      mensagem: null,
      payload: {
        sexos: [
          { codigo: 1, nome: 'Masculino' },
          { codigo: 2, nome: 'Feminino' },
        ],
      },
    };
  },

  'GET /api/v1/Dominios/TiposTelefone': () => {
    return {
      sucesso: true,
      mensagem: null,
      payload: {
        tiposTelefone: [
          { codigo: 1, nome: 'Residencial' },
          { codigo: 2, nome: 'Comercial' },
          { codigo: 3, nome: 'Celular' },
          { codigo: 4, nome: 'Recado' },
        ],
      },
    };
  },

  'GET /api/v1/Dominios/EstadosCivis': () => {
    return {
      sucesso: true,
      mensagem: null,
      payload: {
        estadosCivis: [
          { codigo: 1, nome: 'Solteiro(a)' },
          { codigo: 2, nome: 'Casado(a)' },
          { codigo: 3, nome: 'Divorciado(a)' },
          { codigo: 4, nome: 'Viúvo(a)' },
          { codigo: 5, nome: 'União Estável' },
        ],
      },
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                        PACIENTES - OPERAÇÕES EXTRAS                        */
  /* -------------------------------------------------------------------------- */

  'POST /api/v1/Pacientes': (req) => {
    const { quantidade, nome, codigo } = (req.body || {}) as any;

    let termo = '12345678900';
    const patients = [];

    if (termo) {
      const patient = mockPatients.find((p) => p.cpf == termo);
      patients.push(patient);
    }

    if (codigo) {
      const patient = mockPatients.find((p) => p.codigo == codigo);
      patients.push(patient);
    }

    console.log('PATIENTS', patients);

    if (patients.length >= 1) {
      return {
        sucesso: true,
        mensagem: null,
        payload: {
          pacientes: patients,
        },
      };
    }
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
        mensagem: 'Paciente não encontrado',
        payload: { paciente: null },
      };
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: { paciente },
    };
  },

  'GET /api/v1/Pacientes/Detalhar/{codigo}': (req) => {
    const fullPath = req.params['0']; // exemplo: "api/v1/Pacientes/Detalhar/100"
    const codigo = fullPath.split('/').pop(); // pega o último: 100

    console.log('CODIGO PACIENTE:', codigo);

    const paciente = mockPatients.find((p) => p.codigo === Number(codigo));

    if (!paciente) {
      return {
        sucesso: false,
        mensagem: 'Paciente não encontrado',
        payload: null,
      };
    }

    return {
      sucesso: true,
      mensagem: null,
      payload: { paciente },
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
