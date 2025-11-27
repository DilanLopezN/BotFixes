import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityDocument } from '../../../entities/schema';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';

import {
  AgendamentoConsultaViewModel,
  HorarioDisponivelViewModel,
  TipoAgendamentoRequest,
  TurnosRequest,
  EstadoAgendaConsultaViewModel,
} from '../interfaces';
import { formatPhone, convertPhoneNumber } from '../../../../common/helpers/format-phone';
import { PacienteViewModel, PacienteCRUDRequest, PacienteRequest } from '../interfaces';

@Injectable()
export class ProdoctorHelpersService {
  private readonly logger = new Logger(ProdoctorHelpersService.name);
  private readonly dateFormat = 'DD/MM/YYYY';
  private readonly dateTimeFormat = 'DD/MM/YYYY HH:mm';

  /**
   * Transforma paciente do ProDoctor para formato padrão
   */
  transformPatient(paciente: PacienteViewModel): Patient {
    const phone = this.extractPhone(paciente);
    const cellPhone = this.extractCellPhone(paciente);

    return {
      code: String(paciente.codigo),
      name: paciente.nome?.trim() || paciente.nomeCivil?.trim(),
      cpf: paciente.cpf?.replace(/\D/g, ''),
      email: paciente.correioEletronico,
      phone: phone,
      cellPhone: cellPhone,
      bornDate: this.parseDate(paciente.dataNascimento),
      sex: this.mapSex(paciente.sexo?.codigo),
    };
  }

  /**
   * Extrai telefone fixo
   */
  private extractPhone(paciente: PacienteViewModel): string {
    const telefones = [paciente.telefone1, paciente.telefone2, paciente.telefone3, paciente.telefone4];

    for (const tel of telefones) {
      if (tel?.numero && tel?.tipo?.codigo !== 3) {
        return formatPhone(tel.ddd + tel.numero, true);
      }
    }

    return '';
  }

  /**
   * Extrai celular
   */
  private extractCellPhone(paciente: PacienteViewModel): string {
    const telefones = [paciente.telefone1, paciente.telefone2, paciente.telefone3, paciente.telefone4];

    for (const tel of telefones) {
      if (tel?.numero && tel?.tipo?.codigo === 3) {
        return formatPhone(tel.ddd + tel.numero, true);
      }
    }

    return '';
  }

  /**
   * Converte data do formato ProDoctor para ISO
   */
  private parseDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    const parsed = moment(dateString, this.dateFormat, true);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD'); // Alterado de toISOString()
    }

    return undefined;
  }
  /**
   * Mapeia código de sexo para string
   */
  private mapSex(codigo?: number): 'M' | 'F' | undefined {
    if (codigo === 1) return 'M';
    if (codigo === 2) return 'F';
    return undefined;
  }

  /**
   * Mapeia sexo string para código
   */
  private mapSexToCode(sex?: string): { codigo: number } | undefined {
    if (sex === 'M') return { codigo: 1 };
    if (sex === 'F') return { codigo: 2 };
    return undefined;
  }

  /**
   * Formata data para formato ProDoctor
   */
  private formatDate(isoDate: string | Date): string {
    return moment(isoDate).format(this.dateFormat);
  }

  /**
   * Transforma agendamento do ProDoctor para RawAppointment
   */
  transformScheduleToRawAppointment(agendamento: AgendamentoConsultaViewModel): RawAppointment {
    const appointmentDate = moment(`${agendamento.data} ${agendamento.hora}`, this.dateTimeFormat);

    return {
      appointmentCode: String(agendamento.codigo),
      appointmentDate: appointmentDate.toISOString(),
      status: this.mapAppointmentStatus(agendamento.estadoAgendaConsulta),
      doctorId: agendamento.usuario?.codigo?.toString(),
      doctorDefault: agendamento.usuario
        ? {
            name: agendamento.usuario.nome,
            friendlyName: agendamento.usuario.nome,
            code: String(agendamento.usuario.codigo),
          }
        : undefined,
      insuranceId: agendamento.convenio?.codigo?.toString(),
      insuranceDefault: agendamento.convenio
        ? {
            name: agendamento.convenio.nome,
            friendlyName: agendamento.convenio.nome,
            code: String(agendamento.convenio.codigo),
          }
        : undefined,
      organizationUnitId: agendamento.localProDoctor?.codigo?.toString(),
      organizationUnitDefault: agendamento.localProDoctor
        ? {
            name: agendamento.localProDoctor.nome,
            friendlyName: agendamento.localProDoctor.nome,
            code: String(agendamento.localProDoctor.codigo),
          }
        : undefined,
      procedureId: agendamento.procedimentoMedico?.codigo,
      procedureDefault: agendamento.procedimentoMedico
        ? {
            name: agendamento.procedimentoMedico.nome,
            friendlyName: agendamento.procedimentoMedico.nome,
            code: agendamento.procedimentoMedico.codigo,
          }
        : undefined,
      specialityId: agendamento.usuario?.especialidade?.codigo?.toString(),
      specialityDefault: agendamento.usuario?.especialidade
        ? {
            name: agendamento.usuario.especialidade.nome,
            friendlyName: agendamento.usuario.especialidade.nome,
            code: String(agendamento.usuario.especialidade.codigo),
          }
        : undefined,
      appointmentTypeId: this.mapAppointmentTypeCode(agendamento.tipoAgendamento),
      duration: String(agendamento.duracao || 0),
      data: {
        observation: agendamento.complemento,
        tipoAgendamento: agendamento.tipoAgendamento,
      },
    };
  }

  /**
   * Mapeia status do agendamento
   */
  private mapAppointmentStatus(estado?: EstadoAgendaConsultaViewModel): AppointmentStatus {
    if (!estado) return AppointmentStatus.scheduled;

    if (estado.faltou || estado.desmarcado) {
      return AppointmentStatus.canceled;
    }
    if (estado.atendido) {
      return AppointmentStatus.finished;
    }
    if (estado.compareceu || estado.confirmado || estado.confirmadoMSG) {
      return AppointmentStatus.confirmed;
    }

    return AppointmentStatus.scheduled;
  }

  /**
   * Mapeia código do tipo de agendamento
   */
  private mapAppointmentTypeCode(tipo: any): string {
    if (!tipo) return 'consulta';

    if (tipo.consulta) return 'consulta';
    if (tipo.retorno) return 'retorno';
    if (tipo.exame) return 'exame';
    if (tipo.cirurgia) return 'cirurgia';
    if (tipo.teleconsulta) return 'teleconsulta';
    if (tipo.compromisso) return 'compromisso';

    return 'consulta';
  }

  /**
   * Transforma horário disponível para RawAppointment
   */
  transformAvailableScheduleToRawAppointment(
    horario: HorarioDisponivelViewModel,
    doctor: EntityDocument,
    filter: CorrelationFilter,
  ): RawAppointment {
    // ✅ CORREÇÃO 1: Concatenar data + hora corretamente
    const appointmentDate = moment(`${horario.data} ${horario.hora}`, this.dateTimeFormat);
    const appointmentDateISO = appointmentDate.toISOString();

    return {
      // ✅ CORREÇÃO 2: appointmentCode NÃO pode ser null (padrão Feegow usa a data)
      appointmentCode: appointmentDateISO,
      appointmentDate: appointmentDateISO,
      status: AppointmentStatus.scheduled,
      doctorId: doctor.code,
      doctorDefault: {
        name: doctor.name,
        friendlyName: doctor.friendlyName || doctor.name,
        code: doctor.code,
      },
      insuranceId: filter.insurance?.code,
      insuranceDefault: filter.insurance
        ? {
            name: filter.insurance.name,
            friendlyName: filter.insurance.friendlyName || filter.insurance.name,
            code: filter.insurance.code,
          }
        : undefined,
      organizationUnitId: filter.organizationUnit?.code,
      organizationUnitDefault: filter.organizationUnit
        ? {
            name: filter.organizationUnit.name,
            friendlyName: filter.organizationUnit.friendlyName || filter.organizationUnit.name,
            code: filter.organizationUnit.code,
          }
        : undefined,
      procedureId: filter.procedure?.code,
      procedureDefault: filter.procedure
        ? {
            name: filter.procedure.name,
            friendlyName: filter.procedure.friendlyName || filter.procedure.name,
            code: filter.procedure.code,
          }
        : undefined,
      // ✅ CORREÇÃO 3: Adicionar specialityId
      specialityId: filter.speciality?.code,
      specialityDefault: filter.speciality
        ? {
            name: filter.speciality.name,
            friendlyName: filter.speciality.friendlyName || filter.speciality.name,
            code: filter.speciality.code,
          }
        : undefined,
      // ✅ CORREÇÃO 4: Usar código da entidade, não string literal
      appointmentTypeId: filter.appointmentType?.code,
      duration: '0',
    };
  }
  /**
   * Constrói request para criar paciente
   */
  buildCreatePatientRequest(patient: Partial<Patient>): PacienteCRUDRequest {
    const paciente: PacienteRequest = {
      nome: patient.name,
      cpf: patient.cpf?.replace(/\D/g, ''),
      dataNascimento: patient.bornDate ? this.formatDate(patient.bornDate) : undefined,
      correioEletronico: patient.email,
      sexo: this.mapSexToCode(patient.sex),
    };

    if (patient.cellPhone || patient.phone) {
      const phoneNumber = convertPhoneNumber(patient.cellPhone || patient.phone);
      if (phoneNumber) {
        paciente.telefone1 = {
          ddd: phoneNumber.substring(0, 2),
          numero: phoneNumber.substring(2),
          tipo: { codigo: 3 },
        };
      }
    }

    return { paciente };
  }

  /**
   * Constrói request para atualizar paciente
   */
  buildUpdatePatientRequest(patientCode: string, patient: Partial<Patient>): PacienteCRUDRequest {
    const request = this.buildCreatePatientRequest(patient);
    request.paciente.codigo = Number(patientCode);
    return request;
  }

  /**
   * Constrói TipoAgendamentoRequest baseado no código
   */
  buildTipoAgendamentoRequest(code: string): TipoAgendamentoRequest {
    const tipoAgendamento: TipoAgendamentoRequest = {};

    switch (code) {
      case 'consulta':
        tipoAgendamento.consulta = true;
        break;
      case 'retorno':
        tipoAgendamento.retorno = true;
        break;
      case 'exame':
        tipoAgendamento.exame = true;
        break;
      case 'cirurgia':
        tipoAgendamento.cirurgia = true;
        break;
      case 'teleconsulta':
        tipoAgendamento.teleconsulta = true;
        break;
      case 'compromisso':
        tipoAgendamento.compromisso = true;
        break;
      default:
        tipoAgendamento.consulta = true;
    }

    return tipoAgendamento;
  }

  /**
   * Constrói TurnosRequest baseado no período
   */
  buildTurnosFromPeriod(start: string, end: string): TurnosRequest {
    const turnos: TurnosRequest = {};
    const startHour = parseInt(start.split(':')[0], 10);
    const endHour = parseInt(end.split(':')[0], 10);

    // Manhã: 06:00 - 12:00
    if (startHour < 12 && endHour > 6) {
      turnos.manha = true;
    }

    // Tarde: 12:00 - 18:00
    if (startHour < 18 && endHour > 12) {
      turnos.tarde = true;
    }

    // Noite: 18:00 - 23:59
    if (endHour >= 18 || startHour >= 18) {
      turnos.noite = true;
    }

    return turnos;
  }
}
