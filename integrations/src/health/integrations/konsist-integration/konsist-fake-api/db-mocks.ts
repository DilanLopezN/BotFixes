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
    id: 1,
    nome: 'Maria de Souza Santos',
    cpf: '12345678900',
    datanascimento: '1991-08-10',
    sexo: 'F',
    email: 'maria.santos@email.com',
    celular: '11999990001',
    telefone: '1132145678',
  },
  {
    id: 2,
    nome: 'Carlos Pereira Lima',
    cpf: '98765432100',
    datanascimento: '1985-04-22',
    sexo: 'M',
    email: 'carlos.lima@email.com',
    celular: '21988887777',
    telefone: null,
  },
  {
    id: 3,
    nome: 'Ana Paula Oliveira',
    cpf: '11122233344',
    datanascimento: '1978-12-15',
    sexo: 'F',
    email: 'ana.oliveira@email.com',
    celular: '31977776666',
    telefone: '3132145678',
  },
];

/**
 * Médicos mock
 */
export const mockMedicos = [
  {
    id: 100,
    nome: 'Dr. João da Silva',
    conselho: 'CRM',
    numconselho: '123456',
    ufconselho: 'SP',
    titulo: 'Dr.',
    especialidades: [{ id: 1, nome: 'Cardiologia' }],
  },
  {
    id: 101,
    nome: 'Dra. Ana Carolina Santos',
    conselho: 'CRM',
    numconselho: '654321',
    ufconselho: 'SP',
    titulo: 'Dra.',
    especialidades: [{ id: 3, nome: 'Dermatologia' }],
  },
  {
    id: 102,
    nome: 'Dr. Roberto Mendes',
    conselho: 'CRM',
    numconselho: '789012',
    ufconselho: 'RJ',
    titulo: 'Dr.',
    especialidades: [{ id: 4, nome: 'Ortopedia' }],
  },
];

/**
 * Convênios mock
 */
export const mockConvenios = [
  { id: 501, nome: 'Unimed', ativo: true },
  { id: 502, nome: 'Bradesco Saúde', ativo: true },
  { id: 503, nome: 'SulAmérica', ativo: true },
  { id: 504, nome: 'Amil', ativo: true },
  { id: 505, nome: 'Particular', ativo: true },
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
  { id: 1, nome: 'Clínica Central', empresa_endereco: 'Av. Paulista, 1000 - São Paulo/SP', empresa_telefone: '(11) 3000-0001' },
  { id: 2, nome: 'Filial Sul', empresa_endereco: 'Rua das Palmeiras, 500 - Porto Alegre/RS', empresa_telefone: '(51) 3000-0002' },
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

    // Filtra por especialidade se informado
    if (idespecialidade) {
      medicos = medicos.filter((m) => m.especialidades.some((e: any) => e.id === Number(idespecialidade)));
    }

    return medicos.map((m) => ({
      id: m.id,
      nome: m.nome,
      titulo: m.titulo,
      conselho: m.conselho,
      numconselho: m.numconselho,
      especialidades: m.especialidades,
    }));
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

    const startDate = datainicio || new Date().toISOString().split('T')[0];
    const endDate = datafim || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const slots = generateAvailableSlots(idmedico, startDate, endDate);

    return slots;
  },

  /* -------------------------------------------------------------------------- */
  /*                      PRÉ-AGENDAMENTO (Passo 3)                             */
  /* -------------------------------------------------------------------------- */

  // POST /medico/agendamento/marcar - Criar pré-agendamento
  'POST /medico/agendamento/marcar': (req) => {
    const body = req.body || {};
    const { chave, idpaciente, idmedico, idconvenio, idservico, codigoprocedimento, descricaoprocedimento, observacao } = body;

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
};
