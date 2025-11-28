import { Test, TestingModule } from '@nestjs/testing';
import { ProdoctorHelpersService } from './prodoctor-helpers.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';

describe('ProdoctorHelpersService', () => {
  let service: ProdoctorHelpersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProdoctorHelpersService],
    }).compile();

    service = module.get<ProdoctorHelpersService>(ProdoctorHelpersService);
  });

  describe('transformPatient', () => {
    it('deve transformar paciente completo do ProDoctor', () => {
      const paciente = {
        codigo: 101,
        nome: 'João da Silva Santos',
        cpf: '123.456.789-00',
        dataNascimento: '15/03/1990',
        sexo: { codigo: 1, nome: 'Masculino' },
        correioEletronico: 'joao@email.com',
        telefone1: { ddd: '11', numero: '999887766', tipo: { codigo: 3, nome: 'Celular' } },
        telefone2: { ddd: '11', numero: '32145678', tipo: { codigo: 1, nome: 'Residencial' } },
      };

      const result = service.transformPatient(paciente);

      expect(result.code).toBe('101');
      expect(result.name).toBe('João da Silva Santos');
      expect(result.cpf).toBe('12345678900');
      expect(result.email).toBe('joao@email.com');
      expect(result.cellPhone).toBe('11999887766');
      expect(result.phone).toBe('1132145678');
      expect(result.sex).toBe('M');
      expect(result.bornDate).toContain('1990-03-15');
    });

    it('deve usar nomeCivil quando nome estiver vazio', () => {
      const paciente = {
        codigo: 102,
        nome: '',
        nomeCivil: 'Maria Oliveira',
        cpf: '98765432100',
      };

      const result = service.transformPatient(paciente as any);

      expect(result.name).toBe('Maria Oliveira');
    });

    it('deve mapear sexo feminino corretamente', () => {
      const paciente = {
        codigo: 103,
        nome: 'Ana Paula',
        sexo: { codigo: 2, nome: 'Feminino' },
      };

      const result = service.transformPatient(paciente as any);

      expect(result.sex).toBe('F');
    });

    it('deve retornar undefined para sexo desconhecido', () => {
      const paciente = {
        codigo: 104,
        nome: 'Pessoa',
        sexo: { codigo: 3, nome: 'Outro' },
      };

      const result = service.transformPatient(paciente as any);

      expect(result.sex).toBeUndefined();
    });

    it('deve remover caracteres não numéricos do CPF', () => {
      const paciente = {
        codigo: 105,
        nome: 'Teste',
        cpf: '111.222.333-44',
      };

      const result = service.transformPatient(paciente as any);

      expect(result.cpf).toBe('11122233344');
    });

    it('deve extrair primeiro celular encontrado', () => {
      const paciente = {
        codigo: 106,
        nome: 'Teste',
        telefone1: { ddd: '21', numero: '32145678', tipo: { codigo: 1, nome: 'Residencial' } },
        telefone2: { ddd: '21', numero: '987654321', tipo: { codigo: 3, nome: 'Celular' } },
        telefone3: { ddd: '21', numero: '912345678', tipo: { codigo: 3, nome: 'Celular' } },
      };

      const result = service.transformPatient(paciente as any);

      expect(result.cellPhone).toBe('21987654321');
      expect(result.phone).toBe('2132145678');
    });

    it('deve retornar strings vazias quando telefones não existirem', () => {
      const paciente = {
        codigo: 107,
        nome: 'Sem Telefone',
      };

      const result = service.transformPatient(paciente as any);

      expect(result.phone).toBe('');
      expect(result.cellPhone).toBe('');
    });

    it('deve retornar undefined para data inválida', () => {
      const paciente = {
        codigo: 108,
        nome: 'Teste',
        dataNascimento: 'invalid-date',
      };

      const result = service.transformPatient(paciente as any);

      expect(result.bornDate).toBeUndefined();
    });
  });

  describe('transformScheduleToRawAppointment', () => {
    it('deve transformar agendamento completo', () => {
      const agendamento = {
        codigo: 1001,
        data: '25/11/2025',
        hora: '09:00',
        duracao: 30,
        usuario: { codigo: 100, nome: 'Dr. Carlos' },
        paciente: { codigo: 101, nome: 'João' },
        localProDoctor: { codigo: 1, nome: 'Clínica Central' },
        convenio: { codigo: 501, nome: 'Unimed' },
        procedimentoMedico: { codigo: '10101012', nome: 'Consulta' },
        estadoAgendaConsulta: { codigo: 1, descricao: 'Agendado' },
        complemento: 'Primeira consulta',
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.appointmentCode).toBe('1001');
      expect(result.appointmentDate).toContain('2025-11-25');
      expect(result.status).toBe(AppointmentStatus.scheduled);
      expect(result.doctorId).toBe('100');
      expect(result.doctorDefault.name).toBe('Dr. Carlos');
      expect(result.insuranceId).toBe('501');
      expect(result.organizationUnitId).toBe('1');
      expect(result.procedureId).toBe('10101012');
      expect(result.duration).toBe('30');
      expect(result.data.observation).toBe('Primeira consulta');
    });

    it('deve mapear status cancelado quando faltou', () => {
      const agendamento = {
        codigo: 1002,
        data: '24/11/2025',
        hora: '10:00',
        estadoAgendaConsulta: { faltou: true },
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.status).toBe(AppointmentStatus.canceled);
    });

    it('deve mapear status cancelado quando desmarcado', () => {
      const agendamento = {
        codigo: 1003,
        data: '24/11/2025',
        hora: '11:00',
        estadoAgendaConsulta: { desmarcado: true },
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.status).toBe(AppointmentStatus.canceled);
    });

    it('deve mapear status finished quando atendido', () => {
      const agendamento = {
        codigo: 1004,
        data: '23/11/2025',
        hora: '14:00',
        estadoAgendaConsulta: { atendido: true },
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.status).toBe(AppointmentStatus.finished);
    });

    it('deve mapear status confirmed quando confirmado', () => {
      const agendamento = {
        codigo: 1005,
        data: '25/11/2025',
        hora: '15:00',
        estadoAgendaConsulta: { confirmado: true },
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.status).toBe(AppointmentStatus.confirmed);
    });

    it('deve mapear status confirmed quando compareceu', () => {
      const agendamento = {
        codigo: 1006,
        data: '25/11/2025',
        hora: '16:00',
        estadoAgendaConsulta: { compareceu: true },
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.status).toBe(AppointmentStatus.confirmed);
    });

    it('deve mapear status confirmed quando confirmadoMSG', () => {
      const agendamento = {
        codigo: 1007,
        data: '25/11/2025',
        hora: '17:00',
        estadoAgendaConsulta: { confirmadoMSG: true },
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.status).toBe(AppointmentStatus.confirmed);
    });

    it('deve incluir especialidade quando disponível', () => {
      const agendamento = {
        codigo: 1008,
        data: '26/11/2025',
        hora: '08:00',
        usuario: {
          codigo: 100,
          nome: 'Dr. Carlos',
          especialidade: { codigo: 1, nome: 'Cardiologia' },
        },
      };

      const result = service.transformScheduleToRawAppointment(agendamento as any);

      expect(result.specialityId).toBe('1');
      expect(result.specialityDefault.name).toBe('Cardiologia');
    });
  });

  describe('buildCreatePatientRequest', () => {
    it('deve construir request para criação de paciente', () => {
      const patient = {
        name: 'Novo Paciente',
        cpf: '12345678900',
        bornDate: '1995-05-20',
        sex: 'F',
        email: 'novo@email.com',
        cellPhone: '11988776655',
        phone: '1132145678',
      };

      const result = service.buildCreatePatientRequest(patient as any);

      expect(result.paciente.nome).toBe('Novo Paciente');
      expect(result.paciente.cpf).toBe('12345678900');
      expect(result.paciente.dataNascimento).toBe('20/05/1995');
      expect(result.paciente.sexo.codigo).toBe(2);
      expect(result.paciente.correioEletronico).toBe('novo@email.com');
    });

    it('deve mapear sexo masculino para código 1', () => {
      const patient = {
        name: 'Paciente Masculino',
        sex: 'M',
      };

      const result = service.buildCreatePatientRequest(patient as any);

      expect(result.paciente.sexo.codigo).toBe(1);
    });
  });

  describe('buildUpdatePatientRequest', () => {
    it('deve construir request para atualização de paciente', () => {
      const patient = {
        name: 'Paciente Atualizado',
        email: 'atualizado@email.com',
      };

      const result = service.buildUpdatePatientRequest('101', patient as any);

      expect(result.paciente.codigo).toBe(101);
      expect(result.paciente.nome).toBe('Paciente Atualizado');
      expect(result.paciente.correioEletronico).toBe('atualizado@email.com');
    });
  });

  describe('buildTypeScheduleRequest', () => {
    it('deve construir tipo consulta', () => {
      const result = service.buildTypeScheduleRequest('consulta');

      expect(result.consulta).toBe(true);
      expect(result.retorno).toBeFalsy();
    });

    it('deve construir tipo retorno', () => {
      const result = service.buildTypeScheduleRequest('retorno');

      expect(result.retorno).toBe(true);
      expect(result.consulta).toBeFalsy();
    });

    it('deve construir tipo exame', () => {
      const result = service.buildTypeScheduleRequest('exame');

      expect(result.exame).toBe(true);
    });

    it('deve construir tipo cirurgia', () => {
      const result = service.buildTypeScheduleRequest('cirurgia');

      expect(result.cirurgia).toBe(true);
    });

    it('deve construir tipo teleconsulta', () => {
      const result = service.buildTypeScheduleRequest('teleconsulta');

      expect(result.teleconsulta).toBe(true);
    });

    it('deve construir tipo compromisso', () => {
      const result = service.buildTypeScheduleRequest('compromisso');

      expect(result.compromisso).toBe(true);
    });

    it('deve retornar consulta como padrão para tipo desconhecido', () => {
      const result = service.buildTypeScheduleRequest('unknown');

      expect(result.consulta).toBe(true);
    });
  });

  describe('transformAvailableScheduleToRawAppointment', () => {
    it('deve transformar horário disponível', () => {
      const horario = {
        dataHora: '25/11/2025 14:00',
        duracao: 30,
      };

      const doctor = {
        code: '100',
        name: 'Dr. Carlos',
        friendlyName: 'Dr. Carlos',
      };

      const filter = {
        insurance: { code: '501', name: 'Unimed', friendlyName: 'Unimed' },
        organizationUnit: { code: '1', name: 'Clínica Central', friendlyName: 'Clínica Central' },
      };

      const result = service.transformAvailableScheduleToRawAppointment(horario as any, doctor as any, filter as any);

      expect(result.appointmentCode).toBeNull();
      expect(result.appointmentDate).toContain('2025-11-25');
      expect(result.status).toBe(AppointmentStatus.scheduled);
      expect(result.doctorId).toBe('100');
      expect(result.insuranceId).toBe('501');
      expect(result.organizationUnitId).toBe('1');
    });
  });

  describe('mapAppointmentTypeCode', () => {
    it('deve mapear tipo consulta', () => {
      const tipo = { consulta: true };
      const result = service['mapAppointmentTypeCode'](tipo);
      expect(result).toBe('consulta');
    });

    it('deve mapear tipo retorno', () => {
      const tipo = { retorno: true };
      const result = service['mapAppointmentTypeCode'](tipo);
      expect(result).toBe('retorno');
    });

    it('deve mapear tipo exame', () => {
      const tipo = { exame: true };
      const result = service['mapAppointmentTypeCode'](tipo);
      expect(result).toBe('exame');
    });

    it('deve mapear tipo cirurgia', () => {
      const tipo = { cirurgia: true };
      const result = service['mapAppointmentTypeCode'](tipo);
      expect(result).toBe('cirurgia');
    });

    it('deve mapear tipo teleconsulta', () => {
      const tipo = { teleconsulta: true };
      const result = service['mapAppointmentTypeCode'](tipo);
      expect(result).toBe('teleconsulta');
    });

    it('deve mapear tipo compromisso', () => {
      const tipo = { compromisso: true };
      const result = service['mapAppointmentTypeCode'](tipo);
      expect(result).toBe('compromisso');
    });

    it('deve retornar consulta como padrão', () => {
      const tipo = {};
      const result = service['mapAppointmentTypeCode'](tipo);
      expect(result).toBe('consulta');
    });

    it('deve retornar consulta quando tipo for null', () => {
      const result = service['mapAppointmentTypeCode'](null);
      expect(result).toBe('consulta');
    });
  });
});
