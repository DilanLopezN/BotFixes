import { Request } from 'express';

type MockFn = (req: Request) => any;

// ========== IN-MEMORY STORAGE ==========
export const inMemoryPatients: Map<number, any> = new Map();
export const inMemoryAppointments: Map<string, any> = new Map();

let patientIdCounter = 1000;
let appointmentKeyCounter = 10000;

export const generatePatientId = (): number => ++patientIdCounter;
export const generateAppointmentKey = (): number => ++appointmentKeyCounter;

// ========== DADOS MOCK FIXOS ==========

/**
 * Pacientes mock
 */
export const mockPatients = [
  {
    idpaciente: 1,
    nomeregistro: 'Maria de Souza Santos',
    nomesocial: 'Maria Santos',
    nascimento: '2000-11-17',
    cpf: '52033709825',
    sexo: 'F',
    idmedico: 10,
    idconvenio: 2,
    convenio: 'Unimed',
    plano: 'Premium',
  },
  {
    idpaciente: 2,
    nomeregistro: 'Carlos Pereira Lima',
    nomesocial: 'Carlos Lima',
    nascimento: '1985-04-22',
    sexo: 'M',
    idmedico: 12,
    idconvenio: 1,
    convenio: 'Amil',
    plano: 'Gold',
  },
  {
    idpaciente: 3,
    nomeregistro: 'Ana Paula Oliveira',
    nomesocial: 'Ana Oliveira',
    nascimento: '1978-12-15',
    sexo: 'F',
    idmedico: 10,
    idconvenio: 3,
    convenio: 'SulAmérica',
    plano: 'Especial',
  },
];

export const mockMedicos = [
  { id: 100, nome: 'Dr. João da Silva', crm: 'CRM/SP 123456', local: 1, podemarcaratendido: true },
  { id: 101, nome: 'Dra. Ana Carolina Santos', crm: 'CRM/SP 654321', local: 1, podemarcaratendido: true },
  { id: 102, nome: 'Dr. Roberto Mendes', crm: 'CRM/RJ 789012', local: 2, podemarcaratendido: true },
];

/**
 * Convênios mock
 */
export const mockConvenios = [
  { id: 501, codigo: '001', nome: 'Unimed', reduzido: 'UNIM', num_cnpj: '12345678000101', status: 'A' },
  { id: 502, codigo: '002', nome: 'Bradesco Saúde', reduzido: 'BRAD', num_cnpj: '22345678000102', status: 'A' },
  { id: 503, codigo: '003', nome: 'SulAmérica', reduzido: 'SULA', num_cnpj: '32345678000103', status: 'A' },
  { id: 504, codigo: '004', nome: 'Amil', reduzido: 'AMIL', num_cnpj: '42345678000104', status: 'A' },
  { id: 505, codigo: '005', nome: 'Particular', reduzido: 'PART', num_cnpj: null, status: 'A' },
];

/**
 * Especialidades mock
 */
export const mockEspecialidades = [
  { id: 1, nome: 'Cardiologia' },
  { id: 2, nome: 'Clínica Geral' },
  { id: 3, nome: 'Dermatologia' },
  { id: 4, nome: 'Ortopedia' },
  { id: 5, nome: 'Pediatria' },
  { id: 6, nome: 'Ginecologia' },
];

/**
 * Serviços/Procedimentos mock
 */
export const mockServicos = [
  { id: 1, nome: 'Consulta Cardiologia', codigo: '10101012', valor: 250.0, duracao: 30, idespecialidade: 1 },
  { id: 2, nome: 'Retorno Cardiologia', codigo: '10101013', valor: 150.0, duracao: 20, idespecialidade: 1 },
  { id: 3, nome: 'Consulta Dermatologia', codigo: '10101014', valor: 200.0, duracao: 30, idespecialidade: 3 },
  { id: 4, nome: 'Consulta Ortopedia', codigo: '10101015', valor: 280.0, duracao: 30, idespecialidade: 4 },
];

/**
 * Filiais/Locais mock
 */
export const mockFiliais = [
  {
    tipo: 'FILIAL',
    id: 1,
    empresa: 'Clínica Central',
    cnpj: '12345678000199',
    endereco: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cep: '01310100',
    ddd: '11',
    fone: '30000001',
    site: 'www.clinicacentral.com.br',
    localizacao: 'https://maps.google.com/?q=-23.5505,-46.6333',
    complemento: 'Sala 101',
  },
  {
    tipo: 'FILIAL',
    id: 2,
    empresa: 'Filial Sul',
    cnpj: '12345678000288',
    endereco: 'Rua das Palmeiras',
    numero: '500',
    bairro: 'Centro',
    cep: '90000000',
    ddd: '51',
    fone: '30000002',
    site: 'www.clinicasul.com.br',
    localizacao: 'https://maps.google.com/?q=-30.0346,-51.2177',
    complemento: null,
  },
];

// ========== HELPERS ==========

/**
 * Gera horários disponíveis para um médico
 */
const generateAvailableSlots = (idmedico: number, datainicio: string, datafim: string): any[] => {
  const slots: any[] = [];
  const start = new Date(datainicio);
  const end = new Date(datafim);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue; // Pula fim de semana

    const hours = ['08:00', '08:30', '09:00', '09:30', '10:00', '14:00', '14:30', '15:00', '15:30', '16:00'];

    for (const hora of hours) {
      const dateStr = d.toISOString().split('T')[0];
      const key = `${idmedico}-${dateStr}-${hora}`;

      // Só adiciona se não estiver ocupado
      if (!inMemoryAppointments.has(key)) {
        slots.push({
          chave: generateAppointmentKey(),
          idmedico,
          data: dateStr,
          hora,
        });
      }
    }
  }

  return slots.slice(0, 50); // Limita retorno
};

// ========== MOCKS REALISTAS ==========

export const realisticMocks: Record<string, MockFn> = {
  /* -------------------------------------------------------------------------- */
  /*                              PACIENTES                                     */
  /* -------------------------------------------------------------------------- */

  // POST /listarpaciente - Buscar paciente por CPF, nome ou id
  'POST /listarpaciente': (req) => {
    const { cpf, nome, id } = req.body || {};

    let pacientes = [...mockPatients, ...Array.from(inMemoryPatients.values())];

    if (cpf) {
      pacientes = pacientes.filter((p) => p.cpf === cpf.replace(/\D/g, ''));
    }
    if (nome) {
      pacientes = pacientes.filter((p) => p.nome.toLowerCase().includes(nome.toLowerCase()));
    }
    if (id) {
      pacientes = pacientes.filter((p) => p.id === Number(id));
    }

    if (pacientes.length === 0) {
      return null; // Retorna 404
    }

    console.log('PACIENTES', pacientes);

    return pacientes;
  },

  // POST /paciente - Criar paciente
  'POST /paciente': (req) => {
    const body = req.body || {};
    const newId = generatePatientId();

    const newPatient = {
      id: newId,
      nome: body.nome,
      cpf: body.cpf?.replace(/\D/g, ''),
      datanascimento: body.datanascimento,
      sexo: body.sexo,
      email: body.email,
      celular: body.celular,
      telefone: body.telefone,
    };

    inMemoryPatients.set(newId, newPatient);
    console.log(`[FAKE-API] Paciente criado com id ${newId}`);

    return { idpaciente: newId };
  },

  /* -------------------------------------------------------------------------- */
  /*                              CONVÊNIOS                                     */
  /* -------------------------------------------------------------------------- */

  // GET /listarconvenio - Listar todos os convênios
  'GET /listarconvenio': () => {
    return mockConvenios;
  },

  // GET /listarconvenio/{id} - Detalhar convênio
  'GET /listarconvenio/{id}': (req) => {
    const id = Number(req.params.id || req.params['0']?.split('/').pop());
    const convenio = mockConvenios.find((c) => c.id === id);
    return convenio || null;
  },

  /* -------------------------------------------------------------------------- */
  /*                              MÉDICOS                                       */
  /* -------------------------------------------------------------------------- */

  // GET /listarmedico - Listar todos os médicos
  'GET /listarmedico': () => {
    return mockMedicos;
  },

  // GET /listarmedico/{id} - Detalhar médico
  'GET /listarmedico/{id}': (req) => {
    const id = Number(req.params.id || req.params['0']?.split('/').pop());
    const medico = mockMedicos.find((m) => m.id === id);
    return medico || null;
  },

  /* -------------------------------------------------------------------------- */
  /*                           ESPECIALIDADES                                   */
  /* -------------------------------------------------------------------------- */

  // GET /listarespecialidade - Listar especialidades
  'GET /listarespecialidade': () => {
    return mockEspecialidades;
  },

  /* -------------------------------------------------------------------------- */
  /*                        SERVIÇOS/PROCEDIMENTOS                              */
  /* -------------------------------------------------------------------------- */

  // GET /listarservico - Listar todos os serviços
  'GET /listarservico': () => {
    return mockServicos;
  },

  // GET /listarservico/{:idconvenio} - Listar serviços por convênio
  'GET /listarservico/{:idconvenio}': () => {
    return mockServicos; // Retorna todos (mock simplificado)
  },

  /* -------------------------------------------------------------------------- */
  /*                           FILIAIS/LOCAIS                                   */
  /* -------------------------------------------------------------------------- */

  // GET /clientefilial - Listar todas as filiais
  'GET /clientefilial': () => {
    return mockFiliais;
  },

  // GET /clientefilial/{id} - Detalhar filial
  'GET /clientefilial/{id}': (req) => {
    const id = Number(req.params.id || req.params['0']?.split('/').pop());
    const filial = mockFiliais.find((f) => f.id === id);
    return filial || null;
  },

  /* -------------------------------------------------------------------------- */
  /*                      MÉDICOS DISPONÍVEIS (Passo 1)                         */
  /* -------------------------------------------------------------------------- */

  // POST /medico/agendamento/disponiveis - Listar médicos disponíveis para agendamento
  'POST /medico/agendamento/disponiveis': (req) => {
    const { idconvenio, codigoprocedimento, idespecialidade } = req.body || {};

    let medicos = [...mockMedicos];

    return medicos;
  },

  /* -------------------------------------------------------------------------- */
  /*                     HORÁRIOS DISPONÍVEIS (Passo 2)                         */
  /* -------------------------------------------------------------------------- */

  // POST /medico/agendamento/horarios-disponiveis - Retorna horários disponíveis

  'POST /medico/agendamento/horarios-disponiveis': (req) => {
    const { idmedico, idconvenio, codigoprocedimento, datainicio, datafim } = req.body || {};

    if (!idmedico) {
      return null;
    }

    console.log('BODY', req.body);

    // Valida se datainicio/datafim são datas válidas (YYYY-MM-DD) ou horários inválidos
    const isValidDate = (str: string) => /^\d{4}-\d{2}-\d{2}$/.test(str);

    const startDate = isValidDate(datainicio) ? datainicio : new Date().toISOString().split('T')[0];
    const endDate = isValidDate(datafim)
      ? datafim
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const slots = generateAvailableSlots(idmedico, startDate, endDate);

    return slots;
  },
  /* -------------------------------------------------------------------------- */
  /*                      PRÉ-AGENDAMENTO (Passo 3)                             */
  /* -------------------------------------------------------------------------- */

  // POST /medico/agendamento/marcar - Criar pré-agendamento
  'POST /medico/agendamento/marcar': (req) => {
    const body = req.body || {};
    const {
      chave,
      idpaciente,
      idmedico,
      idconvenio,
      idservico,
      codigoprocedimento,
      descricaoprocedimento,
      observacao,
    } = body;

    const protocolo = `PROT-${Date.now()}`;

    const appointmentData = {
      id: chave || generateAppointmentKey(),
      protocolo,
      idpaciente,
      idmedico,
      idconvenio,
      idservico,
      codigoprocedimento,
      descricaoprocedimento,
      observacao,
      status: 1, // 1=Agendado
      dataCriacao: new Date().toISOString(),
    };

    inMemoryAppointments.set(String(appointmentData.id), appointmentData);
    console.log(`[FAKE-API] Pré-agendamento criado - Protocolo: ${protocolo}, Chave: ${appointmentData.id}`);

    return {
      protocolo,
      mensagem: 'Pré-agendamento realizado com sucesso',
    };
  },

  /* -------------------------------------------------------------------------- */
  /*                    STATUS DO PROTOCOLO (Passo 4)                           */
  /* -------------------------------------------------------------------------- */

  // POST /medico/agendamento/status-protocolo - Consultar status do protocolo
  'POST /medico/agendamento/status-protocolo': (req) => {
    const { protocolo, cpfpaciente } = req.body || {};

    const appointment = Array.from(inMemoryAppointments.values()).find((a) => a.protocolo === protocolo);

    if (!appointment) {
      return null;
    }

    // Retorna como confirmado (idstatus: 2)
    return [
      {
        id: appointment.id,
        protocolo: appointment.protocolo,
        datasolicitacao: appointment.dataCriacao?.split('T')[0],
        idstatus: 2, // Confirmado
        status: 'Agendamento confirmado',
        idmedico: appointment.idmedico,
        idpaciente: appointment.idpaciente,
        cpfpaciente,
        chave: appointment.id,
      },
    ];
  },

  /* -------------------------------------------------------------------------- */
  /*                      CONFIRMAÇÃO/CANCELAMENTO                              */
  /* -------------------------------------------------------------------------- */

  // POST /status - Alterar status do agendamento
  'POST /status': (req) => {
    const { chave, status, emailusuario } = req.body || {};

    const appointment = inMemoryAppointments.get(String(chave));

    if (appointment) {
      appointment.status = status;
      inMemoryAppointments.set(String(chave), appointment);
      console.log(`[FAKE-API] Status alterado - Chave: ${chave}, Novo Status: ${status}`);
    }

    return {
      chave,
      statusalterado: true,
      mensagem: 'Status alterado com sucesso',
    };
  },

  // POST /status-lote - Alterar status em lote
  'POST /status-lote': (req) => {
    const agendamentos = req.body || [];

    return agendamentos.map((ag: any) => {
      const appointment = inMemoryAppointments.get(String(ag.chave));
      if (appointment) {
        appointment.status = ag.status;
        inMemoryAppointments.set(String(ag.chave), appointment);
      }

      return {
        chave: ag.chave,
        statusalterado: true,
      };
    });
  },

  /* -------------------------------------------------------------------------- */
  /*                           AGENDAMENTOS                                     */
  /* -------------------------------------------------------------------------- */

  // GET /agendamentos/{cpf} - Buscar agendamentos do paciente por CPF
  'GET /agendamentos/{cpf}': (req) => {
    const cpf = req.params.cpf || req.params['0']?.split('/').pop();

    const allPatients = [...mockPatients, ...Array.from(inMemoryPatients.values())];
    const patient = allPatients.find((p) => p.cpf === cpf?.replace(/\D/g, ''));

    if (!patient) {
      return null;
    }

    const appointments = Array.from(inMemoryAppointments.values()).filter((a) => a.idpaciente === patient.id);

    return appointments;
  },

  // POST /listaragenda - Listar agenda de um médico
  'POST /listaragenda': (req) => {
    const { idMedico, data, qtdDias } = req.body || {};

    const medico = mockMedicos.find((m) => m.id === idMedico);
    const appointments = Array.from(inMemoryAppointments.values()).filter((a) => a.idmedico === idMedico);

    return {
      medico,
      agendamentos: appointments,
    };
  },

  // POST /agendamentos - Buscar agendamentos por período
  'POST /agendamentos': (req) => {
    const { datai, dataf, idpaciente, cpfPaciente, status } = req.body || {};

    const allPatients = [...mockPatients, ...Array.from(inMemoryPatients.values())];

    let patient = null;
    if (idpaciente) {
      patient = allPatients.find((p) => p.id === Number(idpaciente));
    } else if (cpfPaciente) {
      patient = allPatients.find((p) => p.cpf === cpfPaciente?.replace(/\D/g, ''));
    }

    if (!patient) {
      return [];
    }

    const appointments = Array.from(inMemoryAppointments.values()).filter((a) => {
      if (a.idpaciente !== patient.id) return false;
      if (status && a.status !== status) return false;
      return true;
    });

    // Retorna no formato AgendamentoResponse
    return [
      {
        idpaciente: patient.id,
        paciente: patient.nome,
        telefone: patient.celular || patient.telefone,
        contatos: [
          { descricao: 'Celular', conteudo: patient.celular },
          { descricao: 'Email', conteudo: patient.email },
        ],
        agendamento: appointments.map((a) => {
          const medico = mockMedicos.find((m) => m.id === a.idmedico);
          const servico = mockServicos.find((s) => s.id === a.idservico || s.codigo === a.codigoprocedimento);
          const filial = mockFiliais.find((f) => f.id === a.idlocal) || mockFiliais[0];

          return {
            agendamento_chave: a.id,
            agendamento_medico: medico?.nome || 'Médico',
            agendamento_especialidade: servico?.idespecialidade
              ? mockEspecialidades.find((e) => e.id === servico.idespecialidade)?.nome
              : null,
            agendamento_data: a.data || a.dataCriacao?.split('T')[0],
            agendamento_hora: a.hora || '08:00',
            agendamento_procedimento: a.descricaoprocedimento || servico?.nome,
            agendamento_codigo_procedimento: a.codigoprocedimento || servico?.codigo,
            agendamento_preparo: null,
            agendamento_status: a.status === 1 ? 'Agendado' : a.status === 2 ? 'Confirmado' : 'Cancelado',
            agendamento_categoria: null,
            agendamento_status_personalizado: null,
            agendamento_marcacao: [],
            empresa_unidade: filial.empresa,
            empresa_endereco: `${filial.endereco}, ${filial.numero} - ${filial.bairro}`,
            empresa_telefone: `(${filial.ddd}) ${filial.fone}`,
          };
        }),
      },
    ];
  },
};
